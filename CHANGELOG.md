# **aqa** Changelog

## 2023

### [1.6.5] (TBD)
- Added logging for skipped tests
- Improved file detection in exceptions

### [1.6.4] (04-feb-2023)
- Before/after tests are now always in report + file name is now in report

### [1.6.3] (04-feb-2023)
- Changed skip logic in error reporting

### [1.6.2] (04-feb-2023)
- Improved error reporting

### [1.6.1] (04-feb-2023)
- Added reporting! The only supported reporter is JUnit for now.

### [1.6.0] (02-feb-2023)
- Added `before`, `after`, `beforeEach` and `afterEach` hooks
- Exposed `Asserts` TypeScript interface
- Fixed issue in error line matching

## 2022

### [1.5.1] (26-aug-2022)
- GitHub Action: CI + Coverage
- Added watch tests / E2E watch tests
- Fixed recursive directory watch not working on Linux
- Fixed Node 14 support by not using fancy `??=` syntax anymore

### [1.5.0] (26-aug-2022)
- HUGE speed improvement by running test files in parallel
  - In some cases up to 8x faster!
- Prettier test feedback with ✔ and ❌

### [1.4.1] (23-aug-2022)
- Added Config section to README

### [1.4.0] (23-aug-2022)
- Added support for `"aqa"` section in `package.json`
  - Only `verbose` is supported for now: 
  ```js
  {
    "aqa": {
      "verbose": true
    }
  }
    ```
- Added support for globs for `--watch`
- Added tests to increase code coverage to 95%
- Added color for `-`/`+` difference notations on test failures
- Changed `t.is()` to report differences similar to the same format as `t.deepEqual()`
- Code split of CLI
- Removed the undocumented `--tap` feature

### [1.3.8] (20-aug-2022)
- Added strict check for the type of the equality param of `deepEqual`
- Added Coverage documentation to README
- Improved examples in README
- Fixed error line matching in stack traces
- Removed some source code to leverage more of Node's `util.inspect`, like BigInt rendering
- Caching of Source Maps

### [1.3.7] (14-aug-2022)
- Added Source Map support
- Created this changelog + all entries retroactively

### [1.3.6] (13-aug-2022)
- Added index.d.ts for auto-complete purposes
- Fixed directory watch filter

### [1.3.5] (10-aug-2022)
- Improved clickability of file paths on test fail (Cmd/Ctrl+Click in IDE terminals)

### [1.3.4] (20-jul-2022)
- Added deepEqual getter handling support

### [1.3.3] (15-jul-2022)
- Added JSDoc documentation for auto-completion

### [1.3.2] (30-jun-2022)
- Removed inspect limitations

### [1.3.1] (08-apr-2022)
- Added `t.near()` + `t.notNear()`
- Added more granular unit tests

### [1.3.0] (07-apr-2022)
- Reworked watcher, added directory watching

### [1.2.15] (01-jan-2022)
- Fixed `aqa.ignore` usage in extra expected properties

<br>

## 2021

### [1.2.14] (08-dec-2021)
- Fixed issue with Data comparison on dates with a few milliseconds difference

### [1.2.13] (08-dec-2021)
- Re-added ignore dirs that start with a single underscore
- Color helper
- Fixed normalize slashes in file filter

### [1.2.12] (06-dec-2021)
- Added log suppressing via `t.disableLogging()`
- Minor spelling fixes in README.md
- Added CLI parameters chapter to README.md

### [1.2.11] (05-dec-2021)
- Fixed relative glob matching

### [1.2.10] (04-dec-2021)
- Added small fix to make debugging easier
- Merged JJ's PR

### [1.2.9] (26-oct-2021)
- Improved string difference rendering

### [1.2.8] (12-oct-2021)
- Improved `global` backup mechanism

### [1.2.7] (11-oct-2021)
- `global` backup mechanism, for when (rogue) tests overwrite crucial globals like `console` and `process`.

### [1.2.6] (17-aug-2021)
- Added `test.ignoreExtra(obj)` to only compare the properties specified by the obj and ignore the rest.

### [1.2.5] (05-aug-2021)
- Improved JSON diff by using Node's `util.inspect()`
- Duplicate test case name detection
- stdout + stderr merge

### [1.2.4] (04-aug-2021)
- Fixed 0 == -0 equality

### [1.2.3] (04-aug-2021)
- Fixed `deepEqual` not reporting extra or getter properties

### [1.2.2] (04-aug-2021)
- Fixed `deepEqual` so it only checks enumerable properties

### [1.2.1] (03-aug-2021)
- Fixed `deepEqual` diff detection for getters

### [1.2.0] (23-jun-2021)
- Added support for many common test file patterns
- Added support for ignores
- Added extra unit tests

### [1.1.15] (14-jun-2021)
- Added support for special numbers like `NaN`, `Infinity` and `-Infinity`

### [1.1.14] (07-may-2021)
- Added stricter value checking for `deepEqual`	

### [1.1.13] (07-apr-2021)
- Updated README with new features and instructions that I forgot for 1.1.12

### [1.1.12] (07-apr-2021)
- Removed superfluous code
- Added common tests
- Added support for RegExp comparison

### [1.1.11] (06-apr-2021)
- Added support for module packages

### [1.1.10] (06-apr-2021)
- Improved error stacktrace

### [1.1.9] (02-apr-2021)
- Added fail tests
- Improved error and success message output

### [1.1.8] (02-apr-2021)
- Smarter file watcher for non test files
- Added `t.log`

### [1.1.7] (01-apr-2021)
- Added `--verbose` flag
- Improved timing information
- Improved terminal colors and formatting
- Updated .gitignore
- Changed install hint to a devDependency

### [1.1.0 - 1.1.6] (25-mar-2021)
- Made error handling more reliable
- Added `notThrows` and `notThrowsAsync`
- Added `test.ignore` support for `deepEqual` objects
- Changed 'undefined' detection
- NaN equality check
- Simplified `deepEqual`
- Added `deepEqual` and `notDeepEqual` 
- Added message parameter support for all assert methods

### [1.0.0] (26-feb-2021)
- Added `throwsAsync`
- Added self-testing
- Added single file/glob run

### [0.4.0] (25-feb-2021)
- Added async test support
- Added fatal error detection
- Added common.js

### [0.3.0] (22-feb-2021)
- Added watch support!

### [0.2.0] (19-feb-2021)
- Added CLI support
  - Run all tests in project
- Added assertion documentation

### [0.1.2] (18-feb-2021)
- Added `throws`
- Added terminal colors
- Added tests

### [0.1.1] (17-feb-2021)
- Added new README.md

### [0.1.0] (17-feb-2021)
- Initial release
- Added `is()`, `not()`, `true()`, `false()`
- Added CLI test running
- Added unit test to test aqa with itself