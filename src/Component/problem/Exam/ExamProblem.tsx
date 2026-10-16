import React, { Dispatch, useEffect } from 'react';
import { Alert, Button, Card } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import ExamChoice from './ExamChoice';
import { connect, useSelector } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import eApi from '../../../Utils/API/e-api';
import ProProgram from '../Program/ProProgram';
import { isValueEmpty } from '../../../Utils/empty';
import {
  retryExamAnswers,
  selectExamAnswerDraft,
  selectExamAnswerSheets,
  updateFlagTodo,
} from '../../../Redux/Action/exam';
import { UserState } from '../../../Type/Iuser';

const ExamProblem = (props: any) => {
  useEffect(() => {
    document.oncontextmenu = function (e) {
      /*屏蔽浏览器默认右键事件*/
      e = e || window.event;
      return false;
    };
  });

  const eid = props.match.params.eid;
  const gid = props.match.params.gid;
  const pid = props.match.params.pid;

  const GetProblemInfoAPI = () => {
    return eApi.getProInfo({
      examId: eid,
      groupIndex: gid,
      problemIndex: pid,
    });
  };

  // const problemInfo = useProblemInfo(GetProblemInfoAPI, `EXAM_${eid}_${gid}_${pid}`)
  // console.log("problemInfo", problemInfo)

  const problemList = useSelector((state: any) => {
    return state.ExamReducer.examProListInfo[eid + '_' + gid];
  });
  const answerSheet = useSelector(
    (state: any) => selectExamAnswerSheets(state, `${eid}_${gid}`)?.[pid],
  );
  const draft = useSelector((state: any) => selectExamAnswerDraft(state, `${eid}_${gid}`));
  const answerDisabled = useSelector(
    (state: any) =>
      state.ExamReducer.answerSubmitting ||
      state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`] === undefined,
  );

  const baseInfo = problemList?.proList[pid] ?? { index: undefined, score: undefined };
  const proType = problemList?.type;
  const flag = answerSheet?.marked ?? false;

  return (
    <Card
      className={'Problem'}
      title={
        <>
          【{props.t(proType)}】{baseInfo.index !== undefined && <>{baseInfo.index + 1}.</>}
          {baseInfo.score !== undefined && (
            <>
              （{baseInfo.score}
              {props.t(baseInfo.score === 1 ? 'point' : 'points')}）
            </>
          )}
        </>
      }
      extra={
        proType !== 'Program' && (
          <Button
            type="default"
            shape="round"
            icon={flag ? <StarFilled /> : <StarOutlined />}
            danger={flag}
            disabled={answerDisabled}
            onClick={() => props.flipFlag(`${eid}_${gid}`, pid).catch(() => {})}
          >
            {props.t('Mark')}
          </Button>
        )
      }
    >
      {draft && (
        <Alert
          type={draft.status === 'failed' ? 'error' : 'info'}
          message={props.t(
            draft.status === 'failed' ? 'ExamAnswerSaveFailed' : 'ExamAnswerSaving',
            {
              defaultValue:
                draft.status === 'failed'
                  ? 'Answers are not saved. Retry before leaving or submitting.'
                  : 'Saving answers…',
            },
          )}
          action={
            draft.status === 'failed' ? (
              <Button
                size="small"
                onClick={() => props.retryAnswers(`${eid}_${gid}`).catch(() => {})}
              >
                {props.t('Retry')}
              </Button>
            ) : undefined
          }
        />
      )}
      {(() => {
        switch (proType) {
          case 'Program':
            return (
              <ProProgram
                showMdExport={false}
                nameWithD={`EXAM_${eid}_${gid}_${pid}`}
                name={`EXAM_${eid}_${gid}_${pid}`}
                GetProblemInfoAPI={GetProblemInfoAPI}
                SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                  return eApi.CreateSubmit({
                    judgeTemplateId: judgeTemplate,
                    code: code,
                    zipFileId: zipId,
                    problemIndex: pid,
                    groupIndex: gid,
                    examId: eid,
                    problemCode: pid,
                  });
                }}
                SubmissionListAPI={async (data: any) => {
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
                scoreMod={'show'}
                testcaseMod={'show'}
                showInfo={true}
                enableLeftSubmitCount={true}
              />
            );
          case 'SingleChoice':
          case 'MultipleChoice':
            return <ExamChoice />;
        }
      })()}
    </Card>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    username: UState.userInfo?.username,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  retryAnswers: (groupKey: string) => dispatch(retryExamAnswers(groupKey)),
  flipFlag: (groupKey: string, proIndex: number) => dispatch(updateFlagTodo(groupKey, proIndex)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(ExamProblem)));
