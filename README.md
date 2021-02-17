# aqa
Dependency-less Test Runner for Node.js

### Installation
```
npm i aqa
```

### Basic usage
Syntax is similar to ava.

_your.tests.js:_
```js
const test = require('aqa')

test('Test ourself', t => {    
    t.is(1+1, 2);
    t.not(1+1, 3);
    t.true(1 === 1);
    t.false(1 === 2);
})

```

`
node your.tests.js
`

### Work in progress:
- Actual runner harnass, to run all files matching a glob, etc.
