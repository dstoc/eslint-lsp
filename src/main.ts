import {loadESLint, type ESLint} from 'eslint';
import {
  createConnection,
  TextDocuments,
  TextDocumentSyncKind,
  Diagnostic,
} from 'vscode-languageserver/node.js';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {StreamMessageReader, StreamMessageWriter} from 'vscode-jsonrpc/node.js';

const esl: typeof ESLint = await loadESLint({useFlatConfig: true});

const connection = createConnection(
  new StreamMessageReader(process.stdin),
  new StreamMessageWriter(process.stdout),
);
const documents = new TextDocuments(TextDocument);
let rootPath: string = process.cwd();

connection.onInitialize((params) => {
  rootPath = params.rootPath!;
  process.chdir(rootPath);

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      diagnosticProvider: {
        identifier: 'eslint-lsp',
        documentSelector: null,
        interFileDependencies: false,
        workspaceDiagnostics: true,
      },
    },
  };
});

documents.onDidChangeContent(async (change) => {
  const file = new URL(change.document.uri).pathname;
  // TODO: Not really sure what `cwd` is for. We still had to `chdir` above.
  const eslint: ESLint = new esl({cwd: rootPath});
  const results = await eslint.lintText(change.document.getText(), {
    filePath: file,
  });
  const messages = results.flatMap((entry) => entry.messages);
  const diagnostics: Diagnostic[] = [];
  for (const message of messages) {
    diagnostics.push({
      source: 'eslint',
      message: `${message.message} (${message.ruleId})`,
      severity: message.severity == 2 ? 1 : 2,
      range: {
        start: {
          line: (message.line ?? 1) - 1,
          character: (message.column ?? 1) - 1,
        },
        end: {
          line: (message.endLine ?? 1) - 1,
          character: (message.endColumn ?? 1) - 1,
        },
      },
    });
  }
  await connection.sendDiagnostics({uri: change.document.uri, diagnostics});
});

documents.listen(connection);
connection.listen();
