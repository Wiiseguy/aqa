const test = require('../../aqa')

let be = 0;
let ae = 0;

test.before(t => {
    console.log('BEFORE');
});

test.beforeEach(t => {
    be++;
    console.log('BEFORE EACH' + be);
});

test.afterEach(t => {
    ae++;
    console.log('AFTER EACH' + ae);
});

test.after(t => {
    console.log('AFTER');
});

test('x1', t => {
    t.true(true);
})

test('x2', t => {
    t.true(true);
})