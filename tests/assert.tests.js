const test = require('../aqa')

// TODO (Placeholder)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayFail(ms) {
    return new Promise(resolve => { throw new TypeError('delayFail') });
}

test('Test ourself', t => {    
    t.is(1 + 1, 2);
    t.not(1 + 1, 3);
    t.true(1 === 1);
    t.false(1 === 2); 

    t.throws(_ => { throw new TypeError() });
    const error = t.throws(() => { throw new TypeError() }, {instanceOf: TypeError});
    t.true(error instanceof TypeError);
})

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
})