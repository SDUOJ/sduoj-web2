import React from 'react';
import { Button, Card, Col, Progress, Row, Space, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import TestCase, { TestCaseProp } from '../TestCase';
import { displayType, StateList, TestCaseStates } from '../../../Type/ISubmission';
import mApi from '../../../Utils/API/m-api';

interface IJudgeResult {
  data: TestCaseProp[];
  sumScore: number;
  scoreMod: displayType;
  title: string;
  useDownload: boolean;
}

const JudgeResult = (props: IJudgeResult) => {
  const { t } = useTranslation();
  const { data } = props;

  const getInfo = () => {
    let numList = Array(StateList.length);
    let scoreAC = 0,
      ACNumber = 0,
      firstRejectId: string = '',
      firstRejectIndex: number | undefined;
    for (let i = 0; i < StateList.length; i++) numList[i] = [];
    for (let i = 0; i < data.length; i++) {
      const add: number = data[i].caseScore ?? 0;
      numList[data[i].caseType].push(data[i]);
      scoreAC += add;
      if (data[i].caseType === TestCaseStates.Accepted) {
        ACNumber++;
      } else {
        if (firstRejectId.length === 0) {
          firstRejectId = data[i].caseID ?? '';
          firstRejectIndex = data[i].caseIndex;
        }
      }
    }
    return {
      numList: numList,
      AC: scoreAC,
      SumAll: props.sumScore,
      ACNumber: ACNumber,
      CaseNumber: data.length,
      firstRejectId: firstRejectId,
      firstRejectIndex: firstRejectIndex,
    };
  };
  const info = getInfo();

  return (
    <Card
      size="small"
      title={<span style={{ fontWeight: 'bold' }}>{props.title}</span>}
      className={'card'}
      extra={
        <>
          {info.firstRejectId.length !== 0 && props.useDownload && (
            <Button
              type={'dashed'}
              size={'small'}
              danger
              onClick={() => {
                mApi.getCheckpointPreview(info.firstRejectId).then((checkpoint: any) => {
                  const base = String(info.firstRejectIndex ?? info.firstRejectId);
                  mApi.zipDownload(
                    [
                      {
                        id: checkpoint.inputFileId,
                        downloadFilename: `${base}.in`,
                      },
                      {
                        id: checkpoint.outputFileId,
                        downloadFilename: `${base}.out`,
                      },
                    ],
                    `${base}.zip`,
                  );
                });
              }}
            >
              {t('DownloadFirstRejectCase')}
            </Button>
          )}
        </>
      }
    >
      <Row>
        <Col span={18}>
          <Tabs defaultActiveKey="0" tabPosition={'left'} className={'JudgeResult-tab'}>
            {info.numList.map((value, index) => {
              if (value.length !== 0) {
                return (
                  <Tabs.TabPane
                    tab={
                      <Space>
                        <TestCase type={'tag-simple'} caseType={index} />
                        <span> x {value.length}</span>
                      </Space>
                    }
                    key={index}
                  >
                    {value.length !== 0 && (
                      <Card size={'small'} title={<TestCase type={'text'} caseType={index} />}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'left',
                            flexWrap: 'wrap',
                          }}
                        >
                          {value.map((val: any) => {
                            return (
                              <TestCase key={val.caseIndex ?? val.Index} type={'index'} {...val} />
                            );
                          })}
                        </div>
                      </Card>
                    )}
                  </Tabs.TabPane>
                );
              }
              return undefined;
            })}
          </Tabs>
        </Col>
        <Col span={6} className={'Progress-set'}>
          {props.scoreMod === 'show' && (
            <>
              <Progress
                success={{ percent: (info.AC / info.SumAll) * 100 }}
                type="dashboard"
                format={() => `${info.AC} / ${info.SumAll}`}
              />
              <span>{t('Score')}</span>
            </>
          )}
          {props.scoreMod !== 'show' && (
            <>
              <Progress
                success={{ percent: (info.ACNumber / info.CaseNumber) * 100 }}
                type="dashboard"
                format={() => `${info.ACNumber} / ${info.CaseNumber}`}
              />
              <span>{t('acceptedNumber')}</span>
            </>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default JudgeResult;
