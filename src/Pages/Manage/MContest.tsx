import React from 'react';
import { LockOutlined } from '@ant-design/icons';
import { Card, Space, Tag } from 'antd';
import MApi from '../../Utils/API/m-api';
import mApi from '../../Utils/API/m-api';
import { useTranslation } from 'react-i18next';
import TableWithPagination from '../../Component/common/Table/TableWithPagination';
import { TimeDiff, unix2Time } from '../../Utils/Time';
import { isValueEmpty } from '../../Utils/empty';
import ModalFormUseForm from '../../Component/common/Form/ModalFormUseForm';
import ContestMFormBase from '../../Component/contest/Form/ContestMFormBase';
import ContestMFormManagement from '../../Component/contest/Form/ContestMFormManagement';
import ContestMFormProblem from '../../Component/contest/Form/ContestMFormProblem';

const MContest = () => {
  const { t } = useTranslation();

  const ProblemSubForm = [
    { component: <ContestMFormBase />, label: t('BasicInformation') },
    { component: <ContestMFormManagement />, label: t('Management') },
    { component: <ContestMFormProblem />, label: t('Problem') },
  ];

  const getValue = (v: any[]) => {
    if (v === undefined) return '';
    let str = '';
    for (let x of v) {
      if (str.length !== 0) str += ',';
      str += x;
    }
    return str;
  };

  const splitV = (str: any[], c: string) => {
    if (str === undefined) return [];
    let res: any = [];
    for (let x of str) {
      for (let y of x.split(c)) res.push(y);
    }
    return res;
  };

  const dataLoader = async (contestId: any) => {
    return mApi.getContest({ contestId: contestId }).then((res: any) => {
      let cnt = 0;
      const problems = Array.isArray(res?.problems) ? res.problems : [];
      for (let x of problems) {
        x.id = ++cnt;
      }
      res.participants = getValue(res.participants ?? '');
      res.unofficialParticipants = getValue(res.unofficialParticipants ?? '');
      return Promise.resolve(res);
    });
  };

  const beforeSubmit = (value: any) => {
    const work = (v: string) => {
      return splitV(splitV(splitV(v.split('\t'), '\n'), ','), ' ').filter(
        (v0: string) => !isValueEmpty(v0),
      );
    };
    value.participants = work(value.participants ?? '');
    value.unofficialParticipants = work(value.unofficialParticipants ?? '');
    return value;
  };

  const colData: any[] = [
    {
      title: 'ID',
      dataIndex: 'contestId',
      width: 50,
      responsive: ['lg', 'sm', 'xs'],
    },
    {
      title: t('title'),
      dataIndex: 'contestTitle',
      width: 'auto',
      responsive: ['lg', 'sm', 'xs'],
      render: (text: any, row: any) => {
        return (
          <Space size={8}>
            {text}
            {row.features.openness === 'private' && <LockOutlined style={{ color: 'red' }} />}
            {row.features.openness === 'protected' && <LockOutlined style={{ color: 'orange' }} />}
            {row.isPublic === 0 && <Tag color={'red'}>{t('private')}</Tag>}
          </Space>
        );
      },
    },
    {
      title: t('StartTime'),
      dataIndex: 'gmtStart',
      width: 'auto',
      responsive: ['lg', 'sm'],
      render: (text: string) => {
        return unix2Time(parseInt(text));
      },
    },
    {
      title: t('Duration'),
      width: 'auto',
      responsive: ['lg', 'sm'],
      render: (text: string, rows: any) => {
        return TimeDiff(rows.gmtStart, rows.gmtEnd);
      },
    },
    {
      title: t('Mode'),
      width: 'auto',
      responsive: ['lg', 'sm'],
      render: (text: string, row: any) => {
        return <span>{row.features.mode}</span>;
      },
    },
    {
      title: t('Participants'),
      dataIndex: 'participantNum',
      width: 'auto',
      responsive: ['lg', 'sm'],
    },
    {
      title: t('ManageGroup'),
      dataIndex: 'groupId',
      width: 'auto',
      responsive: ['lg'],
      render: (text: string, row: any) => {
        if (isValueEmpty(row.managerGroupDTO)) return <></>;
        else
          return (
            <span>
              {row.managerGroupDTO.groupId} ({row.managerGroupDTO.title})
            </span>
          );
      },
    },
    {
      title: t('Owner'),
      dataIndex: 'username',
      width: 'auto',
      responsive: ['lg'],
    },
    {
      title: t('operator'),
      width: '150px',
      render: (text: any, rows: any) => {
        return (
          <Space size={3}>
            <ModalFormUseForm
              TableName={'ContestList'}
              width={1200}
              title={t('EditWithName', { name: rows.contestTitle })}
              type={'update'}
              subForm={ProblemSubForm}
              formName={'ContestForm'}
              updateAppendProps={{ contestId: rows.contestId }}
              dataLoader={async () => dataLoader(rows.contestId)}
              dataSubmitter={(value: any) => {
                return mApi.updateContest(beforeSubmit(value));
              }}
            />
            <ModalFormUseForm
              TableName={'ContestList'}
              width={1200}
              title={t('CreateContestFrom', { name: rows.contestTitle })}
              type={'fork'}
              editorDocumentIdentity={`contest:fork:${rows.contestId}`}
              subForm={ProblemSubForm}
              formName={'ContestForm'}
              dataLoader={async () => dataLoader(rows.contestId)}
              dataSubmitter={(value: any) => {
                return mApi.createContest(beforeSubmit(value));
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: -20, overflow: 'hidden' }}>
      <Card
        size={'small'}
        bordered={true}
        title={t('contestList')}
        extra={
          <>
            <ModalFormUseForm
              TableName={'ContestList'}
              width={1200}
              title={t('CreateContest')}
              type={'create'}
              subForm={ProblemSubForm}
              formName={'ContestForm'}
              dataSubmitter={(value: any) => {
                return mApi.createContest(beforeSubmit(value));
              }}
            />
          </>
        }
      >
        <TableWithPagination name={'ContestList'} columns={colData} API={MApi.getContestList} size={'small'} />
      </Card>
    </div>
  );
};

export default MContest;
