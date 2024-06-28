const test = require('../aqa');
const fs = require('fs');
const { watchFiles } = require('../cli.watch');

test('Watch - specific file', async t => {
    const time = new Date();
    const stopSignal = {};
    let ranTests = false;

    const runTests = () => {
        ranTests = true;
        stopSignal.stop();
    };
    const onScan = () => {
        fs.utimesSync('tests/_self/watch._s', time, time);
    };

    await watchFiles('tests/_self/watch._s', runTests, false, stopSignal, onScan);

    t.true(ranTests);
});

test('Watch - all files', async t => {
    const stopSignal = {};
    let ranScan = false;

    const runTests = () => {};
    const onScan = () => {
        ranScan = true;
        stopSignal.stop();
    };

    await watchFiles('tests/_self/watch._s', runTests, false, stopSignal, onScan);

    // Can't trigger change in this mode as it would also
    // cause the current watch to retrigger, causing an infinite loop

    t.true(ranScan);
});
