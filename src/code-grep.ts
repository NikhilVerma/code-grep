/**
 * This file is a tool to "grep" for code by using Abstract syntax trees
 * It allows developers to do refactorings by searching for code patterns
 * which would be hard to express using regular expressions
 *
 * - Member expressions create({ something }) vs xxx.create({ something })
 * - Detect file contents (to use TS or Flow etc)
 * - Support block statements - { onOpen_: null }
 * - 'return' outside of function (2:12)
 * - function ___() {if (started) { return; }}
 */

import parseCode, { CodeMask } from './parsers/babel';
import traverse, { Node, NodePath, TraverseOptions } from '@babel/traverse';

export function codeSearch(
    code: string,
    masks: CodeMask[],
    onError?: (err: any) => void,
    fileName?: string
) {
    try {
        const ast = parseCode(code, fileName);
        const matches: NodePath<Node>[] = [];

        masks.forEach((expressionMask) => {
            traverse(
                ast,
                getVisitorFromMask(expressionMask, (nodePath) => {
                    matches.push(nodePath);
                })
            );
        });

        return matches;
    } catch (err) {
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }

        return [];
    }
}

function getVisitorFromMask(mask: CodeMask, onMatch: (nodePath: NodePath<Node>) => void) {
    const type = mask.type;

    if (!type) {
        console.error('No type found in mask', mask);
        throw new Error('No type found in mask');
    }

    return {
        [type](nodePath: NodePath<Node>) {
            if (matches(nodePath.node, mask)) {
                onMatch(nodePath);
            }
        },
    } as TraverseOptions;
}

function isObject(value: any): value is object {
    return Object.prototype.toString.call(value) === '[object Object]';
}

function isArray(value: any): value is any[] {
    return Object.prototype.toString.call(value) === '[object Array]';
}

function matches(value: Node, mask: any): boolean {
    if (Object.prototype.toString.call(mask) === '[object RegExp]') {
        return mask.test(value);
    } else if (isObject(mask)) {
        return (
            isObject(value) &&
            //@ts-ignore
            !Object.entries(mask).some(([key, maskValue]) => !matches(value[key], maskValue))
        );
    } else if (isArray(mask) && isArray(value)) {
        const clone = [...value];

        return mask.every((maskItem) => {
            return clone.some((valueItem, index) => {
                if (matches(valueItem, maskItem)) {
                    // This prevents re-matching with same items (e.g if user searched for <A/><A/>)
                    clone[index] = null;
                    return true;
                }

                return false;
            });
        });
    }

    return value === mask;
}
