import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Drawer,
  Empty,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import mApi from '../../Utils/API/m-api';
import {
  GlobalSubmissionDetail,
  GlobalSubmissionQuery,
  GlobalSubmissionRow,
} from '../../Type/globalSubmissions';
import RunResults from '../../Component/answerIde/RunResults';
import OpsMetricsPanel from '../../Component/manage/OpsMetricsPanel';
import { runResultLabel } from '../../Component/answerIde/runTypes';
import type { JavaPage } from '../../Type/api';
import { unix2Time } from '../../Utils/Time';
const types = [0, 1, 2, 3, 100, 101, 102, 103, 104];
const results = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 99];
function localDate(value: number) {
  return new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export default function MSubmissionsGlobal() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<GlobalSubmissionQuery>({});
  const [applied, setApplied] = useState<GlobalSubmissionQuery>({});
  const [windowHours, setWindowHours] = useState(168);
  const [from, setFrom] = useState(localDate(Date.now() - 7 * 86400000));
  const [to, setTo] = useState(localDate(Date.now()));
  const [page, setPage] = useState({ current: 1, size: 50 });
  const [data, setData] = useState<JavaPage<GlobalSubmissionRow>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [auto, setAuto] = useState(true);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [actionBusy, setActionBusy] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [detailId, setDetailId] = useState<string>();
  const [detail, setDetail] = useState<GlobalSubmissionDetail>();
  const [detailError, setDetailError] = useState(false);
  const params = (): GlobalSubmissionQuery => ({
    ...applied,
    ...(windowHours ? { fromTs: Date.now() - windowHours * 3600000, toTs: Date.now() } : {}),
    pageNow: page.current,
    pageSize: page.size,
  });
  useEffect(() => {
    let active = true;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    const abort = new AbortController();
    const poll = async () => {
      setLoading(true);
      try {
        const query = {
          ...applied,
          ...(windowHours ? { fromTs: Date.now() - windowHours * 3600000, toTs: Date.now() } : {}),
          pageNow: page.current,
          pageSize: page.size,
        };
        const value = await mApi.globalSubmissionPage(query, abort.signal);
        if (!active) return;
        setData(value);
        setError(false);
        failures = 0;
      } catch {
        if (active) {
          setError(true);
          failures++;
        }
      } finally {
        if (active) setLoading(false);
      }
      if (active && auto) timer = setTimeout(poll, Math.min(60000, 10000 * 2 ** failures));
    };
    void poll();
    return () => {
      active = false;
      abort.abort();
      clearTimeout(timer);
    };
  }, [applied, page, windowHours, auto, revision]);
  useEffect(() => {
    let active = true;
    setDetail(undefined);
    setDetailError(false);
    if (detailId)
      void mApi
        .globalSubmissionDetail(detailId)
        .then((value) => {
          if (active) setDetail(value);
        })
        .catch(() => {
          if (active) setDetailError(true);
        });
    return () => {
      active = false;
    };
  }, [detailId, revision]);
  const checkpoints = (rows: GlobalSubmissionDetail['checkpointResults']) => (
    <Table
      rowKey="key"
      size="small"
      pagination={{ pageSize: 20 }}
      scroll={{ x: 550 }}
      dataSource={(rows ?? []).map((item, index) => ({
        key: index,
        id: String(item[0]),
        result: item[1],
        score: item[2],
        time: item[3],
        memory: item[4],
      }))}
      columns={[
        { title: t('globalSubmissions.checkpoint'), dataIndex: 'id' },
        { title: t('globalSubmissions.result'), dataIndex: 'result', render: runResultLabel },
        { title: t('score'), dataIndex: 'score' },
        { title: t('globalSubmissions.timeMs'), dataIndex: 'time' },
        { title: t('globalSubmissions.memoryKB'), dataIndex: 'memory' },
      ]}
    />
  );
  const refresh = () => setRevision((value) => value + 1);
  const changeFilters = (value: GlobalSubmissionQuery) =>
    setFilters((previous) => ({ ...previous, ...value }));
  const execute = async (action: () => Promise<unknown>) => {
    setActionBusy(true);
    try {
      await action();
    } catch {
      message.error(t('globalSubmissions.actionFailed'));
    } finally {
      setActionBusy(false);
    }
  };
  return (
    <Card title={t('globalSubmissions.title')}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <OpsMetricsPanel auto={auto} revision={revision} />
        <Space wrap>
          <Input
            aria-label={t('globalSubmissions.username')}
            placeholder={t('globalSubmissions.username')}
            value={filters.username ?? ''}
            maxLength={64}
            onChange={(e) => changeFilters({ username: e.target.value })}
            style={{ width: 160 }}
          />
          <Input
            aria-label={t('globalSubmissions.problem')}
            placeholder={t('globalSubmissions.problem')}
            value={filters.problemCode ?? ''}
            maxLength={64}
            onChange={(e) => changeFilters({ problemCode: e.target.value })}
            style={{ width: 170 }}
          />
          <Select
            aria-label={t('globalSubmissions.type')}
            allowClear
            placeholder={t('globalSubmissions.type')}
            value={filters.bizType}
            onChange={(bizType) => changeFilters({ bizType })}
            options={types.map((value) => ({
              value,
              label: t(`globalSubmissions.types.${value}`),
            }))}
            style={{ width: 180 }}
          />
          <Select
            aria-label={t('globalSubmissions.result')}
            allowClear
            placeholder={t('globalSubmissions.result')}
            value={filters.judgeResult}
            onChange={(judgeResult) => changeFilters({ judgeResult })}
            options={results.map((value) => ({ value, label: runResultLabel(value) }))}
            style={{ width: 190 }}
          />
          <Select
            aria-label={t('globalSubmissions.timeRange')}
            value={windowHours}
            onChange={(value) => {
              setWindowHours(value);
              setPage((previous) => ({ ...previous, current: 1 }));
              setSelected([]);
            }}
            options={[
              { value: 1, label: '1h' },
              { value: 24, label: '24h' },
              { value: 168, label: '7d' },
              { value: 0, label: t('globalSubmissions.custom') },
            ]}
            style={{ width: 120 }}
          />
          {windowHours === 0 && (
            <>
              <Input
                aria-label={t('globalSubmissions.from')}
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Input
                aria-label={t('globalSubmissions.to')}
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </>
          )}
          <Button
            onClick={() => {
              setApplied({
                ...filters,
                ...(windowHours === 0
                  ? { fromTs: new Date(from).getTime(), toTs: new Date(to).getTime() }
                  : {}),
              });
              setPage((previous) => ({ ...previous, current: 1 }));
              setSelected([]);
            }}
          >
            {t('globalSubmissions.apply')}
          </Button>
        </Space>
        <Space wrap>
          <Switch
            aria-label={t('globalSubmissions.autoRefresh')}
            checked={auto}
            onChange={setAuto}
          />
          <span>{t('globalSubmissions.autoRefresh')}</span>
          <Button onClick={refresh}>{t('globalSubmissions.refresh')}</Button>
          <Button
            loading={actionBusy}
            disabled={!selected.length || actionBusy}
            onClick={() =>
              void execute(async () => {
                await mApi.globalRejudge(selected);
                setSelected([]);
                refresh();
              })
            }
          >
            {t('globalSubmissions.rejudge')}
          </Button>
          <Checkbox checked={includeTasks} onChange={(e) => setIncludeTasks(e.target.checked)}>
            {t('globalSubmissions.includeTasks')}
          </Checkbox>
          <Button
            loading={actionBusy}
            disabled={actionBusy}
            onClick={() => void execute(() => mApi.globalExport({ ...params(), includeTasks }))}
          >
            {t('globalSubmissions.export')}
          </Button>
        </Space>
        <Alert type="info" message={t('globalSubmissions.bounds')} />
        {error && <Alert type="error" message={t('globalSubmissions.connectionError')} />}
        <Table<GlobalSubmissionRow>
          rowKey="submissionId"
          loading={loading}
          dataSource={data?.rows ?? []}
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description={t('globalSubmissions.empty')} /> }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(String)),
            getCheckboxProps: (row) => ({ disabled: row.bizType > 3 || row.judgeResult < 0 }),
          }}
          pagination={{
            current: page.current,
            pageSize: page.size,
            total: Number(data?.totalNum ?? 0),
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (current, size) => {
              setPage({ current, size });
              setSelected([]);
            },
          }}
          columns={[
            { title: 'ID', dataIndex: 'submissionId' },
            {
              title: t('globalSubmissions.type'),
              dataIndex: 'bizType',
              render: (value) => <Tag>{t(`globalSubmissions.types.${value}`)}</Tag>,
            },
            {
              title: t('globalSubmissions.username'),
              render: (_, row) => row.username ?? row.userId,
            },
            {
              title: t('globalSubmissions.problem'),
              render: (_, row) => row.problemCode ?? row.problemId,
            },
            {
              title: t('globalSubmissions.created'),
              dataIndex: 'gmtCreate',
              render: (value) => unix2Time(value),
            },
            {
              title: t('globalSubmissions.result'),
              dataIndex: 'judgeResult',
              render: (value, row) => (row.bizType === 104 ? '—' : runResultLabel(value)),
            },
            { title: t('score'), dataIndex: 'judgeScore' },
            { title: t('globalSubmissions.language'), dataIndex: 'judgeTemplateTitle' },
            {
              title: t('operator'),
              render: (_, row) => (
                <Button type="link" onClick={() => setDetailId(row.submissionId)}>
                  {t('globalSubmissions.details')}
                </Button>
              ),
            },
          ]}
        />
      </Space>
      <Drawer
        title={`${t('globalSubmissions.details')} · ${detailId ?? ''}`}
        open={Boolean(detailId)}
        onClose={() => setDetailId(undefined)}
        width={800}
      >
        <Button onClick={refresh}>{t('globalSubmissions.refresh')}</Button>
        {detailError && <Alert type="error" message={t('globalSubmissions.connectionError')} />}
        {detail &&
          (detail.taskType === 104 ? (
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.code}</pre>
          ) : detail.run ? (
            <RunResults detail={detail} />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag>{runResultLabel(detail.judgeResult)}</Tag>
              {detail.judgeLog && (
                <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {detail.judgeLog}
                </pre>
              )}
              {detail.code && (
                <Collapse
                  items={[
                    {
                      key: 'source',
                      label: t('globalSubmissions.source'),
                      children: (
                        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                          {detail.code}
                        </pre>
                      ),
                    },
                  ]}
                />
              )}
              <Collapse
                items={[
                  {
                    key: 'formal',
                    label: t('globalSubmissions.formalResults'),
                    children: checkpoints(detail.checkpointResults),
                  },
                  {
                    key: 'public',
                    label: t('globalSubmissions.publicResults'),
                    children: checkpoints(detail.publicCheckpointResults),
                  },
                ]}
              />
            </Space>
          ))}
      </Drawer>
    </Card>
  );
}
