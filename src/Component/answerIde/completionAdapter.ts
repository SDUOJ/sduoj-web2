import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type {
  IdeCompletionItem,
  IdeDocumentation,
  IdeRange,
} from '../../Utils/API/ide-intelligence';

// LSP and Monaco enumerate the same concepts in different orders.
const kinds = [
  'Text',
  'Method',
  'Function',
  'Constructor',
  'Field',
  'Variable',
  'Class',
  'Interface',
  'Module',
  'Property',
  'Unit',
  'Value',
  'Enum',
  'Keyword',
  'Snippet',
  'Color',
  'File',
  'Reference',
  'Folder',
  'EnumMember',
  'Constant',
  'Struct',
  'Event',
  'Operator',
  'TypeParameter',
] as const;

export function completionKind(api: typeof Monaco, kind?: number) {
  return api.languages.CompletionItemKind[kinds[(kind ?? 1) - 1] ?? 'Text'];
}

export function documentation(
  value?: IdeDocumentation,
): string | Monaco.IMarkdownString | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value.value !== 'string') return undefined;
  return value.kind === 'markdown'
    ? { value: value.value, isTrusted: false, supportHtml: false }
    : value.value;
}

function validRange(model: Monaco.editor.ITextModel, r: IdeRange) {
  return (
    [r.startLine, r.startColumn, r.endLine, r.endColumn].every(Number.isSafeInteger) &&
    r.startLine >= 1 &&
    r.endLine <= model.getLineCount() &&
    r.startLine <= r.endLine &&
    r.startColumn >= 1 &&
    r.endColumn >= 1 &&
    r.startColumn <= model.getLineMaxColumn(r.startLine) &&
    r.endColumn <= model.getLineMaxColumn(r.endLine) &&
    (r.startLine !== r.endLine || r.startColumn <= r.endColumn)
  );
}

function range(api: typeof Monaco, r: IdeRange) {
  return new api.Range(r.startLine, r.startColumn, r.endLine, r.endColumn);
}

function match(
  item: IdeCompletionItem,
  prefix: string,
): { tier: number; text: string } | undefined {
  if (!prefix) return { tier: 0, text: item.filterText ?? item.label };
  const needle = prefix.toLowerCase();
  const texts = [item.filterText, item.label, item.insertText].filter(
    (text): text is string => typeof text === 'string' && text.length > 0,
  );
  const direct = texts.find((text) => text.startsWith(prefix));
  if (direct) return { tier: 0, text: direct };
  const folded = texts.find((text) => text.toLowerCase().startsWith(needle));
  if (folded) return { tier: 1, text: folded };
  // Retain word/camel initials and genuine subsequences, not unrelated items
  // that match just one character of the current word (e.g. pri -> import).
  const initials = texts.find((text) =>
    (text.match(/(?:^|[_\s])([A-Za-z])|[A-Z]/g) ?? [])
      .join('')
      .replace(/[_\s]/g, '')
      .toLowerCase()
      .startsWith(needle),
  );
  if (initials) return { tier: 2, text: initials };
  const fuzzy = texts.find((text) => {
    let index = 0;
    for (const character of text.toLowerCase()) {
      if (character === needle[index]) index++;
      if (index === needle.length) return true;
    }
    return false;
  });
  if (fuzzy) return { tier: 3, text: fuzzy };
  return undefined;
}

export function adaptCompletions(
  api: typeof Monaco,
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  items: IdeCompletionItem[],
): Monaco.languages.CompletionItem[] {
  const word = model.getWordUntilPosition(position);
  // Servers may omit textEdit. Replacing only the prefix in pri|nt would
  // insert printnt, so use the whole current word for this fallback.
  const completeWord = model.getWordAtPosition(position);
  const fallback = new api.Range(
    position.lineNumber,
    word.startColumn,
    position.lineNumber,
    completeWord?.endColumn ?? position.column,
  );
  const suggestions = items.flatMap((item) => {
    const matching = match(item, word.word);
    if (!matching) return [];
    const { tier } = matching;
    const replace = item.replaceRange;
    const insert = item.insertRange;
    // Main completion edits must affect this word and contain the request position.
    const mainValid = (r: IdeRange) =>
      validRange(model, r) &&
      r.startLine === position.lineNumber &&
      r.endLine === position.lineNumber &&
      r.startColumn <= position.column &&
      r.endColumn >= position.column;
    if (replace && !mainValid(replace)) return [];
    if (
      insert &&
      (!replace ||
        !mainValid(insert) ||
        insert.startColumn !== replace.startColumn ||
        insert.endColumn > replace.endColumn)
    )
      return [];
    const main = replace ? range(api, replace) : fallback;
    const extra = item.additionalTextEdits ?? [];
    if (extra.length > 32 || extra.some((edit) => !validRange(model, edit.range))) return [];
    const edits = extra.map((edit) => ({ range: range(api, edit.range), text: edit.text }));
    const all = [main, ...edits.map((edit) => edit.range)];
    // Conservative overlap rule includes coincident insertion points.
    if (
      all.some((r, i) =>
        all.slice(i + 1).some((other) => api.Range.areIntersectingOrTouching(r, other)),
      )
    )
      return [];
    return [
      {
        label: item.label,
        kind: completionKind(api, item.kind),
        detail: item.detail,
        documentation: documentation(item.documentation),
        insertText: item.insertText ?? item.label,
        insertTextRules:
          (item.insertTextFormat === 2
            ? api.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : 0) |
          (item.insertTextMode === 1
            ? api.languages.CompletionItemInsertTextRule.KeepWhitespace
            : 0),
        // Monaco filters again by this field. Use the text that actually
        // matched, or an unrelated server filter can hide a valid label.
        filterText: matching.text,
        commitCharacters: item.commitCharacters,
        preselect: tier === 0 ? item.preselect : false,
        sortText: tier + ':' + (item.sortText ?? item.label),
        range: insert && replace ? { insert: range(api, insert), replace: main } : main,
        additionalTextEdits: edits.length ? edits : undefined,
      },
    ];
  });
  // Select the bounded result after matching/ranking, so a large server list
  // cannot discard the exact prefix before we have inspected it.
  return suggestions
    .sort((a, b) => (a.sortText < b.sortText ? -1 : a.sortText > b.sortText ? 1 : 0))
    .slice(0, 512);
}

const templates: Record<string, Array<[string, string, string]>> = {
  python: [
    ['print', 'print(${1:value})$0', 'print(…)'],
    ['range', 'range(${1:stop})$0', 'range(…)'],
    ['len', 'len(${1:object})$0', 'len(…)'],
    ['for', 'for ${1:item} in ${2:items}:\n\t$0', 'for … in …'],
    ['forrange', 'for ${1:i} in range(${2:n}):\n\t$0', 'for … in range(…)'],
  ],
  c: [['printf', 'printf("${1:%d}\\n", ${2:value});$0', 'printf(…)']],
  cpp: [
    ['for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}', 'for (…)'],
    ['cout', "std::cout << ${1:value} << '\\n';$0", 'std::cout << …'],
  ],
  java: [
    ['sout', 'System.out.println(${1:value});$0', 'System.out.println(…)'],
    ['for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for (…)'],
  ],
};

export function trustedTemplates(
  api: typeof Monaco,
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  language: string,
): Monaco.languages.CompletionItem[] {
  const word = model.getWordUntilPosition(position);
  const completeWord = model.getWordAtPosition(position);
  if (!word.word) return [];
  const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1);
  if (/[.>:]\s*$/.test(before)) return [];
  // Tokenize a bounded prefix to suppress templates in multiline comments/strings too.
  // Monaco also applies quickSuggestions context suppression before invoking providers.
  if (position.lineNumber > 1000) return [];
  const prefix = model.getValueInRange(new api.Range(1, 1, position.lineNumber, position.column));
  if (prefix.length > 65536) return [];
  const tokens = api.editor.tokenize(prefix, language === 'c' ? 'cpp' : language).at(-1) ?? [];
  const token = tokens.filter((t) => t.offset <= position.column - 2).at(-1);
  if (/comment|string/.test(token?.type ?? '')) return [];
  return (templates[language] ?? [])
    .filter(([label]) => label.startsWith(word.word))
    .map(([label, insertText, detail]) => ({
      label: { label, description: detail },
      kind: api.languages.CompletionItemKind.Snippet,
      insertText,
      insertTextRules: api.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      filterText: label,
      sortText: '1:template:' + label,
      range: new api.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        completeWord?.endColumn ?? position.column,
      ),
    }));
}
