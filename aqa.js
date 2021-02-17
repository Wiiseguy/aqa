/*
    aqa - dependency-less testing
    
    15-02-2021: Started
    
    TODO 15-02-2021: npm link like in photo-fix
*/

let tests = [];

let t = {
    is(actual, expected) {
        if(actual != expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    },
    not(actual, expected) {
        if(actual == expected) {
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
    }
}

function awa(testName, testFn) {
    tests.push({ name: testName, fn: testFn})
}

function getCallerFromStack(stack) {
    let lines = stack.split('\n').map(s => s.trim()).slice(2);
    let probableCause = lines[0];
    let path = probableCause.split('\\').reverse()[0];
    path = path.substr(0, path.length-1);
    let info = path.split(':')
    return `${info[0]} Line ${info[1]}`;
}

setImmediate(_ => {
    console.log("aqa - starting tests");
    let fails = 0;
    // Run tests
    tests.forEach(test => {
        let ok = true;
        let errorMessage = null;

        try {
            test.fn(t);
        } catch(e) {
            fails++;
            ok = false;
            errorMessage = e.toString() + ' - ' + getCallerFromStack(e.stack);
            console.error(e);
        }

        if(ok) {
            console.log(`Success: "${test.name}"`);
        } else {
            console.log(`FAILED:  "${test.name}": ${errorMessage}`);
        }
    });

    if(fails === 0) {
        console.log(`Ran ${tests.length} test(s) succesfully!`)
    } else {
        console.log(`Failed ${fails} out of ${tests.length} tests.`)
    }
})


module.exports = awa;