const test = require('../aqa');
const common = require('../sourceMap');

test('mapSourceLocation', t => {
    const sut = common.mapSourceLocation;
    const sourceMap = {
        version: 3,
        file: 'sourcemap-test.js',
        sourceRoot: '',
        sources: ['sourcemap-test.ts'],
        names: [],
        mappings:
            ';;AACA,gCAAkC;AAElC,IAAI,CAAC,eAAe,EAAE,UAAA,CAAC;IACnB,CAAC,CAAC,MAAI,CAAA,CAAC,KAAK,CAAC,CAAC;AAClB,CAAC,CAAC,CAAA;AAEF,IAAI,CAAC,eAAe,EAAE,UAAA,CAAC;IACnB,CAAC,CAAC,MAAI,CAAA,CAAC,KAAK,CAAC,CAAC;AAClB,CAAC,CAAC,CAAA'
    };
    let result = sut(8, 5, sourceMap.mappings, sourceMap.sources, sourceMap.names);
    t.deepEqual(result, {
        source: 'sourcemap-test.ts',
        line: 9,
        column: 4
    });
});
