# aqa
> Dependency-less Test Runner for Node.js

**aqa** is a light-weight and **a** **q**uick **a**lternative to [ava](https://github.com/avajs/ava), with a similar API.

## Installation
```
npm i aqa -D
```

## Usage

### Simple single-file usage

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
### Integration
To run multiple tests and integrate CI testing with your package, you need to change your package.json's `test` in the `scripts` section to `"aqa"`:
```json
"scripts": {
  "test": "aqa"
},
```
Then, to run all your tests: `npm run test`

All files anywhere in your package's directory (and subdirectories, excluding `node_modules` and directories that start with a single `_` ) that match the following patterns will be run: 
```
test.js
tests.js
*.test.js
*.tests.js
*/test-*.js
*.spec.js
**/test/*.js
**/tests/*.js
**/__tests__/*.js
```

If your test files are named differently, for instance *.spec.js, you can write your test script like this:
```json
"scripts": {
  "test": "aqa *.spec.js"
},
```

### Watch mode
To automatically run tests whenever you modify your files, **aqa** has a watch mode. If you desire this functionality, add a new script to your package.json:
```json
"scripts": {
  "test": "aqa",
  "test:watch": "aqa --watch"
},
```
To start the watch script, run `npm run test:watch`.

Like with the `test` script, you can watch files other than `*.test.js`:
```json
"test:watch": "aqa *.foo.js --watch"
```

## API
### Assertion
These assertion methods are currently supported:
#### `t.is(actual, expected, message?)`
Asserts that `actual` is equal to `expected`.
#### `t.not(actual, notEpected, message?)`
Asserts that `actual` is **not** equal to `notEpected`.
#### `t.deepEqual(actual, expected, message?)`
Asserts that `actual` is deeply equal to `expected`. `test.ignore` can be used to skip certain properties, i.e.:
```js
let actual = { a: 3, b: 'ok', c: 7 }
t.deepEqual(actual, {
  a: 3,
  b: 'ok',
  c: test.ignore
})
```
Differences are reported with a minus `-` for actual values and plus `+` for expected values.

You may also use `test.ignoreExtra()` to only assert the given properties in the expected object:
```js
let actual = { a: 3, b: 'ok', c: 7 }
t.deepEqual(actual, test.ignoreExtra({
  b: 'ok',
}))
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
### Utility methods
#### `t.log(message, ...arguments?)`
Similar to `console.log`, but helps you easily find for which test method you've logged information. 
#### `t.disableLogging()`
Suppresses any calls to `console.log`, `console.warn`, `console.error`, etc. for the current testcase. Note that logging is enabled again automatically after the testcase has completed.

## CLI parameters
**aqa** can be run from the terminal like `npx aqa tests/test-*.js` with the following supported parameters:
#### `--watch`
Runs **aqa** in watch mode. See [watch mode](#watch-mode) for more information.
#### `--verbose`
Adds verbose logging.
Example: `aqa --verbose`
#### `--tap`
Optimizes output for TAP results.  
Example: `aqa --tap`

## Work in progress:
- Configuration in (nearest) package.json
