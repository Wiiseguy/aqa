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
const cwds = path.join(cwd, '/');

// RegExps
const reSkip = /\\\.|\\node_modules/;
const reJsFile = /.js$/;
const reNumTestExtract = /(\d+) test/;

let isVerbose = false;
let isTap = false;

async function main() {
    //console.log(`Args: ${args}`)
    //console.log(`Called from: ${cwd}`)
    //console.log(`Script located at: ${__dirname}`);

    let arg0 = args.filter(a => !a.startsWith('-'))[0]; // First non-flag argument

    isVerbose = args.includes('--verbose');
    isTap = args.includes('--tap');
    let isWatch = args.includes('--watch');    

    if (isWatch) {
        // Watch files and run tests when changed
        watchFiles();
    } else {
        let testsFiles = [];
        let allFiles = await getFiles(cwd);

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

        if(isVerbose) {
            console.log("Running tests for:", testsFiles.join(', '));
        }

        let result = await runTests(testsFiles);
        if (result.failed.length > 0) {
            process.exit(1);
        }

    }
}

async function watchFiles() {
    let allFiles = await getFiles(cwd);
    let testsFiles = filterTestFiles(allFiles);
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
            console.log(' ');
            console.log("[watch] Running tests for:", requested.map(r => path.basename(r)).join(', '));
            runTests(requested);
            requested.length = 0;
        }, 250);
    };

    const requestRuns = files => files.forEach(requestRun);

    // Watch test files
    testsFiles.forEach(tf => {
        fs.watch(tf, (type, fileName) => {
            if (isVerbose) {
                console.log('Watch triggered for test file:', type, fileName);
            }
            requestRun(tf);
        })
    });

    // Watch non-test files and simply run all tests when these change
    nonTestFiles.forEach(ntf => {
        fs.watch(ntf, (type, fileName) => {
            let ext = path.extname(fileName);
            let base = path.basename(fileName, ext);
            if (isVerbose) {
                console.log('Watch triggered for non-test file:', type, fileName);
            }

            let relevantTestFiles = testsFiles.filter(tf => path.basename(tf).startsWith(base));
            if(relevantTestFiles.length > 0) {
                requestRuns(relevantTestFiles);
            } else {
                // Test all files
                requestRuns(testsFiles);
            }
        })
    })

    console.log("[watch] aqa - watcher active, waiting for file changes...");

    // Initial run
    //testsFiles.forEach(tf => requestRun(tf));
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

        let relevantOutput = result.stdout;

        if (result.code === 1) {
            if(isTap) {
                failed.push({ name: m.name, result })
            } else {
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
        }
        else if (result.stdout && !isTap) {
            let lastLine = getLastLine(result.stdout);
            numOk += extractNumTests(lastLine);			
            relevantOutput = withoutLastLine(result.stdout) + '\n' + result.stderr;
        }
		
		relevantOutput = relevantOutput.trim();

        if (relevantOutput) {
            if(!isTap) console.log(`[${m.name}]`);
            console.log(relevantOutput);
        }
    });


    let elapsedMs = +new Date - startMs;

    // Output results
    if(!isTap) {
        console.log();
        if (failed.length === 0) {
            console.log(common.Color.green(` Ran ${numOk} test${numOk === 1 ? '' : 's'} succesfully!`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
        } else {
            failed.forEach(f => {            
                if (f.fatal) {
                    console.log(common.Color.red("Fatal error:"), f.result.stderr)
                } else {
                    console.log('  ', common.Color.gray(path.relative(cwd, f.name) + ':'));
                    console.log(withoutLastLine(f.result.stderr));
                }
                console.log(' ');
            });

            console.log(common.Color.red(` ${numFailed} test${numFailed === 1 ? '' : 's'} failed.`), common.Color.gray(`(${common.humanTime(elapsedMs)})`))
        }
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
