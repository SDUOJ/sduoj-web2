import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Table, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { fileUpload } from '../../Utils/fileUpload';
import mApi from '../../Utils/API/m-api';
import { PublicAutoFill } from '../../Type/publicAuto';
import MetaTaskProgress from './From/Item/MetaTaskProgress';

function FillContent(props: { problemCode: string; onAdded?: () => void }) {
  const { t } = useTranslation();
  const storageKey = `publicAuto:task:${props.problemCode}`;
  const [selected, setSelected] = useState<File[]>([]);
  const [preview, setPreview] = useState<PublicAutoFill>();
  const [report, setReport] = useState<PublicAutoFill>();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState<{ id: string; action: 'validate' | 'generate' } | undefined>(
    () => {
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
        return value &&
          /^[0-9a-f]{1,16}$/.test(value.id) &&
          ['validate', 'generate'].includes(value.action)
          ? value
          : undefined;
      } catch {
        return undefined;
      }
    },
  );
  const [running, setRunning] = useState(Boolean(task));
  const generation = useRef(0);
  const abort = useRef(new AbortController());
  useEffect(
    () => () => {
      generation.current++;
      abort.current.abort();
    },
    [],
  );
  useEffect(() => {
    try {
      if (task) localStorage.setItem(storageKey, JSON.stringify(task));
      else localStorage.removeItem(storageKey);
    } catch {
      /* Task resume is optional. */
    }
  }, [task, storageKey]);
  const perform = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    if (!task) return;
    const current = generation.current;
    await perform(async () => {
      const detail = await mApi.publicAutoTask({ submissionId: task.id });
      if (current !== generation.current) return;
      if (detail.judgeResult === 0 || detail.judgeResult === -2) return;
      setRunning(false);
      if (detail.judgeResult === 99) {
        setTask(undefined);
        return;
      }
      if (task.action === 'generate' && detail.judgeResult !== 99) {
        const result = await mApi.finishPublicAutoTask(task.id);
        if (current !== generation.current) return;
        setReport(result);
        props.onAdded?.();
      }
    });
  };
  const start = async (action: 'validate' | 'generate') => {
    if (!preview) return;
    const inputFileIds = preview.items
      .filter((item) => action === 'validate' || item.status === 'NEW')
      .map((item) => item.inputFileId);
    if (!inputFileIds.length) return;
    await perform(async () => {
      const id = await mApi.uploadPublicInputs({
        problemCode: props.problemCode,
        action,
        inputFileIds,
      });
      try {
        localStorage.setItem(storageKey, JSON.stringify({ id, action }));
      } catch {
        /* Optional. */
      }
      setReport(undefined);
      setTask({ id, action });
      setRunning(true);
    });
  };
  const result = report ?? preview;
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert type="info" message={t('publicAuto.fillHelp')} />
      {error && <Alert type="error" message={t('publicAuto.fillError')} />}
      <Input
        type="file"
        multiple
        accept=".in"
        aria-label={t('publicAuto.chooseInputs')}
        disabled={busy || running}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          generation.current++;
          setPreview(undefined);
          setReport(undefined);
          setTask(undefined);
          if (
            files.length > 20 ||
            files.some((file) => file.size > 5 * 1024 * 1024 || !file.name.endsWith('.in'))
          ) {
            setSelected([]);
            setError(true);
            return;
          }
          setSelected(files);
          setError(false);
        }}
      />
      <Button
        disabled={!selected.length || running}
        loading={busy}
        onClick={() => {
          const current = generation.current;
          void perform(async () => {
            const ids: string[] = [];
            for (const file of selected) {
              const uploaded = await fileUpload([file], undefined, {
                signal: abort.current.signal,
              });
              if (current !== generation.current) return;
              ids.push(String(uploaded[0].id));
            }
            const result = await mApi.previewPublicInputs({
              problemCode: props.problemCode,
              inputFileIds: ids,
            });
            if (current === generation.current) setPreview(result);
          });
        }}
      >
        {t('publicAuto.previewInputs')}
      </Button>
      {result && (
        <Typography.Text>
          {t('publicAuto.capacity', { used: result.usedCount, max: result.maxCount })}
        </Typography.Text>
      )}
      {preview && (!preview.eligible || !preview.autoAddEnabled) && (
        <Alert type="warning" message={t('publicAuto.enableFirst')} />
      )}
      <Space wrap>
        <Button disabled={!preview || busy || running} onClick={() => void start('validate')}>
          {t('publicAuto.validateInputs')}
        </Button>
        <Button
          type="primary"
          disabled={
            !preview?.eligible ||
            !preview.autoAddEnabled ||
            busy ||
            running ||
            !preview.items.some((item) => item.status === 'NEW')
          }
          onClick={() => void start('generate')}
        >
          {t('publicAuto.generateAndAdd')}
        </Button>
        {task?.action === 'generate' && (
          <Button disabled={busy || running} onClick={() => void finish()}>
            {t('publicAuto.retryImport')}
          </Button>
        )}
      </Space>
      {task && (
        <MetaTaskProgress
          key={task.id}
          ids={[task.id]}
          onChange={() => void finish()}
          onRetry={(id) => {
            generation.current++;
            setTask({ ...task, id });
            setReport(undefined);
            setRunning(true);
          }}
        />
      )}
      {report && (
        <Alert
          type={report.items.some((item) => item.status === 'FAILED') ? 'warning' : 'success'}
          message={t('publicAuto.fillSummary', { added: report.added, skipped: report.skipped })}
        />
      )}
      {result && (
        <Table
          size="small"
          rowKey="index"
          pagination={false}
          dataSource={result.items}
          columns={[
            {
              title: t('publicAuto.inputFile'),
              render: (_, item) => {
                const uploaded = preview?.items.find(
                  (value) => value.inputFileId === item.inputFileId,
                );
                return selected[uploaded?.index ?? item.index]?.name ?? item.inputFileId;
              },
            },
            { title: t('InputPreview'), dataIndex: 'inputPreview' },
            { title: t('status'), render: (_, item) => t(`publicAuto.fillStatus.${item.status}`) },
            { title: t('ID'), dataIndex: 'checkpointId' },
            {
              title: t('operator'),
              render: (_, item) =>
                item.outputFileId && (
                  <Button
                    onClick={() => {
                      void mApi.zipDownload(
                        [
                          { id: item.inputFileId, downloadFilename: `${item.index}.in` },
                          { id: item.outputFileId!, downloadFilename: `${item.index}.out` },
                        ],
                        `${props.problemCode}-${item.index}.zip`,
                      );
                    }}
                  >
                    {t('publicAuto.downloadPair')}
                  </Button>
                ),
            },
            { title: t('publicAuto.failure'), dataIndex: 'message' },
          ]}
        />
      )}
    </Space>
  );
}

export default function PublicAutoFillPanel(props: { problemCode: string; onAdded?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="link" size="small" onClick={() => setOpen(true)}>
        {t('publicAuto.fillTitle')}
      </Button>
      <Modal
        open={open}
        title={`${props.problemCode} · ${t('publicAuto.fillTitle')}`}
        width={1000}
        footer={null}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        {open && <FillContent {...props} />}
      </Modal>
    </>
  );
}
