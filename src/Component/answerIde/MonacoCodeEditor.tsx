import { ReactNode } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({ monaco });
export default function MonacoCodeEditor(props: {
  height?: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
  loading: ReactNode;
}) {
  return (
    <Editor
      height={props.height ?? '400px'}
      language={props.language}
      value={props.value}
      onChange={(value) => props.onChange(value ?? '')}
      loading={props.loading}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
        lineHeight: 22,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'gutter',
        overviewRulerBorder: false,
        smoothScrolling: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
