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

test('Test ourself', t => {    
    t.is(1 + 1, 2);
    t.not(1 + 1, 3);
    t.true(1 === 1);
    t.false(1 === 2); 

    t.deepEqual({
        a: {
            aa: 1,
            ab: 2,
            ac: [1,2],
            ad: [{
                aaa: 12
            }],
            ae: NaN,
            af: undefined,
            ag: {ok: true}
        },
        b: [1,2,3]
    }, 
    {
        a: {
            aa: 1,
            ab: 2,
            ac: [1,2],
            ad: [{
                aaa: 1
            }],
            ae: NaN,
            ag: test.ignore
        },
        b: [1,2,3]
        });

    t.notDeepEqual({
        a: {
            aa: 1,
            ab: 2,
            ac: [1,2],
            ad: [{
                aaa: 1
            }]
        },
        b: [1,2,3]
    }, 
    {
        a: {
            aa: 1,
            ab: 2,
            ac: [1,2],
            ad: [{
                aaa: 100000000
            }]
        },
        b: [1,2,3]
    });

    t.throws(_ => { throw new TypeError() });
    t.notThrows(_ => { /* nothing */ });
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

    t.notThrowsAsync(async _ => {
        
    });
})

test('Log test', async t => {
    console.log("Hello", 1, 2, "arg3")
})

test('Log test 2', async t => {
    t.log("Hello", 1, 2, "arg3");
})