const test = require('../../aqa')

test.before(t => {
    // Causes the test to fail
    t.true(false); 
});

test('x1', t => {
    t.true(true);
})

test('x2', t => {
    t.true(true);
})