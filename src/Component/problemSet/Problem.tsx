import { withTranslation } from 'react-i18next';
import { Link, withRouter } from 'react-router-dom';
import { Badge, Button, Card, Col, message, Result, Row, Spin } from 'antd';
import ProProgram from '../problem/Program/ProProgram';
import cApi from '../../Utils/API/c-api';
import ProProgramDetail from '../problem/Program/ProProgramDetail';
import RecentSubmissionList from '../submission/SubmissionList/RecentSubmissionList';
import React, { Dispatch, useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { UserState } from '../../Type/Iuser';
import useProblemInfo from '../problem/API/getProblemInfo';
import { UrlPrefix } from '../../Config/constValue';
import { ProblemSetState } from '../../Redux/Action/problemSet';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import ProblemSetPageCtrl from './ProblemSetPageCtrl';
import useProblemSetInfo from './API/getProblemSetInfo';
import Objective from '../problem/Objective/Objective';
import Timer from '../common/Timer';
import Subjective from '../problem/Subjective/Subjective';
import Reconfirm from '../common/Reconfirm';
import dealFloat from '../../Utils/dealFloat';
import { TimeRangeState } from '../../Utils/Time';
import { isValueEmpty } from '../../Utils/empty';
import mApi from '../../Utils/API/m-api';
import { useProblemGuards } from './problemGuards';

export const Problem = (props: any) => {
  useProblemGuards();
  const psid = props.match.params.problemSetId;
  const gid = props.match.params.problemGroupId;
  const pid = props.match.params.problemId;
  const problemSetInfo = useProblemSetInfo(psid);

  const proName = `problemSet-${psid}-${gid}-${pid}`;
  const psType = problemSetInfo?.type;
  const groupInfo = problemSetInfo?.groupInfo?.[gid];
  const problemMeta = groupInfo?.problemInfo?.[pid];
  const groupType = groupInfo?.type;
  const proType = problemMeta?.type;
  const score = problemMeta?.point;
  const latePermission = problemSetInfo?.latePermission;

  const [flag, setFlag] = useState(problemMeta?.collect);
  const dispatch = useDispatch();

  const updateProblemMeta = (data: Record<string, unknown>) => {
    if (!problemSetInfo || !groupInfo || !problemMeta) return;
    const groups = Array.isArray(problemSetInfo.groupInfo)
      ? [...problemSetInfo.groupInfo]
      : { ...problemSetInfo.groupInfo };
    const problems = Array.isArray(groupInfo.problemInfo)
      ? [...groupInfo.problemInfo]
      : { ...groupInfo.problemInfo };
    problems[pid] = { ...problemMeta, ...data };
    groups[gid] = {
      ...groupInfo,
      problemInfo: problems,
    };
    dispatch({
      type: 'setProblemSetInfo',
      key: psid,
      data: { ...problemSetInfo, groupInfo: groups },
    });
  };

  useEffect(() => {
    if (problemMeta && flag !== problemMeta.collect) setFlag(problemMeta.collect);
  }, [flag, gid, pid, problemMeta, problemSetInfo, psid]);

  const getTypeText = () => {
    if (proType === 0) return props.t('SingleChoice');
    if (proType === 1) return props.t('MultipleChoice');
    if (proType === 2) return props.t('IndefiniteChoice');
  };

  const GetProblemInfoAPI = () => {
    return cApi.getProblemSetProblem({
      router: { psid: psid, gid: gid, pid: pid },
    });
  };
  const SubmissionListAPI = (data: any) => {
    if (!isValueEmpty(props.username)) {
      return cApi.getProblemSetSubmissionList({
        ...data,
        router: { psid: psid, gid: gid, pid: pid },
        username: props.username,
        problemSetId: psid,
      });
    } else {
      return Promise.reject(props.t('PleaseLogin'));
    }
  };

  const submitAPI = (data: any) => {
    return cApi
      .submitProblemSetProblem({
        data: data,
        router: { psid: psid, gid: gid, pid: pid },
      })
      .then((res: any) => {
        let hasAnswer = true;
        if (groupType !== 2) hasAnswer = res;
        updateProblemMeta({ hasAnswer });
        return Promise.resolve(res);
      });
  };

  const getAs = () => {
    return cApi.getProblemSetProblemAS({
      router: { psid: psid, gid: gid, pid: pid },
    });
  };
  const QuerySubmissionAPI = (submissionId: string) => {
    return cApi.getProblemSetSubmissionInfo({
      psid: psid,
      gid: gid,
      pid: pid,
      submissionId: submissionId,
    });
  };

  const problemInfo = useProblemInfo(GetProblemInfoAPI, proName);
  const hasTimer =
    problemSetInfo !== undefined &&
    psType === 1 &&
    problemSetInfo.config?.useSameSE === 1 &&
    parseInt(problemSetInfo.tm_end) > Date.now();

  let publicCheckPointAPI: any = {};

  if (!hasTimer) {
    publicCheckPointAPI = {
      AddPublicCheckpointsAPI: (data: any) => {
        return cApi.addPsPublicCheckpoints({
          data: data,
          router: { psid: psid, gid: gid, pid: pid },
        });
      },
      GetPublicCheckpointAPI: () => {
        return cApi.getPsPublicCheckpoints({
          router: { psid: psid, gid: gid, pid: pid },
        });
      },
      DelPublicCheckpointAPI: (data: any) => {
        return cApi.delPsPublicCheckpoints({
          data: data,
          router: { psid: psid, gid: gid, pid: pid },
        });
      },
      UpdPublicCheckpointAPI: (data: any) => {
        return mApi.updatePsPublicCheckpoints({
          data: data,
          router: { psid: psid, gid: gid, pid: pid },
        });
      },
    };
  }

  if (problemSetInfo !== undefined && (groupInfo === undefined || problemMeta === undefined)) {
    return (
      <Result
        status="404"
        title={props.t('PageNotFound', { defaultValue: '题目不存在或已被移除' })}
      />
    );
  }

  const examActions = hasTimer && (
    <>
      <Reconfirm
        btnProps={{ block: true, danger: true, type: 'primary' }}
        btnText={props.t('SubmitPaper')}
        confirm={props.username}
        API={() => {
          cApi.finishProblemSet({ router: { psid, gid: 0, pid: 0 } }).then(() => {
            message.success(props.t('examSubmittedSuccess'));
            props.history.replace(UrlPrefix + '/problemSetPublic/' + psid);
          });
        }}
        todo={props.t('SubmitPaper')}
      />
      <div style={{ marginTop: 24 }}>
        <Timer
          deadline={parseInt(problemSetInfo?.tm_end)}
          inline
          onFinish={() => props.history.replace(UrlPrefix + '/problemSetPublic/' + psid)}
        />
      </div>
    </>
  );

  return (
    <div style={{ textAlign: 'center', margin: '0 auto' }}>
      <div
        style={{
          textAlign: 'left',
          maxWidth: '1500px',
          margin: '0 auto',
          userSelect: 'none',
        }}
      >
        <Row gutter={20} style={{ marginTop: props.embedded ? 0 : '24px' }}>
          <Col span={props.embedded ? 24 : 17}>
            {props.embedded && examActions && <div style={{ marginBottom: 24 }}>{examActions}</div>}
            <Card
              title={
                <>
                  {groupType === 0 && <>【{getTypeText()}】</>}
                  <>{parseInt(pid) + 1}.</>
                  {score !== undefined && (
                    <>
                      （{dealFloat(score)}
                      {props.t(score === 1 ? 'point' : 'points')}）
                    </>
                  )}
                </>
              }
              extra={
                <Button
                  type="default"
                  shape="round"
                  icon={flag ? <StarFilled /> : <StarOutlined />}
                  danger={flag}
                  onClick={() => {
                    cApi
                      .updateProblemSetProblemCollect({
                        router: { psid: psid, gid: gid, pid: pid },
                      })
                      .then((res) => {
                        updateProblemMeta({ collect: flag ? 0 : 1 });
                        setFlag((current: number | undefined) => (current ? 0 : 1));
                      });
                  }}
                >
                  {props.t('Mark')}
                </Button>
              }
            >
              {(() => {
                if (!problemInfo) return <Spin />;
                switch (groupType) {
                  case 2:
                    return (
                      <>
                        {!props.embedded && (
                          <Link to={`${UrlPrefix}/problemSet/${psid}/problem/${gid}/${pid}/ide`}>
                            <Button type="primary" style={{ marginBottom: 16 }}>
                              {props.t('answerIde.open')}
                            </Button>
                          </Link>
                        )}
                        <ProProgram
                          key={proName}
                          showMdExport={false}
                          name={proName}
                          nameWithD={proName}
                          GetProblemInfoAPI={GetProblemInfoAPI}
                          enableLeftSubmitCount={true}
                          SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                            return submitAPI({
                              judgeTemplateId: judgeTemplate,
                              code: code,
                              zipFileId: zipId,
                              problemSetId: psid,
                            });
                          }}
                          SubmissionListAPI={SubmissionListAPI}
                          QuerySubmissionAPI={QuerySubmissionAPI}
                          {...publicCheckPointAPI}
                          scoreMod={'show'}
                          testcaseMod={'show'}
                          showInfo={false}
                        />
                      </>
                    );
                  case 1: {
                    const timeState_running = TimeRangeState(
                      problemSetInfo.tm_start,
                      problemSetInfo.tm_end,
                    );
                    return (
                      <Subjective
                        key={proName}
                        router={{ psid, gid, pid }}
                        problemInfo={problemInfo}
                        onAnswerM={submitAPI}
                        getAS={getAs}
                        key_o={`sbjective-${psid}-${gid}-${pid}`}
                        finish={timeState_running === 'end' && isValueEmpty(latePermission)}
                      />
                    );
                  }
                  case 0:
                    return (
                      <Objective
                        key={proName}
                        key_o={`objective-${psid}-${gid}-${pid}`}
                        onMark={(SID: string) => {
                          return cApi
                            .markObjectiveProblem({
                              data: SID,
                              router: { psid: psid, gid: gid, pid: pid },
                            })
                            .then((res: any) => {
                              updateProblemMeta({ hasAnswer: res.hasAnswer });
                              return Promise.resolve(res);
                            });
                        }}
                        onAnswerM={submitAPI}
                        getAS={getAs}
                        problemInfo={problemInfo}
                      />
                    );
                }
              })()}
            </Card>
            {!props.embedded && <ProblemSetPageCtrl />}
            {props.embedded && groupType === 2 && (
              <div style={{ marginTop: 24 }}>
                <ProProgramDetail problemInfo={problemInfo} />
                <RecentSubmissionList
                  name={'Pro-SubmissionList-Recent-' + proName}
                  API={SubmissionListAPI}
                  QuerySubmissionAPI={QuerySubmissionAPI}
                />
              </div>
            )}
          </Col>
          {!props.embedded && (
            <Col span={7}>
              <div>{examActions}</div>
              <div style={hasTimer ? { marginTop: 25 } : {}}>
                {problemSetInfo?.groupInfo.map((group: any, g_index: number) => {
                  return (
                    <div key={`group-${group.index ?? g_index}`}>
                      <Card size={'small'} title={group.name} variant={'borderless'}>
                        <Row gutter={10}>
                          {group.problemInfo.map((problem: any, index: number) => {
                            return (
                              <Col
                                key={`problem-${group.index ?? g_index}-${problem.index ?? index}`}
                                span={3}
                              >
                                <Button
                                  ghost={true}
                                  size={'middle'}
                                  type={
                                    g_index.toString() === gid && index.toString() === pid
                                      ? 'primary'
                                      : 'text'
                                  }
                                  shape={'round'}
                                  onClick={() => {
                                    props.history.push(
                                      UrlPrefix +
                                        '/problemSet/' +
                                        psid +
                                        '/problem/' +
                                        group.index +
                                        '/' +
                                        index,
                                    );
                                  }}
                                >
                                  <Badge dot={problem.collect === 1} offset={[10, 0]}>
                                    <span
                                      style={{
                                        fontWeight: 'bold',
                                        color: problem.hasAnswer ? '#3ad506' : undefined,
                                      }}
                                    >
                                      {index + 1}
                                    </span>
                                  </Badge>
                                </Button>
                              </Col>
                            );
                          })}
                        </Row>
                      </Card>
                    </div>
                  );
                })}
              </div>
              <div>
                {groupType === 2 && (
                  <>
                    <div style={{ marginTop: 25 }}>
                      <ProProgramDetail problemInfo={problemInfo} />
                    </div>
                    <div style={{ marginTop: 25 }}>
                      <RecentSubmissionList
                        name={'Pro-SubmissionList-Recent-' + proName}
                        API={SubmissionListAPI}
                        QuerySubmissionAPI={QuerySubmissionAPI}
                      />
                    </div>
                  </>
                )}
              </div>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  const State: UserState = state.UserReducer;
  const PSState: ProblemSetState = state.ProblemSetReducer;
  return {
    username: State.userInfo?.username,
    problemSetInfo: PSState.problemSetInfo,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(Problem)));
