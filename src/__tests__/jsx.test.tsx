import { codeSearch } from 'code-grep';
import { createCodeMask } from 'parsers/babel';

test('jsx expressions', () => {
    const mask = createCodeMask('<Component prop="test" />');
    let matches: string[] = [];

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
        mask,
        function (nodePath) {
            matches.push(nodePath.toString());
        }
    );

    expect(matches).toMatchSnapshot();
});

test('neighboring elements', () => {
    const mask = createCodeMask('<A /><B />');
    let matches: string[] = [];

    debugger;

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
        mask,
        function (nodePath) {
            matches.push(nodePath.toString());
        }
    );

    expect(matches).toMatchSnapshot();
});
