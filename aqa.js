/*
    aqa - dependency-less testing
*/
const util = require("util");
const fs = require('fs');
const path = require('path');

const common = require("./common");
const testScriptFilename = require.main ? require.main.filename : process.argv[1];
const thisFilename = __filename;
let testFilenameWithoutExt = path.basename(testScriptFilename, path.extname(testScriptFilename));
let testFilenameWithoutCwd = testScriptFilename.replace(process.cwd(), '');
let testFilenameWithoutCwdAndExt = testFilenameWithoutCwd.replace(path.extname(testFilenameWithoutCwd), '');
let testFilenameNormalized = testFilenameWithoutCwdAndExt.replace(/[\\/]/g, '--');
let testFilename = testFilenameWithoutCwd.replace(/\\/g, '/');

const _backupItems = ['process', 'console'];
const _backup = {};
_backupItems.forEach(b => _backup[b] = Object.getOwnPropertyDescriptor(global, b));
const _backupRestore = () => _backupItems.forEach(b => Object.defineProperty(global, b, _backup[b]));
const errorMatcher = /(.*):(\d+):(\d+)/;

const packageConfig = common.getPackageConfig();

const tests = [];
const testsBefore = [];
const testsAfter = [];
const testsBeforeEach = [];
const testsAfterEach = [];

const throwsDefaultOpts = {};

const nop = function () { /* Used for console suppression */ };
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

let skipFile = false;
let skipFileReason = '';
let cachedSourceMap = new Map();

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

aqa.before = function (fn) {
    testsBefore.push(fn);
};
aqa.after = function (fn) {
    testsAfter.push(fn);
};
aqa.beforeEach = function (fn) {
    testsBeforeEach.push(fn);
};
aqa.afterEach = function (fn) {
    testsAfterEach.push(fn);
};
aqa.skipFile = function (reason) {
    skipFile = true;
    skipFileReason = reason || 'Skipped file';
};

function getSourceMap(file) {
    if (cachedSourceMap.has(file)) return cachedSourceMap.get(file);

    let mapFile = file + '.map';
    let exists = fs.existsSync(mapFile);
    if (exists) {
        let sourceMap = JSON.parse(fs.readFileSync(mapFile).toString());
        cachedSourceMap.set(file, sourceMap);
        return sourceMap;
    }
    return null;
}

function getFilePosition(file, line, col) {
    // Check if a Source Map is available
    let sourceMap = getSourceMap(file);
    if (sourceMap) {
        try {
            let mapped = common.mapSourceLocation(line, col, sourceMap.mappings, sourceMap.sources, sourceMap.names);
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
    line = line.substr(line.indexOf(testScriptFilename));
    let match = line.match(errorMatcher);
    if (match) return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3])
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
        .slice(1) // Remove the first line, which is the origin
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
    return util.inspect(o, {
        maxStringLength: Infinity,
        maxArrayLength: Infinity,
        depth: Infinity
    });
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

function createDiffString(a, b) {
    return [
        common.Color.red('- ') + a,
        common.Color.green('+ ') + b
    ].join('\n')
}

class Asserts {
    is(actual, expected, message = "") {
        if (!areEqual(actual, expected)) {
            throw new Error(`Actual value is not equal to expected:\n${createDiffString(smartify(actual), smartify(expected))}${prefixMessage(message, '\n')}`.trim());
        }
    }
    not(actual, expected, message = "") {
        if (areEqual(actual, expected)) {
            throw new Error(`Actual value is equal to expected ${prefixMessage(message)}`.trim());
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
                let stringDiff = common.getStringDiff(a, b);
                a = stringDiff[0];
                b = stringDiff[1];
            }
            path.push({
                differences: createDiffString(a, b)
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
                let diffStr = last.differences || '';
                let pathString = pathToString(path);
                throw new Error(`Difference found at path: ${pathString}\n${diffStr}${prefixMessage(message, '\n')}`.trim());
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
    _throwsCheckType(caughtException, opts, message) {
        if (opts.instanceOf) {
            if (!(caughtException instanceof opts.instanceOf)) {
                throw new Error(`Expected error to be an instance of '${opts.instanceOf.name}', got '${caughtException.name}' ${prefixMessage(message, '\n')}`.trim());
            }
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
            this._throwsCheckType(caughtException, opts, message);
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
    async throwsAsync(fn, opts, message = "") {
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
            this._throwsCheckType(caughtException, opts, message);
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
    log(_s) { /* Overwritten later */ }
}

const t = new Asserts();

function outputFailure(testName, caughtException, fileName) {
    if (!(caughtException instanceof Error)) {
        if (typeof caughtException !== 'object') {
            caughtException = { message: caughtException }
        }
        caughtException = Object.assign(new Error(), caughtException);
        caughtException.message = '[WARNING: aqa could not determine stack information, because the thrown object was not an Error.] ' + caughtException.message;
    }
    let testErrorLine = getCallerFromStack(caughtException);
    let errorMessage = caughtException.toString();
    console.error(common.Color.red(`FAILED: `), `"${testName}"` + (fileName ? ` (${fileName})` : ''));
    console.error(common.Color.gray(testErrorLine));
    console.error(errorMessage);
    let stack = getSimplifiedStack(caughtException);
    if (stack) {
        console.error(common.Color.gray(stack));
    }
    console.error('');

    return errorMessage + '\n' + testErrorLine + '\n' + stack;
}

/**
 * 
 * @param {TestResult} testResult 
 */
function outputReport(testResult) {
    let reporter = (packageConfig.reporter || '').toLocaleLowerCase();
    let result = '';

    const makeXmlSafe = (s) => {
        if (typeof s !== 'string') return s;
        s = common.Color.strip(s);
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };

    if (reporter === 'junit') {
        result = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<testsuites name="aqa tests" tests="${testResult.numTests}" failures="${testResult.numFailedTests}" time="${testResult.duration / 1000}">\n` +
            `  <testsuite name="${makeXmlSafe(testResult.name)}" tests="${testResult.numTests}" failures="${testResult.numFailedTests}" timestamp="${testResult.startTime.toISOString()}" time="${testResult.duration / 1000}">\n` +
            testResult.testCases.map(testCase => {
                return `    <testcase name="${makeXmlSafe(testCase.name)}" classname="${makeXmlSafe(testResult.name)}" time="${testCase.duration / 1000}">\n` +
                    (!testCase.success && testCase.failureMessage != null ? `      <failure message="${makeXmlSafe(testCase.failureMessage)}"></failure>\n` : '') +
                    (testCase.skipped ? `      <skipped>${testCase.skipMessage || ''}</skipped>\n` : '') +
                    `    </testcase>\n`;
            }).join('') +
            `  </testsuite>\n` +
            `</testsuites>`;
        let outputDir = packageConfig.reporterOptions?.outputDir || '';
        let outputFileName = `test-result${testFilenameNormalized}.xml`;
        let outputPath = path.join(outputDir, outputFileName);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, result);
    }
    else if (reporter === 'tap') {
        let testCases = testResult.testCases.map((testCase, i) => {
            return `${testCase.success ? 'ok' : 'not ok'} ${i + 1} - ${testCase.name}` +
                (testCase.skipped ? `  # SKIP ${testCase.failureMessage}` : '');
        }).join('\n');
        result = `TAP version 13\n` +
            `1..${testResult.numTests}\n` +
            testCases + '\n' +
            `# tests ${testResult.numTests}\n` +
            `# pass ${testResult.numTests - testResult.numFailedTests}\n` +
            `# fail ${testResult.numFailedTests}\n` +
            `# duration_ms ${testResult.duration}\n`;

        console.log(result);
    }

    return result;
}


setImmediate(async function aqa_tests_runner() {
    let isVerbose = packageConfig.verbose;
    const startMs = +new Date;

    let numTests = tests.length;
    let fails = 0;
    let beforeFailed = false;

    /** @type {TestResult} */
    const testResult = {
        duration: 0,
        startTime: new Date,
        name: testFilename,
        numFailedTests: 0,
        numTests: 0,
        testCases: []
    };

    const runBeforeAfter = async (fn, name) => {
        let testCaseStartMs = +new Date;
        /** @type {TestCaseResult} */
        let testCase = {
            duration: 0,
            startTime: new Date,
            name: name + ' - ' + testFilename,
            failureMessage: null,
            success: false,
            skipped: false
        };
        testResult.testCases.push(testCase);
        if (skipFile) {
            testCase.skipped = true;
            testCase.skipMessage = skipFileReason;
            return;
        }

        try {
            await fn(t);
        } catch (e) {
            fails++;
            testCase.failureMessage = outputFailure(name, e, testFilenameWithoutExt);
        }
        testCase.duration = +new Date - testCaseStartMs;
        testCase.success = !testCase.failureMessage;
        return testCase.success;
    };

    // Run before-tests
    for (let fn of testsBefore) {
        let ok = await runBeforeAfter(fn, 'before');
        if (!ok) beforeFailed = true;
    }

    // Run tests
    for (let test of tests) {
        /** @type {TestCaseResult} */
        let testCaseResult = {
            duration: 0,
            startTime: new Date,
            name: test.name,
            failureMessage: null,
            success: false,
            skipped: false
        };
        testResult.testCases.push(testCaseResult);

        let testStartMs = +new Date;

        if (beforeFailed || skipFile) {
            testCaseResult.skipped = true;
            testCaseResult.skipMessage = skipFile ? skipFileReason : 'before-tests failed';
            console.error(common.Color.yellow(`SKIPPED: `), test.name, common.Color.gray(`(${testCaseResult.skipMessage})`));
            continue;
        }
        let ok = true;
        let caughtException = null;
        let logs = [];

        let localT = Object.assign(t);
        localT.log = (...args) => logs.push(args);

        if (isVerbose) {
            console.log(`Running test: "${test.name}"`);
        }

        try {
            // Run before-each-tests
            for (let fn of testsBeforeEach) {
                await fn(localT);
            }

            // Run actual test
            await test.fn(localT);

            // Run after-each-tests
            for (let fn of testsAfterEach) {
                await fn(localT);
            }
        } catch (e) {
            caughtException = e;
            fails++;
            ok = false;
        }

        let elapsedTestMs = +new Date - testStartMs;

        testCaseResult.success = ok;
        testCaseResult.duration = elapsedTestMs;

        // Restore potentially overwritten critical globals
        _backupRestore();

        if (logs.length > 0) {
            console.log(`[Log output for "${test.name}":]`);
            logs.forEach(args => console.log(...args))
        }

        if (ok) {
            if (isVerbose) {
                console.log(common.Color.green('OK'));
            }
        } else {
            testCaseResult.failureMessage = outputFailure(test.name, caughtException);
        }

        if (isVerbose) {
            console.log(' ');
        }
    }

    // Run after-tests
    for (let fn of testsAfter) {
        await runBeforeAfter(fn, 'after');
    }

    const elapsedMs = +new Date - startMs;

    testResult.duration = elapsedMs;
    testResult.numFailedTests = fails;
    testResult.numTests = numTests;
    outputReport(testResult);

    if (fails === 0) {
        console.log(common.Color.green(` Ran ${tests.length} test${tests.length === 1 ? '' : 's'} successfully!`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
    } else {
        console.error(common.Color.red(` ${fails} test failed.`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
        process.exit(1);
    }
})

module.exports = aqa;