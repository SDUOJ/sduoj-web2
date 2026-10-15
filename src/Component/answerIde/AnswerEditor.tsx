import React, { lazy, Suspense } from 'react';
import { Alert, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
const Monaco = lazy(() => import('./MonacoCodeEditor'));
class EditorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function AnswerEditor(props: {
  language: 'c' | 'cpp' | 'java' | 'python' | 'sql' | 'text';
  value: string;
  onChange: (code: string) => void;
  fill?: boolean;
}) {
  const { t } = useTranslation();
  const loading = (
    <div className="ide-editor-loading" role="status">
      <Spin />
      <span>{t('answerIde.loadingEditor')}</span>
    </div>
  );
  return (
    <div className={props.fill ? 'ide-editor' : undefined}>
      <div className={props.fill ? 'ide-editor-surface' : undefined}>
        <EditorBoundary fallback={<Alert type="error" message={t('answerIde.editorFailed')} />}>
          <Suspense fallback={loading}>
            <Monaco
              height={props.fill ? '100%' : undefined}
              language={
                props.language === 'c'
                  ? 'cpp'
                  : props.language === 'text'
                    ? 'plaintext'
                    : props.language
              }
              value={props.value}
              onChange={props.onChange}
              loading={loading}
            />
          </Suspense>
        </EditorBoundary>
      </div>
    </div>
  );
}
