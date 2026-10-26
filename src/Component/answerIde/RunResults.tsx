import { Collapse, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import CaseDiffView from './CaseDiffView';
import { RunDetail, runResultLabel, runTerminal } from './runTypes';
import JudgeLog from '../submission/JudgeLog';
const textStyle = {
  whiteSpace: 'pre-wrap' as const,
  overflowWrap: 'anywhere' as const,
  maxHeight: 240,
  overflow: 'auto',
};
export default function RunResults({ detail }: { detail?: RunDetail }) {
  const { t } = useTranslation();
  if (!detail) return null;
  return (
    <div className="ide-run-results" aria-label={t('answerIde.results')}>
      <Space>
        <Tag
          color={
            detail.judgeResult === 1 || detail.judgeResult === -1
              ? 'green'
              : detail.judgeResult === 0 || detail.judgeResult === -2
                ? 'blue'
                : detail.judgeResult === 99
                  ? undefined
                  : 'red'
          }
        >
          {runResultLabel(detail.judgeResult)}
        </Tag>
        <span>{t('answerIde.task', { id: detail.submissionId })}</span>
      </Space>
      {detail.judgeLog && (
        <JudgeLog
          title={t(detail.judgeResult === 8 ? 'answerIde.compileLog' : 'answerIde.log')}
          error={detail.judgeResult === 8 || detail.judgeResult === 5}
          log={detail.judgeLog}
        />
      )}
      {detail.judgeResult !== 8 && (detail.run?.cases?.length ?? 0) > 0 && (
        <Collapse
          style={{ marginTop: 8 }}
          defaultActiveKey={['0']}
          items={(detail.run?.cases ?? []).map((item) => ({
            key: String(item.index),
            label: `${t('answerIde.case', { index: item.index + 1 })} · ${item.judgeResult == null ? t(runTerminal(detail.judgeResult) ? 'answerIde.notExecuted' : 'answerIde.waiting') : runResultLabel(item.judgeResult)}`,
            children: (
              <>
                <div className="ide-run-metrics" aria-label={t('Statistics')}>
                  <Tag color="blue">
                    {t('Time')}: {item.usedTime ?? '—'} ms
                  </Tag>
                  <Tag color="purple">
                    {t('Memory')}: {item.usedMemory ?? '—'} KB
                  </Tag>
                  <Tag
                    color={
                      item.exitCode == null ? undefined : item.exitCode === 0 ? 'green' : 'red'
                    }
                  >
                    {t('answerIde.exit', { code: item.exitCode ?? '—' })}
                  </Tag>
                </div>
                <div>{t('answerIde.input')}</div>
                <pre style={textStyle}>{item.input}</pre>
                {item.expectedOutput != null && (
                  <>
                    <div>{t('answerIde.expected')}</div>
                    <pre style={textStyle}>{item.expectedOutput || t('answerIde.empty')}</pre>
                  </>
                )}
                <div>
                  {t('answerIde.stdout')}{' '}
                  {item.stdoutTruncated && (
                    <Tag color="orange">
                      {t('answerIde.truncated', { bytes: item.stdoutOriginalLength })}
                    </Tag>
                  )}
                </div>
                <pre style={textStyle}>{item.stdout ?? ''}</pre>
                <div>
                  {t('answerIde.stderr')}{' '}
                  {item.stderrTruncated && (
                    <Tag color="orange">
                      {t('answerIde.truncated', { bytes: item.stderrOriginalLength })}
                    </Tag>
                  )}
                </div>
                <pre style={textStyle}>{item.stderr ?? ''}</pre>
                {item.expectedOutput != null && item.stdout != null && (
                  <CaseDiffView
                    expected={item.expectedOutput}
                    actual={item.stdout}
                    truncated={item.stdoutTruncated}
                  />
                )}
              </>
            ),
          }))}
        />
      )}
    </div>
  );
}
