const fs = require("fs");
const path = require("path");
const readdir = fs.promises.readdir;

const reSkip = /\\\.|\\node_modules/;
const reEscape = /[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g;
const reColorStrip = /\x1b\[\d+m/g;

const Color = {
    red: s => `\x1b[31m${s}\x1b[0m`,
    yellow: s => `\x1b[33m${s}\x1b[0m`,
    green: s => `\x1b[32m${s}\x1b[0m`,
    gray: s => `\x1b[90m${s}\x1b[0m`,
    strip: s => {
        return s.replace(reColorStrip, '');
    }
};

function escapeRegExp(s) {
    return s.replace(reEscape, '\\$&');
}

function microMatch(s) {
    if (!s) return null;
    let org = s;

    // Special replaces
    s = s.replace(/\)\*/g, ")__GLOB_PATTERN_STAR__"); // matches (...)* 
    s = s.replace(/\*/g, "__GLOB_STAR__");
    s = s.replace(/\?/g, "__GLOB_QM__");
    s = s.replace(/\+/g, "__GLOB_PLUS__");
    s = s.replace(/\[!/g, "[^");
    s = s.replace(/\[.*-.*\]/g, m => m.replace(/-/g, "__GLOB_RANGE_DASH__")); // replace dashes within [...] ranges   
    s = s.replace(/\[/g, "__GLOB_RANGE_START__");
    s = s.replace(/\]/g, "__GLOB_RANGE_END__");
    s = s.replace(/\(/g, "__GLOB_PATTERN_START__");
    s = s.replace(/\)/g, "__GLOB_PATTERN_END__");
    s = s.replace(/\^/g, "__GLOB_CARET__");

    if (s === org) {
        return org;
    }

    // Non-special replaces
    s = s.replace(/\./g, "__GLOB_DOT__");
    s = s.replace(/-/g, "__GLOB_DASH__"); // dashes outside ranges

    s = normalizeSlashes(s); // Forward slashes / to backslashes \
    s = escapeRegExp(s);

    // Restore
    s = s.replace(/__GLOB_PATTERN_STAR__/g, "*");
    s = s.replace(/__GLOB_STAR__/g, "\\S+");
    s = s.replace(/__GLOB_QM__/g, "?");
    s = s.replace(/__GLOB_PLUS__/g, "+");
    s = s.replace(/__GLOB_RANGE_DASH__/g, "-");
    s = s.replace(/__GLOB_RANGE_START__/g, "[");
    s = s.replace(/__GLOB_RANGE_END__/g, "]");
    s = s.replace(/__GLOB_PATTERN_START__/g, "(");
    s = s.replace(/__GLOB_PATTERN_END__/g, ")");
    s = s.replace(/__GLOB_CARET__/g, "^");

    s = s.replace(/__GLOB_DOT__/g, "\\.");
    s = s.replace(/__GLOB_DASH__/g, "-");
    s = "^" + s + "$";
    let r = new RegExp(s);
    return r;
}

function normalizeSlashes(str) {
    return str.replace(/\//g, '\\');
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

function filterFiles(files, matches = [], ignores = []) {
    return files
        .filter(f => {
            f = normalizeSlashes(f);
            return matches.some(rg => f.match(rg))
                &&
                (
                    ignores.length === 0
                    ||
                    ignores.every(rg => !f.match(rg))
                )
        });
}

function humanTime(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms + 'ms';
}

function debounce(func, wait) {
    let timeout;
    return function () {
        let context = this, args = arguments;
        let later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    }
}

// Modified from https://advancedweb.hu/how-to-add-timeout-to-a-promise-in-javascript/ (Tamás Sallai)
function timeout(prom, time, reason) {
    let timer;
    return Promise.race([
        prom,
        new Promise((_r, rej) => timer = setTimeout(() => rej(reason), time))
    ]).finally(() => clearTimeout(timer));
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
    microMatch("*tests?.js"),
    microMatch("*/test-*.js"),
    microMatch("*.spec.js"),
    microMatch("*/tests?/*.js"),
    microMatch("*/__tests__/*.js")
];

const REGEXP_IGNORE_FILES = [
    microMatch("node_modules"),
    microMatch("coverage"),
    microMatch("*/.([^.])*/*"), // directories that start with a single period .
    microMatch("*/_([^_])*/*"), // directories that start with a single underscore _
];


// Source map helpers

// Modified from https://github.com/Rich-Harris/vlq
const b64Map = {A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25,a:26,b:27,c:28,d:29,e:30,f:31,g:32,h:33,i:34,j:35,k:36,l:37,m:38,n:39,o:40,p:41,q:42,r:43,s:44,t:45,u:46,v:47,w:48,x:49,y:50,z:51,'0':52,'1':53,'2':54,'3':55,'4':56,'5':57,'6':58,'7':59,'8':60,'9':61,'+':62,'/':63,'=':64};
function decodeVLQ(string) {
	const result = [];
	let shift = 0;
	let value = 0;

	for (let i = 0; i < string.length; i += 1) {
		let intValue = b64Map[string[i]];
		const shouldContinue = intValue & 0x20;

		intValue &= 0x1f;
		value += intValue << shift;

		if (shouldContinue) {
            shift += 5;
            continue;
        }
        
        const shouldNegate = value & 1;
        value >>>= 1;

        if (shouldNegate) {
            result.push(value === 0 ? -0x80000000 : -value);
        } else {
            result.push(value);
        }

        value = shift = 0;		
	}

	return result;
}


// Based on https://gist.github.com/bengourley/c3c62e41c9b579ecc1d51e9d9eb8b9d2
function mapSourceLocation(actualLine, actualColumn, mappings, sources, names) {
    const vlqState = [0, 0, 0, 0, 0];
    const lines = mappings.split(';');
    let result = null;

    const getCol = (line, col, state, sources, names) => {
        const segs = line.split(',')
        let result = null;
        for (let seg of segs) {
            if (!seg) continue;
            const decoded = decodeVLQ(seg)
            for (let i = 0; i < state.length; i++) {
                state[i] = decoded[i] !== undefined ? state[i] + decoded[i] : state[i]
            }
            if (state[0] >= col - 1 && result == null) result = createResult(...state, sources, names)
        }
        return result;
    }

    const createResult = (_col, source, sourceLine, sourceCol, name, sources, names) => ({
        source: sources[source],
        line: sourceLine + 1,
        column: sourceCol,
        name: names[name]
    });

    
    for (let i = 0; i < actualLine; i++) {
        let l = lines[i];
        result = getCol(l, actualColumn, vlqState, sources, names)
        vlqState[0] = 0
    }
    return result;
}

function clearLine() {
    if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
}

module.exports = {
    Color,

    escapeRegExp,
    microMatch,
    getFiles,
    filterFiles,
    humanTime,
    debounce,
    timeout,
    poll,

    mapSourceLocation,

    clearLine,

    REGEXP_TEST_FILES,
    REGEXP_IGNORE_FILES
}