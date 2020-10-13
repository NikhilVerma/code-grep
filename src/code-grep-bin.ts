/* eslint-disable no-console */
/* eslint-env node */

/**
 * This file is a tool to "grep" for code by using Abstract syntax trees
 * It allows developers to do refactorings by searching for code patterns
 * which would be hard to express using regular expressions
 *
 * - Member expressions create({ something }) vs xxx.create({ something })
 * - Detect file contents (to use TS or Flow etc)
 * - Support block statements - { onOpen_: null }
 */
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { argv } from 'yargs';
import { createCodeMask } from 'parsers/babel';
import { codeSearch } from 'code-grep';
import chalk from 'chalk';

// Don't scan files over 1MB
const MAX_FILE_SIZE = 1000 * 1000;

const pattern = argv._[0];

const expressionMask = createCodeMask(pattern);

//@todo - compile glob from supported languages
const globPattern = (argv.glob as string) || '**/*.{js,jsx,ts,tsx}';

const cwd = argv.cwd ? path.resolve(argv.cwd as string) : process.cwd();

const now = Date.now();

const files = glob.sync(globPattern, {
    absolute: true,
    dot: true,
    cwd,
    ignore: [
        //@todo - use gitignore files - https://www.npmjs.com/package/ignore
        '**/node_modules/**',
    ],
});

let filesScanned = 0;
let filesSkipped: string[] = [];
let filesFailed: string[] = [];

console.info(`Going to scan ${files.length.toLocaleString()} files.\n`);

files.forEach(function (fileName: string) {
    const code = fs.readFileSync(fileName, 'utf8');

    if (code.length > MAX_FILE_SIZE) {
        filesSkipped.push(fileName);
        return;
    }

    filesScanned++;

    codeSearch(
        code,
        expressionMask,
        function (nodePath) {
            console.log(`${fileName}: ${chalk.blue(nodePath.toString())}`);
        },
        function (err) {
            if (argv.verbose) {
                console.error(`🔴 Failed to parse ${fileName}`);
                console.error(err);
            } else {
                filesFailed.push(fileName);
            }
        },
        fileName
    );
});

console.log(`\n✅ Scanned ${filesScanned} files in ${(Date.now() - now) / 1000}ms.`);

if (filesFailed.length > 0) {
    console.warn(
        `\n🔴 Failed to parse following files. Pass --verbose argument to see the errors:`
    );
    filesFailed.forEach((fileFailed) => console.log(`  ${fileFailed}`));
}

if (filesSkipped.length > 0) {
    if (argv.verbose) {
        console.warn('\n⚠️ Following files were skipped because they were too large:');
        filesSkipped.forEach((fileSkipped) => console.log(`  ${fileSkipped}`));
    } else {
        console.warn(
            `\n⚠️ Skipped ${filesSkipped.length} files because they were larger than ${Math.round(
                MAX_FILE_SIZE / 1000
            ).toLocaleString()} KB. Pass --verbose argument to see the list.`
        );
    }
}
