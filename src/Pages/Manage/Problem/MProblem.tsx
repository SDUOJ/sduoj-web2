import DevOnly, { DevBadge } from '../../../Component/common/DevOnly';
import React from 'react';
import { Button, Card, Space } from 'antd';
import MApi from '../../../Utils/API/m-api';
import mApi from '../../../Utils/API/m-api';
import TableWithPagination from '../../../Component/common/Table/TableWithPagination';
import { useTranslation } from 'react-i18next';
import ModalFormUseForm from '../../../Component/common/Form/ModalFormUseForm';
import ItemTitle from '../../../Component/common/Form/Item/ItemTitle';
import ItemSwitch from '../../../Component/common/Form/Item/ItemSwitch';
import ItemSelectGroup from '../../../Component/group/Form/Item/ItemSelectGroup';
import ItemText from '../../../Component/common/Form/Item/ItemText';
import FormJudgeType from '../../../Component/problem/From/FormJudgeType';
import ProDescriptions from '../../../Component/problem/ProDescriptions';
import ProCheckPoints from '../../../Component/problem/ProCheckPoints';
import { contracts } from '../../../Config/validation/contracts';
import { UrlPrefix } from '../../../Config/constValue';
import PublicAutoFillPanel from '../../../Component/problem/PublicAutoFillPanel';

const MProblem = () => {
  const { t } = useTranslation();
  {
    const beforeSubmit = (value: any) => {
      value.isPublic = value.isPublic ? 1 : 0;
      if (value.functionTemplates === undefined) value.functionTemplates = {};
      const functionTemplates = [];
      for (const x in value.functionTemplates) {
        functionTemplates.push({
          ...value.functionTemplates[x],
          isShowFunctionTemplate: value.functionTemplates[x].isShowFunctionTemplate ? 1 : 0,
        });
      }
      value.functionTemplates = functionTemplates;

      return value;
    };
    const beforeUse = (value: any) => {
      if (value.managerGroups === null) value.managerGroups = [];
      if (value.judgeTemplates === null) value.judgeTemplates = [];
      if (value.functionTemplates !== undefined) {
        const functionTemplates: any = {};
        for (const x of value.functionTemplates) {
          for (let y in x) {
            if (x[y] === null) x[y] = '';
          }
          functionTemplates[x.judgeTemplateId] = { ...x };
        }
        value.functionTemplates = functionTemplates;
      }
      return value;
    };

    const ProblemForm = [
      {
        component: (
          <>
            <ItemTitle
              name={'problemTitle'}
              label={t('title')}
              constraint={contracts.problem.problemTitle}
            />
            <ItemSwitch name={'isPublic'} label={t('public')} />
            <ItemText
              name={'source'}
              label={t('source')}
              required={false}
              constraint={contracts.problem.source}
            />
            <ItemSelectGroup
              name={'managerGroups'}
              constraint={contracts.problem.managerGroups}
              label={t('ManagementGroup')}
              mode={'multiple'}
              formName={'ProblemInfo'}
            />
          </>
        ),
        label: t('BasicInformation'),
      },
      {
        component: (
          <>
            <ItemText
              name={'timeLimit'}
              label={t('TimeLimit')}
              suffix={'ms'}
              constraint={contracts.problem.timeLimit}
              initialValue={1000}
            />
            <ItemText
              name={'memoryLimit'}
              label={t('MemoryLimit')}
              suffix={'KB'}
              constraint={contracts.problem.memoryLimit}
              initialValue={256 * 1024}
            />
            <ItemText
              name={'outputLimit'}
              label={t('OutputLimit')}
              suffix={'KB'}
              constraint={contracts.problem.outputLimit}
              initialValue={100 * 1024}
            />
          </>
        ),
        label: t('JudgeLimit'),
      },
      {
        component: <FormJudgeType />,
        label: t('JudgeMethod'),
      },
    ];

    // 列结构跨断点保持稳定：responsive 增删列会让行内 Modal 整棵卸载（#29）
    let colData: any[] = [
      {
        title: 'ID',
        dataIndex: 'problemId',
        width: 50,
      },
      {
        title: t('problemCode'),
        dataIndex: 'problemCode',
        width: 'auto',
      },
      {
        title: t('title'),
        dataIndex: 'problemTitle',
        width: 'auto',
      },
      {
        title: t('TimeLimit'),
        dataIndex: 'timeLimit',
        width: 'auto',
        render: (text: string) => {
          return (
            <>
              {Math.floor(parseInt(text) / 1000)}s ({text}ms)
            </>
          );
        },
      },
      {
        title: t('MemoryLimit'),
        dataIndex: 'memoryLimit',
        width: 'auto',
        render: (text: string) => {
          return (
            <>
              {Math.floor(parseInt(text) / 1024)}MB ({text}KB)
            </>
          );
        },
      },
      {
        title: 'AC/Submit',
        width: 'auto',
        render: (text: string, row: any) => {
          return (
            <>
              {row.acceptNum} / {row.submitNum}
            </>
          );
        },
      },
      {
        title: t('source'),
        dataIndex: 'source',
        width: 'auto',
      },
      {
        title: t('Owner'),
        dataIndex: 'username',
        width: 'auto',
      },
      {
        title: t('operator'),
        width: 'auto',
        // 操作列必须跨断点保持挂载，否则响应式切换会卸载行内 Modal
        shouldCellUpdate: () => false,
        render: (text: any, rows: any) => {
          return (
            <Space size={3}>
              <ModalFormUseForm
                TableName={'ProblemList'}
                width={900}
                className="problem-editor-modal"
                title={rows.problemCode}
                type={'update'}
                formName={'ProblemInfo'}
                subForm={ProblemForm}
                updateAppendProps={{ problemCode: rows.problemCode }}
                dataSubmitter={(value: any) => {
                  value = beforeSubmit(value);
                  return mApi.updateProblemInfo(value);
                }}
                dataLoader={async () => {
                  return mApi.getProblem({ problemCode: rows.problemCode }).then((value: any) => {
                    value = beforeUse(value);
                    return Promise.resolve(value);
                  });
                }}
              />
              <ModalFormUseForm
                TableName={'ProblemList'}
                width={900}
                className="problem-editor-modal"
                title={t('CreateProblemFrom', { name: rows.problemCode })}
                type={'fork'}
                formName={'ProblemInfo'}
                subForm={ProblemForm}
                dataSubmitter={(value: any) => {
                  value = beforeSubmit(value);
                  return mApi.createProblem(value);
                }}
                dataLoader={async () => {
                  return mApi.getProblem({ problemCode: rows.problemCode }).then((value: any) => {
                    value = beforeUse(value);
                    return Promise.resolve(value);
                  });
                }}
              />
              <ProDescriptions
                problemCode={rows.problemCode}
                title={rows.problemTitle}
                defaultDescriptionId={rows.defaultDescriptionId}
              />
              <ProCheckPoints problemCode={rows.problemCode} title={rows.problemTitle} />
              <PublicAutoFillPanel problemCode={rows.problemCode} />
            </Space>
          );
        },
      },
    ];

    return (
      <div style={{ marginTop: -20, overflow: 'hidden' }}>
        <Card
          size={'small'}
          variant="outlined"
          title={t('ProblemList')}
          extra={
            <Space wrap>
              <Button href={UrlPrefix + '/manage/problemSet/problem_group'}>
                客观题 / 主观题组
              </Button>
              <DevOnly>
                <Button href={UrlPrefix + '/manage/intelligent'}>
                  智能管理
                  <DevBadge />
                </Button>
              </DevOnly>
              <ModalFormUseForm
                TableName={'ProblemList'}
                width={900}
                className="problem-editor-modal"
                title={t('CreateProblem')}
                type={'create'}
                subForm={ProblemForm}
                dataSubmitter={(value: any) => {
                  value = beforeSubmit(value);
                  return mApi.createProblem(value);
                }}
              />
            </Space>
          }
        >
          <TableWithPagination
            search={true}
            columns={colData}
            API={MApi.getProblemList}
            size={'small'}
            name={'ProblemList'}
            rowKey={'problemId'}
          />
        </Card>
      </div>
    );
  }
};

export default MProblem;
