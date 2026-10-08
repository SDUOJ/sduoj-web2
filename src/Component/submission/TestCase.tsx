import React, { useState } from 'react';
import { Popover, Tag, Tooltip } from 'antd';
import Icon, {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  SyncOutlined,
} from '@ant-design/icons';

import { ReactComponent as Memory } from 'Assert/img/memory.svg';
import { ReactComponent as RE } from 'Assert/img/bomb.svg';
import { ReactComponent as OLE } from 'Assert/img/output.svg';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';
import { displayType, StateList, TestCaseStates } from '../../Type/ISubmission';
import { ck } from '../../Utils/empty';

interface ViewType {
  type?: 'tag' | 'text' | 'tag-simple' | 'index';
}

export interface TestCaseProp {
  caseIndex?: number;
  caseType: TestCaseStates;
  caseScore?: number;
  caseTime?: number;
  caseMemory?: number;
  casePreview?: string;
  append?: string;
  textLevel?: number;
  scoreMod?: displayType;
  caseID?: string;
}

const TestCase = (props: TestCaseProp & ViewType) => {
  const { t } = useTranslation();
  const [MouseIn, setMouseIn] = useState(false);

  const NameList = StateList;
  const CaseList: { [key: string]: any } = {
    Pending: {
      icon: <ClockCircleOutlined />,
      text: 'Pending',
      textAll: t('Pending'),
      color: undefined,
    },
    Running: {
      icon: <SyncOutlined spin />,
      text: 'Running',
      textAll: t('Running'),
      color: 'blue',
    },
    Accepted: {
      icon: <CheckCircleOutlined />,
      text: 'AC',
      textAll: t('Accepted'),
      color: 'success',
      type: 'success',
      tagColor: '#3ad506',
    },
    TimeLimitExceeded: {
      icon: <FieldTimeOutlined />,
      text: 'TLE',
      textAll: t('TimeLimitExceeded'),
      color: 'orange',
      type: 'warning',
      tagColor: '#d46b08',
    },
    MemoryLimitExceeded: {
      icon: <Icon component={Memory} />,
      text: 'MLE',
      textAll: t('MemoryLimitExceeded'),
      color: 'orange',
      type: 'warning',
      tagColor: '#d46b08',
    },
    OutputLimitExceeded: {
      icon: <Icon component={OLE} />,
      text: 'OLE',
      textAll: t('OutputLimitExceeded'),
      color: 'orange',
      type: 'warning',
      tagColor: '#d46b08',
    },
    WrongAnswer: {
      icon: <CloseCircleOutlined />,
      text: 'WA',
      textAll: t('WrongAnswer'),
      color: 'error',
      type: 'danger',
      tagColor: '#ff1500',
    },
    RuntimeError: {
      icon: <Icon component={RE} />,
      text: 'RE',
      textAll: t('RuntimeError'),
      color: 'error',
      type: 'danger',
      tagColor: '#531dab',
    },
    CompilationError: {
      icon: <CloseCircleOutlined />,
      text: 'CE',
      textAll: t('compilationError'),
      color: 'error',
      type: 'warning',
      tagColor: '#c46304',
    },
    PresentationError: {
      icon: <CloseCircleOutlined />,
      text: 'PE',
      textAll: t('formatError'),
      color: 'error',
      type: 'danger',
      tagColor: '#ff1500',
    },
    SystemError: {
      icon: <CloseCircleOutlined />,
      text: 'SE',
      textAll: t('SystemError'),
      color: 'error',
      type: 'danger',
      tagColor: '#ff1500',
    },
    Queueing: {
      icon: <ClockCircleOutlined />,
      text: 'Queueing',
      textAll: t('Pending'),
      color: undefined,
    },
    Compiling: {
      icon: <SyncOutlined spin />,
      text: 'Compiling',
      textAll: t('Compiling'),
      color: 'blue',
    },
    Judging: {
      icon: <SyncOutlined spin />,
      text: 'Judging',
      textAll: t('judging'),
      color: 'blue',
    },
    End: {
      icon: <CloseCircleOutlined />,
      text: 'END',
      textAll: t('End'),
      color: undefined,
    },
    Cancelled: {
      icon: <CloseCircleOutlined />,
      text: 'Cancelled',
      textAll: t('canceled'),
      color: 'black',
    },
  };

  const type = NameList[props.caseType];

  const visible = !(
    props.caseTime === undefined && props.caseMemory === undefined && props.caseScore === undefined
  );

  const content: any = visible ? (
    <>
      {props.caseTime !== undefined && (
        <>
          <Typography.Text strong>{t('Time')}</Typography.Text> : {props.caseTime} ms
        </>
      )}
      {props.caseMemory !== undefined && (
        <>
          <br />
          <Typography.Text strong>{t('Memory')}</Typography.Text> :{' '}
          {Math.floor(props.caseMemory / 1024)} MB
        </>
      )}
      {props.caseScore !== undefined && props.scoreMod === 'show' && (
        <>
          <br />
          <Typography.Text strong>{t('Score')}</Typography.Text> :{' '}
          {props.caseType === TestCaseStates.Accepted ? props.caseScore : 0}
        </>
      )}
    </>
  ) : (
    <></>
  );

  switch (props.type) {
    case undefined:
    case 'tag':
      return (
        <span
          onMouseEnter={() => setMouseIn(true)}
          onMouseLeave={() => setMouseIn(false)}
          className={'test-case-e'}
        >
          <Popover content={content} open={visible && MouseIn} zIndex={2001}>
            <Tag icon={CaseList[type].icon} color={CaseList[type].color}>
              #{props.caseIndex} {CaseList[type].text}
            </Tag>
          </Popover>
        </span>
      );
    case 'tag-simple':
      return (
        <Tooltip title={CaseList[type].textAll}>
          <Tag color={CaseList[type].tagColor} className={'tag-simple'}>
            {CaseList[type].text}
          </Tag>
        </Tooltip>
      );
    case 'text':
      return (
        <Typography.Title
          level={ck(props.textLevel, 5)}
          type={CaseList[type].type}
          className={'TestCase-text'}
        >
          {CaseList[type].textAll + (props.append !== undefined ? props.append : '')}
        </Typography.Title>
      );
    case 'index':
      return (
        <span
          onMouseEnter={() => setMouseIn(true)}
          onMouseLeave={() => setMouseIn(false)}
          className={'test-case'}
        >
          <Popover content={content} open={visible && MouseIn} zIndex={2001}>
            <Tag color={CaseList[type].color}> #{props.caseIndex} </Tag>
          </Popover>
        </span>
      );
    default:
      return null;
  }
};

export default TestCase;
