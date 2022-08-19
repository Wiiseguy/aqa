# aqa
> Dependency-less Test Runner for Node.js

**aqa** is a light-weight and **a** **q**uick **a**lternative to [ava](https://github.com/avajs/ava), with a similar API.

<br>

## Installation
```
npm i aqa -D
```


## Usage

### Simple single-file usage

_your.tests.js:_
```js
const test = require('aqa')
const myLib = require('./my-lib')

test('Test our library', t => {    
  t.is(myLib.add(1, 1), 2);
  t.not(myLib.add(2, 2), 3);
  t.true(myLib.isPrime(3));
  t.false(myLib.isOdd(2));
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

<br>

## Coverage
**aqa** can be easily integrated with coverage tools such as [nyc](https://github.com/istanbuljs/nyc) and [c8](https://github.com/bcoe/c8). 

To enable coverage with [c8](https://github.com/bcoe/c8), add the following to your package.json:
```jsonc
"scripts": {
  // Other scripts
  "test:coverage": "c8 npm test"
},
```
Or to run tests with [nyc](https://github.com/istanbuljs/nyc):
```jsonc
"scripts": {
  // Other scripts
  "test:coverage": "nyc aqa"
},
```

Running `test:coverage` will produce something like this:
```
--------------|---------|----------|---------|---------|-----------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-----------------------
All files     |    99.2 |    96.63 |   98.57 |    99.2 | 
 my-lib.js    |   97.74 |    95.18 |   98.55 |   97.74 | 20-21,190-191,231-232
 test.js      |     100 |      100 |     100 |     100 | 
--------------|---------|----------|---------|---------|-----------------------
```

To add special reporters such as LCOV and HTML, check the README pages of the code coverage package.

> Note: [c8](https://github.com/bcoe/c8) is recommended, as it is many times faster than [nyc](https://github.com/istanbuljs/nyc), because uses Node's built-in [V8 coverage tools](https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#node_v8_coveragedir).

<br>

## API
### Assertion
The callback parameter for `test()` wraps many assertion methods (in this case `t`):
```js
test('Test name', t => {    
  // Your assertions
})
```
These assertion methods are currently supported:
#### `t.is(actual, expected, message?)`
Asserts that `actual` is equal to `expected`.
#### `t.not(actual, notEpected, message?)`
Asserts that `actual` is **not** equal to `notEpected`.
#### `t.near(actual, expected, delta, message?)`
Asserts that `actual` is equal to `expected` within the precision of `delta`.
#### `t.notNear(actual, expected, delta, message?)`
Asserts that `actual` is **not** equal to `expected` within the precision of `delta`.
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


<br>

## TypeScript
(Available in 1.3.7+) To write **aqa** test files TypeScript, you will need to enable source maps in your tsconfig.json.

```jsonc
"compilerOptions": {
  // Can be any other path, but .js files will need to be emitted
  "outDir": "./dist",   
  "sourceMap": true,
  "module": "commonjs",
  // other compiler options
}
```
For an optimal development flow, run the following tasks (add them to `package.json` scripts first):
- `tsc --watch`
- `aqa --watch`

Now let's create a file named *your.tests.ts*:
```ts
import test = require('aqa')
import myLib from './my-lib'

test('Should fail', t => {
    t.is(myLib.add(1, 1), 3)
})
```

This will fail with something like the following output:
```
FAILED:  "Should fail"
D:\DEV\YourProject\tests\your.tests.ts:6:10 [SourceMap]
```

Note the source-mapped location. This will allow you to Ctrl+Click on the location in your IDE to easily jump to the original test file.

<br>

### Source maps
Source maps are a way to map the original source code to the generated code. This is useful for debugging and development. Languages or tools that compile to JavaScript, like TypeScript, CoffeeScript, ClojureScript, BabelJS, etc., can generate source maps.
We've only covered TypeScript here, but if you're using another language that has a compiler that generates source maps, it should work with **aqa**. 


<br>

## CLI parameters
**aqa** can be run from the terminal like `npx aqa tests/test-*.js` with the following supported parameters:
#### `--watch`
Runs **aqa** in watch mode. See [watch mode](#watch-mode) for more information.
#### `--verbose`
Adds verbose logging.
Example: `aqa --verbose`

<br>
<br>

## Work in progress:
- Configuration in (nearest) package.json
- TAP results
