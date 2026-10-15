import { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { Button, message, Modal, Space, Table, Tag, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import mApi from 'Utils/API/m-api';
import cApi from 'Utils/API/c-api';
import { FileDownloadRequest } from '../../../Type/api';

interface DownloadTestCaseProps {
  t: (key: string) => string;
  problemCode?: string;
  problemId?: string | number;
}

type CheckpointFile = {
  checkpointId: string | number;
  inputFileId?: string | number | null;
  outputFileId?: string | number | null;
};

type PublicCheckpoint = {
  checkpointId: string | number;
  status: number;
  checkpoint: CheckpointFile;
};

type CheckpointRow = {
  key: string;
  scope: 'private' | 'public';
  caseIndex: number;
  inputFileId: string | number;
  outputFileId: string | number;
};

/** Number in the dataset, independent of any submission or judge result. */
export const buildCheckpointRows = (
  formal: CheckpointFile[],
  publicCases: PublicCheckpoint[],
): CheckpointRow[] => {
  const rows = (cases: CheckpointFile[], scope: CheckpointRow['scope']): CheckpointRow[] =>
    cases.flatMap((item, index) =>
      item.inputFileId != null && item.outputFileId != null
        ? [
            {
              key: `${scope}-${item.checkpointId}`,
              scope,
              caseIndex: index + 1,
              inputFileId: item.inputFileId,
              outputFileId: item.outputFileId,
            },
          ]
        : [],
    );
  return [
    ...rows(formal, 'private'),
    ...rows(
      publicCases.filter((item) => item.status === 1).map((item) => item.checkpoint),
      'public',
    ),
  ];
};

export const buildCaseFileNames = (
  targets: Array<{ scope: string; caseIndex?: number; caseID?: string }>,
): string[] => {
  const numOf = (row: { caseIndex?: number; caseID?: string }) =>
    String(row.caseIndex ?? row.caseID ?? 'case');
  const counts = new Map<string, number>();
  for (const row of targets) {
    const num = numOf(row);
    counts.set(num, (counts.get(num) ?? 0) + 1);
  }
  return targets.map((row) => {
    const num = numOf(row);
    return (counts.get(num) ?? 0) > 1 ? `${row.scope}-${num}` : num;
  });
};

export const buildZipFileRequests = (targets: CheckpointRow[]): FileDownloadRequest[] => {
  const names = buildCaseFileNames(targets);
  return targets.flatMap((target, index) => [
    { id: target.inputFileId, downloadFilename: `${names[index]}.in` },
    { id: target.outputFileId, downloadFilename: `${names[index]}.out` },
  ]);
};

export const DownloadTestCaseInner = (props: DownloadTestCaseProps) => {
  const { problemCode, problemId } = props;
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<{
    problemCode: string;
    problemId?: string | number;
    rows: CheckpointRow[];
  }>();

  useEffect(() => {
    let active = true;
    setData(undefined);
    setSelectedKeys([]);
    setOpen(false);
    if (problemCode) {
      // The management API gates access to formal data before listing files.
      void mApi
        .getCheckpointList(problemCode)
        .then(async (formal) => {
          if (!Array.isArray(formal)) throw new Error('Invalid checkpoint list');
          const publicCases =
            problemId == null
              ? []
              : ((await cApi.getPublicCheckpoints({
                  problemId: Number(problemId),
                })) as PublicCheckpoint[]);
          if (active)
            setData({ problemCode, problemId, rows: buildCheckpointRows(formal, publicCases) });
        })
        .catch(() => {
          if (active) setData(undefined);
        });
    }
    return () => {
      active = false;
    };
  }, [problemCode, problemId]);

  const rows =
    data?.problemCode === props.problemCode && data?.problemId === props.problemId
      ? (data?.rows ?? [])
      : [];

  const downloadByRowKeys = async (rowKeys: React.Key[]) => {
    const targets = rows.filter((row) => rowKeys.includes(row.key));
    if (!targets.length) return;
    setDownloading(true);
    try {
      await mApi.zipDownload(buildZipFileRequests(targets), `${props.problemCode}-testcases.zip`);
    } catch {
      message.error(props.t('DownloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  if (!rows.length) return null;

  return (
    <>
      <Button icon={<DownloadOutlined aria-hidden />} onClick={() => setOpen(true)}>
        {props.t('downloadData')}
      </Button>
      <Modal
        title={props.t('downloadData')}
        open={open}
        onCancel={() => setOpen(false)}
        width={560}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>{props.t('Cancel')}</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined aria-hidden />}
              loading={downloading}
              disabled={!selectedKeys.length || downloading}
              onClick={() => void downloadByRowKeys(selectedKeys)}
            >
              {props.t('BatchDownload')}
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="key"
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
          columns={[
            { title: props.t('index'), dataIndex: 'caseIndex' },
            {
              title: props.t('scope'),
              dataIndex: 'scope',
              render: (scope: string) => <Tag>{props.t(`checkpointDownload.${scope}`)}</Tag>,
            },
            {
              title: props.t('Download'),
              key: 'download',
              width: 80,
              render: (_: unknown, row: CheckpointRow) => (
                <Tooltip title={props.t('clickToDownload')}>
                  <Button
                    aria-label={`${props.t('Download')} ${props.t(`checkpointDownload.${row.scope}`)} ${row.caseIndex}`}
                    type="link"
                    size="small"
                    icon={<DownloadOutlined aria-hidden />}
                    disabled={downloading}
                    onClick={() => void downloadByRowKeys([row.key])}
                  />
                </Tooltip>
              ),
            },
          ]}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: props.t('NoData') }}
        />
      </Modal>
    </>
  );
};

export default withTranslation()(DownloadTestCaseInner);
