import { useEffect, useState } from 'react';
import { Alert, Button, Drawer, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import cApi from '../../Utils/API/c-api';
import { IdeContext } from '../answerIde/runTypes';
import mApi from '../../Utils/API/m-api';

export default function PublicCaseDetail(props: {
  problemId: string;
  problemCode?: string;
  checkpointId: string;
  context?: IdeContext;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof cApi.publicCaseDetail>>>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    if (open) {
      setError(false);
      setDetail(undefined);
      void (
        props.context
          ? cApi.idePublicCaseDetail(props.context, props.checkpointId)
          : cApi.publicCaseDetail({ problemId: props.problemId, checkpointId: props.checkpointId })
      )
        .then((value) => {
          if (active) setDetail(value);
        })
        .catch(() => {
          if (active) setError(true);
        });
    }
    return () => {
      active = false;
    };
  }, [open, props.problemId, props.checkpointId, props.context]);
  return (
    <>
      <Button size="small" type="link" onClick={() => setOpen(true)}>
        {t('publicAuto.caseDetail')}
      </Button>
      <Drawer
        open={open}
        title={`${t('publicAuto.caseDetail')} · ${props.checkpointId}`}
        width={600}
        onClose={() => setOpen(false)}
      >
        {error && <Alert type="error" message={t('publicAuto.fillError')} />}
        {detail && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {!detail.canRun && <Alert type="info" message={t('publicAuto.largePreview')} />}
            <div>
              {t('InputPreview')} ({detail.inputSize} B)
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.input}</pre>
            <div>
              {t('OutputPreview')} ({detail.outputSize} B)
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.output}</pre>
            <Button
              onClick={() =>
                void mApi.zipDownload(
                  [
                    { id: detail.inputFileId, downloadFilename: `${props.checkpointId}.in` },
                    { id: detail.outputFileId, downloadFilename: `${props.checkpointId}.out` },
                  ],
                  `${props.checkpointId}.zip`,
                )
              }
            >
              {t('publicAuto.downloadPair')}
            </Button>
            {props.problemCode && window.location.pathname.endsWith('/ide') && (
              <Button
                disabled={!detail.canRun}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('answerIde:publicCase', {
                      detail: {
                        problemCode: props.problemCode,
                        input: detail.input,
                        expectedOutput: detail.output,
                      },
                    }),
                  );
                  setOpen(false);
                }}
              >
                {t('publicAuto.runCase')}
              </Button>
            )}
          </Space>
        )}
      </Drawer>
    </>
  );
}
