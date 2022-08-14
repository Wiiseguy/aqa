const test = require('../aqa')
const util = require("util");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);

test('Test should-fail', async t => {
    try {
        await exec(`node cli tests/_self/should-fail`);
    } catch (e) {
        t.true(e.stdout.includes('should-fail.js:4:11'));
        t.true(e.stdout.includes('Error: Expected true, got false'));
    }
})

test('Test should-fail-fatal', async t => {
    try {
        await exec(`node cli tests/_self/should-fail-fatal.txt`);
    } catch (e) {
        t.true(e.stdout.includes('Fatal error:'));
        t.true(e.stdout.includes('SyntaxError:'));
    }
})

test('Test source map', async t => {
    try {
        await exec(`node cli tests/_self/sourcemap-test.js`);
    } catch (e) {
        t.true(e.stdout.includes('sourcemap-test.ts:5:10 [SourceMap]'));
        t.true(e.stdout.includes('sourcemap-test.ts:9:10 [SourceMap]'));
    }
})