/*
    aqa - dependency-less testing
*/
const common = require("./common");
const [, , ...args] = process.argv;
const testScriptFilename = process.mainModule ? process.mainModule.filename : process.argv[1];
const thisFilename = __filename;

let tests = [];

const throwsDefaultOpts = {};

function aqa(testName, testFn) {
    tests.push({ name: testName, fn: testFn })
}

aqa.ignore = Symbol('aqa_ignore');

function getCallerFromStack(e) {
    let stack = e.stack;

    if (!stack.includes(testScriptFilename)) {
        return stack;
    }
    stack = stack.replace(e.message, ''); // Stack repeats the message
    let lines = stack.split('\n').map(s => s.trim());
    let probableCause = lines.find(l => l.includes(testScriptFilename));
    let path = probableCause.split('\\').reverse()[0];
    path = path.substr(0, path.length - 1);
    return path;
}

function getSimplifiedStack(e) {
    let stack = e.stack;
    stack = stack.replace(e.message, ''); // Stack repeats the message
    let lines = stack
        .split('\n')
        .slice(1)
        //.map(s => s.trim())
        .filter(s => !s.includes(thisFilename));

    return lines.join('\n');
}

function prefixMessage(message, prefix) {
    if (!prefix) prefix = ':';
    if (message) return prefix + ' ' + message;
    return '';
}

function smartify(o) {
    if (typeof o === 'number' || o instanceof RegExp) return o.toString();
    return JSON.stringify(o);
}

function quoteIfString(s) {
    if (typeof s === 'string') return `"${s}"`;
    return s;
}

function getObjectProperties(o) {
    return Object.entries(Object.getOwnPropertyDescriptors(o))
        .map(([key, value]) => ({ name: key, ...value }));
}

function getEnumerableProperties(o) {
    return getObjectProperties(o).filter(p => p.enumerable);
}

function getEnumerablePropertyNames(o) {
    return getEnumerableProperties(o).map(p => p.name);
}

let t = {
    is(actual, expected, message = "") {
        if (!Object.is(actual, expected)) {
            throw new Error(`Expected ${quoteIfString(expected)}, got ${quoteIfString(actual)} ${prefixMessage(message)}`.trim());
        }
    },
    not(actual, expected, message = "") {
        if (Object.is(actual, expected)) {
            throw new Error(`Expected something other than ${quoteIfString(expected)}, but got ${quoteIfString(actual)} ${prefixMessage(message)}`.trim());
        }
    },
    deepEqual(actual, expected, message = "", _equality = false) {
        const path = [];
        const addDiff = (path, a, b) => path.push({
            differences: [
                '- ' + a,
                '+ ' + b
                //common.makeGray('- ') + a,
                //common.makeGray('+ ') + b
            ],
        });

        const bothNaN = (a, b) => {
            if ((typeof a === 'number' && typeof b === 'number') || (a instanceof Date && b instanceof Date)) {
                return isNaN(a) && isNaN(b);
            }
        };

        const compare = (a, b, path) => {
            if (b === aqa.ignore) {
                return true;
            }
            // Check base equality
            if (Object.is(a, b) || (a === null && b === null) || bothNaN(a, b)) {
                return true;
            }
            // Check deeper equality
            if (typeof a === "object" && typeof b === "object" && a != null && b != null) {
                if (a instanceof Date && b instanceof Date && +a !== +b) {
                    addDiff(path, a.toString(), b.toString());
                    return false;
                }
                if (a instanceof RegExp && b instanceof RegExp && a.toString() !== b.toString()) {
                    addDiff(path, a, b);
                    return false;
                }
                if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) {
                    addDiff(path, smartify(a), smartify(b));
                    return false;
                }

                if (Symbol.iterator in a && Symbol.iterator in b) {
                    a = [...a];
                    b = [...b];
                }

                const aProperties = getEnumerablePropertyNames(a);
                for (let p of aProperties) {
                    path.push(p);
                    if (!compare(a[p], b[p], path)) {
                        return false;
                    }
                    path.pop();
                }
                // Detect extra properties in the expected object, not found in actual
                const bProperties = getEnumerablePropertyNames(b);
                for (let p of bProperties) {
                    if (!aProperties.includes(p) && typeof b[p] !== 'undefined') {
                        path.push(p);
                        addDiff(path, 'undefined', smartify(b[p]));
                        return false;
                    }
                }

                return true;
            }

            addDiff(path, smartify(a), smartify(b));
            return false;
        };

        let equal = compare(actual, expected, path);

        if (equal === _equality) {
            if (_equality === true) {
                throw new Error(`No difference between actual and expected. ${prefixMessage(message)}`.trim());
            } else {
                let last = path.pop();
                let diff = [];
                if (last.differences) {
                    diff = last.differences;
                }
                let diffStr = diff.join('\n');
                let pathString = path.map((p, pi) => {
                    if (Number.isFinite(+p)) return `[${p}]`;
                    return pi > 0 ? '.' + p : p;
                }).join('') || '(root)';
                throw new Error(`Difference found at path: ${pathString}\n${diffStr} ${prefixMessage(message, '\n')}`.trim());
            }
        }
    },
    notDeepEqual(actual, expected, message = "") {
        this.deepEqual(actual, expected, message, true);
    },
    true(actual, message = "") {
        expected = true;
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`.trim());
        }
    },
    false(actual, message = "") {
        expected = false;
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`.trim());
        }
    },
    throws(fn, opts, message = "") {
        opts = { throwsDefaultOpts, ...opts };
        let caughtException = null;

        try {
            if (typeof fn === 'function') {
                fn();
            }
        } catch (e) {
            caughtException = e;
        }

        if (caughtException) {
            if (opts.instanceOf) {
                if (!(caughtException instanceof opts.instanceOf)) {
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message, '\n')}`.trim());
                }
            }
            return caughtException;
        }
        throw new Error(`Expected an exception ${prefixMessage(message)}`.trim());
    },
    notThrows(fn, message = "") {
        try {
            if (typeof fn === 'function') {
                fn();
            }
        } catch (e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`.trim());
        }
    },
    async throwsAsync(fn, opts, message = "") { // TODO: SPOD with throws?
        opts = { throwsDefaultOpts, ...opts };
        let caughtException = null;

        try {
            if (typeof fn === 'function') {
                await fn();
            }
        } catch (e) {
            caughtException = e;
        }

        if (caughtException) {
            if (opts.instanceOf) {
                if (!(caughtException instanceof opts.instanceOf)) {
                    throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message)}`.trim());
                }
            }
            return caughtException;
        }
        throw new Error(`Expected an exception ${prefixMessage(message)}`.trim());
    },
    async notThrowsAsync(fn, message = "") {
        try {
            if (typeof fn === 'function') {
                await fn();
            }
        } catch (e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`.trim());
        }
    },
}

setImmediate(async _ => {
    //console.log("aqa - starting tests", args);
    let isVerbose = args.includes('--verbose');
    const startMs = +new Date;

    let fails = 0;
    // Run tests
    for (let test of tests) {
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
        } catch (e) {
            caughtException = e;
            fails++;
            ok = false;
            //console.error(e);
            testErrorLine = getCallerFromStack(e);
            errorMessage = e.toString();// + ' \n' + getCallerFromStack(e);           
        }

        if (logs.length > 0) {
            console.log(`[Log output for "${test.name}":]`);
            logs.forEach(args => console.log(...args))
        }

        if (ok) {
            //console.log(`Success: "${test.name}"`);
            if (isVerbose) {
                console.log(common.makeGreen('OK'));
            }
        } else {
            console.error(common.makeRed(`FAILED: `), `"${test.name}" @ ${testErrorLine}\n${errorMessage}`);
            console.error(common.makeGray(getSimplifiedStack(caughtException)));
            console.error('');
        }

        if (isVerbose) {
            console.log(' ');
        }
    }

    const elapsedMs = +new Date - startMs;

    if (fails === 0) {
        console.log(common.makeGreen(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} succesfully!`), common.makeGray(`(${common.humanTime(elapsedMs)})`))
    } else {
        console.error(common.makeRed(` ${fails} test failed.`), common.makeGray(`(${common.humanTime(elapsedMs)})`))
        process.exit(1);
    }
})

module.exports = aqa;