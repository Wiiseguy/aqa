# aqa [![ci](https://github.com/Wiiseguy/aqa/actions/workflows/node.js.yml/badge.svg)](https://github.com/Wiiseguy/aqa/actions/workflows/node.js.yml) [![codecov](https://codecov.io/gh/Wiiseguy/aqa/branch/main/graph/badge.svg?token=O7IF9PWJKP)](https://codecov.io/gh/Wiiseguy/aqa) ![npm](https://img.shields.io/npm/v/aqa)
> Dependency-less Test Runner for Node.js

**aqa** is a light-weight and **a** **q**uick **a**lternative to [ava](https://github.com/avajs/ava), with a similar API.


<br>

## Installation
```
npm i aqa -D
```
## Features
- **Dependency-free**: No dependencies, leverages many of Node.js modern built-in modules.
- **Fast**: Runs tests in parallel by default.
- **Watch mode**: Automatically re-run tests when files change.
- **Simple**: No configuration needed, just run your tests!
- **Powerful**: Supports many asserts, async/await, Sourcemaps
- **Coverage**: Code coverage support via your favorite coverage tool.
- **TypeScript**: First-class TypeScript support, with type definitions for all assertions.
- **CI integration**: Easily run tests in CI pipelines. 
- **Reporting**: Generate JUnit and TAP reports.

<br>

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

test('Test something async', async t => {
  let result = await myLib.asyncAdd(1, 1); 
  t.is(result, 2);
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

If your test files are named differently, for instance *.unit-test.js, you can write your test script like this:
```json
"scripts": {
  "test": "aqa *.unit-test.js"
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

> Note: [c8](https://github.com/bcoe/c8) is recommended, because it uses Node's built-in [V8 coverage tools](https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#node_v8_coveragedir) and it is many times faster than [nyc](https://github.com/istanbuljs/nyc).

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

### Mocking
(Available in 1.6.8+) **aqa** supports mocking with the `t.mock()` method. This method lets you mock a method on an object or library. Mocked methods are restored automatically after each test.

```js
const test = require('aqa')
const Http = require('SomeHttpLibrary')

test('Mocking', async t => {
  let mockedGet = t.mock(Http, 'get', async _ => {
    return { statusCode: 200, body: 'Hello World!' }
  })

  let result = await Http.get('https://example.com')
  t.is(result.statusCode, 200)
  t.is(result.body, 'Hello World!')

  t.is(mockedGet.calls.length, 1)
})
```	
In the example above, we mock the `get` method on the `Http` object. The mocked method returns a promise that resolves to a response object. We then assert that the response object has the expected properties. Finally, we assert that the mocked method was called once.

By mocking the `get` method here, any other code that imports `SomeHttpLibrary` and calls `Http.get` will also use the mocked method. This is useful for testing code that uses external libraries.

`t.mock()` returns a `Mock` object with the following properties:
#### `Mock.restore()`
Restores the mocked method back to its original implementation. If you don't call this method, the mocked method will be restored automatically after each test.
#### `Mock.calls`
An array of all calls to the mocked method. Each call is an array of arguments passed to the mocked method.


### Hooks
(Available in 1.6.0+) The following hooks are available:
```js
const test = require('aqa')

test.before(t => {    
  // Your set-up and assertions
  // This is only ran once per test file
})

test.after(t => {    
  // Your tear-down and assertions
  // This is only ran once per test file
})

test.beforeEach(t => {    
  // Your set-up and assertions
  // This is ran before each test
})

test.afterEach(t => {    
  // Your tear-down and assertions
  // This is ran after each test
})
```

### Skipping tests
(Available in 1.6.7+) You can skip all tests in a file by calling `test.skipFile()`:
```js
const test = require('aqa')

test.skipFile('Reason for skipping this file here');
```

<br>

## TypeScript
(Available in 1.3.7+) To write **aqa** test files TypeScript, you will need to enable source maps in your `tsconfig.json`.

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

## Reporting
(Available in 1.6.1+) **aqa** supports reporting test results to a file. The current supported reporters are `junit` and `tap`. To enable it, add the following to your `package.json`:
```jsonc
{  
  "aqa": {
    "reporter": "junit"
  }
}
```
### JUnit
The `junit` reporter will generate a JUnit XML file for each test file in the `.aqa-output/reports` folder. You can then use this file in your CI/CD pipeline to generate reports.

See [Config](#config) for more information.

### TAP
The `tap` reporter will output the test results in the [TAP version 13](https://testanything.org/) format to the console / stdout. Currently, this report is simplified and does not include stack traces.



<br>

## CLI parameters
**aqa** can be run from the terminal like `npx aqa tests/test-*.js` with the following supported parameters:
#### `--watch`
Runs **aqa** in watch mode. See [watch mode](#watch-mode) for more information.
#### `--verbose`
Adds verbose logging.
Example: `aqa --verbose`
#### `--no-concurrency`
Disables concurrency. This will run all tests sequentially.
Example: `aqa --no-concurrency`

<br>

## Config
**aqa** will try to check the `package.json` from where it was ran from for a section named `"aqa"`.

```jsonc
{  
  "aqa": {
    "verbose": true,
    "concurrency": true,
    "reporter": "", 
    "reporterOptions": {
      "outputDir": "test-results/" 
    }
  }
}
```

Supported config:
- `verbose` - If true, enables verbose output. (default = false)
  - Can also be set via the `AQA_VERBOSE` environment variable.
- `concurrency` - If false, disables concurrency. (default = true)
  - Can also be set via the `AQA_CONCURRENCY` environment variable.
- `reporter` - The reporter to use, can be `junit` or `tap`. Default = "" (no reporter)
  - Can also be set via the `AQA_REPORTER` environment variable.
- `reporterOptions` - Options for the reporter. 
  - `outputDir` - The output directory for the reporter. Default = ".aqa-output/reports"
    - Can also be set via the `AQA_REPORTER_OUTPUT_DIR` environment variable.
