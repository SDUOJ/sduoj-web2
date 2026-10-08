import { useState } from 'react';
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
  const rows = [
    ...toRows(props.TestCaseStateList, 'private'),
    ...toRows(props.PublicTestCaseStateList, 'public'),
  ];

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
          const checkpoint = (await mApi.getCheckpointPreview(row.caseID!)) as {
            inputFileId: string;
            outputFileId: string;
            inputFilename?: string;
            outputFilename?: string;
          };
          return [
            {
              id: checkpoint.inputFileId,
              downloadFilename:
                checkpoint.inputFilename ?? `${row.scope}-${row.caseIndex ?? row.caseID}.in`,
            },
            {
              id: checkpoint.outputFileId,
              downloadFilename:
                checkpoint.outputFilename ?? `${row.scope}-${row.caseIndex ?? row.caseID}.out`,
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
