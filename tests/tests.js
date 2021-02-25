const test = require('../aqa')

// TODO (Placeholder)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

test('An async test', async t => {
    await delay(1);
    t.true(true);
})