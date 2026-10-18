import { lazy, Suspense } from 'react';
import { withRouter } from 'react-router-dom';
import { Alert, Card } from 'antd';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { UserState } from '../../Type/Iuser';
import useClientProblemPage from './useClientProblemPage';
import '../../Component/answerIde/answerIde.css';

const AnswerLayout = lazy(() => import('../../Component/answerIde/AnswerLayout'));
const AnswerWorkspace = lazy(() => import('../../Component/answerIde/AnswerWorkspace'));

export const CProblemIde = (props: any) => {
  const { problemCode, problemInfo, showWorkspace, statement, recent, QuerySubmissionAPI } =
    useClientProblemPage(props, true);
  return (
    <section className="online-ide-page">
      <div className="online-ide-body">
        <Suspense fallback={<Card>{props.t('answerIde.loadingWorkspace')}</Card>}>
          <AnswerLayout
            key={`${props.username}:${problemCode}`}
            identity={`${props.username}:${problemCode}`}
            statement={<div className="ide-statement-panel">{statement}</div>}
            workspace={
              showWorkspace ? (
                <AnswerWorkspace
                  key={`${props.username}:${problemCode}`}
                  problemCode={problemCode}
                  username={props.username}
                  title={problemInfo.problemTitle}
                  templates={problemInfo.judgeTemplates}
                  samples={problemInfo.problemCaseDTOList}
                  querySubmission={QuerySubmissionAPI}
                  submissionHistory={recent}
                />
              ) : (
                <Alert type="info" message={props.t('answerIde.unavailable')} />
              )
            }
          />
        </Suspense>
      </div>
    </section>
  );
};

export default connect((state: any) => ({
  username: (state.UserReducer as UserState).userInfo?.username,
  isLogin: (state.UserReducer as UserState).isLogin,
}))(withTranslation()(withRouter(CProblemIde)));
