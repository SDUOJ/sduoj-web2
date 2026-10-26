import { useEffect, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { Button, message, Modal, Space, Table, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import mApi from 'Utils/API/m-api';
import { FileDownloadRequest } from '../../../Type/api';
import { TestCaseProp } from '../TestCase';
import { StateList } from '../../../Type/ISubmission';

interface DownloadTestCaseProps {
  t: (key: string) => string;
  TestCaseStateList?: TestCaseProp[];
  PublicTestCaseStateList?: TestCaseProp[];
  problemCode?: string;
}

type CheckpointRow = {
  key: string;
  scope: string;
  caseIndex?: number;
  caseID?: string;
  result: string;
  score?: number;
  time?: number;
  memory?: number;
};

type ManageCheckpoint = {
  checkpointId: string | number;
  inputFileId?: string | number | null;
  outputFileId?: string | number | null;
  inputFilename?: string | null;
  outputFilename?: string | null;
  caseIndex?: number | null;
};

type ResolvedTarget = CheckpointRow & {
  inputFileId: string | number;
  outputFileId: string | number;
};

const toRows = (cases: TestCaseProp[] | undefined, scope: string): CheckpointRow[] =>
  (cases ?? []).map((item, index) => ({
    key: `${scope}-${item.caseID ?? item.caseIndex ?? index}`,
    scope,
    caseIndex: item.caseIndex,
    caseID: item.caseID === undefined || item.caseID === null ? undefined : String(item.caseID),
    result: StateList[item.caseType] ?? String(item.caseType),
    score: item.caseScore,
    time: item.caseTime,
    memory: item.caseMemory,
  }));

/** zip 内文件名：优先使用 test case 编号（1.in / 1.out），重名时加 scope 前缀。 */
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

/**
 * 将提交里的测试点映射到 manage/checkpoint/list 的文件 id。
 * 仅使用一次列表接口，避免逐条 /checkpoint/query 触发网关限流。
 */
export const resolveManagedTargets = (
  rows: CheckpointRow[],
  manageCheckpoints: ManageCheckpoint[],
): ResolvedTarget[] => {
  const usable = manageCheckpoints.filter(
    (item) => item.inputFileId != null && item.outputFileId != null,
  );
  const used = new Set<string>();
  const resolved: ResolvedTarget[] = [];
  const claim = (row: CheckpointRow, managed: ManageCheckpoint) => {
    used.add(String(managed.checkpointId));
    resolved.push({
      ...row,
      inputFileId: managed.inputFileId!,
      outputFileId: managed.outputFileId!,
    });
  };

  for (const row of rows) {
    if (!row.caseID) continue;
    const managed = usable.find(
      (item) =>
        !used.has(String(item.checkpointId)) && String(item.checkpointId) === String(row.caseID),
    );
    if (managed) claim(row, managed);
  }

  // 公开样例点：用 caseIndex 对齐（后端 manage 列表为 0 基，提交侧为 1 基）
  for (const row of rows) {
    if (resolved.some((item) => item.key === row.key) || row.caseIndex == null) continue;
    const rowIndex: number = row.caseIndex;
    const managed = usable.find(
      (item) =>
        !used.has(String(item.checkpointId)) &&
        (item.caseIndex === rowIndex || item.caseIndex === rowIndex - 1),
    );
    if (managed) claim(row, managed);
  }

  // 私有点：按顺序对齐 caseIndex 为空的 manage 记录
  const privateManage = usable.filter(
    (item) =>
      !used.has(String(item.checkpointId)) &&
      (item.caseIndex == null || item.caseIndex === undefined),
  );
  let cursor = 0;
  for (const row of rows) {
    if (resolved.some((item) => item.key === row.key) || row.scope !== 'private') continue;
    if (cursor >= privateManage.length) break;
    claim(row, privateManage[cursor++]);
  }

  return resolved;
};

export const buildZipFileRequests = (targets: ResolvedTarget[]): FileDownloadRequest[] => {
  const names = buildCaseFileNames(targets);
  const files: FileDownloadRequest[] = [];
  targets.forEach((target, index) => {
    const base = names[index];
    files.push({ id: target.inputFileId, downloadFilename: `${base}.in` });
    files.push({ id: target.outputFileId, downloadFilename: `${base}.out` });
  });
  return files;
};

const DownloadTestCase = (props: DownloadTestCaseProps) => {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [manageCheckpoints, setManageCheckpoints] = useState<ManageCheckpoint[] | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const rows = useMemo(
    () => [
      ...toRows(props.TestCaseStateList, 'private'),
      ...toRows(props.PublicTestCaseStateList, 'public'),
    ],
    [props.TestCaseStateList, props.PublicTestCaseStateList],
  );

  // Gate the button on the manage checkpoint API: only problem managers/admins
  // with download rights get a non-null list; anything else stays hidden.
  useEffect(() => {
    let active = true;
    const problemCode = props.problemCode;
    if (!problemCode) {
      setManageCheckpoints(null);
      setPermissionDenied(true);
      return () => {
        active = false;
      };
    }
    setManageCheckpoints(null);
    setPermissionDenied(false);
    Promise.resolve(mApi.getCheckpointList(problemCode))
      .then((res: any) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : [];
        setManageCheckpoints(list);
        if (list.length === 0) setPermissionDenied(true);
      })
      .catch(() => {
        if (!active) return;
        setManageCheckpoints(null);
        setPermissionDenied(true);
      });
    return () => {
      active = false;
    };
  }, [props.problemCode]);

  const downloadByRowKeys = async (rowKeys: React.Key[]) => {
    const targets = rows.filter((row) => rowKeys.includes(row.key));
    if (targets.length === 0) {
      message.warning(props.t('noItemSelected'));
      return;
    }
    const resolved = resolveManagedTargets(targets, manageCheckpoints ?? []);
    if (resolved.length === 0) {
      message.error(props.t('DownloadFailed'));
      return;
    }
    if (resolved.length < targets.length) {
      message.warning(props.t('noItemSelected'));
    }
    setDownloading(true);
    try {
      const files = buildZipFileRequests(resolved);
      const zipName = props.problemCode ? `${props.problemCode}-testcases.zip` : 'testcases.zip';
      await mApi.zipDownload(files, zipName);
    } catch (error) {
      message.error(props.t('DownloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const firstError = rows.find((row) => row.result !== 'Accepted' && row.caseID);

  // Hide entirely when the current user cannot download this problem's data.
  if (permissionDenied || manageCheckpoints === null) {
    return null;
  }

  return (
    <>
      <Button icon={<DownloadOutlined />} onClick={() => setOpen(true)}>
        {props.t('downloadData')}
      </Button>
      <Modal
        title={props.t('downloadData')}
        open={open}
        onCancel={() => setOpen(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>{props.t('Cancel')}</Button>
            {firstError && (
              <Button
                danger
                loading={downloading}
                onClick={() => downloadByRowKeys([firstError.key])}
              >
                {props.t('DownloadFirstRejectCase')}
              </Button>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloading}
              disabled={selectedKeys.length === 0}
              onClick={() => downloadByRowKeys(selectedKeys)}
            >
              {props.t('BatchDownload')}
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="key"
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
          }}
          columns={[
            {
              title: props.t('Checkpoint'),
              dataIndex: 'caseID',
              render: (value?: string) => value ?? '-',
            },
            { title: props.t('index'), dataIndex: 'caseIndex' },
            {
              title: props.t('scope'),
              dataIndex: 'scope',
            },
            {
              title: props.t('JudgeResult'),
              dataIndex: 'result',
            },
            {
              title: props.t('Score'),
              dataIndex: 'score',
            },
            {
              title: props.t('Time'),
              dataIndex: 'time',
            },
            {
              title: props.t('Memory'),
              dataIndex: 'memory',
            },
            {
              title: props.t('Download'),
              key: 'download',
              width: 80,
              render: (_: unknown, row: CheckpointRow) => (
                <Tooltip title={props.t('clickToDownload')}>
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={() => downloadByRowKeys([row.key])}
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

export const DownloadTestCaseInner = DownloadTestCase;
export default withTranslation()(DownloadTestCase);
