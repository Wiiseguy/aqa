#!/usr/bin/env node

const util = require("util");
const path = require("path");
const child_process = require("child_process");
const common = require("./common");
const { watchFiles } = require("./cli.watch");

const exec = util.promisify(child_process.exec);

const [, , ...args] = process.argv
const cwd = process.cwd();
const cwds = path.join(cwd, '/');

const MAX_TEST_TIME_MS = 10000;

// RegExps
const reNumTestExtract = /(\d+) test/;

let isVerbose = false;

async function main() {
    let arg0 = args.filter(a => !a.startsWith('-'))[0]; // First non-flag argument

    isVerbose = args.includes('--verbose');
    let isWatch = args.includes('--watch');

    if (isWatch) {
        // Watch files and run tests when changed
        watchFiles(arg0, runTests, isVerbose);
    } else {
        let testsFiles = [];
        let allFiles = await common.getFiles(cwd);

        if (arg0) { // Param is file/glob
            let reGlob = common.microMatch(arg0);
            if (typeof reGlob === 'string') { // Not a regexp, just try to testrun the file
                testsFiles.push(arg0);
            } else {
                testsFiles = allFiles.filter(f => f.replace(cwds, '').match(reGlob));
            }
        } else {
            // Test all files
            testsFiles = filterTestFiles(allFiles);
        }

        if (isVerbose) {
            console.log("Running tests for:", testsFiles.join(', '));
        }

        let result = await runTests(testsFiles);
        if (result.failed.length > 0) {
            process.exit(1);
        }

    }
}

async function runTests(filesToTest) {
    //console.log("Running:", filesToTest)
    const startMs = +new Date;
    let testsFiles = filesToTest;

    let tasks = [];
    testsFiles.forEach(tf => {
        tasks.push({
            name: tf,
            exec: _ => exec(`node ${tf} --cli ${isVerbose ? '--verbose' : ''}`),
            result: null
        });
    });

    // Execute tests
    for (let task of tasks) {
        try {
            task.result = await common.timeout(task.exec(), MAX_TEST_TIME_MS, { stdout: '', stderr: `Timeout exceeded while waiting for ${task.name}` });
        } catch (e) {
            task.result = e;
            task.result.code = 1;
        }
    }

    // Check and handle results
    let numOk = 0;
    let numFailed = 0;
    let failed = [];
    tasks.forEach(m => {
        let result = m.result;

        let relevantOutput = result.stdout || '';

        if (result.code === 1) {
            let lastLine = getLastLine(result.stderr);
            let numTests = extractNumTests(lastLine);
            if (numTests === -1) {
                numFailed += 1;
                failed.push({ name: m.name, result, fatal: true });
            } else {
                numFailed += numTests;
                failed.push({ name: m.name, result })
            }
        }
        else if (result.stdout) {
            let lastLine = getLastLine(result.stdout);
            numOk += extractNumTests(lastLine);
            relevantOutput = withoutLastLine(result.stdout) + '\n' + result.stderr;
        }

        relevantOutput = relevantOutput.trim();

        if (relevantOutput) {
            console.log(`[${m.name}]`);
            console.log(relevantOutput);
        }
    });


    let elapsedMs = +new Date - startMs;

    // Output results
    console.log();
    if (failed.length === 0) {
        console.log(common.Color.green(` Ran ${numOk} test${numOk === 1 ? '' : 's'} successfully!`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
    } else {
        failed.forEach(f => {
            if (f.fatal) {
                console.log(common.Color.red("Fatal error:"), f.result.stderr)
            } else {
                //console.log('  ', common.Color.gray(path.relative(cwd, f.name) + ':'));
                console.log(withoutLastLine(f.result.stderr));
            }
            console.log(' ');
        });

        console.log(common.Color.red(` ${numFailed} test${numFailed === 1 ? '' : 's'} failed.`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
    }

    return { failed };
}

function filterTestFiles(files) {
    return common.filterFiles(files, common.REGEXP_TEST_FILES, common.REGEXP_IGNORE_FILES);
}

function getLastLine(str) {
    str = str.trimEnd();
    str = str.substr(Math.max(0, str.lastIndexOf('\n')));
    return str;
}

function withoutLastLine(str) {
    str = str.trimEnd();
    let lastNl = str.lastIndexOf('\n');
    if (lastNl === -1) return '';
    return str.substr(0, lastNl);
}

function extractNumTests(str) {
    let matches = str.match(reNumTestExtract);
    if (matches && matches.length > 0) {
        return Number(matches[1]);
    }
    return -1;
}

main();
