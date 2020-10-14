import { codeSearch } from '../code-grep';
import { createCodeMask } from '../parsers/babel';

test('ObjectExpression', () => {
    expect(
        codeSearch(
            `
            const { containerEl, icon, delay } = props;
    `,
            createCodeMask('{ containerEl, delay }')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});

test('FunctionDeclaration (wildcard)', () => {
    expect(
        codeSearch(
            `
            function test() {
                if (started) { return; }

                doSomethingElse();
            }`,
            createCodeMask('function ___() {if (started) { return; }}')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});
