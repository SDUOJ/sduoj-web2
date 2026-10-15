import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Collapse, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import mApi from '../../../../Utils/API/m-api';
import { RunDetail, runResultLabel, runTerminal } from '../../../answerIde/runTypes';
import RunResults from '../../../answerIde/RunResults';
import { SyncJudging } from '../../../submission/SyncJudging';

export default function MetaTaskProgress(props: {
  ids: string[];
  onChange: () => void;
  onRetry?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const key = props.ids.join(',');
  const [retries, setRetries] = useState<Record<string, string>>({});
  const ids = useMemo(
    () => (key ? key.split(',').map((id) => retries[id] ?? id) : []),
    [key, retries],
  );
  const [details, setDetails] = useState<Record<string, RunDetail>>({});
  const [error, setError] = useState(false);
  const refresh = useRef<() => void>(() => {});
  const changed = useRef(props.onChange);
  changed.current = props.onChange;
  useEffect(() => {
    let active = true;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout>;
    let notified = false;
    let failures = 0;
    setDetails({});
    setError(false);
    const poll = async () => {
      if (!active || inFlight || !ids.length) return;
      clearTimeout(timer);
      inFlight = true;
      try {
        // Bound each response and request count for full formal sets with many batches.
        const results: RunDetail[] = [];
        for (let offset = 0; offset < ids.length; offset += 20) {
          if (!active) return;
          results.push(...(await mApi.publicAutoTasks(ids.slice(offset, offset + 20))));
        }
        if (!active) return;
        setDetails(Object.fromEntries(results.map((detail) => [detail.submissionId, detail])));
        setError(false);
        failures = 0;
        if (results.every((detail) => runTerminal(detail.judgeResult))) {
          if (!notified) {
            notified = true;
            changed.current();
          }
          return;
        }
      } catch {
        if (active) {
          setError(true);
          failures++;
        }
      } finally {
        inFlight = false;
      }
      if (active) timer = setTimeout(poll, Math.min(10000, 1000 * 2 ** failures));
    };
    refresh.current = () => {
      void poll();
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
      refresh.current = () => {};
    };
  }, [ids]);
  if (!ids.length) return null;
  return (
    <>
      {error && <Alert type="warning" message={t('publicAuto.taskConnectionError')} />}
      {Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => {
        const queryList = ids.slice(index * 100, (index + 1) * 100);
        return (
          <SyncJudging
            key={index}
            queryList={queryList}
            open={queryList.some((id) => !runTerminal(details[id]?.judgeResult))}
            dataHandle={(frame) => {
              if (frame[2] === 4) refresh.current();
            }}
          />
        );
      })}
      <Collapse
        items={ids.map((id) => ({
          key: id,
          label: `${id} · ${runResultLabel(details[id]?.judgeResult ?? 0)}`,
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button
                  disabled={runTerminal(details[id]?.judgeResult)}
                  onClick={async () => {
                    await mApi.cancelPublicAutoTask({ submissionId: id });
                    refresh.current();
                  }}
                >
                  {t('answerIde.cancel')}
                </Button>
                <Button
                  disabled={!runTerminal(details[id]?.judgeResult)}
                  onClick={async () => {
                    const fresh = await mApi.retryPublicAutoTask({ submissionId: id });
                    const original = props.ids.find((value) => (retries[value] ?? value) === id);
                    if (original) setRetries((previous) => ({ ...previous, [original]: fresh }));
                    if (props.onRetry) props.onRetry(fresh);
                    else changed.current();
                  }}
                >
                  {t('publicAuto.retry')}
                </Button>
                <Button onClick={() => refresh.current()}>{t('publicAuto.refresh')}</Button>
              </Space>
              <RunResults detail={details[id]} />
            </Space>
          ),
        }))}
      />
    </>
  );
}
