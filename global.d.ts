declare interface AqaPackageSection {
    verbose?: boolean;
    reporter?: string;
    reporterOptions?: AqaPackageReporterOptions;
}

declare interface AqaPackageReporterOptions {
    outputDir: string;
}

declare interface TestResult {
    name: string;   
    startTime: Date;
    numTests: number;
    numFailedTests: number;
    duration: number;
    testCases: TestCaseResult[];
}

declare interface TestCaseResult {
    name: string;
    startTime: Date;
    duration: number;
    skipped: boolean;
    success: boolean;
    failureMessage: string;
}