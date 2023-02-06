const test = require('../../aqa')

test('Should succeed', t => {
    t.true(true);
})

test('Should fail', t => {
    t.true(false);
})