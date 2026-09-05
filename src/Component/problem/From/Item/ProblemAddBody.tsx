import React, { useEffect, useRef, useState } from 'react';
import { Button, Popconfirm, Popover, Space } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  MenuOutlined,
  PlusOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { ActionType, EditableProTable, ProColumns } from '@ant-design/pro-components';
import { arrayMoveImmutable } from 'array-move';
import {
  DragHandle,
  SortableTableScope,
  sortableTableComponents,
} from '../../../common/Table/SortableTable';
import { useTranslation } from 'react-i18next';
import { genNumberList } from '../../../../Type/IManage';
import mApi from 'Utils/API/m-api';
import Paragraph from 'antd/lib/typography/Paragraph';
import { examProblemType } from '../../../../Type/IExam';
import { ck, get, isValueEmpty } from '../../../../Utils/empty';
import { SketchPicker } from 'react-color';
import { createCachedRequest } from '../../problemLookup';

export const defaultKeyMapping = {
  ProblemCode: 'ProblemCode',
  ProblemAlias: 'ProblemAlias',
  defaultDescriptionId: 'defaultDescriptionId',
  ProblemPreview: 'ProblemPreview',
  ProblemSubmitNumber: 'ProblemSubmitNumber',
  ProblemScore: 'ProblemScore',
  problemColor: 'problemColor',
  antiCheatingRate: 'antiCheatingRate',
};

interface ProblemAddBodyType {
  problemType: 'single' | 'multi' | 'program';
  useSubmitLimit: boolean;
  useColor: boolean;
  editable: boolean;

  initNewLine: any; // 新增一行时，如何根据已有信息
  keyMapping: any;

  value: any;
  onChange: any;
}

const ProblemAddBody = (props: ProblemAddBodyType & any) => {
  const { t } = useTranslation();

  // 可编辑表格的操作引用
  const actionRef = useRef<ActionType>();
  const keyMapping = { ...defaultKeyMapping, ...props.keyMapping };

  // === State ===
  const [sortSwitch, setSortSwitch] = useState<boolean>(false); // 操作是否开启排序模式
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(
    genNumberList(ck(props.value, [])),
  ); // 编辑区域构造

  const [TableData, setTableDataX] = useState<any[]>([]);
  const [TableDataHis, setTableDataHis] = useState<Record<string | number, string>>({});
  const setTableData = (data: any) => {
    // console.log("setTableData", data)
    props.onChange && props.onChange(data);
    setTableDataX([...data]);
  };

  const [problemInfoCache, setProblemInfoCacheX] = useState<any>({}); // 根据题号请求得到的题目信息的缓存
  const [problemDescriptionCache, setProblemDescriptionCacheX] = useState<{
    [key: string]: {
      DescriptionInfo: any;
    };
  }>({}); // 根据题号请求得到的题目描述的缓存
  const problemInfoRequests = useRef(createCachedRequest<string, void>());
  const problemDescriptionRequests = useRef(createCachedRequest<string, void>());

  // 执行初始化
  useEffect(() => {
    if (props.value !== undefined && TableData.length === 0) {
      setTableDataX(props.value);
      setEditableRowKeys(genNumberList(props.value));
      const nextHistory: Record<string | number, string> = {};
      for (let x of props.value) {
        let nowKey = x[keyMapping['ProblemCode']];
        nextHistory[x.id] = nowKey;
        getProblemDescriptionInfo(nowKey).catch(() => undefined);
      }
      setTableDataHis(nextHistory);
    }
  }, [props, props.value, TableData]);

  useEffect(() => {
    // console.log("update", TableData, TableDataHis, problemInfoCache, problemDescriptionCache)
    let use = false;
    const nextHistory = { ...TableDataHis };
    const newTableData = TableData.map((value) => {
      if (strMatch(value[keyMapping['ProblemCode']]) !== null) {
        let obj: any = {},
          updateNum = 0,
          forceUpdate = false;
        // 根据是否已经加载过数据，判断是否更新当前区域
        if (TableDataHis[value.id] !== value[keyMapping['ProblemCode']]) {
          nextHistory[value.id] = value[keyMapping['ProblemCode']];
          forceUpdate = true;
        }

        const check = (nameA: string, arr: any) => {
          let nowKey = value[keyMapping['ProblemCode']];
          if (
            forceUpdate ||
            (value[nameA] === undefined && get(arr[nowKey], nameA) !== undefined)
          ) {
            obj[nameA] = get(arr[nowKey], nameA);
            updateNum += 1;
          }
        };

        check(keyMapping['ProblemAlias'], problemInfoCache);
        check(keyMapping['defaultDescriptionId'], problemInfoCache);
        check(keyMapping['ProblemPreview'], problemInfoCache);
        check('DescriptionInfo', problemDescriptionCache);

        for (const x in value) {
          if (!(x in obj)) obj[x] = value[x];
        }

        if (updateNum !== 0) {
          use = true;
          return {
            id: value.id,
            [keyMapping['ProblemCode']]: value[keyMapping['ProblemCode']],
            ...obj,
          };
        }
      }
      return value;
    });
    // console.log("use", use, "useHis", useHis)
    // console.log("newTableData", newTableData, "TableDataHis", TableDataHis)
    if (use) setTableData(newTableData);
    if (Object.keys(nextHistory).some((key) => nextHistory[key] !== TableDataHis[key])) {
      setTableDataHis(nextHistory);
    }
  }, [TableData, TableDataHis, problemInfoCache, problemDescriptionCache]);

  // console.log("TableData", TableData)

  // === 拖拽排序 ===

  // 题目信息匹配
  const ProblemType = props.problemType;
  const strMatch = (value?: string) => {
    if (value === undefined) return null;
    if (ProblemType === 'single' || ProblemType === 'multi')
      return value.match(/SDUOJ-C-[0-9]{4}$/);
    if (ProblemType === 'program') return value.match(/SDUOJ-[0-9]{4}$/);
  };

  // 获取题目描述信息
  const getProblemDescriptionInfo = async (problemCode?: string) => {
    if (problemCode === undefined) return {};
    if (strMatch(problemCode) === null) return Promise.reject(t('ProblemCodeFormatError'));
    return problemDescriptionRequests.current.get(problemCode, async () => {
      const resData = await mApi.getProblemDescriptionList({ problemCode });
      if (resData === null) throw new Error(t('ProblemNotExist'));
      const descriptions: any = {};
      for (const description of resData as any[]) {
        descriptions[description.id] = { text: description.title };
      }
      setProblemDescriptionCacheX((current) => ({
        ...current,
        [problemCode]: { DescriptionInfo: descriptions },
      }));
    });
  };

  const getProblemInfo = async (problemCode: string) => {
    // console.log("getProblemInfo", TableData, problemCode, rowID)
    if (problemCode === undefined) return Promise.reject(t('fieldRequired'));
    if (strMatch(problemCode) === null) return Promise.reject(t('ProblemCodeFormatError'));
    return problemInfoRequests.current.get(problemCode, async () => {
      if (ProblemType === 'program') {
        const resData: any = await mApi.getProblem({ problemCode });
        if (resData === null) throw new Error(t('ProblemNotExist'));
        setProblemInfoCacheX((current: any) => ({
          ...current,
          [problemCode]: {
            [keyMapping['ProblemAlias']]: resData.problemTitle,
            [keyMapping['defaultDescriptionId']]: resData.defaultDescriptionId,
          },
        }));
        return;
      }

      const resData: any = await mApi.getChoiceProblem({ problemCode });
      if (resData === null) throw new Error(t('ProblemNotExist'));
      if (resData.isMulti === 1 && ProblemType === 'single') {
        throw new Error(t('SingleGroupCantUseMulti'));
      }
      if (resData.isMulti === 0 && ProblemType === 'multi') {
        throw new Error(t('MultiGroupCantUseSingle'));
      }
      const problem =
        typeof resData.description === 'string'
          ? JSON.parse(resData.description)
          : resData.description;
      let preview = `${problem.content}\n`;
      const choices = Object.keys(problem.choice);
      choices.forEach((choice, index) => {
        preview += `${choice}.${problem.choice[choice]}${index < choices.length - 1 ? '\n' : ''}`;
      });
      setProblemInfoCacheX((current: any) => ({
        ...current,
        [problemCode]: { [keyMapping['ProblemPreview']]: preview.substring(0, 50) },
      }));
    });
  };

  const SortColumnItem: ProColumns[] = [
    {
      title: (
        <Button
          type="text"
          key="operator"
          onClick={() => {
            setSortSwitch(!sortSwitch);
          }}
          icon={sortSwitch ? <CheckOutlined /> : <SwapOutlined />}
          disabled={!props.editable}
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
  const IdColumnItem: ProColumns[] = [
    {
      title: 'ID',
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
  ];
  const ProblemCodeColumnItem: ProColumns[] = [
    {
      title: t('ProblemCodeLabel'),
      dataIndex: keyMapping['ProblemCode'],
      width: 200,
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            ({ getFieldValue }) => ({
              validator(_, value) {
                return getProblemInfo(value).then(() => {
                  return getProblemDescriptionInfo(value);
                });
              },
            }),
          ],
        };
      },
      editable: () => {
        return props.editable;
      },
    },
  ];
  const ObjectiveProblemPreviewColumnItem: ProColumns[] = [
    {
      title: t('ProblemPreview'),
      dataIndex: keyMapping['ProblemPreview'],
      editable: () => {
        return false;
      },
      render: (t, record) => {
        return (
          <Paragraph>
            <pre className={'preAutoLine'}>{record[keyMapping['ProblemPreview']]}</pre>
          </Paragraph>
        );
      },
    },
  ];
  const ProgramingProblemInfoColumnItem: ProColumns[] = [
    {
      title: t('ProblemAliasLabel'),
      dataIndex: keyMapping['ProblemAlias'],
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
      title: t('ProblemDescriptionLabel'),
      dataIndex: keyMapping['defaultDescriptionId'],
      valueType: 'select',
      valueEnum: (row) => row.DescriptionInfo,
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
  ];
  const ProblemSubmitLimitColumnItem: ProColumns[] = [
    {
      title: t('SubmitLimitTimes'),
      dataIndex: keyMapping['ProblemSubmitNumber'],
      valueType: 'digit',
      width: 140,
      editable: () => {
        return true;
      },
    },
  ];
  const ProblemScoreColumnItem: ProColumns[] = [
    {
      title: t('ProblemWeight'),
      dataIndex: keyMapping['ProblemScore'],
      valueType: 'digit',
      width: 140,
      formItemProps: (form, { rowIndex }) => {
        return {
          rules: [
            { required: true, message: '此项为必填项' },
            { type: 'number', min: 0, max: 100 },
          ],
        };
      },
      editable: () => {
        return true;
      },
    },
  ];
  const ProblemAntiCheatColumnItem: ProColumns[] = [
    {
      title: t('DuplicateRate'),
      dataIndex: keyMapping['antiCheatingRate'],
      tooltip: t('DuplicateRateTooltip'),
      valueType: 'digit',
      width: 140,
      editable: () => {
        return true;
      },
    },
  ];
  const ProblemColorColumnItem: ProColumns[] = [
    {
      title: t('BalloonColor'),
      dataIndex: keyMapping['problemColor'],
      width: 140,
      renderFormItem: () => <ColorPickerBody />,
    },
  ];
  const OperatorColumnItem: ProColumns<examProblemType>[] = [
    {
      title: t('operator'),
      valueType: 'option',
      width: 80,
      render: (text, record, _, action) => [],
    },
  ];

  // 动态控制列
  let columns: ProColumns[] = [];
  columns = columns.concat(SortColumnItem);
  columns = columns.concat(IdColumnItem);
  columns = columns.concat(ProblemCodeColumnItem);

  if (ProblemType === 'single' || ProblemType === 'multi')
    columns = columns.concat(ObjectiveProblemPreviewColumnItem);
  if (ProblemType === 'program') {
    columns = columns.concat(ProgramingProblemInfoColumnItem);
    if (props.useSubmitLimit) columns = columns.concat(ProblemSubmitLimitColumnItem);
    if (props.useColor) columns = columns.concat(ProblemColorColumnItem);
    if (props.useAntiCheating) columns = columns.concat(ProblemAntiCheatColumnItem);
  }
  columns = columns.concat(ProblemScoreColumnItem);

  if (!sortSwitch) columns = columns.concat(OperatorColumnItem);

  // console.log(columns, TableData, props.value)

  return (
    <>
      <SortableTableScope
        items={TableData.map((row: { id: React.Key }) => row.id)}
        disabled={!sortSwitch}
        onSortEnd={({ oldIndex, newIndex }) =>
          setTableData(arrayMoveImmutable(TableData, oldIndex, newIndex))
        }
      >
        <EditableProTable
          value={TableData}
          onChange={setTableData}
          controlled={true}
          columns={columns}
          rowKey={'id'}
          recordCreatorProps={false}
          actionRef={actionRef}
          editable={{
            type: 'multiple',
            editableKeys: sortSwitch ? [] : editableKeys,
            actionRender: (row: any, config: any, defDom: any) => {
              return [
                <Popconfirm
                  title={t('deleteConfirm')}
                  onConfirm={() => {
                    const data = TableData.filter((value: any) => value.id !== row.id);
                    setTableData(data);
                    setEditableRowKeys(genNumberList(data));
                  }}
                  okText={t('yes')}
                  cancelText={t('no')}
                >
                  <Button type={'link'} size={'small'}>
                    {' '}
                    {t('delete')}{' '}
                  </Button>
                </Popconfirm>,
              ];
            },
            onValuesChange: (record, recordList) => {
              let NewDate = [];
              for (let i = 0; i < recordList.length; i++) {
                if (recordList[i].id !== undefined) NewDate.push(recordList[i]);
              }
              setTableData(NewDate);
            },
            onChange: (keys: React.Key[]) => {
              setEditableRowKeys(keys);
            },
          }}
          components={sortSwitch ? sortableTableComponents : undefined}
        />
      </SortableTableScope>
      <Button
        type="dashed"
        block
        onClick={() => {
          let nData = props.initNewLine(TableData, keyMapping);
          if (nData[keyMapping['ProblemCode']] !== undefined) {
            getProblemInfo(nData[keyMapping['ProblemCode']]).then(() => {
              getProblemDescriptionInfo(nData[keyMapping['ProblemCode']]);
            });
          }
          actionRef.current?.addEditRecord?.(nData, {
            newRecordType: 'dataSource',
            recordKey: Date.now(),
          });
        }}
        icon={<PlusOutlined />}
        disabled={sortSwitch || !props.editable}
        style={{ display: sortSwitch || !props.editable ? 'none' : undefined }}
      />
    </>
  );
};

const ColorPickerBody = ({ value, onChange }: any) => {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (value === undefined) {
      onChange('');
    }
  }, [value, onChange]);

  return (
    <Space size={12}>
      <Popover
        content={
          <SketchPicker
            color={value}
            onChangeComplete={(v: any) => {
              onChange(v.hex);
              setOpen(false);
            }}
          />
        }
        trigger="click"
        open={open}
        onOpenChange={setOpen}
      >
        <div
          style={{
            background: value,
            width: 30,
            height: 30,
            border: isValueEmpty(value) ? '1px solid #000' : undefined,
            textAlign: 'center',
            margin: 0,
            lineHeight: '25px',
          }}
          onClick={() => setOpen(true)}
        >
          {isValueEmpty(value) ? '无' : undefined}
        </div>
      </Popover>
      {!isValueEmpty(value) && (
        <Button
          icon={<CloseOutlined />}
          size={'small'}
          type={'dashed'}
          onClick={() => {
            onChange('');
          }}
        />
      )}
    </Space>
  );
};

export default ProblemAddBody;
