import { codeSearch } from '../code-grep';
import { createCodeMask } from '../parsers/babel';

test('jsx expressions', () => {
    expect(
        codeSearch(
            `
    function TestComponent() {
        return (<>
            <Component prop="test" />
            <Component />
            <Component onClick={evt => alert(evt)} prop="test" />
            //@todo - It should match ExpressionContainers as well
            <Component onClick={evt => alert(evt)} prop={"test"} />
            <Component prop="test">
                Some value
            </Component>
        </>);
    }
    `,
            createCodeMask('<Component prop="test" />')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});

test('neighboring elements', () => {
    expect(
        codeSearch(
            `
function TestComponent() {
    return (<>
        <C>
            <A />
            <B />
        </C>
        <B>
            <A>Hello</A>
            <B>World</B>
        </B>
        <A />
        <D />
        <A />
        <B />
    </>);
}
`,
            createCodeMask('<A /><B />')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});

test('same jsx elements', () => {
    expect(
        codeSearch(
            `
function TestComponent() {
    return (<>
        <A />
        <B />
        <A />
    </>);
}
`,
            createCodeMask('<A /><A />')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();

    expect(
        codeSearch(
            `
function TestComponent() {
    return (<>
        <A />
        <B />
    </>);
}
`,
            createCodeMask('<A /><A />')
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});
