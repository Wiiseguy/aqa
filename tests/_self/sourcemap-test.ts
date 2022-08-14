/** @ts-ignore */
import test = require('../../aqa')

test('Should fail 1', t => {
    t.true(false);
})

test('Should fail 2', t => {
    t.true(false);
})

// tsc sourcemap-test.ts --sourceMap