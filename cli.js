#!/usr/bin/env node
const util = require("util");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const common = require("./common");

const exec = util.promisify(child_process.exec);
const readdir = fs.promises.readdir;

const [, , ...args] = process.argv
const cwd = process.cwd();

// RegExps
const reSkip = /\\\.|\\node_modules/;
const reJsFile = /.js$/;
const reTestFile = /tests?.js$/;
const reNumTestExtract = /(\d+) test/;

let isVerbose = false;

async function main() {
    //console.log(`Args: ${args}`)
    //console.log(`Called from: ${cwd}`)
    //console.log(`Script located at: ${__dirname}`);

    let arg0 = args.filter(a => !a.startsWith('-'))[0]; // Any non-flag argument

    isVerbose = args.includes('--verbose');
    let isWatch = args.includes('--watch');


    if (isWatch) {
        // Watch files and run tests when changed
        watchFiles();
    } else {
        if (arg0) {
            // Param is file/glob
            let allFiles = await getFiles(cwd);
            let reGlob = common.glob(arg0);
            let testFiles = [];
            if (typeof reGlob === 'string') { // Not a regexp, just try to testrun the file
                testFiles.push(arg0);
            } else {
                testFiles = allFiles.filter(f => f.match(reGlob));
                //console.log(arg0, reGlob.source, testFiles);
            }

            let result = await runTests(testFiles, false);
            if (result.failed.length > 0) {
                process.exit(1);
            }

        } else {
            // Test all files
            let allFiles = await getFiles(cwd);
            let result = await runTests(allFiles);
            if (result.failed.length > 0) {
                process.exit(1);
            }
        }

    }
}

async function watchFiles() {
    let allFiles = await getFiles(cwd);
    let testsFiles = allFiles.filter(f => f.match(reTestFile));
    let nonTestFiles = allFiles.filter(f => f.match(reJsFile) && !testsFiles.includes(f));

    // Collect & debounce
    let requestTimeout;
    let requested = [];
    const requestRun = f => {
        if (!requested.includes(f)) {
            requested.push(f);
        }
        clearTimeout(requestTimeout);
        requestTimeout = setTimeout(_ => {
            console.log('');
            console.log('');
            console.log("[watch] Running tests for:", requested.map(r => path.basename(r)).join(', '));
            runTests(requested);
            requested.length = 0;
        }, 250);
    };

    // Watch test files
    testsFiles.forEach(tf => {
        fs.watch(tf, (...args) => {
            if (isVerbose) {
                console.log('Watch triggered for test file:', ...args);
            }
            requestRun(tf);
        })
    });

    // Watch non-test files and simply run all tests when these change
    nonTestFiles.forEach(ntf => {
        fs.watch(ntf, (...args) => {
            if (isVerbose) {
                console.log('Watch triggered for non-test file:', ...args);
            }
            testsFiles.forEach(tf => requestRun(tf));
        })
    })

    console.log("[watch] aqa - watcher active, waiting for file changes...");

    // Initial run
    testsFiles.forEach(tf => requestRun(tf));
}

async function runTests(filesToTest, autoFilter = true) {
    const startMs = +new Date;
    let testsFiles = filesToTest;
    if (autoFilter) {
        testsFiles = testsFiles.filter(f => f.match(reTestFile));
    }

    let tasks = [];
    testsFiles.forEach(tf => {
        tasks.push({
            name: tf,
            exec: _ => exec(`node ${tf} ${isVerbose ? '--verbose' : ''}`),
            result: null
        });
    });

    // Execute tests
    for (let task of tasks) {
        try {
            task.result = await task.exec();
        } catch (e) {
            task.result = e;
        }
    }

    // Check and handle results
    let numOk = 0;
    let numFailed = 0;
    let failed = [];
    tasks.forEach((m, i) => {
        let result = m.result;

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
        if (result.stdout) {
            let lastLine = getLastLine(result.stdout);
            numOk += extractNumTests(lastLine);
        }

        if (isVerbose) {
            console.log(`[${m.name}]`);
            console.log(result.stdout);
        }
    });


    let elapsedMs = +new Date - startMs;

    // Output results
    console.log();
    if (failed.length === 0) {

        console.log(common.makeGreen(` Ran ${numOk} test${numOk === 1 ? '' : 's'} succesfully!`), common.makeGray(`(${common.humanTime(elapsedMs)})`))
    } else {
        failed.forEach(f => {
            //console.log(f.result.stdout);
            if (f.fatal) {
                console.error(common.makeRed("Fatal error:"), f.result.stderr)
            } else {
                console.log('  ', common.makeGray(path.relative(cwd, f.name) + ':'));
                console.error(withoutLastLine(f.result.stderr));
            }
            console.log();
        });

        console.error(common.makeRed(` ${numFailed} test${numFailed === 1 ? '' : 's'} failed.`), common.makeGray(`(${common.humanTime(elapsedMs)})`))
    }

    return { failed };
}


function getLastLine(str) {
    str = str.trimEnd();
    str = str.substr(Math.max(0, str.lastIndexOf('\n')));
    return str;
}

function withoutLastLine(str) {
    str = str.trimEnd();
    let lastNl = str.lastIndexOf('\n');
    if (lastNl === -1) return str;
    return str.substr(0, lastNl);
}

function extractNumTests(str) {
    let matches = str.match(reNumTestExtract);
    if (matches && matches.length > 0) {
        return Number(matches[1]);
    }
    return -1;
}

// Taken and modified from https://stackoverflow.com/a/45130990/1423052
async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        if (res.match(reSkip)) return;
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files).filter(n => n);
}

main();