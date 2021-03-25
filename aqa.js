/*
    aqa - dependency-less testing
*/
const common = require("./common");

let tests = [];

const throwsDefaultOpts = {};

function aqa(testName, testFn) {
    tests.push({ name: testName, fn: testFn})
}

function getCallerFromStack(e) {
    let stack = e.stack;
    stack = stack.replace(e.message, ''); // Stack repeats the message
    let lines = stack.split('\n').map(s => s.trim()).slice(2);
    let probableCause = lines[0];
    let path = probableCause.split('\\').reverse()[0];
    path = path.substr(0, path.length-1);
    return path;
}

function prefixMessage(message, prefix) {
    if(!prefix) prefix = ':';
    if(message) return prefix + ' ' + message;
    return '';
}

let t = {
    is(actual, expected, message = "") {
        if(!Object.is(actual, expected)) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`);
        }
    },
    not(actual, expected, message = "") {
        if(Object.is(actual, expected)) {
            throw new Error(`Expected something other than ${expected}, but got ${actual} ${prefixMessage(message)}`);
        }
    },
    deepEqual(actual, expected, message = "", _equality=false) {        
        const path = [];
        const compare = (a, b, path) => {
            if (a == b) return true;
            if (typeof a === "object" && typeof b === "object" && a != null && b != null) {
                if (a instanceof Date && b instanceof Date) {
                    return +a === +b;
                }
                if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) {
                    path.push({
                        differences: [
                            '-' + JSON.stringify(a),
                            '+' + JSON.stringify(b)
                        ],
                    });
                    return false;
                }
                for (var p in a) {
                    if (a.hasOwnProperty(p)) {
                        path.push(p);
                        if (typeof b[p] === 'undefined') { 
                            path.push({
                                differences: [
                                '-' + JSON.stringify(a[p])
                                ]
                            });
                            return false; 
                        }
                        switch (typeof a[p]) {
                            case 'object':
                                if (!compare(a[p], b[p], path)) { 
                                    /*path.push({
                                        differences: [
                                            '-' + JSON.stringify(a[p]),
                                            '+' + JSON.stringify(b[p])
                                        ],
                                    });*/
                                    return false; 
                                } 
                                break;
                            default:
                                if(a[p] !== b[p]) {
                                    path.push({
                                        differences: [
                                            '-' + JSON.stringify(a[p]),
                                            '+' + JSON.stringify(b[p])
                                        ],
                                    });
                                    return false;
                                }
                                break;
                        }
                        path.pop();
                    }
                }
                for (var p in b) { 
                    if (b.hasOwnProperty(p) && typeof a[p] === 'undefined') {
                        path.push({
                            differences: [
                                '+' + JSON.stringify(b[p])
                            ],
                        });
                        return false;
                    } 
                }
                
                return true;
            }

            path.push({
                differences: [
                    '-' + JSON.stringify(a),
                    '+' + JSON.stringify(b)
                ],
            });
            return false;
        }
        
        let equal = compare(actual, expected, path);

        if(equal === _equality) {
            if(equal === true) {
                throw new Error(`No difference between actual and expected. ${prefixMessage(message)}`);
            } else {
                //console.log(path)
                let last = path.pop();
                let diff = [];
                if(last.differences) {
                    diff = last.differences;
                }
                let diffStr = diff.join('\n');
                let pathString = path.map((p,pi) => {
                    if(Number.isFinite(+p)) return `[${p}]`;
                    return pi > 0 ? '.' + p : p;
                }).join('') || '(root)';
                throw new Error(`Difference found at:\nPath: ${pathString}\n${diffStr} ${prefixMessage(message,'\n')}`);
            }
        }
    },
    notDeepEqual(actual, expected, message = "") {
        this.deepEqual(actual, expected, message, true);
    },
    true(actual, message = "") {
        expected = true;
        if(actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`);
        }
    },
    false(actual, message = "") {
        expected = false;
        if(actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`);
        }
    },
    throws(fn, opts, message = "") {
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
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message)}`);
                }
            }
            return caughtException;
        } 
        throw new Error(`Expected an exception ${prefixMessage(message)}`);
    },
    async throwsAsync(fn, opts, message = "") { // TODO: SPOD with throws?
        opts = { throwsDefaultOpts, ...opts };
        let caughtException = null;

        try {
            if(typeof fn === 'function') {
                await fn();
            }
        } catch(e) {
            caughtException = e;            
        }

        if(caughtException) {
            if(opts.instanceOf) {
                if(!(caughtException instanceof opts.instanceOf)) {
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message)}`);
                }
            }
            return caughtException;
        } 
        throw new Error(`Expected an exception ${prefixMessage(message)}`);
    }
}

setImmediate(async _ => {
    //console.log("aqa - starting tests");
    let fails = 0;
    // Run tests
    for(let test of tests) {
        let ok = true;
        let errorMessage = null;
        let caughtException = null;
        let testErrorLine = '';

        try {
            await test.fn(t);
        } catch(e) {
            caughtException = e;
            fails++;
            ok = false;
            //console.error(e);
            testErrorLine= getCallerFromStack(e);
            errorMessage = e.toString();// + ' \n' + getCallerFromStack(e);           
        }

        if(ok) {
            //console.log(`Success: "${test.name}"`);
        } else {
            console.error(common.makeRed(`FAILED: `),`"${test.name}" @ ${testErrorLine}\n${errorMessage}`);
        }
    }

    if(fails === 0) {
        console.log(common.makeGreen(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} succesfully!`))
    } else {
        console.error(common.makeRed(` ${fails} test failed.`))
        process.exit(1);
    }
})

module.exports = aqa;