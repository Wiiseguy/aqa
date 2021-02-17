const test = require('./aqa')

test('Test ourself', t => {    
    t.is(1+1, 2);
    t.not(1+1, 3);
    t.true(1 === 1);
    t.false(1 === 2);
})
