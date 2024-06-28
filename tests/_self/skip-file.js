const test = require('../../aqa')

test.skipFile('Not feeling like testing today...')

let be = 0;
let ae = 0;

test.before(_t => {
    console.log('BEFORE');
});

test.beforeEach(_t => {
    be++;
    console.log('BEFORE EACH' + be);
});

test.afterEach(_t => {
    ae++;
    console.log('AFTER EACH' + ae);
});

test.after(_t => {
    console.log('AFTER');
});

test('x1', t => {
    t.true(true);
})

test('x2', t => {
    t.true(true);
})