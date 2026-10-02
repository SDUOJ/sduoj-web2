import { Link, withRouter } from 'react-router-dom';
import { Button, Card, Space, Tabs } from 'antd';
import { isValueEmpty } from '../../Utils/empty';
import MarkdownText from '../../Utils/MarkdownText';
import React, { Dispatch, useEffect, useState } from 'react';
import useProblemSetInfo from './API/getProblemSetInfo';
import { UrlPrefix } from '../../Config/constValue';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { UserState } from '../../Type/Iuser';
import PSTakePicture from './PSTakePicture';
import { LeftOutlined } from '@ant-design/icons';
import '../../Assert/css/problemSetHeader.css';
import LatePermissionNotice from './LatePermissionNotice';

const PSHeader = (props: any) => {
  const problemSetId = props.match.params.problemSetId;
  const path = props.location.pathname;

  const onError = () => {
    props.history.replace(UrlPrefix + '/problemSetPublic/' + problemSetId);
  };

  const problemSetInfo = useProblemSetInfo(problemSetId, onError);

  const menuData = [
    {
      key: 'overview',
      name: props.t('Overview'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/overview',
      re: /\/problemSet\/.*\/overview/g,
    },
    {
      key: 'problem',
      name: props.t('Problem'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/problem/0/0',
      re: /\/problemSet\/.*\/problem/g,
    },
    {
      key: 'review',
      name: props.t('Review'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/review',
      re: /\/problemSet\/.*\/review/g,
    },
    {
      key: 'rank',
      name: props.t('Rank'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/rank',
      re: /\/problemSet\/.*\/rank/g,
    },
    {
      key: 'monitor',
      name: props.t('RankMonitorTab'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/monitor',
      re: /\/problemSet\/.*\/monitor/g,
    },
    {
      key: 'submission',
      name: props.t('SubmissionList'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/submission',
      re: /\/problemSet\/.*\/submission/g,
    },
    {
      key: 'late',
      name: props.t('LatePermission'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/late',
      re: /\/problemSet\/.*\/late/g,
    },
    {
      key: 'auto-task',
      name: props.t('AutoTaskTab'),
      link: UrlPrefix + '/problemSet/' + problemSetId + '/auto-task',
      re: /\/problemSet\/.*\/auto-task/g,
    },
  ];

  const [nowKey, setNowKey] = useState<any>();

  const menuList: any = ['overview', 'problem'];
  if (problemSetInfo?.isAdmin === true)
    menuList.push(
      'review', 'submission', 'late', 'auto-task', 'rank', 'monitor',
    );

  useEffect(() => {
    if (path.match(/\/problemSet\/[0-9]*\/?$/g) !== null) {
      props.history.replace(menuData[0].link);
    }
    menuData.map((value) => {
      if (path.match(value.re) !== null) setNowKey(value.key);
      return undefined;
    });
  }, [path, props.history, problemSetId, props.t]);

  return (
    <>
      {problemSetInfo !== undefined && (
        <>
          <Card
            style={{ marginTop: 25 }}
            extra={
              <Space style={{ marginTop: 12 }} wrap>
                {problemSetInfo.isAdmin === true && (
                  <>
                    <Button size={'small'} href={`${UrlPrefix}/workspace?psid=${problemSetId}`}>
                      AI 任务中心
                    </Button>
                    <Button size={'small'} href={`${UrlPrefix}/manage/problemSet/grading?psid=${problemSetId}`}>
                      AI 批阅
                    </Button>
                  </>
                )}
              </Space>
            }
            title={
              <>
                <Link to={UrlPrefix + `/group/${problemSetInfo.groupId}`}>
                  <Button size={'small'} icon={<LeftOutlined />}>
                    {' '}
                    {props.t('Return')}{' '}
                  </Button>
                </Link>
              </>
            }
          >
            {problemSetInfo.config.useSameSE === 1 && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.45rem' }}>
                    <span style={{ paddingRight: 10 }}>{problemSetInfo.name}</span>
                  </span>
                </div>
              </>
            )}
            {!isValueEmpty(problemSetInfo.description) &&
              !isValueEmpty(problemSetInfo.description.trim()) && (
                <MarkdownText
                  id={'problemSet-markdownDescription'}
                  text={problemSetInfo.description.trim()}
                />
              )}
          </Card>
          <Tabs
            className={'ps-header-tabs'}
            activeKey={nowKey}
            onChange={(activeKey) => {
              menuData.forEach((item) => {
                if (item.key === activeKey) props.history.push(item.link);
              });
            }}
            items={menuData
              .filter((m) => menuList.includes(m.key))
              .map((m) => ({
                key: m.key,
                label: m.name,
              }))}
            animated
            destroyOnHidden={false}
          />
          <LatePermissionNotice latePermission={problemSetInfo?.latePermission} />
        </>
      )}
    </>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    roles: UState.userInfo?.roles,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(PSHeader)));
