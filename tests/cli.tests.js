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
    t.true(stdout.includes('Running test: "Throw test"'))
    t.true(stdout.includes('[ throw ]\n'))
    t.true(stdout.includes('throw.js:4:11'))
})

test('Verbose - via process.env', async t => {
    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/should-fail`, { env: { AQA_VERBOSE: 'true' }}));
    let stdout = Color.strip(result.stdout);
    t.true(stdout.includes('Running tests for: tests/_self/should-fail'))
    t.true(stdout.includes('Running test: "Should fail'))
    t.true(stdout.includes('[ should-fail ]'))
});

test('Test before-after', async t => {
    let result = await exec(`node cli tests/_self/before-after`);
    t.true(result.stdout.includes('BEFORE'))
    t.true(result.stdout.includes('AFTER'))
    t.true(result.stdout.includes('BEFORE EACH1'))
    t.true(result.stdout.includes('BEFORE EACH2'))
    t.true(result.stdout.includes('AFTER EACH1'))
    t.true(result.stdout.includes('AFTER EACH2'))
})

test('Test before-fail', async t => {
    let result = await t.throwsAsync(async _ => await exec(`node cli tests/_self/before-fail`))
    let stdout = Color.strip(result.stdout);

    t.true(stdout.includes('FAILED:  "before"'))
    t.true(stdout.includes('SKIPPED:  x1'))
    t.true(stdout.includes('SKIPPED:  x2'))    
})

test('Test JUnit report - default', async t => {
    const reportPath = '.aqa-output/reports/test-result-before-fail.js.xml';
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
    t.true(report.includes('<testsuites name="aqa tests" tests="2" failures="3"'))
    t.true(report.includes('<testsuite name="before-fail.js" tests="2" failures="3"'))
    t.true(report.includes('<testcase name="before - before-fail.js" classname="before-fail.js"'))
    t.true(report.includes('<failure message="Error: Expected true, got false'))
    t.true(report.includes('<testcase name="x1" classname="before-fail.js"'))
    t.true(report.includes('<testcase name="x2" classname="before-fail.js"'))
    t.true(report.includes('<skipped></skipped>'))
    
})

test('Test JUnit report - custom report dir', async t => {
    const reportPath = '.aqa-custom-output/test-result-before-fail.js.xml';
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
    t.true(report.includes('<testsuites name="aqa tests" tests="2" failures="3"'))
    t.true(report.includes('<testsuite name="before-fail.js" tests="2" failures="3"'))
    t.true(report.includes('<testcase name="before - before-fail.js" classname="before-fail.js"'))
    t.true(report.includes('<failure message="Error: Expected true, got false'))
    t.true(report.includes('<testcase name="x1" classname="before-fail.js"'))
    t.true(report.includes('<testcase name="x2" classname="before-fail.js"'))
    t.true(report.includes('<skipped></skipped>'))
    
})
