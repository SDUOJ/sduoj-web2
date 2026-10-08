import { useEffect, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { Button, message, Modal, Space, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import mApi from 'Utils/API/m-api';
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
};

const toRows = (cases: TestCaseProp[] | undefined, scope: string): CheckpointRow[] =>
  (cases ?? []).map((item, index) => ({
    key: `${scope}-${item.caseID ?? item.caseIndex ?? index}`,
    scope,
    caseIndex: item.caseIndex,
    caseID: item.caseID === undefined ? undefined : String(item.caseID),
    result: StateList[item.caseType] ?? String(item.caseType),
    score: item.caseScore,
    time: item.caseTime,
    memory: item.caseMemory,
  }));

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

  const checkpointById = useMemo(() => {
    const map = new Map<string, ManageCheckpoint>();
    for (const item of manageCheckpoints ?? []) {
      map.set(String(item.checkpointId), item);
    }
    return map;
  }, [manageCheckpoints]);

  const downloadByCaseIds = async (caseIds: string[]) => {
    const targets = rows.filter((row) => row.caseID && caseIds.includes(row.caseID));
    if (targets.length === 0) {
      message.warning(props.t('Download'));
      return;
    }
    setDownloading(true);
    try {
      const files = await Promise.all(
        targets.map(async (row) => {
          const managed = checkpointById.get(row.caseID!);
          let inputFileId = managed?.inputFileId;
          let outputFileId = managed?.outputFileId;
          let inputFilename = managed?.inputFilename;
          let outputFilename = managed?.outputFilename;
          if (inputFileId == null || outputFileId == null) {
            const checkpoint = (await mApi.getCheckpointPreview(row.caseID!)) as {
              inputFileId: string;
              outputFileId: string;
              inputFilename?: string;
              outputFilename?: string;
            };
            inputFileId = checkpoint.inputFileId;
            outputFileId = checkpoint.outputFileId;
            inputFilename = checkpoint.inputFilename;
            outputFilename = checkpoint.outputFilename;
          }
          return [
            {
              id: inputFileId,
              downloadFilename:
                inputFilename ?? `${row.scope}-${row.caseIndex ?? row.caseID}.in`,
            },
            {
              id: outputFileId,
              downloadFilename:
                outputFilename ?? `${row.scope}-${row.caseIndex ?? row.caseID}.out`,
            },
          ];
        }),
      );
      await mApi.zipDownload(files.flat());
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
                onClick={() => downloadByCaseIds([firstError.caseID!])}
              >
                {props.t('DownloadFirstRejectCase')}
              </Button>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloading}
              disabled={selectedKeys.length === 0}
              onClick={() => {
                const ids = rows
                  .filter((row) => selectedKeys.includes(row.key) && row.caseID)
                  .map((row) => row.caseID!);
                void downloadByCaseIds(ids);
              }}
            >
              {props.t('BatchDownload')}
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
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
