const test = require('../aqa');
const common = require("../common");

test('makeRed', async t => {
    t.is(common.makeRed('abc'), "\x1b[31mabc\x1b[0m");
})

test('makeGreen', async t => {
    t.is(common.makeGreen('abc'), "\x1b[32mabc\x1b[0m");
})

test('makeGreen', async t => {
    t.is(common.makeGray('abc'), "\x1b[90mabc\x1b[0m");
})

test('escapeRegExp', async t => {
    let sut = common.escapeRegExp;
    t.is(sut('abc'), "abc");
    t.is(sut('(abc)'), "\\(abc\\)");
    t.is(sut('[abc]'), "\\[abc\\]");
    t.is(sut('a*'), "a\\*");
    t.is(sut('\\'), "\\\\");
    t.is(sut('-[\]{}()*+!<=:?.\/\\^$|#\s,'), "\\-\\[\\]\\{\\}\\(\\)\\*\\+\\!\\<\\=\\:\\?\\.\\/\\\\\\^\\$\\|\\#s\\,");
})

test('glob', async t => {
    let sut = common.glob;
    t.deepEqual(sut('abc'), "abc");
    t.deepEqual(sut('abc*'), /^abc\S+$/);
    t.deepEqual(sut('*tests\\file.js'), /^\S+tests\\file\.js$/);
    t.deepEqual(sut('*tests\\*.tests.js'), /^\S+tests\\\S+\.tests\.js$/);
})

test('humanTime', async t => {
    let sut = common.humanTime;
    t.is(sut(0), "0ms");
    t.is(sut(1), "1ms");
    t.is(sut(100), "100ms");
    t.is(sut(999), "999ms");
    t.is(sut(1000), "1.0s");
    t.is(sut(1040), "1.0s");
    t.is(sut(1050), "1.1s");
    t.is(sut(1100), "1.1s");
    t.is(sut(9999), "10.0s");
})

