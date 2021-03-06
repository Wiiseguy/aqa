function makeRed(s) {
	return `\x1b[31m${s}\x1b[0m`;
}

function makeGreen(s) {
	return `\x1b[32m${s}\x1b[0m`;
}

function makeGray(s) {
    return `\x1b[90m${s}\x1b[0m`;
}

function escapeRegExp(s) {
    return s.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

function microMatch(s) {
    if(!s) return null;
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

    if(s === org) {
        return org;
    }

    // Non-special replaces
    s = s.replace(/\./g, "__GLOB_DOT__");
    s = s.replace(/-/g, "__GLOB_DASH__"); // dashes outside ranges

    s = s.replace(/\//g, "\\"); // Forward slashes / to backslashes \
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

function filterFiles(files, matches = [], ignores = []) {
    return files
        .filter(f => 
            matches.some(rg => f.match(rg))
            &&
            (
                ignores.length === 0
                ||
                ignores.every(rg => !f.match(rg))
            )
        );
}

function humanTime(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms + 'ms';
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
    microMatch("*/_([^_])*/*"),
];

module.exports = {
    makeRed,
    makeGreen,
    makeGray,
    escapeRegExp,
    microMatch,
    filterFiles,
    humanTime,

    REGEXP_TEST_FILES,
    REGEXP_IGNORE_FILES
}