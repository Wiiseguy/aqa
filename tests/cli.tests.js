const test = require('../aqa')
const util = require("util");
const child_process = require("child_process");
const { Color } = require('../common');
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

test('Test throw', async t => {
    let e = await t.throwsAsync(async _ => await exec(`node cli tests/_self/throw --verbose`))
    t.true(e.stdout.includes('throw.js:4:11'))
})
