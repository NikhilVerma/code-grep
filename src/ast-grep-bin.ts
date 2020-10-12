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
import { parse, ParserPlugin } from '@babel/parser';
import traverse, { Node, NodePath, TraverseOptions } from '@babel/traverse';
import { Statement } from '@babel/types';
import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { argv } from 'yargs';

const pattern = argv._[0];

const SKIP_MASK_KEYS = ['start', 'end', 'loc', 'selfClosing', 'extra'] as const;

function createMask<T extends Record<string, any> | Record<string, any>[]>(node: T): T {
    if (node instanceof Array) {
        return node.map(createMask);
    } else if (node instanceof Object) {
        return (Object.keys(node) as Array<keyof T>).reduce((out, key) => {
            if (SKIP_MASK_KEYS.indexOf(key) === -1 && !isEmpty(node[key])) {
                out[key] = createMask(node[key]);
            }
            return out;
        }, {} as T);
    } else {
        return node;
    }
}

const expressionMask = getMappedMask(pattern);

function getMappedMask(code: string): Statement[] {
    return createMask(parseCode(`(${code})`).program.body).map((mask) => {
        // A lot of code is parsed as an expression statement while the intention of the user
        // is to search for the expression inside the statement
        if (mask.type === 'ExpressionStatement') {
            return mask.expression;
        }

        return mask;
    });
}

console.log(JSON.stringify(expressionMask, null, 4));

//@todo - compile glob from supported languages
const globPattern = (argv.glob as string) || '**/*.{js,jsx,ts,tsx}';

const cwd = argv.cwd ? path.resolve(argv.cwd as string) : process.cwd();

glob.sync(globPattern, {
    absolute: true,
    dot: true,
    cwd,
    ignore: [
        //@todo - use gitignore files - https://www.npmjs.com/package/ignore
        // exclude
        '**/node_modules/**',
        '**/target/**',
        '**/js/cosmos/**',
    ],
}).forEach(astFinder);
