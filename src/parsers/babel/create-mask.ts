import { babelParser } from './babel-parser';
import { Statement, Expression } from '@babel/types';
import { Node } from '@babel/traverse';

const SKIP_MASK_KEYS = ['start', 'end', 'loc', 'selfClosing', 'extra'];

export type CodeMask = ReturnType<typeof createCodeMask>[number];

export function createCodeMask(code: string) {
    return createMask(getParsedCode(code).program.body).map(expandMask).flat();
}

type NodeType = Node | Statement | Expression;

function expandMask(mask: Partial<NodeType>): Array<Partial<NodeType>> {
    // A lot of code is parsed as an expression statement while the intention of the user
    // is to search for the expression inside the statement
    if (mask.type === 'ExpressionStatement' && mask.expression) {
        return [mask, ...expandMask(mask.expression)];
    }

    // If a user enters "<A /><B />" as their pattern, it's not valid JSX
    // so we wrap it with fragments, but the user could be looking to match neighbouring elements
    if (mask.type === 'JSXFragment') {
        return [
            { type: 'JSXFragment', children: mask.children },
            { type: 'JSXElement', children: mask.children },
        ];
    }

    //@todo - Add support for AssignmentExpression (a = 5) > VariableDeclarator (const a = 5)

    return [mask];
}

function getParsedCode(code: string) {
    try {
        return babelParser(`(${code})`);
    } catch (err) {
        // Try to fix user mistakes

        // Invalid JSX
        if (err.message.includes('Adjacent JSX elements must be wrapped in an enclosing tag')) {
            return babelParser(`<>${code}</>`);
        }

        // Self own, don't convert this code into an expression
        if (
            err.message.includes('import can only be used') ||
            err.message.includes('Unexpected token')
        ) {
            return babelParser(code);
        }

        throw err;
    }
}

function createMask(node: NodeType[]): Partial<NodeType>[];
function createMask(node: NodeType): Partial<NodeType>;

function createMask(node: any): any {
    if (node instanceof Array) {
        return node.map(createMask);
    } else if (node instanceof Object) {
        const nodeKeys: Array<keyof typeof node> = Object.keys(node);
        const output: Partial<typeof node> = {};

        return nodeKeys.reduce((out, key) => {
            key = String(key);
            if (SKIP_MASK_KEYS.indexOf(key) === -1 && !isEmpty(node[key])) {
                out[String(key)] = createMask(node[key]);
            }
            return out;
        }, output);
    } else {
        return node;
    }
}

// eslint-disable-next-line complexity
function isEmpty(val: any) {
    return (
        val === undefined ||
        val === null ||
        val === '___' ||
        (val instanceof Array && val.length === 0) ||
        (val instanceof Object && Object.keys(val).length === 0)
    );
}
