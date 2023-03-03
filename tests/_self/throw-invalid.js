const test = require('../../aqa')

test('Throw invalid test 1', _t => {
    throw { message: 'Bye1'}
})

test('Throw invalid test 2', _t => {
    throw  'Bye2'
})