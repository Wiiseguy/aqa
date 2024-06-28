const test = require('../aqa');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayFail(ms) {
    return new Promise((_resolve, reject) => {
        setTimeout(_ => {
            reject(new TypeError('delayFail'));
        }, ms);
    });
}

test('Async test', async t => {
    await delay(1);
    t.true(true);
});

test('Async fail test', async t => {
    let e = await t.throwsAsync(async _ => {
        await delayFail(1);
    });
    await t.throwsAsync(
        async _ => {
            await delayFail(1);
        },
        { instanceOf: TypeError }
    );

    t.true(e instanceof TypeError);
    t.is(e.message, 'delayFail');

    t.notThrowsAsync(async _ => {});
});
