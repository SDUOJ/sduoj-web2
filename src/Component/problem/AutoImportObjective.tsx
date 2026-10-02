import React, { useState } from 'react';
import { Button, message, Modal, Space, Table } from 'antd';
import { InboxOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import Dragger from 'antd/lib/upload/Dragger';
import mApi from '../../Utils/API/m-api';
import cApi from '../../Utils/API/c-api';
import deepClone from 'Utils/deepClone';
import { withTranslation } from 'react-i18next';
import { matrixToRecords, parseXlsxMatrices, SpreadsheetCell } from '../../Utils/spreadsheetXlsx';

const OBJECTIVE_HEADERS = new Set([
  'problemTitle',
  'isMulti',
  'content',
  'answer',
  'managerGroups',
  ...Array.from({ length: 26 }, (_, index) => `choice-${String.fromCharCode(65 + index)}`),
]);

type ObjectiveImportRecord = Record<string, SpreadsheetCell | undefined>;

type ObjectivePreviewRecord = {
  problemTitle: string;
  isMulti: string;
  description: string;
  answer: SpreadsheetCell;
  managerGroups: SpreadsheetCell | string[];
};

type ObjectiveSubmitRecord = {
  isPublic: 1;
  problemTitle: string;
  isMulti: SpreadsheetCell;
  description: { content: string; choice: Record<string, string> };
  answer: string[];
  managerGroups: SpreadsheetCell | string[];
};

export function convertObjectiveRecords(
  data: ObjectiveImportRecord[],
  translate: (key: string) => string = (key) => key,
) {
  const submitProData: ObjectiveSubmitRecord[] = [];
  const proData: ObjectivePreviewRecord[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i] || {};
    const choice: Record<string, string> = {};
    const choiceLines: string[] = [];
    for (let j = 0; j < 26; j++) {
      const label = String.fromCharCode('A'.charCodeAt(0) + j);
      const raw = row[`choice-${label}`];
      if (raw === undefined || raw === null || String(raw).trim() === '') break;
      const value = String(raw);
      choice[label] = value;
      choiceLines.push(`${label}. ${value}`);
    }
    const rawAnswer = row.answer == null ? '' : String(row.answer).replaceAll(' ', '');
    const answer = rawAnswer ? rawAnswer.split(',').filter((value) => value.length > 0) : [];
    const problemTitle = row.problemTitle == null ? '' : String(row.problemTitle);
    const content = row.content == null ? '' : String(row.content);
    const managerGroups: SpreadsheetCell | string[] =
      row.managerGroups == null ? [] : row.managerGroups;
    submitProData.push({
      isPublic: 1,
      problemTitle,
      isMulti: row.isMulti ?? 0,
      description: { content, choice },
      answer,
      managerGroups,
    });
    proData.push({
      problemTitle,
      isMulti:
        row.isMulti === 0 || row.isMulti === '0'
          ? translate('SingleChoice')
          : translate('MultipleChoice'),
      description: content + (choiceLines.length ? `\n${choiceLines.join('\n')}` : ''),
      answer: row.answer ?? '',
      managerGroups,
    });
  }
  return { proData, submitProData };
}

const AutoImportObjective = (props: any) => {
  const [modalVis, setModalVis] = useState<boolean>(false);
  const [proData, setProData] = useState<ObjectivePreviewRecord[]>([]);
  const [submitProData, setSubmitProData] = useState<ObjectiveSubmitRecord[]>([]);
  const [canSubmitAll, setCanSubmitAll] = useState<boolean>(true);
  // 0 init   1 wait   2 finish
  const [uploadState, setUploadState] = useState<number[]>([]);

  const onImportExcel = async (file: File) => {
    try {
      const { default: readWorkbook } = await import('read-excel-file/browser');
      const sheets = await parseXlsxMatrices(readWorkbook, await file.arrayBuffer());
      const data = sheets.flatMap(
        ({ data }) =>
          matrixToRecords(data, OBJECTIVE_HEADERS, [
            'problemTitle',
            'isMulti',
            'content',
            'answer',
            'choice-A',
          ]) as ObjectiveImportRecord[],
      );
      message.success(props.t('UploadSuccess'));
      const converted = convertObjectiveRecords(data, props.t);
      setProData(converted.proData);
      setSubmitProData(converted.submitProData);
      setUploadState(converted.submitProData.map(() => 0));
    } catch (e) {
      message.error(props.t('FileTypeIncorrect'));
    }
    return false;
  };

  const close = () => {
    setModalVis(false);
    setProData([]);
    setSubmitProData([]);
    setUploadState([]);
  };
  return (
    <>
      <Button
        type={'default'}
        onClick={() => {
          setModalVis(true);
        }}
      >
        <PlusOutlined /> {props.t('BatchImport')}
      </Button>
      <Modal
        title={props.t('BatchImportProblems')}
        maskClosable={false}
        open={modalVis}
        onCancel={close}
        width={1600}
        footer={
          <Space>
            <Button type={'default'} onClick={close}>
              {' '}
              {props.t('Cancel')}{' '}
            </Button>
            <Button
              type={'primary'}
              onClick={() => {
                if (submitProData.length === 0) {
                  message.error(props.t('ProblemInfoNotLoaded'));
                  return;
                }
                for (let i = 0; i < uploadState.length; i++)
                  if (uploadState[i] === 0) uploadState[i] = 1;
                setUploadState(deepClone(uploadState));
                setCanSubmitAll(false);

                const waitTime = (time: number = 100) => {
                  return new Promise((resolve) => {
                    setTimeout(() => {
                      resolve(true);
                    }, time);
                  });
                };

                const run = async () => {
                  for (let idx = 0; idx < submitProData.length; idx++) {
                    if (uploadState[idx] === 2) continue;
                    const payload = submitProData[idx];
                    try {
                      await mApi.createChoiceProblem(payload);
                      uploadState[idx] = 2;
                    } catch (e) {
                      uploadState[idx] = 0;
                    }
                    setUploadState(deepClone(uploadState));
                    await waitTime(200);
                  }
                  setCanSubmitAll(true);
                };
                run();
              }}
              disabled={!canSubmitAll}
            >
              {props.t('SubmitAll')}
            </Button>
          </Space>
        }
      >
        <Dragger
          multiple={false}
          accept={'.xlsx'}
          action=""
          listType="text"
          beforeUpload={onImportExcel}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{props.t('UploadDragAreaText')}</p>
          <p className="ant-upload-hint">{props.t('UploadExcelHint')}</p>
        </Dragger>
        <div style={{ textAlign: 'right', marginTop: '10px', marginBottom: '20px' }}>
          <a
            href={
              cApi.getFileDownloadUrl('262337552520937533', 'AutoImportObjective.xlsx')
            }
          >
            {props.t('ExampleFileDownload')}
          </a>
        </div>
        <Table
          size={'small'}
          pagination={{
            pageSize: 5,
          }}
          columns={[
            {
              title: props.t('problemName'),
              dataIndex: 'problemTitle',
              key: 'problemTitle',
            },
            {
              title: props.t('ProblemType'),
              dataIndex: 'isMulti',
              key: 'isMulti',
            },
            {
              title: props.t('ProblemContentLabel'),
              dataIndex: 'description',
              key: 'description',
              render: (text) => {
                return <pre>{text}</pre>;
              },
            },
            {
              title: props.t('answer'),
              dataIndex: 'answer',
              key: 'answer',
            },
            {
              title: props.t('ManagerGroupIds'),
              dataIndex: 'managerGroups',
              key: 'managerGroups',
            },
            {
              title: props.t('Upload'),
              key: 'isUpload',
              render: (text, record, index) => {
                if (uploadState[index] === 0)
                  return (
                    <Button
                      type={'link'}
                      onClick={() => {
                        uploadState[index] = 1;
                        setUploadState(deepClone(uploadState));
                        mApi
                          .createChoiceProblem(submitProData[index])
                          .then((resData) => {
                            message.success(props.t('SubmitSuccess'));
                            uploadState[index] = 2;
                            setUploadState(deepClone(uploadState));
                          })
                          .catch(() => {
                            message.success(props.t('SubmitFailed'));
                            uploadState[index] = 0;
                            setUploadState(deepClone(uploadState));
                          });
                      }}
                    >
                      {props.t('Submit')}
                    </Button>
                  );
                if (uploadState[index] === 1)
                  return (
                    <>
                      <SyncOutlined spin /> {props.t('Submitting')}{' '}
                    </>
                  );
                if (uploadState[index] === 2)
                  return <span style={{ color: 'green' }}> {props.t('Created')} </span>;
              },
            },
          ]}
          dataSource={proData}
        />
      </Modal>
    </>
  );
};

export default withTranslation()(AutoImportObjective);
