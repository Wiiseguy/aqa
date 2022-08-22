const test = require('../../aqa')

function sut() {
    throw new Error('Bye')
}

test('Throw test', _t => {
    sut();
})
