import { codeSearch } from 'ast-grep';
import { createCodeMask } from 'parsers/babel';

test('ImportDeclaration', () => {
    const mask = createCodeMask(`import abc from 'xxx';`);
    let matches: string[] = [];

    codeSearch(
        `
        import abc, { something } from 'xxx';
        import { something2 } from 'xxx';
        import 'xxx';
        import 'abc';
`,
        mask,
        function (nodePath) {
            matches.push(nodePath.toString());
        }
    );

    expect(matches).toMatchSnapshot();
});

test('ImportDeclarationWildcard', () => {
    const mask = createCodeMask(`import ___ from 'xxx';`);
    let matches: string[] = [];

    console.log(JSON.stringify(mask, null, 4));

    codeSearch(
        `
        import abc, { something } from 'xxx';
        import bcd from 'xxx';
        import bcd123 from '123';
`,
        mask,
        function (nodePath) {
            matches.push(nodePath.toString());
        }
    );

    expect(matches).toMatchSnapshot();
});
