const test = require('../aqa')

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayFail(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(_ => {
            reject(new TypeError('delayFail'));
        }, ms);
    });
}


test('Async test', async t => {
    await delay(1);
    t.true(true);
})

test('Async fail test', async t => {
    let e = await t.throwsAsync(async _ => {
        await delayFail(1);
    });
    await t.throwsAsync(async _ => {
        await delayFail(1);
    }, { instanceOf: TypeError });

    t.true(e instanceof TypeError);
    t.is(e.message, 'delayFail');

    t.notThrowsAsync(async _ => {

    });
});

test('Log test', async t => {
    //console.log("Hello", 1, 2, "arg3")
})

test('Log test 2', async t => {
    //t.log("Hello", 1, 2, "arg3");
})