const test = require('../aqa');
const common = require('../common');

function delayPromise(ms, resolveValue) {
    return new Promise(resolve => {
        setTimeout(_ => resolve(resolveValue), ms);
    });
}

test('Color.red', async t => {
    t.is(common.Color.red('abc'), '\x1b[31mabc\x1b[0m');
});

test('Color.green', async t => {
    t.is(common.Color.green('abc'), '\x1b[32mabc\x1b[0m');
});

test('Color.gray', async t => {
    t.is(common.Color.gray('abc'), '\x1b[90mabc\x1b[0m');
});

test('Color.strip', async t => {
    let str = '' + common.Color.red('red') + '\r\n' + common.Color.green('green') + ' - \n' + common.Color.gray('gray');

    t.is(common.Color.strip(str), 'red\r\ngreen - \ngray');
});

test('escapeRegExp', async t => {
    let sut = common.escapeRegExp;
    t.is(sut('abc'), 'abc');
    t.is(sut('(abc)'), '\\(abc\\)');
    t.is(sut('[abc]'), '\\[abc\\]');
    t.is(sut('a*'), 'a\\*');
    t.is(sut('\\'), '\\\\');
    t.is(sut('-[]{}()*+!<=:?./\\^$|#s,'), '\\-\\[\\]\\{\\}\\(\\)\\*\\+\\!\\<\\=\\:\\?\\.\\/\\\\\\^\\$\\|\\#s\\,');
});

test('microMatch', async t => {
    let sut = common.microMatch;
    t.deepEqual(sut(''), null);
    t.deepEqual(sut('abc'), 'abc');
    t.deepEqual(sut('abc.xyz'), 'abc.xyz');
    t.deepEqual(sut('abc?'), /^abc?$/);
    t.deepEqual(sut('abc+'), /^abc+$/);
    t.deepEqual(sut('abc(xyz)+'), /^abc(xyz)+$/);
    t.deepEqual(sut('abc(xyz)*'), /^abc(xyz)*$/);
    t.deepEqual(sut('a-z'), 'a-z');
    t.deepEqual(sut('[a-z]'), /^[a-z]$/);
    t.deepEqual(sut('[^a-z]'), /^[^a-z]$/);
    t.deepEqual(sut('[!a-z]'), /^[^a-z]$/);
    t.deepEqual(sut('abc*'), /^abc\S+$/);
    t.deepEqual(sut('*tests\\file.js'), /^\S+tests\\file\.js$/);
    t.deepEqual(sut('*tests\\*.tests.js'), /^\S+tests\\\S+\.tests\.js$/);
    t.deepEqual(sut('tests/*/should-succeed.js'), /^tests\\\S+\\should-succeed\.js$/);
    t.deepEqual(sut('tests?.js'), /^tests?\.js$/);
    t.deepEqual(sut('tests.js'), 'tests.js');
    t.deepEqual(sut('*/_([^_])*/*'), /^\S+\\_([^_])*\\\S+$/);
});

test('filterFiles - custom', async t => {
    let sut = common.filterFiles;
    let files = ['C:\\DEV\\something-else.js', 'C:\\DEV\\test.js', 'C:\\DEV\\tests.js', 'C:\\DEV\\a.tests.js'];
    let testFiles = files.slice(1);
    t.deepEqual(sut(files, [common.microMatch('tests?.js')]), []);
    t.deepEqual(sut(files, [common.microMatch('*tests?.js')]), testFiles);
    t.deepEqual(sut(files, [common.microMatch('**tests?.js')]), testFiles);
    t.deepEqual(sut(files, [common.microMatch('**/*tests?.js')]), testFiles);
});

test('filterFiles - custom - multi', async t => {
    let sut = common.filterFiles;
    let files = ['C:\\DEV\\something-else.js', 'C:\\DEV\\test.js', 'C:\\DEV\\tests.js', 'C:\\DEV\\a.spec.js'];
    let testFiles = files.slice(1);
    t.deepEqual(sut(files, [common.microMatch('*tests?.js'), common.microMatch('*spec.js')]), testFiles);
});

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
        'C:\\DEV\\__tests__\\c.js'
    ];
    let testFiles = files.slice(1);

    t.deepEqual(sut(files, common.REGEXP_TEST_FILES), testFiles);
});

test('filterFiles - REGEXP_TEST_FILES + REGEXP_IGNORE_FILES', async t => {
    let sut = common.filterFiles;
    let files = [
        'C:\\DEV\\something.js', 
        'C:\\DEV\\something.js.map',
        'C:\\DEV\\_ignore\\test.js',
        'C:\\DEV\\node_modules\\test.js',

        'C:\\DEV\\test.js',
        'C:\\DEV\\tests.js',
        'C:\\DEV\\test-something.js',
        'C:/DEV/test-something.js',
        'tests/test-something.js',
        'C:\\DEV\\a.test.js',
        'C:\\DEV\\a.tests.js',
        'C:\\DEV\\a.spec.js',
        'C:\\DEV\\test\\a.js',
        'C:\\DEV\\tests\\b.js',
        'C:\\DEV\\__tests__\\c.js'
    ];
    let testFiles = files.slice(4); // Everything except the first 4

    let filtered = sut(files, common.REGEXP_TEST_FILES, common.REGEXP_IGNORE_FILES)
    t.deepEqual(filtered, testFiles);
});

test('humanTime', async t => {
    let sut = common.humanTime;
    t.is(sut(0), '0ms');
    t.is(sut(1), '1ms');
    t.is(sut(100), '100ms');
    t.is(sut(999), '999ms');
    t.is(sut(1000), '1.0s');
    t.is(sut(1040), '1.0s');
    t.is(sut(1050), '1.1s');
    t.is(sut(1100), '1.1s');
    t.is(sut(1900), '1.9s');
    t.is(sut(9999), '10.0s');
});

test('debounce', async t => {
    const sut = common.debounce;

    let callCount = 0;
    let func = _ => callCount++;
    let debouncedFunc = sut(func, 1);

    t.is(callCount, 0);
    func();
    t.is(callCount, 1);

    debouncedFunc();
    t.is(callCount, 1);

    await delayPromise(10);

    t.is(callCount, 2);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();
    t.is(callCount, 2);

    await delayPromise(10);

    t.is(callCount, 3);
});

test('getStringDiff', t => {
    const sut = common.getStringDiff;
    t.deepEqual(sut('', ''), []);
    t.deepEqual(sut('a', 'b'), ['a', 'b']);
    t.deepEqual(sut('a\nb\nc', 'a\nb\nd'), ['c', 'd']);
    t.deepEqual(sut('a\nb', 'a\nb\nc'), ['', 'c']);
    t.deepEqual(sut('a\nb\nc', 'a\nb'), ['c', '']);
});
