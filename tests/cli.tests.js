const test = require('../aqa')
const util = require("util");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);

test('Test should-fail', async t => {
    try {
        await exec(`node cli tests/self/should-fail`);
    } catch(e) {
        t.true(!!e.stderr);
        t.true(e.stderr.includes('Error: Expected true, got false'));
    }
})

test('Test should-fail-fatal', async t => {
    try {
        await exec(`node cli tests/self/should-fail-fatal.txt`);
    } catch(e) {
        t.true(!!e.stderr);
        t.true(e.stderr.includes('Fatal error:'));
        t.true(e.stderr.includes('SyntaxError:'));
    }
})