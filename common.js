function makeRed(s) {
	return `\x1b[31m${s}\x1b[0m`;
}

function makeGreen(s) {
	return `\x1b[32m${s}\x1b[0m`;
}

module.exports = {
    makeRed,
    makeGreen
}