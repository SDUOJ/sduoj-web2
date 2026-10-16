import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Row } from 'antd';
import ExamProblem from '../problem/Exam/ExamProblem';
import ExamPageCtrl from './ExamPageCtrl';
import ExamAnswerSheet from './ExamAnswerSheet';
import Timer from '../common/Timer';
import { withRouter } from 'react-router-dom';
import eApi from 'Utils/API/e-api';
import useExamInfo from './API/getExamInfo';
import RecentSubmissionList from '../submission/SubmissionList/RecentSubmissionList';
import { UrlPrefix } from '../../Config/constValue';
import { activateExamAnswers, examAnswerSessionKey } from '../../Redux/Action/exam';
import { getExamGroupListFunc } from './API/getExamGroupListFunc';

const ExamRun = (props: any) => {
  const eid = props.match.params.eid;
  const gid = props.match.params.gid;
  const pid = props.match.params.pid;

  const examInfo = useExamInfo(eid);

  const problemList = useSelector((state: any) => {
    return state.ExamReducer.examProListInfo[eid];
  });
  const dispatch = useDispatch();

  const sessionKey = useSelector(examAnswerSessionKey);
  const unsaved = useSelector(
    (state: any) => Object.keys(state.ExamReducer.examAnswerDraftInfo ?? {}).length > 0,
  );
  useEffect(() => dispatch(activateExamAnswers(eid) as any) as any, [dispatch, eid, sessionKey]);
  useEffect(() => {
    if (!unsaved) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [unsaved]);

  // 获取题组信息
  useEffect(() => {
    let active = true;
    eApi
      .getExamGroupList(eid)
      .then((res: any) => {
        getExamGroupListFunc(res, eid, dispatch, false, () => active);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dispatch, eid, sessionKey]);

  // console.log("problemList", problemList)

  return (
    <>
      <div style={{ margin: 'clamp(8px, 3vw, 35px)', width: '100%', minWidth: 0 }}>
        <div style={{ textAlign: 'center', margin: '0 auto' }}>
          <div
            style={{
              textAlign: 'left',
              maxWidth: '1600px',
              width: '100%',
              minWidth: 0,
              margin: '0 auto',
            }}
          >
            <Row>
              <Col xs={24} lg={16}>
                <ExamProblem />
                <ExamPageCtrl />
              </Col>
              <Col xs={24} lg={7} className={'ExamRun-ExamAnswerSheet'}>
                <Timer
                  deadline={examInfo?.endTime}
                  inline={true}
                  onFinish={() => {
                    props.history.push(UrlPrefix + '/exam/finish');
                  }}
                />
                <ExamAnswerSheet problemList={problemList} />
                {problemList && problemList[`${eid}_${gid}`]?.type === 'Program' && (
                  <div style={{ marginTop: 30 }}>
                    <RecentSubmissionList
                      name={`Pro-SubmissionList-Recent-EXAM_${eid}_${gid}_${pid}`}
                      API={async (data: any) => {
                        return eApi.getSubmissionList({
                          ...data,
                          examId: parseInt(eid),
                          problemGroup: parseInt(gid),
                          problemIndex: parseInt(pid),
                        });
                      }}
                      QuerySubmissionAPI={async (submissionId: string) => {
                        return eApi.getSubmission(eid, submissionId);
                      }}
                    />
                  </div>
                )}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
};

export default withRouter(ExamRun);
