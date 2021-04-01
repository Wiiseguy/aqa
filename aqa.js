/*
    aqa - dependency-less testing
*/
const common = require("./common");
const [, , ...args] = process.argv;

let tests = [];

const throwsDefaultOpts = {};

function aqa(testName, testFn) {
    tests.push({ name: testName, fn: testFn})
}

aqa.ignore = Symbol('aqa_ignore');

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

function smaritfy(o) {
    if(typeof o === 'number' && isNaN(o)) return 'NaN';
    return JSON.stringify(o);
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
            if(b === aqa.ignore) {
                return true;
            }
            // Check base equality
            if (a == b || (a === null && b === null) || (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b))) { 
                return true; 
            }
            // Check deeper equality
            if (typeof a === "object" && typeof b === "object" && a != null && b != null) {
                if (a instanceof Date && b instanceof Date) {
                    return +a === +b;
                }
                if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) {
                    path.push({
                        differences: [
                            '- ' + smaritfy(a),
                            '+ ' + smaritfy(b)
                        ],
                    });
                    return false;
                }
                for (var p in a) {
                    if (a.hasOwnProperty(p)) {
                        path.push(p);
                  
                        if (!compare(a[p], b[p], path)) { 
                            return false; 
                        }
                        
                        path.pop();
                    }
                }
                // Detect extra properties in the expected object, not found in actual
                for (var p in b) { 
                    if (b.hasOwnProperty(p) && typeof a[p] === 'undefined' && typeof b[p] !== 'undefined') {
                        path.push({
                            differences: [
                                '+ ' + smaritfy(b[p])
                            ],
                        });
                        return false;
                    } 
                }
                
                return true;
            }

            path.push({
                differences: [
                    '- ' + smaritfy(a),
                    '+ ' + smaritfy(b)
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
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message, '\n')}`);
                }
            }
            return caughtException;
        } 
        throw new Error(`Expected an exception ${prefixMessage(message)}`);
    },
    notThrows(fn, message = "") {
        try {
            if(typeof fn === 'function') {
                fn();
            }
        } catch(e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`);            
        }
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
    },
    async notThrowsAsync(fn, message = "") {
        try {
            if(typeof fn === 'function') {
                await fn();
            }
        } catch(e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`);            
        }
    },
}

setImmediate(async _ => {
    //console.log("aqa - starting tests", args);
    let isVerbose = args.includes('--verbose');
    const startMs = +new Date;

    let fails = 0;
    // Run tests
    for(let test of tests) {
        let ok = true;
        let errorMessage = null;
        let caughtException = null;
        let testErrorLine = '';
        let logs = [];

        let localT = Object.assign(t);
        localT.log = (...args) => logs.push(args);

        if (isVerbose) {
            console.log(`Running test: "${test.name}"`);
        }

        try {
            await test.fn(localT);
        } catch(e) {
            caughtException = e;
            fails++;
            ok = false;
            //console.error(e);
            testErrorLine= getCallerFromStack(e);
            errorMessage = e.toString();// + ' \n' + getCallerFromStack(e);           
        }

        if (logs.length > 0) {
            //console.log(`[Log output for "${test.name}":]`);
            logs.forEach(args => console.log(...args))
        }

        if(ok) {
            //console.log(`Success: "${test.name}"`);
            if (isVerbose) {
                console.log(common.makeGreen('OK'));
            }            
        } else {
            console.error(common.makeRed(`FAILED: `), `"${test.name}" @ ${testErrorLine}\n${errorMessage}`);
            console.error('');
        }

        if (isVerbose) {
            console.log('');
        }
    }

    const elapsedMs = +new Date - startMs;

    if(fails === 0) {
        console.log(common.makeGreen(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} succesfully!`), common.makeGray(`(${common.humanTime(elapsedMs)})`) )
    } else {
        console.error(common.makeRed(` ${fails} test failed.`), common.makeGray(`(${common.humanTime(elapsedMs)})`) )
        process.exit(1);
    }
})

module.exports = aqa;