function makeRed(s) {
	return `\x1b[31m${s}\x1b[0m`;
}

function makeGreen(s) {
	return `\x1b[32m${s}\x1b[0m`;
}

function escapeRegExp(s) {
    return s.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

function glob(s) {
    if(!s) return null;
    let org = s;
    s = s.replace(/\*/g, "__GLOB_STAR__")
    if(s === org) {
        return org;
    }
    s = s.replace(/\//g, "\\")
    s = escapeRegExp(s);
    s = s.replace(/__GLOB_STAR__/g, "\\S+")
    s = "^" + s + "$";
    let r = new RegExp(s);
    return r;
}

module.exports = {
    makeRed,
    makeGreen,
    glob
}