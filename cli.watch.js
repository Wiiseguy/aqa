/* c8 ignore start */ // Remove this line when we've found a way to cover the bits of this code that do not work across all platforms
const fs = require('fs');
const path = require('path');
const common = require('./common');

const cwd = process.cwd();
const cwds = path.join(cwd, '/');

const debounceTimeout = 500;

// RegExps
const reJsFile = /\.js$/;

async function watchFiles(arg0, runTests, isVerbose, stopSignal, onScan) {
    let testsFiles = [];
    let nonTestFiles = [];
    let fileWatchers = [];
    let allFiles = [];

    let custom = false;

    if (arg0) {
        let reGlob = common.microMatch(arg0);
        if (typeof reGlob === 'string') {
            // Not a regexp, just try to testrun the file
            testsFiles.push(arg0);
        } else {
            allFiles = await common.getFiles(cwd);
            testsFiles = allFiles.filter(f => f.replace(cwds, '').match(reGlob));
        }
        custom = true;
    }

    // Watch
    const watch = (file, callback) => {
        let watcher = fs.watch(file, callback);
        fileWatchers.push(watcher);
    };

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
            console.log(common.Color.gray('[watch] Changes detected, running tests...'));
            if (isVerbose) {
                console.log(requested.map(r => path.basename(r)).join(', '));
            }
            console.log(' ');
            runTests(requested);
            requested.length = 0;
        }, debounceTimeout);
    };
    const requestRuns = files => files.forEach(requestRun);

    // Scan and watch
    const scanAndWatch = common.debounce(async _ => {
        clearTimeout(requestTimeout);
        fileWatchers.forEach(w => w.close());
        fileWatchers.length = 0;

        if (!custom) {
            allFiles = await common.getFiles(cwd);
            testsFiles = common.filterFiles(allFiles, common.REGEXP_TEST_FILES, common.REGEXP_IGNORE_FILES);
        }
        nonTestFiles = allFiles.filter(f => !testsFiles.includes(f));
        nonTestFiles = common.filterFiles(nonTestFiles, [reJsFile], common.REGEXP_IGNORE_FILES);

        // Watch test files
        testsFiles.forEach(tf => {
            watch(tf, (type, fileName) => {
                if (isVerbose) {
                    console.log('Watch triggered for test file:', type, fileName);
                }
                requestRun(tf);
            });
        });

        // Watch non-test files and simply run all tests when these change
        nonTestFiles.forEach(ntf => {
            watch(ntf, (type, fileName) => {
                let ext = path.extname(fileName);
                let base = path.basename(fileName, ext);
                if (isVerbose) {
                    console.log('Watch triggered for non-test file:', type, fileName);
                }

                let relevantTestFiles = testsFiles.filter(tf => path.basename(tf).startsWith(base));
                if (relevantTestFiles.length > 0) {
                    requestRuns(relevantTestFiles);
                } else {
                    // Test all files
                    requestRuns(testsFiles);
                }
            });
        });

        console.log(common.Color.gray('[watch] aqa - watcher active, waiting for file changes...'));

        if (typeof onScan === 'function') {
            onScan(testsFiles, nonTestFiles);
        }
    }, debounceTimeout);

    // Watch dir
    let dirWatcher = null;
    try {
        dirWatcher = fs.watch(cwd, { recursive: true }, (type, fileName) => {
            if (fileName == null) {
                return;
            }
            let resolvedFileName = path.join(cwd, fileName);
            if (isVerbose) {
                console.log('Watch triggered for dir:', type, cwd, resolvedFileName);
            }

            let filtered = common.filterFiles([resolvedFileName], [reJsFile], common.REGEXP_IGNORE_FILES);

            if (filtered.length === 0) return;

            if (!testsFiles.includes(resolvedFileName) && !nonTestFiles.includes(resolvedFileName)) {
                clearTimeout(requestTimeout);
                requested.length = 0;
                console.log('New file detected:', resolvedFileName, '- rescanning');
                scanAndWatch();
            }
        });
    } catch (e) {
        // Recursive watch is probably not supported on this platform
        console.log(common.Color.yellow('[watch] Warning: ' + e.message));
    }

    scanAndWatch();

    // Initial run
    //testsFiles.forEach(tf => requestRun(tf));

    return new Promise(resolve => {
        if (stopSignal) {
            stopSignal.stop = function () {
                fileWatchers.forEach(w => w.close());
                if (dirWatcher) {
                    dirWatcher.close();
                }
                resolve();
            };
        }
    });
}

module.exports = {
    watchFiles
};
