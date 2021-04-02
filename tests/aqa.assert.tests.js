const test = require('../aqa')


test('Assert fail messages', async t => {
    // true
    try {
        t.true(false);
    } catch (e) {
        t.is(e.message, "Expected true, got false")
    }

    // false
    try {
        t.false(true);
    } catch (e) {
        t.is(e.message, "Expected false, got true")
    }

    // is
    try {
        t.is(1, 2);
    } catch (e) {
        t.is(e.message, "Expected 2, got 1")
    }

    try {
        t.is("1", 1);
    } catch (e) {
        t.is(e.message, "Expected 1, got \"1\"")
    }

    try {
        t.is("1", "2");
    } catch (e) {
        t.is(e.message, "Expected \"2\", got \"1\"")
    }


    // not
    try {
        t.not(1, 1);
    } catch (e) {
        t.is(e.message, "Expected something other than 1, but got 1")
    }

    try {
        t.not("1", "1");
    } catch (e) {
        t.is(e.message, "Expected something other than \"1\", but got \"1\"")
    }

    // deepEqual
    try {
        t.deepEqual({ a: 1 }, { a: 2 });
    } catch (e) {
        t.is(e.message, "Difference found at:\nPath: a\n- 1\n+ 2")
    }

    try {
        t.deepEqual({ a: 1 }, { a: 1, b: 2 });
    } catch (e) {
        t.is(e.message, "Difference found at:\nPath: b\n+ 2")
    }

    try {
        t.deepEqual({ a: [1, 2, 3] }, { a: [1, 2, 4] });
    } catch (e) {
        t.is(e.message, "Difference found at:\nPath: a[2]\n- 3\n+ 4")
    }

    // notDeepEqual
    try {
        t.notDeepEqual({ a: 1 }, { a: 1 });
    } catch (e) {
        t.is(e.message, "No difference between actual and expected.")
    }

    // throws
    try {
        t.throws(_ => {
            // Does not throw
        })
    } catch (e) {
        t.is(e.message, "Expected an exception");
    }

    try {
        t.throws(_ => {
            throw new Error();
        }, { instanceOf: TypeError })
    } catch (e) {
        t.is(e.message, "Expected error to be an instance of 'TypeError', got 'Error'");
    }

    // notThrows
    try {
        t.notThrows(_ => {
            throw new Error("Test");
        })
    } catch (e) {
        t.is(e.message, "Expected no exception, got exception of type 'Error': Test");
    }

    // throwsAsync
    try {
        await t.throwsAsync(async _ => {
            // Does not throw
        })
    } catch (e) {
        t.is(e.message, "Expected an exception");
    }

    try {
        await t.throwsAsync(async _ => {
            throw new Error()
        }, { instanceOf: TypeError })
    } catch (e) {
        t.is(e.message, "Expected error to be an instance of 'TypeError', got 'Error'");
    }

    // notThrowsAsync
    try {
        await t.notThrowsAsync(async _ => {
            throw new Error("TestAsync");
        })
    } catch (e) {
        t.is(e.message, "Expected no exception, got exception of type 'Error': TestAsync");
    }

})