import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Popconfirm } from 'antd';
import { EditOutlined, MenuOutlined, PlusOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { ActionType, EditableProTable, ProColumns } from '@ant-design/pro-components';
import { arrayMoveImmutable } from 'array-move';
import {
  DragHandle,
  SortableTableScope,
  sortableTableComponents,
} from '../common/Table/SortableTable';
import { withTranslation } from 'react-i18next';
import { genNumberList } from '../../Type/IManage';
import mApi from 'Utils/API/m-api';
import Paragraph from 'antd/lib/typography/Paragraph';
import { examProblemDescription, examProblemInfo, examProblemType } from '../../Type/IExam';
import { createCachedRequest, updateMatchingProblemRow } from './problemLookup';

const ProblemAddForm = (props: any) => {
  const { groupId, listData, setListData } = props;
  // 可编辑表格的操作引用
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const getListData = (type?: string) => {
    const group = props.listData.find((item: any) => item.groupId === props.groupId);
    if (group) {
      if (type === undefined) return group.proList ?? [];
      if (type === 'problemInfo') return group.problemInfo ?? [];
      if (type === 'checkedProblemCode') return group.checkedProblemCode ?? [];
    }
    return [];
  };
  const strMatch = (value: string) => {
    if (typeof value !== 'string') return null;
    if (props.type === 'single' || props.type === 'multi') return value.match(/^SDUOJ-C-[0-9]{4}$/);
    if (props.type === 'program') return value.match(/^SDUOJ-[0-9]{4}$/);
    return null;
  };

  // === State ===
  const [sortSwitch, setSortSwitch] = useState<boolean>(false); // 操作是否开启排序模式
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(genNumberList(getListData())); // 编辑区域构造
  const [proListData, setProListData] = useState<examProblemType[]>(getListData());
  const [problemInfo, setProblemInfo] = useState<examProblemInfo[]>(getListData('problemInfo')); // 记录题面选项信息
  const [checkedProblemCode, setCheckedProblemCode] = useState<string[]>(
    getListData('checkedProblemCode'),
  );
  const [isStart, setIsStart] = useState<boolean>(props.isStart);
  const isStartRef = useRef(isStart);
  isStartRef.current = isStart;
  const proListDataRef = useRef(proListData);
  const problemInfoRef = useRef(problemInfo);
  const problemRequests = useRef(createCachedRequest<string, any>());
  const descriptionRequests = useRef(createCachedRequest<string, examProblemInfo>());
  proListDataRef.current = proListData;
  problemInfoRef.current = problemInfo;

  useEffect(() => {
    if (!listData.some((item: any) => item.groupId === groupId)) {
      setListData((current: any[]) => [
        ...current,
        { groupId, proList: [], problemInfo: [], checkedProblemCode: [] },
      ]);
    }
  }, [groupId, listData, setListData]);

  const setListDataAll = (listData: examProblemType[]) => {
    const nextList = [...listData];
    proListDataRef.current = nextList;
    props.setListData((current: any[]) =>
      current.map((group) =>
        group.groupId === props.groupId ? { ...group, proList: nextList } : group,
      ),
    );
    setProListData(nextList);
    props.updateGroup();
    // 刷新当前界面的编辑值
    setEditableRowKeys([]);
    setEditableRowKeys(genNumberList(nextList));
  };
  const setProblemInfoAll = (data: examProblemInfo[]) => {
    const nextInfo = [...data];
    problemInfoRef.current = nextInfo;
    props.setListData((current: any[]) =>
      current.map((group) =>
        group.groupId === props.groupId ? { ...group, problemInfo: nextInfo } : group,
      ),
    );
    setProblemInfo(nextInfo);
  };
  const setCheckedProblemCodeAll = (data: string[]) => {
    const nextCodes = [...data];
    props.setListData((current: any[]) =>
      current.map((group) =>
        group.groupId === props.groupId ? { ...group, checkedProblemCode: nextCodes } : group,
      ),
    );
    setCheckedProblemCode(nextCodes);
  };
  const getValueEnum = (problemCode?: string) => {
    if (problemCode === undefined) return {};
    for (const x of problemInfo) {
      if (x.problemCode === problemCode) return x.problemDescription;
    }
    if (strMatch(problemCode) !== null) {
      void descriptionRequests.current
        .get(problemCode, async () => {
          const resData = await mApi.getProblemDescriptionList({ problemCode });
          if (resData === null) throw new Error(props.t('ProblemNotExist'));
          const descriptions: any = {};
          const data = resData as unknown as examProblemDescription[];
          for (const description of data) {
            descriptions[description.id] = { text: description.title };
          }
          return { problemCode, problemDescription: descriptions };
        })
        .then((loaded) => {
          const withoutOld = problemInfoRef.current.filter(
            (item) => item.problemCode !== problemCode,
          );
          setProblemInfoAll([...withoutOld, loaded]);
          setEditableRowKeys(genNumberList(proListDataRef.current));
        })
        .catch(() => undefined);
    }
    return {};
  };

  const updateProblemRow = (
    rowId: React.Key | undefined,
    problemCode: string,
    changes: Partial<examProblemType>,
  ) => {
    const current = proListDataRef.current;
    const next = updateMatchingProblemRow(current, rowId, problemCode, changes);
    if (next.some((row, index) => row !== current[index])) setListDataAll(next);
  };

  const queryProblem = (problemCode: string) =>
    problemRequests.current.get(problemCode, async () => {
      if (props.type === 'program') {
        const problem: any = await mApi.getProblem({ problemCode });
        if (problem === null) throw new Error(props.t('ProblemNotExist'));
        return {
          ProblemAlias: problem.problemTitle,
          ProblemDescription: problem.defaultDescriptionId,
        };
      }

      const problem: any = await mApi.getChoiceProblem({ problemCode });
      if (problem === null) throw new Error(props.t('ProblemNotExist'));
      if (problem.isMulti === 1 && props.type === 'single') {
        throw new Error(props.t('SingleGroupCantUseMulti'));
      }
      if (problem.isMulti === 0 && props.type === 'multi') {
        throw new Error(props.t('MultiGroupCantUseSingle'));
      }
      const description =
        typeof problem.description === 'string'
          ? JSON.parse(problem.description)
          : problem.description;
      let preview = `${description.content}\n`;
      const choices = Object.keys(description.choice);
      choices.forEach((choice, index) => {
        preview += `${choice}.${description.choice[choice]}${index < choices.length - 1 ? '\n' : ''}`;
      });
      return { ProblemDescription: preview };
    });

  // === 拖拽排序 ===
  // 可拖拽的排序手柄

  // 排序结束后
  const onSortEnd = ({ oldIndex, newIndex }: any) => {
    // 当前排序是有效的
    if (oldIndex !== newIndex) {
      // 移动数组中的元素，并设置到当前的状态
      setListDataAll(arrayMoveImmutable(proListData, oldIndex, newIndex));
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (props.type !== 'program') {
        const x = isStartRef.current;
        setIsStart(false);
        form.validateFields().then(() => {
          setIsStart(x);
        });
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [form, props.isDataLoad, props.type]);

  const sortColumns: ProColumns<examProblemType>[] = [
    {
      title: (
        <Button
          type="text"
          key="operator"
          onClick={() => {
            setSortSwitch(!sortSwitch);
          }}
          icon={sortSwitch ? <EditOutlined /> : <SortAscendingOutlined />}
          disabled={isStart}
        />
      ),
      dataIndex: 'sort',
      width: 50,
      className: 'drag-visable',
      render: () => (sortSwitch ? <DragHandle /> : undefined),
      editable: () => {
        return false;
      },
    },
  ];
  const baseAColumns: ProColumns<examProblemType>[] = [
    {
      title: (
        <Button
          type="text"
          onClick={() => {
            const code =
              proListData.length === 0
                ? undefined
                : proListData[proListData.length - 1].ProblemCode;
            const score =
              proListData.length === 0
                ? undefined
                : proListData[proListData.length - 1].ProblemScore;
            const submitNumber =
              proListData.length === 0
                ? undefined
                : proListData[proListData.length - 1].ProblemSubmitNumber;
            const number = code === undefined ? 0 : parseInt(code.substr(-4));
            const NewCode =
              code === undefined
                ? undefined
                : code.substr(0, code.length - 4) + (number + 1).toString();
            actionRef.current?.addEditRecord?.(
              {
                id: Date.now(),
                ProblemCode: NewCode,
                ProblemScore: score,
                ProblemSubmitNumber: submitNumber,
              },
              { newRecordType: 'dataSource', recordKey: Date.now() },
            );
            if (NewCode !== undefined)
              setTimeout(() => {
                form.validateFields();
              }, 100);
          }}
          icon={<PlusOutlined />}
          disabled={sortSwitch || isStart}
        />
      ),
      dataIndex: 'id',
      valueType: 'index',
      width: 50,
      render: (text, record, index) => {
        return <span>{index + 1}</span>;
      },
      editable: () => {
        return false;
      },
    },
    {
      title: props.t('ProblemCode'),
      dataIndex: 'ProblemCode',
      width: 200,
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            () => ({
              validator(_, value) {
                if (strMatch(value) === null) {
                  return Promise.reject(new Error(props.t('ProblemCodeFormatError')));
                }
                const rowId = proListDataRef.current[rowIndex]?.id;
                return queryProblem(value).then((changes) => {
                  updateProblemRow(rowId, value, changes);
                  if (!checkedProblemCode.includes(value)) {
                    setCheckedProblemCodeAll([...checkedProblemCode, value]);
                  }
                });
              },
            }),
          ],
        };
      },
      editable: () => {
        return !isStart;
      },
    },
  ];
  const ObjectiveColumns: ProColumns<examProblemType>[] = [
    {
      title: props.t('ProblemContentLabel'),
      dataIndex: 'ProblemDescription',
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [{ required: true, message: props.t('fieldRequired') }],
        };
      },
      editable: () => {
        return false;
      },
      render: (t, record) => {
        return (
          <Paragraph>
            <pre>{record.ProblemDescription}</pre>
          </Paragraph>
        );
      },
    },
  ];
  const programColumns: ProColumns<examProblemType>[] = [
    {
      title: props.t('ProblemAlias'),
      dataIndex: 'ProblemAlias',
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            { required: true, message: '此项为必填项' },
            { type: 'string', min: 1, max: 60 },
          ],
        };
      },
      editable: () => {
        return true;
      },
    },
    {
      title: props.t('ProblemDescription'),
      dataIndex: 'ProblemDescription',
      valueType: 'select',
      valueEnum: (row) => getValueEnum(row.ProblemCode),
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            { required: true, message: props.t('fieldRequired') },
            { type: 'string', min: 1, max: 60 },
          ],
        };
      },
      editable: () => {
        return true;
      },
    },
    {
      title: props.t('SubmitLimit'),
      dataIndex: 'ProblemSubmitNumber',
      editable: () => {
        return true;
      },
    },
  ];
  const baseBColumns: ProColumns<examProblemType>[] = [
    {
      title: props.t('ProblemScore'),
      dataIndex: 'ProblemScore',
      valueType: 'digit',
      width: 140,
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            { required: true, message: props.t('fieldRequired') },
            { type: 'number', min: 0, max: 100 },
          ],
        };
      },
      editable: () => {
        return true;
      },
    },
  ];
  const operatorColumns: ProColumns<examProblemType>[] = [
    {
      title: props.t('operator'),
      valueType: 'option',
      width: 80,
      render: (text, record, _, action) => [],
    },
  ];

  // 动态控制列
  let columns: ProColumns<examProblemType>[] = [];
  columns = columns.concat(sortColumns);
  columns = columns.concat(baseAColumns);
  if (props.type === 'single' || props.type === 'multi') columns = columns.concat(ObjectiveColumns);
  if (props.type === 'program') columns = columns.concat(programColumns);
  columns = columns.concat(baseBColumns);
  if (!sortSwitch) columns = columns.concat(operatorColumns);

  return (
    <>
      <SortableTableScope
        items={proListData.map((row: { id: React.Key }) => row.id)}
        disabled={!sortSwitch}
        onSortEnd={onSortEnd}
      >
        <EditableProTable<examProblemType>
          value={proListData}
          onChange={(value) => setProListData([...value])}
          columns={columns}
          rowKey={'id'}
          recordCreatorProps={false}
          actionRef={actionRef}
          editable={{
            type: 'multiple',
            form: form,
            editableKeys: sortSwitch ? [] : editableKeys,
            actionRender: (row: any, config: any, defDom: any) => {
              return [
                <Popconfirm
                  key={row.id}
                  title={props.t('deleteConfirm')}
                  onConfirm={() => {
                    const data = proListData.filter(
                      (value: examProblemType) => value.id !== row.id,
                    );
                    setListDataAll(data);
                    setEditableRowKeys(genNumberList(data));
                  }}
                  okText={props.t('yes')}
                  cancelText={props.t('no')}
                >
                  <Button type={'link'} size={'small'}>
                    {' '}
                    {props.t('delete')}{' '}
                  </Button>
                </Popconfirm>,
              ];
            },
            onValuesChange: (record, recordList) => {
              let NewDate = [];
              for (let i = 0; i < recordList.length; i++) {
                if (recordList[i].id !== undefined) NewDate.push(recordList[i]);
              }
              setListDataAll(NewDate);
            },
            onChange: (keys: React.Key[]) => {
              setEditableRowKeys(keys);
            },
          }}
          components={sortSwitch ? sortableTableComponents : undefined}
        />
      </SortableTableScope>
    </>
  );
};

export default withTranslation()(ProblemAddForm);
