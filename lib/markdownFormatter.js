import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

marked.use(
  markedTerminal({}, {
    ignoreIllegals: true
  })
);

export default (stringToPrint) => {
  const supported = [
    'xml','bash','c','cpp','csharp','css','markdown','diff','ruby','go','graphql',
    'ini','java','javascript','json','kotlin','less','lua','makefile','perl',
    'objectivec','php','php-template','plaintext','python','python-repl','r','rust',
    'scss','shell','sql','swift','yaml','typescript','vbnet','wasm'
  ];

  // strip unsupported languages
  const stripUnsupported = new RegExp(
    '^```(?!(' + supported.join('|') + ')\\b)\\S*',
    'gm'
  );
  let clean = stringToPrint.replace(stripUnsupported, '```');

  // prefix supported code blocks with "lang:"
  const prefixSupported = new RegExp(
    '^```(' + supported.join('|') + ')\\b',
    'gm'
  );
  clean = clean.replace(prefixSupported, '$1:\n\n```$1');

  return marked.parse(clean);
}
