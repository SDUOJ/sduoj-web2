import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import useIdeIntelligence from './useIdeIntelligence';
import type { EditorDebug } from './MonacoCodeEditor';
import { IdeContext } from './runTypes';
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
  problemCode?: string;
  judgeTemplateId?: string;
  context?: IdeContext;
  debug?: EditorDebug;
}) {
  const { t } = useTranslation();
  const supported = ['c', 'cpp', 'java', 'python'].includes(props.language);
  const intelligence = useIdeIntelligence({
    enabled: supported && Boolean(props.problemCode && props.context),
    language: (supported ? props.language : 'cpp') as 'c' | 'cpp' | 'java' | 'python',
    problemCode: props.problemCode ?? '',
    judgeTemplateId: props.judgeTemplateId,
    context: props.context ?? { type: 0, problemCode: props.problemCode ?? '' },
    code: props.value,
  });
  const latestValue = useRef(props.value);
  latestValue.current = props.value;
  const { ready: intelligenceReady, syncCode: syncIntelligence } = intelligence;
  useEffect(() => {
    if (intelligenceReady) syncIntelligence(latestValue.current);
  }, [intelligenceReady, syncIntelligence]);
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
              templateLanguage={props.language}
              value={props.value}
              onChange={(value) => {
                props.onChange(value);
                intelligence.syncCode(value);
              }}
              intelligence={intelligence}
              loading={loading}
              debug={props.debug}
            />
          </Suspense>
        </EditorBoundary>
      </div>
    </div>
  );
}
