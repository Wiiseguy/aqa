const test = require('../aqa');


test('All', t => {
    t.is(1 + 1, 2);
    t.not(1 + 1, 3);
    t.true(1 === 1);
    t.false(1 === 2);

    t.deepEqual(
        {
            a: {
                aa: 1,
                ab: 2,
                ac: [1, 2],
                ad: [{
                    aaa: 1
                }],
                ae: NaN,
                af: undefined,
                ag: { ok: true }
            },
            b: [1, 2, 3]
        },
        {
            a: {
                aa: 1,
                ab: 2,
                ac: [1, 2],
                ad: [{
                    aaa: 1
                }],
                ae: NaN,
                ag: test.ignore
            },
            b: [1, 2, 3]
        }
    );

    t.deepEqual(new Date(2000, 1, 1), new Date(2000, 1, 1));
    t.deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))

    t.notDeepEqual([1,2,3], [1,2,4]);
    t.notDeepEqual([1,2,3], [1,2,3,4]);
    t.notDeepEqual({atest:1}, {atest:2});

    t.notDeepEqual({
        a: {
            aa: 1,
            ab: 2,
            ac: [1, 2],
            ad: [{
                aaa: 1
            }]
        },
        b: [1, 2, 3]
    },
    {
        a: {
            aa: 1,
            ab: 2,
            ac: [1, 2],
            ad: [{
                aaa: 100000000
            }]
        },
        b: [1, 2, 3]
    });

    t.notDeepEqual(new Date(2021, 1, 1), new Date(2000, 1, 1));
    t.notDeepEqual(new Set([1, 2, 3]), new Set([1, 2, 4]))

    t.throws(_ => { throw new TypeError() });
    t.notThrows(_ => { /* nothing */ });
    const error = t.throws(() => { throw new TypeError() }, { instanceOf: TypeError });
    t.true(error instanceof TypeError);
})

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
        t.is(e.message, "Difference found at path: a\n- 1\n+ 2")
    }

    try {
        t.deepEqual({ a: 1 }, { a: 1, b: 2 });
    } catch (e) {
        t.is(e.message, "Difference found at path: b\n- undefined\n+ 2")
    }

    try {
        t.deepEqual({ a: [1, 2, 3] }, { a: [1, 2, 4] });
    } catch (e) {
        t.is(e.message, "Difference found at path: a[2]\n- 3\n+ 4")
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

test('Getters & deepEqual', t => {
    let o = {};

    Object.defineProperty(o, 'got', { get() { return 9000; }});

    t.is(o.got, 9000);
    t.notDeepEqual(o, {
        got: 1
    })
});


test('Non-enumerable properties & deepEqual', t => {
    let o = {};

    Object.defineProperty(o, 'got', { value: 9000, enumerable: false });

    t.is(o.got, 9000);
    t.notDeepEqual(o, {
        got: 1
    })
});