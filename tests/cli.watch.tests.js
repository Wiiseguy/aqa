const test = require('../aqa')
const common = require('../common')
const fs = require('fs');
const child_process = require("child_process");

function getAbortController() {
    if (typeof AbortController !== 'undefined') {
        return new AbortController();
    }
    console.log("Shimmed AbortController");
    return { signal: undefined, abort() {} }
}

test('Test Watch - specific file', async t => {
    const controller = getAbortController();
    const signal = controller.signal;
    let time = new Date;
    
    let exe = child_process.exec('node cli --watch tests/_self/watch._s', { signal, timeout: 15000 });
    let stdout = '';

    // Collect stdout
    exe.stdout.on('data', (data) => {
        stdout += data;
    });

    await common.poll(_ => stdout.includes('[watch]'), 100, 20);

    // Touch file, to trigger watch
    fs.utimesSync('tests/_self/watch._s', time, time);

    await common.poll(_ => stdout.includes('success'), 100, 20);

    console.log({ stdout });
    t.true(stdout.includes('Ran 1 test successfully!'))

    controller.abort();
    exe.kill();
    exe.unref()
})

test('Test Watch', async t => {
    const controller = getAbortController();
    const signal = controller.signal;
    let stdout = '';
    let exe = child_process.exec('node cli --watch', { signal, timeout: 15000 });
    exe.stdout.on('data', (data) => {
        stdout += data;
    });
    await common.poll(_ => stdout.includes('[watch]'), 100, 20);
    t.true(stdout.includes('[watch]'))
    controller.abort();
})

test('Test Watch - glob', async t => {
    const controller = getAbortController();
    const signal = controller.signal;
    let stdout = '';
    let exe = child_process.exec('node cli --watch *thr*.js', { signal, timeout: 15000 });
    exe.stdout.on('data', (data) => {
        stdout += data;
    });
    await common.poll(_ => stdout.includes('[watch]'), 100, 20);
    t.true(stdout.includes('[watch]'))
    controller.abort();
})
