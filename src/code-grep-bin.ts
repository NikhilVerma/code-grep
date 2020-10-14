#!/usr/bin/env node

import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { argv } from 'yargs';
import { createCodeMask } from './parsers/babel';
import { codeSearch } from './code-grep';
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

    const matches = codeSearch(
        code,
        expressionMask,
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

    //@todo - Smarter cwd replacement so users can Cmd+Click the files
    matches.forEach((nodePath) =>
        console.log(`.${fileName.replace(cwd, '')}: ${chalk.blue(nodePath.toString())}`)
    );
});

console.log(`\n✅ Scanned ${filesScanned} files in ${(Date.now() - now) / 1000}s.`);

if (filesFailed.length > 0) {
    console.warn(
        `\n🔴 Failed to parse following files. Pass --verbose argument to see the errors:`
    );
    filesFailed.forEach((fileFailed) => console.log(`  .${fileFailed.replace(cwd, '')}`));
}

if (filesSkipped.length > 0) {
    if (argv.verbose) {
        console.warn('\n⚠️ Following files were skipped because they were too large:');
        filesSkipped.forEach((fileSkipped) => console.log(`  .${fileSkipped.replace(cwd, '')}`));
    } else {
        console.warn(
            `\n⚠️ Skipped ${filesSkipped.length} files because they were larger than ${Math.round(
                MAX_FILE_SIZE / 1000
            ).toLocaleString()} KB. Pass --verbose argument to see the list.`
        );
    }
}
