// Source map helpers

// Modified from https://github.com/Rich-Harris/vlq
const b64Map = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
    a: 26,
    b: 27,
    c: 28,
    d: 29,
    e: 30,
    f: 31,
    g: 32,
    h: 33,
    i: 34,
    j: 35,
    k: 36,
    l: 37,
    m: 38,
    n: 39,
    o: 40,
    p: 41,
    q: 42,
    r: 43,
    s: 44,
    t: 45,
    u: 46,
    v: 47,
    w: 48,
    x: 49,
    y: 50,
    z: 51,
    0: 52,
    1: 53,
    2: 54,
    3: 55,
    4: 56,
    5: 57,
    6: 58,
    7: 59,
    8: 60,
    9: 61,
    '+': 62,
    '/': 63,
    '=': 64
};
function decodeVLQ(string) {
    const result = [];
    const points = string.split('');
    let shift = 0;
    let value = 0;

    for (const element of points) {
        let intValue = b64Map[element];
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
        const segs = line.split(',');
        let result = null;
        for (let seg of segs) {
            if (!seg) continue;
            const decoded = decodeVLQ(seg);
            for (let i = 0; i < state.length; i++) {
                state[i] = decoded[i] !== undefined ? state[i] + decoded[i] : state[i];
            }
            if (state[0] >= col - 1 && result == null) result = createResult(...state, sources, names);
        }
        return result;
    };

    const createResult = (_col, source, sourceLine, sourceCol, name, sources, names) => ({
        source: sources[source],
        line: sourceLine + 1,
        column: sourceCol,
        name: names[name]
    });

    for (let i = 0; i < actualLine; i++) {
        let l = lines[i];
        result = getCol(l, actualColumn, vlqState, sources, names);
        vlqState[0] = 0;
    }
    return result;
}

module.exports = {   
    mapSourceLocation
};
