declare function aqa(testName: string, testFn: (t: Asserts) => unknown): void;
declare namespace aqa {
    var ignore: symbol;
    var ignoreExtra: (value: any) => any;
}
declare class Asserts {
    is(actual: any, expected: any, message?: string): void;
    not(actual: any, expected: any, message?: string): void;
    near(actual: any, expected: any, delta: any, message?: string): void;
    notNear(actual: any, expected: any, delta: any, message?: string): void;
    deepEqual(actual: any, expected: any, message?: string, _equality?: boolean): void;
    notDeepEqual(actual: any, expected: any, message?: string): void;
    true(actual: any, message?: string): void;
    false(actual: any, message?: string): void;
    throws(fn: any, opts: any, message?: string): any;
    notThrows(fn: any, message?: string): void;
    throwsAsync(fn: any, opts: any, message?: string): Promise<any>;
    notThrowsAsync(fn: any, message?: string): Promise<void>;
    disableLogging(): void;
    log(s?: any): void;
}
export = aqa;