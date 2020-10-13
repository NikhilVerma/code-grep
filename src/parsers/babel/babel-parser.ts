import { parse, ParserPlugin } from '@babel/parser';

export function babelParser(code: string, fileName?: string) {
    //@todo - better TS detection
    const isTypescript = fileName?.endsWith('tsx') || fileName?.endsWith('ts');

    return parse(code, {
        allowImportExportEverywhere: true,
        plugins: [
            'asyncGenerators',
            'bigInt',
            'classProperties',
            'dynamicImport',
            'exportDefaultFrom',
            'functionBind',
            'functionSent',
            'importMeta',
            'jsx',
            'nullishCoalescingOperator',
            'numericSeparator',
            'objectRestSpread',
            'optionalCatchBinding',
            'optionalChaining',
            'throwExpressions',

            // Shaves a second off parsing for 2k+ files
            isTypescript ? 'typescript' : false,
            isTypescript
                ? [
                      'decorators',
                      {
                          decoratorsBeforeExport: true,
                      },
                  ]
                : false,

            // 'classPrivateMethods',
            // 'classPrivateProperties',
            // 'doExpressions',
            // 'estree',
            // 'exportNamespaceFrom',
            // 'pipelineOperator',
        ].filter(Boolean) as ParserPlugin[],
    });
}
