import {
  adaptCompletions,
  completionKind,
  documentation,
  trustedTemplates,
} from './completionAdapter';

class Range {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number,
  ) {}
  static areIntersectingOrTouching(a: Range, b: Range) {
    const point = (line: number, column: number) => line * 10000 + column;
    return (
      point(a.startLineNumber, a.startColumn) <= point(b.endLineNumber, b.endColumn) &&
      point(b.startLineNumber, b.startColumn) <= point(a.endLineNumber, a.endColumn)
    );
  }
}
const api: any = {
  Range,
  languages: {
    CompletionItemKind: {
      Text: 18,
      Function: 1,
      Method: 0,
      Variable: 4,
      Class: 5,
      Keyword: 17,
      Snippet: 28,
    },
    CompletionItemInsertTextRule: { InsertAsSnippet: 4, KeepWhitespace: 1 },
  },
  editor: { tokenize: jest.fn(() => [[{ offset: 0, type: 'identifier' }]]) },
};
const pos: any = { lineNumber: 1, column: 4 };
const r = (startColumn: number, endColumn: number) => ({
  startLine: 1,
  endLine: 1,
  startColumn,
  endColumn,
});
function model(code = 'pri') {
  const lines = code.split('\n');
  return {
    getWordAtPosition: (p: any) => {
      const line = lines[p.lineNumber - 1];
      const prefix = line.slice(0, p.column - 1).match(/[\w]+$/)?.[0] ?? '';
      const suffix = line.slice(p.column - 1).match(/^[\w]+/)?.[0] ?? '';
      return prefix || suffix
        ? {
            word: prefix + suffix,
            startColumn: p.column - prefix.length,
            endColumn: p.column + suffix.length,
          }
        : null;
    },
    getWordUntilPosition: (p: any) => {
      const word = lines[p.lineNumber - 1].slice(0, p.column - 1).match(/[\w]+$/)?.[0] ?? '';
      return { word, startColumn: p.column - word.length };
    },
    getLineContent: (line: number) => lines[line - 1],
    getLineCount: () => lines.length,
    getLineMaxColumn: (line: number) => lines[line - 1].length + 1,
    getValueInRange: () => code,
  } as any;
}

it('replaces the typed prefix so accepting print cannot produce priprint', () => {
  const [item] = adaptCompletions(api, model(), pos, [{ label: 'print', kind: 3 }]);
  expect(item.range).toEqual(new Range(1, 1, 1, 4));
  expect(item.kind).toBe(1);
  expect('pri'.slice(0, (item.range as Range).startColumn - 1) + item.insertText).toBe('print');
});
it('maps protocol kind concepts rather than casting numeric enums', () => {
  expect(completionKind(api, 6)).toBe(4);
  expect(completionKind(api, 14)).toBe(17);
  expect(completionKind(api, 999)).toBe(18);
});
it('replaces a complete word when the server omits the edit range', () => {
  const code = 'print(42)';
  const [item] = adaptCompletions(api, model(code), pos, [{ label: 'print', insertText: 'print' }]);
  const area = item.range as Range;
  expect(area).toEqual(new Range(1, 1, 1, 6));
  expect(
    code.slice(0, area.startColumn - 1) + item.insertText + code.slice(area.endColumn - 1),
  ).toBe('print(42)');
  const [template] = trustedTemplates(api, model(code), pos, 'python');
  expect(template.range).toEqual(new Range(1, 1, 1, 6));
  // A server-provided range remains authoritative.
  const [explicit] = adaptCompletions(api, model(code), pos, [
    { label: 'print', replaceRange: r(1, 4) },
  ]);
  expect(explicit.range).toEqual(new Range(1, 1, 1, 4));
});
it('retains empty replacement text and commit characters, including an empty override', () => {
  const items = adaptCompletions(api, model(), pos, [
    {
      label: 'erase',
      filterText: 'pri',
      insertText: '',
      replaceRange: r(1, 4),
      commitCharacters: [],
    },
    { label: 'print', commitCharacters: ['('] },
  ]);
  expect(items[0]).toMatchObject({ insertText: '', commitCharacters: [] });
  expect(items[1].commitCharacters).toEqual(['(']);
});
it('preserves filterText, snippets, preselection and insert/replace ranges', () => {
  const [item] = adaptCompletions(api, model('print'), pos, [
    {
      label: 'print(…)',
      filterText: 'print',
      insertText: 'print(${1:value})',
      insertTextFormat: 2,
      preselect: true,
      insertRange: r(1, 4),
      replaceRange: r(1, 6),
    },
  ]);
  expect(item).toMatchObject({ filterText: 'print', preselect: true, insertTextRules: 4 });
  expect(item.range).toEqual({ insert: new Range(1, 1, 1, 4), replace: new Range(1, 1, 1, 6) });
});
it('ranks direct prefixes ahead of fuzzy keywords while retaining server ordering within a tier', () => {
  const items = adaptCompletions(api, model(), pos, [
    { label: 'import', sortText: '00' },
    { label: 'print', sortText: '99' },
    { label: 'priority', sortText: '98' },
  ]);
  expect(items.map((i) => i.sortText)).toEqual(['0:98', '0:99']);
});
it('finds prefix matches beyond the server list cap and removes unrelated preselection', () => {
  const source = [
    ...Array.from({ length: 600 }, (_, index) => ({ label: 'import' + index, preselect: true })),
    { label: 'print', sortText: '99' },
    { label: 'parseRequestInput', preselect: true },
  ];
  const items = adaptCompletions(api, model(), pos, source);
  expect(items.map((item) => item.label)).toEqual(['print', 'parseRequestInput']);
  expect(items[1].preselect).toBe(false);
  expect(source[0]).toMatchObject({ preselect: true });
});
it('checks filter, label and insertion prefixes and preserves real fuzzy matches', () => {
  const items = adaptCompletions(api, model(), pos, [
    { label: 'snippet', filterText: 'not-a-match', insertText: 'print(${1:value})' },
    { label: 'Print', preselect: true },
    { label: 'parse_result_input' },
    { label: 'priority', filterText: 'other', sortText: '00' },
    { label: 'sprint' },
    { label: 'ImportError', preselect: true },
  ]);
  expect(items.map((item) => item.label)).toEqual([
    'priority',
    'snippet',
    'Print',
    'parse_result_input',
    'sprint',
  ]);
  expect(items.filter((item) => item.preselect)).toEqual([]);
  expect(items[0].filterText).toBe('priority');
  expect(items[1].filterText).toBe('print(${1:value})');
});
it.each([
  ['python', 'pri', 'print'],
  ['python', 'ran', 'range'],
  ['python', 'le', 'len'],
  ['c', 'pri', 'printf'],
])('offers the %s %s fallback without a language server', (language, code, expected) => {
  const items = trustedTemplates(
    api,
    model(code),
    { lineNumber: 1, column: code.length + 1 } as any,
    language,
  );
  expect((items[0].label as { label: string }).label).toBe(expected);
});
it.each([
  ['cpp', 'text.sub', 'substr'],
  ['java', 'text.sub', 'substring'],
])('keeps the %s member edit in the member word', (language, code, expected) => {
  const at: any = { lineNumber: 1, column: code.length + 1 };
  const items = adaptCompletions(api, model(code), at, [
    { label: 'unrelated', preselect: true },
    { label: expected },
  ]);
  expect(items[0].label).toBe(expected);
  expect(items[0].range).toEqual(new Range(1, 6, 1, 9));
  expect(trustedTemplates(api, model(code), at, language)).toEqual([]);
});
it('bounds empty-prefix suggestions after sorting without mutating server items', () => {
  const source = Array.from({ length: 600 }, (_, index) => ({
    label: 'item' + String(599 - index).padStart(3, '0'),
  }));
  const items = adaptCompletions(api, model(''), { lineNumber: 1, column: 1 } as any, source);
  expect(items).toHaveLength(512);
  expect(items[0].label).toBe('item000');
  expect(source[0].label).toBe('item599');
});
it('rejects invalid, cross-range and overlapping edits, allowing valid same-document edits', () => {
  expect(adaptCompletions(api, model(), pos, [{ label: 'x', replaceRange: r(1, 20) }])).toEqual([]);
  expect(
    adaptCompletions(api, model(), pos, [
      { label: 'x', additionalTextEdits: [{ range: r(1, 1), text: 'import x' }] },
    ]),
  ).toEqual([]);
  expect(
    adaptCompletions(api, model('header\npri'), { lineNumber: 2, column: 4 } as any, [
      { label: 'print', additionalTextEdits: [{ range: r(1, 1), text: '# header\n' }] },
    ])[0].additionalTextEdits,
  ).toHaveLength(1);
});
it('keeps documentation untrusted and treats plaintext as plaintext', () => {
  expect(documentation({ kind: 'markdown', value: '[x](command:evil)' })).toMatchObject({
    isTrusted: false,
    supportHtml: false,
  });
  expect(documentation({ kind: 'plaintext', value: '**x**' })).toBe('**x**');
});
it('offers trusted prefix templates only outside members, strings and comments', () => {
  expect(trustedTemplates(api, model(), pos, 'python')[0].insertText).toBe('print(${1:value})$0');
  expect(
    trustedTemplates(api, model('obj.pri'), { lineNumber: 1, column: 8 } as any, 'python'),
  ).toEqual([]);
  api.editor.tokenize.mockReturnValueOnce([[{ offset: 0, type: 'comment.python' }]]);
  expect(
    trustedTemplates(api, model('# pri'), { lineNumber: 1, column: 6 } as any, 'python'),
  ).toEqual([]);
});
