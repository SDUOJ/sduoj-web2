import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Result, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import cApi from '../../Utils/API/c-api';
import mApi from '../../Utils/API/m-api';
import useProblemInfo from '../../Component/problem/API/getProblemInfo';
import ProProgram from '../../Component/problem/Program/ProProgram';
import RecentSubmissionList from '../../Component/submission/SubmissionList/RecentSubmissionList';
import AnswerLayout from '../../Component/answerIde/AnswerLayout';
import AnswerWorkspace from '../../Component/answerIde/AnswerWorkspace';
import IdeProblemInfo, { IdeDescriptionTabs } from '../../Component/answerIde/IdeProblemInfo';
import { IdeContext } from '../../Component/answerIde/runTypes';
import { useProblemGuards } from '../../Component/problemSet/problemGuards';
import ContextProblemMenu, {
  ContextProblemGroup,
} from '../../Component/answerIde/ContextProblemMenu';
import { ContestInfo } from '../../Type/api';
import { UrlPrefix } from '../../Config/constValue';
import '../../Component/answerIde/answerIde.css';

const ProblemSetProblem = lazy(() => import('../../Component/problemSet/Problem'));

/** The business address and formal API travel together; the underlying problem code is display-only. */
export default function CContextProblemIde() {
  const { contestId, problemCode, problemSetId, problemGroupId, problemId } = useParams<{
    contestId?: string;
    problemCode?: string;
    problemSetId?: string;
    problemGroupId?: string;
    problemId?: string;
  }>();
  const { t } = useTranslation();
  const location = useLocation();
  const username = useSelector((state: any) => state.UserReducer.userInfo?.username);
  const contest = Boolean(contestId);
  useProblemGuards(!contest);
  const router = useMemo(
    () => ({ psid: problemSetId!, gid: problemGroupId!, pid: problemId! }),
    [problemSetId, problemGroupId, problemId],
  );
  const context = useMemo<IdeContext>(
    () =>
      contest
        ? { type: 1, bizId: contestId, problemCode }
        : {
            type: 2,
            bizId: problemSetId,
            groupIndex: Number(problemGroupId),
            problemIndex: Number(problemId),
          },
    [contest, contestId, problemCode, problemSetId, problemGroupId, problemId],
  );
  const scopeKey = contest
    ? `Contest-${contestId}-${problemCode}`
    : `problemSet-${problemSetId}-${problemGroupId}-${problemId}`;
  const getInfo = () =>
    contest
      ? cApi.getContestProblem({ contestId: contestId!, problemCode: problemCode! })
      : cApi.getProblemSetProblem({ router });
  const info = useProblemInfo(getInfo, scopeKey);
  const [problemSet, setProblemSet] =
    useState<Awaited<ReturnType<typeof cApi.getProblemSetInfo>>>();
  const [contestInfo, setContestInfo] = useState<ContestInfo>();
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const cachedProblemSet = useSelector((state: any) => {
    const cache = state.ProblemSetReducer?.problemSetInfo;
    const session = JSON.stringify([state.UserReducer.isLogin, username]);
    return cache?.[`${problemSetId}-session`] === session ? cache?.[problemSetId!] : undefined;
  });
  const currentProblemSet = cachedProblemSet ?? problemSet;
  const [submissionCount, setSubmissionCount] = useState<number>();
  useEffect(() => {
    let active = true;
    setProblemSet(undefined);
    setContestInfo(undefined);
    setCatalogLoading(true);
    setCatalogError(false);
    const request = contest
      ? cApi.getContestInfo({ contestId: contestId! }).then((value) => {
          if (active) setContestInfo(value);
        })
      : cApi.getProblemSetInfo({ psid: problemSetId! }).then((value) => {
          if (active) setProblemSet(value);
        });
    void request
      .catch(() => {
        if (active) setCatalogError(true);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contest, contestId, problemSetId, username, catalogVersion]);
  useEffect(() => {
    let active = true;
    setSubmissionCount(undefined);
    if (!contest && info?.submitNum) {
      void cApi
        .getProblemSetSubmissionList({ router, problemSetId, username, pageNow: 1, pageSize: 1 })
        .then((value: any) => {
          if (active) setSubmissionCount(Number(value.totalNum));
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [contest, problemSetId, router, username, info?.submitNum]);
  const publicCasesAllowed =
    !contest &&
    currentProblemSet &&
    !(
      currentProblemSet.type === 1 &&
      currentProblemSet.config?.useSameSE === 1 &&
      Number(currentProblemSet.tm_end) > Date.now()
    );

  const querySubmission = (submissionId: string) =>
    contest
      ? cApi.getContestSubmissionInfo({ contestId: contestId!, submissionId })
      : cApi.getProblemSetSubmissionInfo({ ...router, submissionId });
  const listSubmissions = (data: any) =>
    contest
      ? cApi.getContestSubmissionList({ ...data, contestId, problemCode, username })
      : cApi.getProblemSetSubmissionList({ ...data, router, problemSetId, username });
  const submit = async (judgeTemplateId: string, code: string, zipFileId?: string) => {
    if (contest)
      return cApi.submitContestProblem({
        contestId: contestId!,
        problemCode: problemCode!,
        judgeTemplateId,
        code,
        zipFileId,
      });
    if (info?.submitNum) {
      const count: any = await cApi.getProblemSetSubmissionList({
        router,
        problemSetId,
        username,
        pageNow: 1,
        pageSize: 1,
      });
      setSubmissionCount(Number(count.totalNum));
      if (Number(count.totalNum) >= info.submitNum) {
        message.error(t('numberOfRemainingSubmissions') + ': 0');
        throw new Error('No remaining submissions');
      }
    }
    const id = (await cApi.submitProblemSetProblem({
      router,
      data: { judgeTemplateId, code, zipFileId, problemSetId: problemSetId! },
    })) as string;
    setSubmissionCount((value) => (value ?? 0) + 1);
    return id;
  };
  const listName = 'Pro-SubmissionList-Recent-' + scopeKey;
  const back = location.pathname.replace(/\/ide\/?$/, '') + location.search;
  const group = currentProblemSet?.groupInfo?.[Number(problemGroupId)];
  const problemMeta = group?.problemInfo?.[Number(problemId)];
  const ideTemplates =
    info?.judgeTemplates?.filter(
      (item: any) =>
        item.type === 0 &&
        !item.zipFileId &&
        !item.acceptFileExtensions?.some((extension: string) => /^\.?zip$/i.test(extension)),
    ) ?? [];
  const available = (contest || group?.type === 2) && ideTemplates.length > 0;
  const groups: ContextProblemGroup[] = contest
    ? [
        {
          key: 'contest',
          items: (contestInfo?.problems ?? []).map((item) => ({
            key: String(item.problemCode),
            number:
              /^[1-9]\d*$/.test(item.problemCode) && Number(item.problemCode) <= 26
                ? String.fromCharCode(64 + Number(item.problemCode))
                : item.problemCode,
            title: item.problemTitle,
            href: `${UrlPrefix}/contest/${contestId}/problem/${item.problemCode}/ide`,
            answered: item.judgeResult === 1,
          })),
        },
      ]
    : (currentProblemSet?.groupInfo ?? []).map((item: any, groupIndex: number) => ({
        key: String(groupIndex),
        title: item.name,
        // Routes use positions in the user's displayed order, including shuffled objective questions.
        items: item.problemInfo.map((problem: any, problemIndex: number) => ({
          key: `${groupIndex}:${problemIndex}`,
          number: String(problemIndex + 1),
          title: problem.name || t('answerIde.problemNumber', { number: problemIndex + 1 }),
          href: `${UrlPrefix}/problemSet/${problemSetId}/problem/${groupIndex}/${problemIndex}/ide`,
          answered: problem.hasAnswer,
        })),
      }));
  const recent = (
    <RecentSubmissionList
      name={listName}
      API={listSubmissions}
      QuerySubmissionAPI={querySubmission}
    />
  );
  return (
    <section
      className={`online-ide-page context-ide-page${contest ? '' : ' problem-set-ide'}`}
      style={contest ? undefined : { userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <ContextProblemMenu
        title={contest ? contestInfo?.contestTitle : currentProblemSet?.name}
        groups={groups}
        activeKey={contest ? String(problemCode) : `${problemGroupId}:${problemId}`}
        loading={catalogLoading && !currentProblemSet}
      />
      <div className="online-ide-body context-ide-main">
        {catalogError && (
          <Alert
            type="warning"
            showIcon
            message={t('answerIde.problemMenuError')}
            action={
              <Button size="small" onClick={() => setCatalogVersion((value) => value + 1)}>
                {t('Retry')}
              </Button>
            }
          />
        )}
        {!contest && !catalogLoading && currentProblemSet && !problemMeta ? (
          <Result
            status="404"
            title={t('PageNotFound', { defaultValue: '题目不存在或已被移除' })}
          />
        ) : !info || (!contest && !currentProblemSet) ? (
          <Spin />
        ) : !available && !contest ? (
          <div className="context-ide-original" key={`${username}:${scopeKey}`}>
            <div className="context-ide-original-actions">
              <Link to={back}>
                <Button icon={<ArrowLeftOutlined aria-hidden />}>{t('answerIde.back')}</Button>
              </Link>
            </div>
            <Suspense fallback={<Spin />}>
              <ProblemSetProblem embedded />
            </Suspense>
          </div>
        ) : !available ? (
          <div className="context-ide-original" key={`${username}:${scopeKey}`}>
            <Card size="small">
              <ProProgram
                showMdExport
                name={scopeKey}
                nameWithD={scopeKey}
                GetProblemInfoAPI={getInfo}
                SubmitAPI={submit}
                SubmissionListAPI={listSubmissions}
                QuerySubmissionAPI={querySubmission}
                scoreMod="show"
                testcaseMod="show"
                showInfo
                headerBefore={() => (
                  <div className="context-ide-original-actions">
                    <Link to={back}>
                      <Button icon={<ArrowLeftOutlined aria-hidden />}>
                        {t('answerIde.back')}
                      </Button>
                    </Link>
                  </div>
                )}
              />
            </Card>
            {recent}
          </div>
        ) : (
          <AnswerLayout
            key={`${username}:${scopeKey}`}
            identity={`${username}:${scopeKey}`}
            statement={
              <div className="ide-statement-panel">
                <Card size="small">
                  <ProProgram
                    showMdExport={contest}
                    hideSubmit
                    name={scopeKey}
                    nameWithD={scopeKey}
                    ideProblemCode={scopeKey}
                    ideContext={context}
                    GetProblemInfoAPI={getInfo}
                    SubmitAPI={submit}
                    SubmissionListAPI={listSubmissions}
                    QuerySubmissionAPI={querySubmission}
                    scoreMod="show"
                    testcaseMod="show"
                    showInfo={false}
                    headerExtra={<IdeProblemInfo problemInfo={info} />}
                    headerBefore={(actions) => (
                      <IdeDescriptionTabs
                        problemInfo={info}
                        actions={
                          <div className="ide-heading-actions">
                            <Link to={back}>
                              <Button icon={<ArrowLeftOutlined aria-hidden />}>
                                {t('answerIde.back')}
                              </Button>
                            </Link>
                            {actions}
                          </div>
                        }
                      />
                    )}
                    {...(publicCasesAllowed
                      ? {
                          AddPublicCheckpointsAPI: (data: any) =>
                            cApi.addPsPublicCheckpoints({ router, data }),
                          GetPublicCheckpointAPI: () => cApi.getPsPublicCheckpoints({ router }),
                          DelPublicCheckpointAPI: (data: any) =>
                            cApi.delPsPublicCheckpoints({ router, data }),
                          UpdPublicCheckpointAPI: (data: any) =>
                            mApi.updatePsPublicCheckpoints({ router, data }),
                        }
                      : {})}
                  />
                </Card>
              </div>
            }
            workspace={
              username && available ? (
                <AnswerWorkspace
                  key={`${username}:${scopeKey}`}
                  context={context}
                  scopeKey={scopeKey}
                  problemCode={info.problemCode ?? scopeKey}
                  username={username}
                  title={info.problemTitle}
                  templates={ideTemplates}
                  samples={info.problemCaseDTOList}
                  querySubmission={querySubmission}
                  submitCode={submit}
                  remainingSubmissions={
                    !contest && info.submitNum
                      ? info.submitNum - (submissionCount ?? info.submitNum)
                      : undefined
                  }
                  submissionListName={listName}
                  submissionHistory={recent}
                />
              ) : (
                <Alert type="info" message={t('answerIde.unavailable')} />
              )
            }
          />
        )}
      </div>
    </section>
  );
}
