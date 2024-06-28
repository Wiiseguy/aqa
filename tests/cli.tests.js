const test = require('../aqa')
const util = require("util");
const child_process = require("child_process");
const { Color } = require('../common');
const { existsSync, rmSync, readFileSync } = require('fs');
const exec = util.promisify(child_process.exec);

test('Test should-succeed', async t => {
    let result = await exec(`node cli tests/_self/should-succeed`);
    t.true(result.stdout.includes('Ran 1 test successfully!'))
})

test('Test should-succeed - glob', async t => {
    let result = await exec(`node cli tests/_self/should-succ*.js`);
    t.true(result.stdout.includes('Ran 1 test successfully!'))
})

test('Test should-succeed - glob 2', async t => {
    let result = await exec(`node cli */should-succeed.js`);
    t.true(result.stdout.includes('Ran 2 tests successfully!'))
    t.true(result.stdout.includes('level0/should-succeed.js'))
    t.true(result.stdout.includes('_self/should-succeed.js'))
})

test('Test should-succeed - verbose', async t => {
    let result = await exec(`node cli tests/_self/should-succeed --verbose`);
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('Running tests for: tests/_self/should-succeed'))
    t.true(stdout.includes('[ should-succeed ]'))
    t.true(stdout.includes('Running test: "Should succeed'))
    t.true(stdout.includes('Ran 1 test successfully!'))
})

test('Test should-fail', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/should-fail`))
    t.true(e.stdout.includes('should-fail.js:4:11'));
    t.true(e.stdout.includes(' at '));
    t.true(e.stdout.includes('Error: Expected true, got false'));
})

test('Test should-fail-fatal', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/should-fail-fatal.txt`))
    t.true(e.stdout.includes('Fatal error:'));
    t.true(e.stdout.includes('SyntaxError:'));
})

test('Test source map', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/sourcemap-test.js`));
    t.true(e.stdout.includes('sourcemap-test.ts:5:10 [SourceMap]'));
    t.true(e.stdout.includes('sourcemap-test.ts:9:10 [SourceMap]'));
})

test('Test disable logging', async t => {
    let result = await exec(`node cli tests/_self/disable-logging`);
    t.true(result.stdout.includes('Howdy'))
    t.true(result.stdout.includes('Hello'))
    t.false(result.stdout.includes('World'))
    t.true(result.stdout.includes('Hiya'))
})

test('Test duplicate names', async t => {
    let result = await exec(`node cli tests/_self/duplicate-test-name`);
    t.true(result.stdout.includes('Duplicate test name: "T1"'))
    t.true(result.stdout.includes('Duplicate test name: "T2"'))
    t.false(result.stdout.includes('Duplicate test name: "T3"'))
})

test('Test t.log', async t => {
    let result = await exec(`node cli tests/_self/log`);
    let expected = '[Log output for "Test 1":]\n' +
        'Hello\n' +
        '[Log output for "Test 2":]\n' +
        'World\n';
    t.true(result.stdout.includes(expected))
})

test('Verbose - via arg', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/throw --verbose`))
    let stdout = Color.strip(e.stdout);
    t.true(stdout.includes('Running tests for: tests/_self/throw'))
    t.true(stdout.includes('Running test: "Throw test"'), stdout)
    t.true(stdout.includes('[ throw ]\n'))
    t.true(stdout.includes('throw.js:4:11'))
})

test('Verbose - via process.env', async t => {
    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/should-fail`, { env: { AQA_VERBOSE: 'true' } }));
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('Running tests for: tests/_self/should-fail'))
    t.true(stdout.includes('Running test: "Should fail'))
    t.true(stdout.includes('[ should-fail ]'))
});

test('Concurrency - disable via arg', async t => {
    let e = await exec(`node cli tests/_self/should-succeed --no-concurrency`);
    let stdout = Color.strip(e.stdout);
    t.true(stdout.includes('Ran 1 test successfully!'))
})

test('Concurrency - via process.env', async t => {
    let e = await exec(`node cli tests/_self/should-succeed --no-concurrency`, { env: { AQA_CONCURRENCY: 'false' } });
    let stdout = Color.strip(e.stdout);
    t.true(stdout.includes('Ran 1 test successfully!'))
})

test('Handle invalid exceptions', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/throw-invalid --verbose`))
    let stdout = Color.strip(e.stdout);
    t.true(stdout.includes('FAILED:  "Throw invalid test 1"'))
    t.true(stdout.includes('FAILED:  "Throw invalid test 2"'))
    t.true(stdout.includes('Error: [WARNING: aqa could not determine stack information, because the thrown object was not an Error.] Bye1'))
    t.true(stdout.includes('Error: [WARNING: aqa could not determine stack information, because the thrown object was not an Error.] Bye2'))
})

test('Test before-after', async t => {
    let result = await exec(`node cli tests/_self/before-after`);
    t.true(result.stdout.includes('BEFORE'))
    t.true(result.stdout.includes('AFTER'))
    t.true(result.stdout.includes('BEFORE EACH1'))
    t.true(result.stdout.includes('BEFORE EACH2'))
    t.true(result.stdout.includes('AFTER EACH1'))
    t.true(result.stdout.includes('AFTER EACH2'))
})

test('Test skip', async t => {
    let result = await exec(`node cli tests/_self/skip`);    
    let stdout = Color.strip(result.stdout);
    t.true(result.stdout.includes('BEFORE'))
    t.true(result.stdout.includes('AFTER'))
    t.true(stdout.includes('BEFORE EACH1'))
    t.true(stdout.includes('AFTER EACH1'))
    t.true(stdout.includes('Ran 1 test successfully!'))
})

test('Test skip-file', async t => {
    let result = await exec(`node cli tests/_self/skip-file`);
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('SKIPPED:  x1 (Not feeling like testing today...)'))
    t.true(stdout.includes('SKIPPED:  x2 (Not feeling like testing today...)'))
    t.true(stdout.includes('No tests were ran.'))
    t.false(result.stdout.includes('BEFORE'))
    t.false(result.stdout.includes('AFTER'))
    t.false(result.stdout.includes('BEFORE EACH1'))
    t.false(result.stdout.includes('BEFORE EACH2'))
    t.false(result.stdout.includes('AFTER EACH1'))
    t.false(result.stdout.includes('AFTER EACH2'))
})

test('Test before-fail', async t => {
    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/before-fail`))
    let stdout = Color.strip(result.stdout);

    t.true(stdout.includes('FAILED:  "before"'))
    t.true(stdout.includes('SKIPPED:  x1'))
    t.true(stdout.includes('SKIPPED:  x2'))
})

test('Test TAP report - default', async t => {
    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/success-fail`, { env: { AQA_REPORTER: 'tap' } }))
    let stdout = Color.strip(result.stdout);
    let expected = 'TAP version 13\n' +
        '1..2\n' +
        'ok 1 - Should succeed\n' +
        'not ok 2 - Should fail\n' +
        '# tests 2\n' +
        '# pass 1\n' +
        '# fail 1\n';

    t.true(stdout.includes(expected), 'TAP report does not match expected: ' + stdout);
});

test('Test JUnit report - default', async t => {
    const reportPath = '.aqa-output/reports/test-result--tests--_self--before-fail.xml';
    rmSync(reportPath, { force: true });

    let reportExists = existsSync(reportPath);
    t.false(reportExists, 'Report file should not exist before test')

    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/before-fail`, { env: { AQA_REPORTER: 'junit' } }))
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('FAILED:  "before"'))
    t.true(stdout.includes('SKIPPED:  x1'))
    t.true(stdout.includes('SKIPPED:  x2'))

    reportExists = existsSync(reportPath);
    t.true(reportExists, 'Report file should exist')

    // Read report file to string
    let report = readFileSync(reportPath, 'utf8').toString();
    t.true(report.includes('<testsuites name="aqa tests" tests="2" failures="1"'), report)
    t.true(report.includes('<testsuite name="/tests/_self/before-fail.js" tests="2" failures="1"'), report)
    t.true(report.includes('<testcase name="before - /tests/_self/before-fail.js" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<failure message="Error: Expected true, got false'))
    t.true(report.includes('<testcase name="x1" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<testcase name="x2" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<skipped>before-tests failed</skipped>'))

})

test('Test JUnit report - skip-file', async t => {
    const reportPath = '.aqa-output/reports/test-result--tests--_self--skip-file.xml';
    rmSync(reportPath, { force: true });

    let reportExists = existsSync(reportPath);
    t.false(reportExists, 'Report file should not exist before test')

    let result = await exec(`node cli tests/_self/skip-file`, { env: { AQA_REPORTER: 'junit' } });
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('No tests were ran.'))

    reportExists = existsSync(reportPath);
    t.true(reportExists, 'Report file should exist')

    // Read report file to string
    let report = readFileSync(reportPath, 'utf8').toString();
    t.true(report.includes('<testsuites name="aqa tests" tests="2" failures="0"'), report)
    t.true(report.includes('<testsuite name="/tests/_self/skip-file.js" tests="2" failures="0"'), report)
    t.true(report.includes('<testcase name="before - /tests/_self/skip-file.js" classname="/tests/_self/skip-file.js"'))
    t.true(report.includes('<testcase name="x1" classname="/tests/_self/skip-file.js"'))
    t.true(report.includes('<testcase name="x2" classname="/tests/_self/skip-file.js"'))
    t.true(report.includes('<skipped>Not feeling like testing today...</skipped>'))

})

test('Test JUnit report - custom report dir', async t => {
    const reportPath = '.aqa-custom-output/test-result--tests--_self--before-fail.xml';
    rmSync(reportPath, { force: true });

    let reportExists = existsSync(reportPath);
    t.false(reportExists, 'Report file should not exist before test')

    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/before-fail`, { env: { AQA_REPORTER: 'junit', AQA_REPORTER_OUTPUT_DIR: '.aqa-custom-output/' } }))
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('FAILED:  "before"'))
    t.true(stdout.includes('SKIPPED:  x1'))
    t.true(stdout.includes('SKIPPED:  x2'))

    reportExists = existsSync(reportPath);
    t.true(reportExists, 'Report file should exist')

    // Read report file to string
    let report = readFileSync(reportPath, 'utf8').toString();
    t.true(report.includes('<testsuites name="aqa tests" tests="2" failures="1"'), report)
    t.true(report.includes('<testsuite name="/tests/_self/before-fail.js" tests="2" failures="1"'), report)
    t.true(report.includes('<testcase name="before - /tests/_self/before-fail.js" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<failure message="Error: Expected true, got false'))
    t.true(report.includes('<testcase name="x1" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<testcase name="x2" classname="/tests/_self/before-fail.js"'))
    t.true(report.includes('<skipped>before-tests failed</skipped>'))

})

test('Solo test', async t => {
    let result = await exec(`node cli tests/_self/solo`);
    let stdout = Color.strip(result.stdout);
    t.true(result.stdout.includes('Ran 2 tests successfully!'))
    t.true(stdout.includes('SKIPPED:  Should not run 2 (presence of solo tests)'))
})