const test = require('../aqa');
const common = require("../common");

test('Color.red', async t => {
    t.is(common.Color.red('abc'), "\x1b[31mabc\x1b[0m");
})

test('Color.green', async t => {
    t.is(common.Color.green('abc'), "\x1b[32mabc\x1b[0m");
})

test('Color.gray', async t => {
    t.is(common.Color.gray('abc'), "\x1b[90mabc\x1b[0m");
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

test('microMatch', async t => {
    let sut = common.microMatch;
    t.deepEqual(sut('abc'), "abc");
    t.deepEqual(sut('abc.xyz'), "abc.xyz");
    t.deepEqual(sut('abc?'), /^abc?$/);
    t.deepEqual(sut('abc+'), /^abc+$/);
    t.deepEqual(sut('abc(xyz)+'), /^abc(xyz)+$/);
    t.deepEqual(sut('abc(xyz)*'), /^abc(xyz)*$/);
    t.deepEqual(sut('a-z'), "a-z");
    t.deepEqual(sut('[a-z]'), /^[a-z]$/);
    t.deepEqual(sut('[^a-z]'), /^[^a-z]$/);
    t.deepEqual(sut('[!a-z]'), /^[^a-z]$/);
    t.deepEqual(sut('abc*'), /^abc\S+$/);
    t.deepEqual(sut('*tests\\file.js'), /^\S+tests\\file\.js$/);
    t.deepEqual(sut('*tests\\*.tests.js'), /^\S+tests\\\S+\.tests\.js$/);
    t.deepEqual(sut('tests?.js'), /^tests?\.js$/);
    t.deepEqual(sut('*/_([^_])*/*'), /^\S+\\_([^_])*\\\S+$/);
})

test('filterFiles - custom', async t => {
    let sut = common.filterFiles;
    let files = [
        'C:\\DEV\\something-else.js',
        'C:\\DEV\\test.js',
        'C:\\DEV\\tests.js',
        'C:\\DEV\\a.tests.js',
    ];
    let testFiles = files.slice(1);
    t.deepEqual(sut(files, [
        common.microMatch("tests?.js")
    ]), []);
    t.deepEqual(sut(files, [
        common.microMatch("*tests?.js")
    ]), testFiles);
    t.deepEqual(sut(files, [
        common.microMatch("**tests?.js")
    ]), testFiles);
    t.deepEqual(sut(files, [
        common.microMatch("**/*tests?.js")
    ]), testFiles);
})

test('filterFiles - custom - multi', async t => {
    let sut = common.filterFiles;
    let files = [
        'C:\\DEV\\something-else.js',
        'C:\\DEV\\test.js',
        'C:\\DEV\\tests.js',
        'C:\\DEV\\a.spec.js',
    ];
    let testFiles = files.slice(1);
    t.deepEqual(sut(files, [
        common.microMatch("*tests?.js"),
        common.microMatch("*spec.js")
    ]), testFiles);
})

test('filterFiles - REGEXP_TEST_FILES', async t => {
    let sut = common.filterFiles;
    let files = [
        'C:\\DEV\\something.js',

        'C:\\DEV\\test.js',
        'C:\\DEV\\test-something.js',
        'C:/DEV/test-something.js',
        'tests/test-something.js',
        'C:\\DEV\\a.test.js',
        'C:\\DEV\\a.tests.js',
        'C:\\DEV\\a.spec.js',
        'C:\\DEV\\test\\a.js',
        'C:\\DEV\\tests\\b.js',
        'C:\\DEV\\__tests__\\c.js',
    ];
    let testFiles = files.slice(1);

    t.deepEqual(sut(files, common.REGEXP_TEST_FILES), testFiles);
})

test('filterFiles - REGEXP_TEST_FILES + REGEXP_IGNORE_FILES', async t => {
    let sut = common.filterFiles;
    let files = [
        'C:\\DEV\\something.js',
        'C:\\DEV\\_ignore\\test.js',
        'C:\\DEV\\node_modules\\test.js',

        'C:\\DEV\\test.js',
        'C:\\DEV\\test-something.js',
        'C:/DEV/test-something.js',
        'tests/test-something.js',
        'C:\\DEV\\a.test.js',
        'C:\\DEV\\a.tests.js',
        'C:\\DEV\\a.spec.js',
        'C:\\DEV\\test\\a.js',
        'C:\\DEV\\tests\\b.js',
        'C:\\DEV\\__tests__\\c.js',
    ];
    let testFiles = files.slice(3);

    t.deepEqual(sut(files, common.REGEXP_TEST_FILES, common.REGEXP_IGNORE_FILES), testFiles);
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
    t.is(sut(1900), "1.9s");
    t.is(sut(9999), "10.0s");
})

