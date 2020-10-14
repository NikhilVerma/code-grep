/**
 * This file is a tool to "grep" for code by using Abstract syntax trees
 * It allows developers to do refactorings by searching for code patterns
 * which would be hard to express using regular expressions
 *
 * - Member expressions create({ something }) vs xxx.create({ something })
 * - Detect file contents (to use TS or Flow etc)
 * - Support block statements - { onOpen_: null }
 */

import parseCode, { CodeMask } from './parsers/babel';
import traverse, { Node, NodePath, TraverseOptions } from '@babel/traverse';

export function codeSearch(
    code: string,
    masks: CodeMask[],
    onMatch: (nodePath: NodePath<Node>) => void,
    onError?: (err: any) => void,
    fileName?: string
) {
    try {
        const ast = parseCode(code, fileName);

        masks.forEach((expressionMask) => {
            traverse(ast, getVisitorFromMask(expressionMask, onMatch));
        });
    } catch (err) {
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
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

function isArray(value: any): value is [] {
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
        return mask.every((maskItem) => value.some((valueItem) => matches(valueItem, maskItem)));
    }

    return value === mask;
}
