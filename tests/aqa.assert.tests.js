const test = require('../aqa');

test('is', t => {
    t.is(1, 1);
    t.is(1 + 1, 2);
    t.is(0, -0);
})

test('not', t => {
    t.not(1, 2);
    t.not(1 + 1, 3);
    t.not(1, -1);
})

test('true', t => {
    t.true(true);
    t.true(!false);
    t.true(1 > 0);
})

test('false', t => {
    t.false(false);
    t.false(!true);
    t.false(1 < 0);
})

test('near', t => {
    t.near(1, 1.1, 0.1)
    t.near(1, 0.9, 0.1)
    t.near(1.1, 1, 0.1)
    t.near(0.9, 1, 0.1)
})

test('notNear', t => {
    t.notNear(1, 2, 0.1)
    t.notNear(1, 0, 0.1)
    t.notNear(2, 1, 0.1)
    t.notNear(0, 1, 0.1)
})

test('deepEqual', t => {
    
    t.deepEqual(0, -0);
    t.deepEqual([0], [-0]);

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

    t.deepEqual(
        {
            a: {
                aa: 1,
                ab: 2,
                ac: [1, 2],
                ad: [{
                    aaa: 1
                }],
            },
        },
        {
            a: test.ignoreExtra({
                ab: 2
            }),
        }
    );

    t.deepEqual(new Date(2000, 1, 1), new Date(2000, 1, 1));
    t.deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))

})

test('notDeepEqual', t => {

    t.notDeepEqual([1, 2, 3], [1, 2, 4]);
    t.notDeepEqual([1, 2, 3], [1, 2, 3, 4]);
    t.notDeepEqual({ atest: 1 }, { atest: 2 });

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

})

test('throws', t => {
    t.throws(_ => { throw new TypeError() });

    const error = t.throws(() => { throw new TypeError() }, { instanceOf: TypeError });
    t.true(error instanceof TypeError);
})

test('throwsAsync', async t => {
    await t.throwsAsync(async _ => { throw new TypeError() });

    let error = await t.throwsAsync(async _ => { throw new Error('Hello1') });
    t.is(error.message, 'Hello1');

    error = await t.throwsAsync(async _ => { throw new TypeError('Hello2') }, { instanceOf: TypeError });
    t.true(error instanceof TypeError);
    t.is(error.message, 'Hello2');
})

test('notThrows', t => {
    t.notThrows(_ => { /* nothing */ });
})

test('Assert fail messages', async t => {
    let e;

    // true
    e = t.throws(_ => t.true(false));
    t.is(e.message, "Expected true, got false")

    // false
    e = t.throws(_ => t.false(true));
    t.is(e.message, "Expected false, got true")

    // is
    e = t.throws(_ => t.is(1, 2))
    t.is(e.message, "Expected 2, got 1")

    e = t.throws(_ => t.is("1", 1))
    t.is(e.message, "Expected 1, got \"1\"")

    e = t.throws(_ => t.is("1", "2"))
    t.is(e.message, "Expected \"2\", got \"1\"")

    // not
    e = t.throws(_ => t.not(1, 1))
    t.is(e.message, "Expected something other than 1, but got 1")

    e = t.throws(_ => t.not("1", "1"))
    t.is(e.message, "Expected something other than \"1\", but got \"1\"")

    // near
    e = t.throws(_ => t.near(1, 2, 0.1))
    t.is(e.message, "Expected 2 +/- 0.1, got 1 (difference: -1)")

    e = t.throws(_ => t.near(1, 2, -0.1))
    t.is(e.message, "Expected 2 +/- 0.1, got 1 (difference: -1)")

    e = t.throws(_ => t.near(1, 0, 0.1))
    t.is(e.message, "Expected 0 +/- 0.1, got 1 (difference: +1)")

    e = t.throws(_ => t.near(1, 0, 0.1, 'A'))
    t.is(e.message, "Expected 0 +/- 0.1, got 1 (difference: +1) : A")

    // notNear
    e = t.throws(_ => t.notNear(1, 1.5, 1))
    t.is(e.message, "Expected something other than 1.5 +/- 1, but got 1 (difference: -0.5)")

    e = t.throws(_ => t.notNear(1, 2, -1))
    t.is(e.message, "Expected something other than 2 +/- 1, but got 1 (difference: -1)")

    e = t.throws(_ => t.notNear(1, 0, 1))
    t.is(e.message, "Expected something other than 0 +/- 1, but got 1 (difference: +1)")

    e = t.throws(_ => t.notNear(1, 0, 1, 'B'))
    t.is(e.message, "Expected something other than 0 +/- 1, but got 1 (difference: +1) : B")

    // deepEqual
    e = t.throws(_ => t.deepEqual({ a: 1 }, { a: 2 }))
    t.is(e.message, "Difference found at path: a\n- 1\n+ 2")

    e = t.throws(_ => t.deepEqual({ a: 1 }, { a: 1, b: 2 }))
    t.is(e.message, "Difference found at path: b\n- undefined\n+ 2")

    e = t.throws(_ => t.deepEqual({ a: [1, 2, 3] }, { a: [1, 2, 4] }))
    t.is(e.message, "Difference found at path: a[2]\n- 3\n+ 4")

    e = t.throws(_ => t.deepEqual({ a: 1, b: 2 }, test.ignoreExtra({ b: 1 })))
    t.is(e.message, "Difference found at path: b\n- 2\n+ 1")

    e = t.throws(_ => t.deepEqual({ a: 1, b: 2 }, test.ignoreExtra({ c: 1 })))
    t.is(e.message, "Difference found at path: c\n- undefined\n+ 1")

    e = t.throws(_ => t.deepEqual({ get a() { return 1; } }, { a: 2 }))
    t.deepEqual(e.message, 'Difference found at path: a\n- 1\n+ 2')

    e = t.throws(_ => t.deepEqual({ a: 1 }, { get a() { return 2; } } ))
    t.deepEqual(e.message, 'Difference found at path: a\n- 1\n+ 2')

    e = t.throws(_ => t.deepEqual({ get a() { return 1; } }, { get a() { return 2; } } ))
    t.deepEqual(e.message, 'Difference found at path: a\n- 1\n+ 2')

    e = t.throws(_ => t.deepEqual({ get a() { throw Error('X'); } }, { get a() { return 2; } } ))
    t.deepEqual(e.message, 'Error was thrown while comparing the path "a": X')

    e = t.throws(_ => t.deepEqual({ get a() { return 1; } }, { get a() { throw Error('X'); } } ))
    t.deepEqual(e.message, 'Error was thrown while comparing the path "a": X')

    e = t.throws(_ => t.deepEqual({
        a: {
            b: [{
                get c() { throw Error('X'); }
            }]
        }
    }, {
        a: {
            b: [{
                c: 2
            }]
        }
    }))
    t.deepEqual(e.message, 'Error was thrown while comparing the path "a.b[0].c": X')

    // notDeepEqual
    e = t.throws(_ => t.notDeepEqual({ a: 1 }, { a: 1 }))
    t.is(e.message, "No difference between actual and expected.")

    // throws
    let throwTest1 = false;
    try {
        t.throws(_ => {
            // Does not throw
        })
    } catch (e) {
        throwTest1 = true;
        t.is(e.message, "Expected an exception");
    }
    t.is(throwTest1, true)

    let throwTest2 = false;
    try {
        t.throws(_ => {
            throw new Error();
        }, { instanceOf: TypeError })
    } catch (e) {
        throwTest2 = true;
        t.is(e.message, "Expected error to be an instance of 'TypeError', got 'Error'");
    }
    t.is(throwTest2, true)

    // notThrows
    let notThrowsTest1 = false;
    try {
        t.notThrows(_ => {
            throw new Error("Test");
        })
    } catch (e) {
        notThrowsTest1 = true;
        t.is(e.message, "Expected no exception, got exception of type 'Error': Test");
    }
    t.is(notThrowsTest1, true)

    // throwsAsync
    let throwsAsyncTest1 = false;
    try {
        await t.throwsAsync(async _ => {
            // Does not throw
        })
    } catch (e) {
        throwsAsyncTest1 = true;
        t.is(e.message, "Expected an exception");
    }
    t.is(throwsAsyncTest1, true)

    let throwsAsyncTest2 = false;
    try {
        await t.throwsAsync(async _ => {
            throw new Error()
        }, { instanceOf: TypeError })
    } catch (e) {
        throwsAsyncTest2 = true;
        t.is(e.message, "Expected error to be an instance of 'TypeError', got 'Error'");
    }
    t.is(throwsAsyncTest2, true)

    // notThrowsAsync
    let notThrowsAsyncTest1 = false;
    try {
        await t.notThrowsAsync(async _ => {
            throw new Error("TestAsync");
        })
    } catch (e) {
        notThrowsAsyncTest1 = true;
        t.is(e.message, "Expected no exception, got exception of type 'Error': TestAsync");
    }
    t.is(notThrowsAsyncTest1, true)

})

test('Getters & deepEqual', t => {
    let o = {};

    Object.defineProperty(o, 'got', { get() { return 9000; } });

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