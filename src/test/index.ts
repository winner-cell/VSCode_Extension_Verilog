//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.

import * as Mocha from 'mocha';
import * as glob from 'glob';
import * as path from 'path';

export function run(testsRoot: string, clb: (error: Error | null) => void): void {
    const mocha = new Mocha({
        ui: 'tdd',
        useColors: true
    });

    glob('**/**.test.js', { cwd: testsRoot }, (err: Error | null, files: string[]) => {
        if (err) {
            return clb(err);
        }

        files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

        try {
            mocha.run(failures => {
                if (failures > 0) {
                    clb(new Error(`${failures} tests failed.`));
                } else {
                    clb(null);
                }
            });
        } catch (e) {
            clb(e as Error);
        }
    });
}