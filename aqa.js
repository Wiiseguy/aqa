/*
    aqa - dependency-less testing
    
    15-02-2021: Started
*/
const common = require("./common");

let tests = [];

const throwsDefaultOpts = {};

let t = {
    is(actual, expected) {
        if(!Object.is(actual, expected)) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    },
    not(actual, expected) {
        if(Object.is(actual, expected)) {
            throw new Error(`Expected something other than ${expected}, but got ${actual}`);
        }
    },
    true(actual) {
        expected = true;
        if(actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    },
    false(actual) {
        expected = false;
        if(actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    },
    throws(fn, opts) {
        opts = { throwsDefaultOpts, ...opts };
        let caughtException = null;

        try {
            if(typeof fn === 'function') {
                fn();
            }
        } catch(e) {
            caughtException = e;            
        }

        if(caughtException) {
            if(opts.instanceOf) {
                if(!(caughtException instanceof opts.instanceOf)) {
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}'`);
                }
            }
            return caughtException;
        } 
        throw new Error(`Expected an exception`);
    }
}

function aqa(testName, testFn) {
    tests.push({ name: testName, fn: testFn})
}

function getCallerFromStack(stack) {
    let lines = stack.split('\n').map(s => s.trim()).slice(2);
    let probableCause = lines[0];
    let path = probableCause.split('\\').reverse()[0];
    path = path.substr(0, path.length-1);
    return path;
}

setImmediate(_ => {
    //console.log("aqa - starting tests");
    let fails = 0;
    // Run tests
    tests.forEach(test => {
        let ok = true;
        let errorMessage = null;
        let caughtException = null;

        try {
            test.fn(t);
        } catch(e) {
            caughtException = e;
            fails++;
            ok = false;
            errorMessage = e.toString() + ' - ' + getCallerFromStack(e.stack);
        }

        if(ok) {
            //console.log(`Success: "${test.name}"`);
        } else {
            console.error(common.makeRed(`FAILED: `),`"${test.name}": ${errorMessage}`);
        }
    });

    if(fails === 0) {
        console.log(common.makeGreen(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} succesfully!`))
    } else {
        console.error(common.makeRed(` ${fails} test failed.`))
        process.exit(1);
    }
})

module.exports = aqa;