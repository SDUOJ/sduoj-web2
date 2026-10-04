import { Link, matchPath, withRouter } from 'react-router-dom';
import { Button, Card, Space, Tabs } from 'antd';
import { isValueEmpty } from '../../Utils/empty';
import MarkdownText from '../../Utils/MarkdownText';
import React, { Dispatch, useEffect, useMemo, useState } from 'react';
import useProblemSetInfo from './API/getProblemSetInfo';
import { UrlPrefix } from '../../Config/constValue';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { UserState } from '../../Type/Iuser';
import PSTakePicture from './PSTakePicture';
import { LeftOutlined } from '@ant-design/icons';
import '../../Assert/css/problemSetHeader.css';
import LatePermissionNotice from './LatePermissionNotice';
import { navigationTrees } from '../../Config/router/routeTrees';
import { navigationLinks } from '../../Config/router/navigation';

const PSHeader = (props: any) => {
  const problemSetId = props.match.params.problemSetId;
  const path = props.location.pathname;
  const t = props.t;

  const onError = () => {
    props.history.replace(UrlPrefix + '/problemSetPublic/' + problemSetId);
  };

  const problemSetInfo = useProblemSetInfo(problemSetId, onError);

  const menuData = useMemo(
    () =>
      navigationLinks(
        navigationTrees.problemSet,
        { problemSetId, problemGroupId: 0, problemId: 0 },
        [13, 14, 16, 15, 151, 17, 18, 19],
      ).map((item) => ({ ...item, name: t(item.name) })),
    [problemSetId, t],
  );

  const [nowKey, setNowKey] = useState<string>();

  const menuList: string[] = ['overview', 'problem'];
  if (problemSetInfo?.isAdmin === true)
    menuList.push('review', 'submission', 'late', 'auto-task', 'rank', 'monitor');

  useEffect(() => {
    if (path.match(/\/problemSet\/[0-9]*\/?$/g) !== null) {
      props.history.replace(menuData[0].link);
    }
    menuData.map((value) => {
      if (matchPath(path, { path: value.pattern, exact: true })) setNowKey(value.key);
      return undefined;
    });
  }, [menuData, path, props.history]);

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
                    <Button
                      size={'small'}
                      href={`${UrlPrefix}/manage/problemSet/grading?psid=${problemSetId}`}
                    >
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
