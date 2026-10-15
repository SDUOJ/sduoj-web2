import { useEffect, useState } from 'react';
import { Button, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { UrlPrefix } from '../../Config/constValue';
import cApi from '../../Utils/API/c-api';
import mApi from '../../Utils/API/m-api';
import { getUrlParams } from '../../Utils/getUrlParams';
import useProblemInfo from '../../Component/problem/API/getProblemInfo';
import ProProgram from '../../Component/problem/Program/ProProgram';
import ProProgramDetail from '../../Component/problem/Program/ProProgramDetail';
import ProProgramDescription from '../../Component/problem/Program/ProProgramDescription';
import RecentSubmissionList from '../../Component/submission/SubmissionList/RecentSubmissionList';
import IdeProblemInfo, { IdeDescriptionTabs } from '../../Component/answerIde/IdeProblemInfo';

/** Shared problem data and content; each route owns its page layout. */
export default function useClientProblemPage(props: any, hideSubmit = false) {
  const problemCode = props.match.params.ProblemCode;
  const descriptionId = getUrlParams(props.location.search).descriptionId;
  const nameWithD = problemCode + '-' + descriptionId;

  const GetProblemInfoAPI = () => {
    return cApi.getProblemInfo({ problemCode: problemCode, descriptionId: descriptionId });
  };
  const SubmissionListAPI = (data: any) => {
    return cApi.getSubmissionList({
      ...data,
      problemCode: problemCode,
      username: props.username,
    });
  };
  const QuerySubmissionAPI = (submissionId: string) => {
    return cApi.getSubmissionInfo({ submissionId: submissionId });
  };

  const problemInfo = useProblemInfo(GetProblemInfoAPI, nameWithD);

  const [runEnabled, setRunEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    if (props.username)
      cApi
        .runCapabilities()
        .then((data) => {
          if (active) setRunEnabled(data.enabled);
        })
        .catch(() => {
          if (active) setRunEnabled(false);
        });
    else setRunEnabled(false);
    return () => {
      active = false;
    };
  }, [props.username]);
  const showWorkspace = Boolean(
    runEnabled &&
    props.username &&
    problemInfo?.judgeTemplates?.some((item: any) => item.type === 0),
  );
  const statement = (
    <>
      <Card size={'small'}>
        {problemInfo && (
          <ProProgram
            showMdExport={true}
            hideSubmit={hideSubmit}
            headerExtra={hideSubmit ? <IdeProblemInfo problemInfo={problemInfo} /> : undefined}
            headerBefore={
              hideSubmit
                ? (actions) => (
                    <IdeDescriptionTabs
                      problemInfo={problemInfo}
                      actions={
                        <div className="ide-heading-actions">
                          <Link
                            to={`${UrlPrefix}/problem/${encodeURIComponent(problemCode)}${props.location.search}`}
                          >
                            <Button icon={<ArrowLeftOutlined aria-hidden />}>
                              {props.t('answerIde.back')}
                            </Button>
                          </Link>
                          {actions}
                        </div>
                      }
                    />
                  )
                : undefined
            }
            name={problemCode}
            ideProblemCode={problemCode}
            nameWithD={nameWithD}
            GetProblemInfoAPI={GetProblemInfoAPI}
            SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
              return cApi.submit({
                judgeTemplateId: judgeTemplate,
                code: code,
                problemCode: problemCode,
                zipFileId: zipId,
              });
            }}
            SubmissionListAPI={SubmissionListAPI}
            QuerySubmissionAPI={QuerySubmissionAPI}
            AddPublicCheckpointsAPI={(data: any) => {
              return cApi.addPublicCheckpoints({
                ...data,
                problemId: problemInfo?.problemId,
              });
            }}
            GetPublicCheckpointAPI={() => {
              return cApi.getPublicCheckpoints({
                problemId: problemInfo?.problemId,
              });
            }}
            DelPublicCheckpointAPI={(data: any) => {
              return cApi.delPublicCheckpoints({
                ...data,
                problemId: problemInfo?.problemId,
              });
            }}
            UpdPublicCheckpointAPI={(data: any) => {
              return mApi.updatePublicCheckpoints({
                ...data,
                problemId: problemInfo?.problemId,
              });
            }}
            scoreMod={'show'}
            testcaseMod={'show'}
            showInfo={false}
          />
        )}
      </Card>
    </>
  );
  const details = (
    <>
      <div>
        <ProProgramDetail problemInfo={problemInfo} />
      </div>
      <div style={{ marginTop: 30 }}>
        <ProProgramDescription problemInfo={problemInfo} />
      </div>
    </>
  );
  const recent =
    props.username !== undefined ? (
      <RecentSubmissionList
        name={'Pro-SubmissionList-Recent-' + problemCode}
        API={SubmissionListAPI}
        QuerySubmissionAPI={QuerySubmissionAPI}
      />
    ) : null;
  return {
    problemCode,
    problemInfo,
    showWorkspace,
    statement,
    details,
    recent,
    QuerySubmissionAPI,
  };
}
