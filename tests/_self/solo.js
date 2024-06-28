const test = require('../../aqa')

test.solo('Should not run 1', t => {
    t.true(true);
})

test.solo('Should run', t => {
    t.true(true);
})

test('Should not run 2', t => {
    t.true(false);
})