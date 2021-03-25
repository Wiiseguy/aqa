# aqa
> Dependency-less Test Runner for Node.js

**aqa** is a light-weight and **a** **q**uick **a**lternative to [ava](https://github.com/avajs/ava), with a similar API.

### Installation
```
npm i aqa -D
```

### Usage

#### Simple single-file usage

_your.tests.js:_
```js
const test = require('aqa')

test('Test ourself', t => {    
  t.is(1 + 1, 2);
  t.not(1 + 1, 3);
  t.true(1 === 1);
  t.false(1 === 2);
})
```

`
node your.tests.js
`
#### Integration
To run multiple tests and integrate CI testing with your package, you need to change your package.json's `test` in the `scripts` section to `"aqa"`:
```json
"scripts": {
  "test": "aqa"
},
```
Then, to run all your tests: `npm run test`

All files anywhere in your package's directory (and subdirectories) that match `*.test.js` or `*.tests.js` will be ran.

#### Watch mode
To automatically run tests whenever you modify your files, aqa has a watch mode. If you desire this functionality, add a new script to your package.json:
```json
"scripts": {
  "test": "aqa",
  "test:watch": "aqa --watch"
},
```
To start the watch script, run `npm run test:watch`.

### Assertion
These assertion methods are currently supported:
#### `t.is(actual, expected, message?)`
Asserts that `actual` is equal to `expected`.
#### `t.not(actual, notEpected, message?)`
Asserts that `actual` is **not** equal to `notEpected`.
#### `t.deepEqual(actual, expected, message?)`
Asserts that `actual` is deeply equal to `expected`. `test.ignore` can be used to skip certain properties, i.e.:
```js
t.deepEqual(actual, {
  a: 3,
  b: 'ok',
  c: test.ignore
})
```
#### `t.notDeepEqual(actual, expected, message?)`
Asserts that `actual` is **not** deeply equal to `expected`.
#### `t.true(value, message?)`
Asserts that `value` is true.
#### `t.false(value, message?)`
Asserts that `value` is false.
#### `t.throws(fn, opts?, message?)`
Asserts that `fn` throws an exception.
```js
function uhOh() {
  throw new Error("Uh oh.");
}

t.throws(_ => {
  uhOh();
})
```
You can also check for specific types of exception. If the exception does not match it, the test will fail:
```js
t.throws(_ => {
  uhOh();
}, { instanceOf: TypeError })
```
#### `t.throwsAsync(fn, opts?, message?)`
The asynchronous version of t.throws(). Note the addition of async/await.
```js
test('Async test', async t => {
  await t.throwsAsync(async _ => {
    await uhOhAsync();
  })
})
```
You can also check for specific types of exception. If the exception does not match it, the test will fail:
```js
await t.throws(async _ => {
  await uhOhAsync();
}, { instanceOf: TypeError })
```
#### `t.notThrows(fn, message?)`
Asserts that `fn` does not throw an exception.
#### `t.notThrowsAsync(fn, message?)`
Asserts that async function or Promise `fn` does not throw an exception.

### Work in progress:
- Configuration (globs, paths, etc.)
