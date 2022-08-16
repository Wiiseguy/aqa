/*
    aqa - dependency-less testing
*/
const util = require("util");
const fs = require('fs');
const path = require('path');

const common = require("./common");
const [, , ...args] = process.argv;
const testScriptFilename = process.mainModule ? process.mainModule.filename : process.argv[1];
const thisFilename = __filename;

const STRING_DIFF_MAX_LINES = 3;
const _backupItems = ['process', 'console'];
const _backup = {};
_backupItems.forEach(b => _backup[b] = Object.getOwnPropertyDescriptor(global, b));
const _backupRestore = () => _backupItems.forEach(b => Object.defineProperty(global, b, _backup[b]));
const errorMatchers = [
    /at\W\S*\W\((.*):(\d+):(\d+)\)/,
    /at (.*):(\d+):(\d+)/
];

const tests = [];

const throwsDefaultOpts = {};

const nop = function () { };
const suppressedConsole = Object.freeze({
    Console: console.Console,
    log: nop,
    warn: nop,
    error: nop,
    count: nop,
    debug: nop,
    dir: nop,
    dirxml: nop,
    info: nop,
    table: nop,
    timeEnd: nop,
    timeLog: nop,
    trace: nop,
    assert: nop,
    clear: nop,
    countReset: nop,
    group: nop,
    groupCollapsed: nop,
    groupEnd: nop,
    time: nop,
    timeStamp: nop,
    profile: nop,
    profileEnd: nop
});

/**
 * Queue a test to be run.
 * @param {string} testName 
 * @param {(t: Asserts) => unknown} testFn 
 */
function aqa(testName, testFn) {
    if (tests.find(t => t.name === testName)) console.log(`${common.Color.red('WARNING')}: Duplicate test name: "${testName}"`);
    tests.push({ name: testName, fn: testFn });
}

function IgnoreExtra(value) {
    this.value = value;
}

aqa.ignore = Symbol('aqa_ignore');
aqa.ignoreExtra = function (value) {
    return new IgnoreExtra(value);
};

function getFilePosition(file, line, col) {
    // Check if a Source Map is available
    let mapFile = file + '.map';
    let exists = fs.existsSync(mapFile);
    if (exists) {
        try {
            let rawSourceMap = JSON.parse(fs.readFileSync(mapFile).toString());
            let mapped = common.mapSourceLocation(line, col, rawSourceMap.mappings, rawSourceMap.sources, rawSourceMap.names);
            let fileDir = path.dirname(file);
            let mapFilePath = path.join(fileDir, mapped.source);
            return `${mapFilePath}:${mapped.line}:${mapped.column} [SourceMap]`;
        } catch (e) {
            console.log("Couldn't map source location", e);
        }
    }

    // Return default file:line:col
    return `${file}:${line}:${col}`;
}

function parseError(line) {
    for (let matcher of errorMatchers) {
        let match = line.match(matcher);
        if (match) return {
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3])
        };
    }
    return null;
}

function getCallerFromStack(e) {
    let stack = e.stack;

    if (!stack.includes(testScriptFilename)) {
        return stack;
    }
    stack = stack.replace(e.message, ''); // Stack repeats the message
    let lines = stack.split('\n').map(s => s.trim());
    let probableCause = lines.find(l => l.includes(testScriptFilename));
    let parsedError = parseError(probableCause);
    if (parsedError !== null) {
        let { file, line, column } = parsedError;
        return getFilePosition(file, line, column);
    }
    return probableCause;
}

function getSimplifiedStack(e) {
    let stack = e.stack;
    stack = stack.replace(e.message, ''); // Stack repeats the message
    let lines = stack
        .split('\n')
        .slice(1)
        //.map(s => s.trim())
        .filter(s => !s.includes(thisFilename));

    if (lines.length <= 1) return '';

    return lines.join('\n');
}

function prefixMessage(message, prefix) {
    if (!prefix) prefix = ':';
    if (message) return prefix + ' ' + message;
    return '';
}

function smartify(o) {
    if (typeof o === 'number' || o instanceof RegExp) return o.toString();
    return util.inspect(o, {
        maxStringLength: Infinity,
        maxArrayLength: Infinity,
        depth: Infinity
    });
}

function getStringDiff(a, b) {
    let linesA = a.split('\n');
    let linesB = b.split('\n');

    for (let i = 0; i < linesA.length; i++) {
        let la = linesA[i];
        let lb = linesB[i];
        if (la !== lb) {
            let lai = i + 1 >= linesB.length ? undefined : i + STRING_DIFF_MAX_LINES;
            let lbi = i + 1 >= linesA.length ? undefined : i + STRING_DIFF_MAX_LINES;
            return [
                linesA.slice(i, lai).join('\n'),
                linesB.slice(i, lbi).join('\n')
            ]
        }
    }
    return [a, b]
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

function areEqual(a, b) {
    if (typeof a === 'number' && typeof b === 'number' && a === b) return true;
    return Object.is(a, b);
}

function isNear(a, b, delta) {
    delta = Math.abs(delta);
    let actualDelta = a - b;
    return Math.abs(actualDelta) <= (delta + Number.EPSILON);
}

function bothNaN(a, b) {
    if ((typeof a === 'number' && typeof b === 'number') || (a instanceof Date && b instanceof Date)) {
        return isNaN(Number(a)) && isNaN(Number(b));
    }
}

function bothNull(a, b) {
    return a === null && b === null;
}

function bothString(a, b) {
    return typeof a === 'string' && typeof b === 'string';
}

function pathToString(path) {
    return path.map((p, pi) => {
        if (Number.isFinite(+p)) return `[${p}]`;
        return pi > 0 ? '.' + p : p;
    }).join('') || '(root)';
}

class Asserts {
    is(actual, expected, message = "") {
        if (!areEqual(actual, expected)) {
            throw new Error(`Expected ${smartify(expected)}, got ${smartify(actual)} ${prefixMessage(message)}`.trim());
        }
    }
    not(actual, expected, message = "") {
        if (areEqual(actual, expected)) {
            throw new Error(`Expected something other than ${smartify(expected)}, but got ${smartify(actual)} ${prefixMessage(message)}`.trim());
        }
    }
    near(actual, expected, delta, message = "") {
        if (!isNear(actual, expected, delta)) {
            let diff = actual - expected;
            throw new Error(`Expected ${smartify(expected)} +/- ${Math.abs(delta)}, got ${smartify(actual)} (difference: ${diff > 0 ? '+' : ''}${diff}) ${prefixMessage(message)} `.trim());
        }
    }
    notNear(actual, expected, delta, message = "") {
        if (isNear(actual, expected, delta)) {
            let diff = actual - expected;
            throw new Error(`Expected something other than ${smartify(expected)} +/- ${Math.abs(delta)}, but got ${smartify(actual)} (difference: ${diff > 0 ? '+' : ''}${diff}) ${prefixMessage(message)} `.trim());
        }
    }
    deepEqual(actual, expected, message = "", _equality = false) {
        if (typeof _equality !== 'boolean') _equality = false;
        const path = [];
        const addDiff = (path, a, b) => {
            if (bothString(a, b)) {
                let stringDiff = getStringDiff(a, b);
                a = stringDiff[0];
                b = stringDiff[1];
            }
            path.push({
                differences: [
                    '- ' + a,
                    '+ ' + b
                    //common.Color.gray('- ') + a,
                    //common.Color.gray('+ ') + b
                ]
            })
        };

        const compare = (a, b, path) => {
            let ignoreExtra = b instanceof IgnoreExtra;
            if (ignoreExtra) {
                b = b.value;
            }
            if (b === aqa.ignore) {
                return true;
            }
            // Check base equality
            if (areEqual(a, b) || bothNull(a, b) || bothNaN(a, b)) {
                return true;
            }
            // Check deeper equality
            if (typeof a === "object" && typeof b === "object" && a != null && b != null) {
                if (a instanceof Date && b instanceof Date && +a !== +b) {
                    addDiff(path, a.toISOString(), b.toISOString());
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
                const bProperties = getEnumerablePropertyNames(b);

                for (let p of aProperties) {
                    if (ignoreExtra && !bProperties.includes(p)) continue;
                    path.push(p);
                    if (!compare(a[p], b[p], path)) {
                        return false;
                    }
                    path.pop();
                }

                // Detect extra properties in the expected object, not found in actual
                for (let p of bProperties) {
                    if (!aProperties.includes(p) && typeof b[p] !== 'undefined' && b[p] !== aqa.ignore) {
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

        let equal;
        try {
            equal = compare(actual, expected, path);
        } catch (e) {
            throw new Error(`Error was thrown while comparing the path "${pathToString(path)}": ${e.message}`);
        }

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
                let pathString = pathToString(path);
                throw new Error(`Difference found at path: ${pathString}\n${diffStr} ${prefixMessage(message, '\n')}`.trim());
            }
        }
    }
    notDeepEqual(actual, expected, message = "") {
        this.deepEqual(actual, expected, message, true);
    }
    true(actual, message = "") {
        let expected = true;
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`.trim());
        }
    }
    false(actual, message = "") {
        let expected = false;
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual} ${prefixMessage(message)}`.trim());
        }
    }
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
    }
    notThrows(fn, message = "") {
        try {
            if (typeof fn === 'function') {
                fn();
            }
        } catch (e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`.trim());
        }
    }
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
    }
    async notThrowsAsync(fn, message = "") {
        try {
            if (typeof fn === 'function') {
                await fn();
            }
        } catch (e) {
            throw new Error(`Expected no exception, got exception of type '${e.name}': ${e.message} ${prefixMessage(message, '\n')}`.trim());
        }
    }
    disableLogging() {
        global.console = suppressedConsole;
    }
    log() { }
}

const t = new Asserts();

setImmediate(async function aqa_tests_runner() {
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

        // Restore potentially overwritten critical globals
        _backupRestore();

        if (logs.length > 0) {
            console.log(`[Log output for "${test.name}":]`);
            logs.forEach(args => console.log(...args))
        }

        if (ok) {
            //console.log(`Success: "${test.name}"`);
            if (isVerbose) {
                console.log(common.Color.green('OK'));
            }
        } else {
            console.error(common.Color.red(`FAILED: `), `"${test.name}"`);
            console.error(common.Color.gray(testErrorLine));
            console.error(errorMessage);
            let stack = getSimplifiedStack(caughtException);
            if (stack) {
                console.error(common.Color.gray(getSimplifiedStack(caughtException)));
            }
            console.error('');
        }

        if (isVerbose) {
            console.log(' ');
        }
    }

    const elapsedMs = +new Date - startMs;

    if (fails === 0) {
        console.log(common.Color.green(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} succesfully!`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
    } else {
        console.error(common.Color.red(` ${fails} test failed.`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
        process.exit(1);
    }
})

module.exports = aqa;