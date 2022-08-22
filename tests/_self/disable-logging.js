const test = require('../../aqa')

test('Should show logging in other test 1', t => {
    console.log('Howdy');
    t.true(true);
})

test('Should disable logging', t => {
    console.log('Hello');
    t.disableLogging();
    console.log('World');
    t.true(true);
})

test('Should show logging in other test 2', t => {
    console.log('Hiya');
    t.true(true);
})
