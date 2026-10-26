import { ReactNode, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { adaptCompletions, documentation, trustedTemplates } from './completionAdapter';
import type {
  IdeSignatureResult,
  IdeCompletionItem,
  IdeDiagnostic,
} from '../../Utils/API/ide-intelligence';

loader.config({ monaco });

type Intelligence = {
  ready: boolean;
  diagnostics: IdeDiagnostic[];
  completion: (
    line: number,
    column: number,
    triggerKind?: string,
    triggerCharacter?: string,
    cancelled?: () => boolean,
  ) => Promise<{ status: string; isIncomplete?: boolean; items?: IdeCompletionItem[] }>;
  signatureHelp?: (
    line: number,
    column: number,
    cancelled?: () => boolean,
  ) => Promise<IdeSignatureResult>;
  definition: (
    line: number,
    column: number,
  ) => Promise<{
    status: string;
    locations?: Array<{
      documentUri: string;
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    }>;
  }>;
};

export type EditorDebug = {
  enabled: boolean;
  active: boolean;
  stopKey?: string;
  breakpoints: number[];
  line?: number;
  toggle: (line: number) => void;
  cursor?: (line: number) => void;
  hover?: (path: string) => Promise<string | undefined>;
};

export default function MonacoCodeEditor(props: {
  height?: string;
  language: string;
  templateLanguage?: string;
  value: string;
  onChange: (value: string) => void;
  loading: ReactNode;
  intelligence?: Intelligence;
  debug?: EditorDebug;
}) {
  const debugRef = useRef(props.debug);
  debugRef.current = props.debug;
  const decorations = useRef<monaco.editor.IEditorDecorationsCollection>();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const monacoRef = useRef<any>();
  const intelligenceRef = useRef(props.intelligence);
  intelligenceRef.current = props.intelligence;

  useEffect(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    const diagnostics = props.intelligence?.diagnostics ?? [];
    const model = editor?.getModel();
    if (!editor || !monacoInstance || !model) return;
    monacoInstance.editor.setModelMarkers(
      model,
      'sduoj-ide',
      diagnostics.map((item) => ({
        severity:
          item.severity === 'error'
            ? monacoInstance.MarkerSeverity.Error
            : item.severity === 'warning'
              ? monacoInstance.MarkerSeverity.Warning
              : item.severity === 'hint'
                ? monacoInstance.MarkerSeverity.Hint
                : monacoInstance.MarkerSeverity.Info,
        message: item.message,
        startLineNumber: item.startLine,
        startColumn: item.startColumn,
        endLineNumber: item.endLine,
        endColumn: item.endColumn,
        code: item.code,
      })),
    );
  }, [props.intelligence?.diagnostics]);

  useEffect(() => {
    const entries: monaco.editor.IModelDeltaDecoration[] = (
      props.debug?.enabled ? props.debug.breakpoints : []
    ).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: { glyphMarginClassName: 'ide-debug-breakpoint' },
    }));
    if (props.debug?.line)
      entries.push({
        range: new monaco.Range(props.debug.line, 1, props.debug.line, 1),
        options: {
          isWholeLine: true,
          className: 'ide-debug-current-line',
          glyphMarginClassName: 'ide-debug-current-arrow',
        },
      });
    decorations.current?.set(entries);
    if (props.debug?.line) editorRef.current?.revealLineInCenterIfOutsideViewport(props.debug.line);
  }, [props.debug?.breakpoints, props.debug?.line, props.debug?.enabled]);

  return (
    <Editor
      key={props.language}
      height={props.height ?? '400px'}
      language={props.language}
      value={props.value}
      onChange={(value) => props.onChange(value ?? '')}
      loading={props.loading}
      onMount={(editor, monacoInstance) => {
        editorRef.current = editor;
        monacoRef.current = monacoInstance;
        decorations.current = editor.createDecorationsCollection();
        const cursor = editor.onDidChangeCursorPosition((event) =>
          debugRef.current?.cursor?.(event.position.lineNumber),
        );
        debugRef.current?.cursor?.(editor.getPosition()?.lineNumber ?? 1);
        const click = editor.onMouseDown((event) => {
          if (
            debugRef.current?.enabled &&
            event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
            event.target.position
          )
            debugRef.current.toggle(event.target.position.lineNumber);
        });
        const hover = monacoInstance.languages.registerHoverProvider(props.language, {
          provideHover: async (model, position, token) => {
            const provider = debugRef.current;
            if (
              !provider?.enabled ||
              !provider.active ||
              !provider.hover ||
              model !== editor.getModel()
            )
              return null;
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            const offset = position.column - 1;
            const match = Array.from(
              model
                .getLineContent(position.lineNumber)
                .matchAll(
                  /[A-Za-z_$][A-Za-z0-9_$]*(?:(?:\.[A-Za-z_$][A-Za-z0-9_$]*)|(?:\[[0-9]+\])){0,7}/g,
                ),
            ).find((item) => item.index! <= offset && item.index! + item[0].length >= offset);
            const path = match?.[0] ?? word.word;
            const value = await provider.hover(path);
            if (
              value === undefined ||
              token.isCancellationRequested ||
              provider.stopKey !== debugRef.current?.stopKey ||
              !debugRef.current?.active
            )
              return null;
            const text: monaco.IMarkdownString = {
              value: `${path} = ${value}`.replace(/[\\`*_{}[\]()#+.!|<>-]/g, '\\$&'),
              isTrusted: false,
              supportHtml: false,
            };
            return {
              range: new monacoInstance.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [text],
            };
          },
        });
        editor.onDidDispose(() => {
          hover.dispose();
          click.dispose();
          cursor.dispose();
        });
        if (!props.intelligence) return;
        const completionProvider = monacoInstance.languages.registerCompletionItemProvider(
          props.language,
          {
            triggerCharacters: ['.', '>', ':'],
            provideCompletionItems: async (model, position, context, token) => {
              const provider = intelligenceRef.current;
              if (!provider?.ready || model !== editor.getModel() || debugRef.current?.active)
                return { suggestions: [] };
              const version = model.getVersionId();
              const cancelled = () =>
                token.isCancellationRequested ||
                model.isDisposed() ||
                model !== editor.getModel() ||
                model.getVersionId() !== version ||
                !editor.getPosition()?.equals(position) ||
                provider.completion !== intelligenceRef.current?.completion;
              const trigger =
                context.triggerKind ===
                monacoInstance.languages.CompletionTriggerKind.TriggerCharacter
                  ? 'triggerCharacter'
                  : context.triggerKind ===
                      monacoInstance.languages.CompletionTriggerKind.TriggerForIncompleteCompletions
                    ? 'triggerForIncompleteCompletions'
                    : 'invoked';
              const result = await provider.completion(
                position.lineNumber,
                position.column,
                trigger,
                context.triggerCharacter,
                cancelled,
              );
              if (cancelled() || result.status !== 'ready') return { suggestions: [] };
              const suggestions = adaptCompletions(
                monacoInstance,
                model,
                position,
                result.items ?? [],
              );
              // A later edit invalidates absolute additional-edit coordinates.
              // Hide this list rather than applying an import at an old position.
              const guard = suggestions.some((item) => item.additionalTextEdits?.length)
                ? model.onDidChangeContent(() => {
                    queueMicrotask(() => {
                      if (!model.isDisposed() && model === editor.getModel())
                        editor.trigger('sduoj-version-change', 'hideSuggestWidget', {});
                    });
                  })
                : undefined;
              return {
                incomplete: result.isIncomplete ?? false,
                suggestions,
                dispose: () => guard?.dispose(),
              };
            },
          },
        );
        // Trusted local snippets do not need an HTTP request or an LSP process.
        const templateProvider = monacoInstance.languages.registerCompletionItemProvider(
          props.language,
          {
            provideCompletionItems: (model, position) => ({
              // Prefix-filtered snippets must be recomputed as the word changes.
              incomplete: true,
              suggestions:
                model === editor.getModel() && !debugRef.current?.active
                  ? trustedTemplates(
                      monacoInstance,
                      model,
                      position,
                      props.templateLanguage ?? props.language,
                    )
                  : [],
            }),
          },
        );
        const signatureProvider = monacoInstance.languages.registerSignatureHelpProvider(
          props.language,
          {
            signatureHelpTriggerCharacters: ['(', ','],
            signatureHelpRetriggerCharacters: [')'],
            provideSignatureHelp: async (model, position, token) => {
              const provider = intelligenceRef.current;
              if (
                !provider?.ready ||
                !provider.signatureHelp ||
                model !== editor.getModel() ||
                debugRef.current?.active
              )
                return null;
              const version = model.getVersionId();
              const cancelled = () =>
                token.isCancellationRequested ||
                model.isDisposed() ||
                model !== editor.getModel() ||
                model.getVersionId() !== version ||
                !editor.getPosition()?.equals(position) ||
                provider.completion !== intelligenceRef.current?.completion;
              const result = await provider.signatureHelp(
                position.lineNumber,
                position.column,
                cancelled,
              );
              if (cancelled() || result.status !== 'ready' || !result.signatures?.length)
                return null;
              return {
                value: {
                  signatures: result.signatures.map((signature) => ({
                    label: signature.label,
                    documentation: documentation(signature.documentation),
                    activeParameter: signature.activeParameter,
                    parameters: (signature.parameters ?? []).map((parameter) => ({
                      label: parameter.label,
                      documentation: documentation(parameter.documentation),
                    })),
                  })),
                  activeSignature: result.activeSignature ?? 0,
                  activeParameter: result.activeParameter ?? 0,
                },
                dispose() {},
              };
            },
          },
        );
        const definitionProvider = monacoInstance.languages.registerDefinitionProvider(
          props.language,
          {
            provideDefinition: async (model, position) => {
              const provider = intelligenceRef.current;
              if (!provider?.ready || model !== editor.getModel()) return [];
              const result = await provider.definition(position.lineNumber, position.column);
              if (result.status !== 'ready') return [];
              return (result.locations ?? []).map((location) => ({
                // The single-file provider only returns targets in this model.
                uri: model.uri,
                range: new monacoInstance.Range(
                  location.startLine,
                  location.startColumn,
                  location.endLine,
                  location.endColumn,
                ),
              }));
            },
          },
        );
        editor.onDidDispose(() => {
          completionProvider.dispose();
          templateProvider.dispose();
          signatureProvider.dispose();
          definitionProvider.dispose();
          const model = editor.getModel();
          if (model) monacoInstance.editor.setModelMarkers(model, 'sduoj-ide', []);
        });
      }}
      options={{
        automaticLayout: true,
        glyphMargin: props.debug?.enabled,
        readOnly: props.debug?.active,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
        lineHeight: 22,
        padding: { top: 12, bottom: 12 },
        hover: { above: false },
        fixedOverflowWidgets: true,
        renderLineHighlight: 'gutter',
        overviewRulerBorder: false,
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        parameterHints: { enabled: true },
        snippetSuggestions: 'inline',
        suggest: { showWords: false },
        quickSuggestions: { other: true, comments: false, strings: false },
        quickSuggestionsDelay: 300,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: true,
        wordBasedSuggestions: 'off',
      }}
    />
  );
}
