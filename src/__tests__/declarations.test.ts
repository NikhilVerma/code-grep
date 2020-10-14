import { codeSearch } from '../code-grep';
import { createCodeMask } from '../parsers/babel';

test('ImportDeclaration', () => {
    expect(
        codeSearch(
            `
        import abc, { something } from 'xxx';
        import { something2 } from 'xxx';
        import 'xxx';
        import 'abc';
`,
            createCodeMask(`import abc from 'xxx';`)
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});

test('ImportDeclarationWildcard', () => {
    expect(
        codeSearch(
            `
        import abc, { something } from 'xxx';
        import bcd from 'xxx';
        import bcd123 from '123';
`,
            createCodeMask(`import ___ from 'xxx';`)
        ).map((nodePath) => nodePath.toString())
    ).toMatchSnapshot();
});
