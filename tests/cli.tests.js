const test = require('../aqa')
const util = require("util");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);

test('Test should-fail', async t => {
    try {
        await exec(`node cli tests/.self/should-fail`);
    } catch(e) {        
        t.true(e.stdout.includes('Error: Expected true, got false'));
    }
})

test('Test should-fail-fatal', async t => {
    try {
        await exec(`node cli tests/.self/should-fail-fatal.txt`);
    } catch(e) {
        t.true(e.stdout.includes('Fatal error:'));
        t.true(e.stdout.includes('SyntaxError:'));
    }
})