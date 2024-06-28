const fs = require('fs');
const path = require('path');
const readdir = fs.promises.readdir;

const packagePath = './package.json';

const reSkip = /\\\.|\\node_modules/;
const reEscape = /[-[\]{}()*+!<=:?./\\^$|#\s,]/g;
const reColorStrip = /\x1b\[\d+m/g;

const STRING_DIFF_MAX_LINES = 3;

const Color = {
    red: s => `\x1b[31m${s}\x1b[0m`,
    yellow: s => `\x1b[33m${s}\x1b[0m`,
    green: s => `\x1b[32m${s}\x1b[0m`,
    gray: s => `\x1b[90m${s}\x1b[0m`,
    strip: s => {
        return s.replace(reColorStrip, '');
    }
};

/**
 *
 * @returns {AqaPackageSection}
 */
function getPackageConfig() {
    /** @type {AqaPackageSection} */
    let config = {
        verbose: false,
        concurrency: true,
        reporter: '',
        reporterOptions: {
            outputDir: './.aqa-output/reports'
        }
    };

    if (fs.existsSync(packagePath)) {
        let parsedPackage = JSON.parse(fs.readFileSync(packagePath).toString());
        if (parsedPackage?.aqa) {
            /** @type {AqaPackageSection} */
            let packageAqa = parsedPackage.aqa;

            Object.assign(config, packageAqa);
        }
    }

    // Override with environment variables
    if (process.env.AQA_VERBOSE) {
        config.verbose = process.env.AQA_VERBOSE === 'true';
    }
    if (process.env.AQA_REPORTER) {
        config.reporter = process.env.AQA_REPORTER;
    }
    if (process.env.AQA_REPORTER_OUTPUT_DIR) {
        config.reporterOptions.outputDir = process.env.AQA_REPORTER_OUTPUT_DIR;
    }
    if (process.env.AQA_CONCURRENCY) {
        config.concurrency = process.env.AQA_CONCURRENCY === 'true';
    }

    // Override with command line flags
    if (process.argv.includes('--verbose')) {
        config.verbose = true;
    }
    if (process.argv.includes('--no-concurrency')) {
        config.concurrency = false;
    }

    return config;
}

function escapeRegExp(s) {
    return s.replace(reEscape, '\\$&');
}

function microMatch(s) {
    if (!s) return null;
    let org = s;

    // Special replaces
    s = s.replace(/\)\*/g, ')__GLOB_PATTERN_STAR__'); // matches (...)*
    s = s.replace(/\*/g, '__GLOB_STAR__');
    s = s.replace(/\?/g, '__GLOB_QM__');
    s = s.replace(/\+/g, '__GLOB_PLUS__');
    s = s.replace(/\[!/g, '[^');
    s = s.replace(/\[.*-.*\]/g, m => m.replace(/-/g, '__GLOB_RANGE_DASH__')); // replace dashes within [...] ranges
    s = s.replace(/\[/g, '__GLOB_RANGE_START__');
    s = s.replace(/\]/g, '__GLOB_RANGE_END__');
    s = s.replace(/\(/g, '__GLOB_PATTERN_START__');
    s = s.replace(/\)/g, '__GLOB_PATTERN_END__');
    s = s.replace(/\^/g, '__GLOB_CARET__');

    if (s === org) {
        return org;
    }

    // Non-special replaces
    s = s.replace(/\./g, '__GLOB_DOT__');
    s = s.replace(/-/g, '__GLOB_DASH__'); // dashes outside ranges

    s = normalizeSlashes(s); // Forward slashes / to backslashes \
    s = escapeRegExp(s);

    // Restore
    s = s.replace(/__GLOB_PATTERN_STAR__/g, '*');
    s = s.replace(/__GLOB_STAR__/g, '\\S+');
    s = s.replace(/__GLOB_QM__/g, '?');
    s = s.replace(/__GLOB_PLUS__/g, '+');
    s = s.replace(/__GLOB_RANGE_DASH__/g, '-');
    s = s.replace(/__GLOB_RANGE_START__/g, '[');
    s = s.replace(/__GLOB_RANGE_END__/g, ']');
    s = s.replace(/__GLOB_PATTERN_START__/g, '(');
    s = s.replace(/__GLOB_PATTERN_END__/g, ')');
    s = s.replace(/__GLOB_CARET__/g, '^');

    s = s.replace(/__GLOB_DOT__/g, '\\.');
    s = s.replace(/__GLOB_DASH__/g, '-');
    s = '^' + s + '$';
    let r = new RegExp(s);
    return r;
}

function normalizeSlashes(str) {
    return str.replace(/\//g, '\\');
}

function getStringDiff(a, b) {
    let linesA = a.split('\n');
    let linesB = b.split('\n');
    let maxLen = Math.max(linesA.length, linesB.length);

    for (let i = 0; i < maxLen; i++) {
        let la = linesA[i];
        let lb = linesB[i];
        if (la !== lb) {
            let lai = i + 1 >= linesB.length ? undefined : i + STRING_DIFF_MAX_LINES;
            let lbi = i + 1 >= linesA.length ? undefined : i + STRING_DIFF_MAX_LINES;
            return [linesA.slice(i, lai).join('\n'), linesB.slice(i, lbi).join('\n')];
        }
    }
    return [];
}

// Taken and modified from https://stackoverflow.com/a/45130990/1423052
async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents.map(dirent => {
            const res = path.resolve(dir, dirent.name);
            let normalized = normalizeSlashes(res);
            if (normalized.match(reSkip)) return;
            return dirent.isDirectory() ? getFiles(res) : res;
        })
    );
    return Array.prototype.concat(...files).filter(n => n);
}

function filterFiles(files, matches = [], ignores = []) {
    return files.filter(f => {
        f = normalizeSlashes(f);
        return matches.some(rg => f.match(rg)) && (ignores.length === 0 || ignores.every(rg => !f.match(rg)));
    });
}

function humanTime(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms + 'ms';
}

function debounce(func, wait) {
    let timeout;
    return function () {
        let context = this,
            args = arguments;
        let later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modified from https://advancedweb.hu/how-to-add-timeout-to-a-promise-in-javascript/ (Tamás Sallai)
function timeout(prom, time, reason) {
    let timer;
    return Promise.race([prom, new Promise((_r, rej) => (timer = setTimeout(() => rej(reason), time)))]).finally(() =>
        clearTimeout(timer)
    );
}

function poll(fn, timeout, tries = 2) {
    let n = 0;
    return new Promise((resolve, _reject) => {
        let interval = setInterval(_ => {
            let fnResult = fn();
            n++;
            if (fnResult || n > tries) {
                clearInterval(interval);
                resolve();
            }
        }, timeout);
    });
}

const REGEXP_TEST_FILES = [
    'tests?.js',
    microMatch('*tests?.js'),
    microMatch('*/test-*.js'),
    microMatch('*.spec.js'),
    microMatch('*/tests?/*.js'),
    microMatch('*/__tests__/*.js')
];

const REGEXP_IGNORE_FILES = [
    microMatch('node_modules'),
    microMatch('coverage'),
    microMatch('*/.([^.])*/*'), // directories that start with a single period .
    microMatch('*/_([^_])*/*') // directories that start with a single underscore _
];

function clearLine() {
    if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
}

module.exports = {
    Color,

    getPackageConfig,

    escapeRegExp,
    microMatch,

    getStringDiff,

    getFiles,
    filterFiles,
    humanTime,
    debounce,
    timeout,
    poll,

    clearLine,

    REGEXP_TEST_FILES,
    REGEXP_IGNORE_FILES
};
