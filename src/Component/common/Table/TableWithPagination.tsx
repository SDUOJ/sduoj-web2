import { Alert, Button, Card, Form, List, Space, Table } from 'antd';
import React, { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultPageSize } from '../../../Config/constValue';
import { UserState } from '../../../Type/Iuser';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import Search from 'antd/es/input/Search';
import { TableState } from '../../../Type/ITable';
import { ck } from '../../../Utils/empty';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { ColumnsType } from 'antd/lib/table/interface';
import { useForm } from 'antd/es/form/Form';

export interface TableWithPaginationProps {
  API: (params: { pageNow: number; pageSize: number; searchKey?: string; [key: string]: any }) =>
    | Promise<{
        rows?: any[];
        totalNum?: number | string;
        totalPage?: number;
      }>
    | {
        rows?: any[];
        totalNum?: number | string;
        totalPage?: number;
      }; // 表格查询数据的接口
  size: SizeType; // 表格的大小
  columns: ColumnsType<any>; // 表格的列
  name: string; // 表格名称
  APIRowsTransForm?: (rows: any[]) => any[]; // 针对API传输的数据进行转化的函数
  search?: boolean; // 是否开启搜索功能
  defaultPageSize?: number; // 表格默认的页大小
  initRequestProps?: Record<string, any>;
  getForm?: (onFinish: () => void) => React.ReactNode;
  useFormBtn?: boolean;
  useList?: boolean;
  title?: React.ReactNode;
  grid?: any;
  renderItem?: (item: any) => React.ReactNode;
  showSizeChanger?: boolean;
  pagination?: any;
  cardProps?: string | React.CSSProperties;

  // 面向 可选择的行 开放的接口
  // setDataSource?: any       // 输出当前表格的数据
  rowKey?: any; // 作为 key 记录的值
  rowSelection?: any; // 可选列的相关配置
  setDataSource?: (data: any, name: string) => void;
  tableData?: TableState['tableData'];
  setTableInfo?: (name: string, data: any) => void;

  /** （新增）列表模式下是否需要显示卡片边框；默认 false（原先预期无边框） */
  listCardBordered?: boolean;
  /** （新增）列表模式下卡片附加 className（原 cardProps 命名不准确，保留兼容） */
  cardClassName?: string;
  /** （新增）列表模式下卡片 style */
  cardStyle?: React.CSSProperties;
}

const TableWithPagination = (props: TableWithPaginationProps) => {
  const { t } = useTranslation();
  const { name, setDataSource } = props;
  const tableDataState = useMemo(() => props.tableData ?? {}, [props.tableData]);
  const tableDataStateRef = useRef(tableDataState);
  tableDataStateRef.current = tableDataState;
  const [total, setTotal] = useState<number>(0); // 项的总数
  const [tableData, setTableDataX] = useState(); // 表格核心数据
  const [loading, setLoading] = useState(true); // 表格的加载状态
  const [error, setError] = useState<unknown>();
  const [PageNow, setPageNow] = useState<number>(1); // 当前的页码数
  const [PageSize, setPageSize] = useState<number>(ck(props.defaultPageSize, defaultPageSize)); // 当前的页大小
  const [searchText, setSearchText] = useState<string | undefined>(); // 搜索的文本
  const [tableVersion, setTableVersion] = useState<number>(0); // 表格版本（控制表格刷新）
  const requestIdRef = useRef(0);
  const [form] = useForm();
  const getInfoRef =
    useRef<
      (
        pageNow?: number,
        pageSize?: number,
        searchKey?: string,
        moreProps?: any,
        useCachedState?: boolean,
      ) => void
    >();
  const apiSignature = (props.API as any)?._isMockFunction ? props.API : String(props.API);
  const apiRef = useRef(apiSignature);
  const apiChangedRef = useRef(false);
  const skipInitialVersionRef = useRef(true);
  const hasGetForm = props.getForm !== undefined;
  const initRequestSignature = JSON.stringify(props.initRequestProps ?? null);
  const initRequestPropsRef = useRef(props.initRequestProps);
  initRequestPropsRef.current = props.initRequestProps;
  apiChangedRef.current = apiRef.current !== apiSignature;
  apiRef.current = apiSignature;
  const pageSizeRef = useRef(PageSize);
  pageSizeRef.current = PageSize;

  const setTableData = useCallback(
    (data: any) => {
      setTableDataX(data);
      // 若有 选中行 的相关配置，传递数据进行更新
      if (setDataSource !== undefined && name !== undefined) setDataSource(data, name);
    },
    [name, setDataSource],
  );
  // 这里的所有的参数都只能增量的修改，不能删除，删除需要手动更新 redux
  const getInfo = (
    pageNow?: number,
    pageSize?: number,
    searchKey?: string,
    moreProps?: any,
    useCachedState = true,
  ) => {
    const requestId = ++requestIdRef.current;
    const propsTableInfo = tableDataState[props.name]?.tableInfo;
    if (useCachedState && propsTableInfo !== undefined) {
      if (moreProps === undefined && propsTableInfo.moreProps !== undefined) {
        form.setFieldsValue(propsTableInfo.moreProps);
      }
      pageNow = pageNow ?? propsTableInfo.pageNow;
      pageSize = pageSize ?? propsTableInfo.pageSize;
      searchKey = searchKey ?? propsTableInfo.searchKey;
      moreProps = moreProps ?? props.initRequestProps ?? propsTableInfo.moreProps;
    }
    let pn = pageNow ?? PageNow;
    let ps = pageSize ?? PageSize;
    let sk = searchKey ?? searchText;
    const rawMoreProps = moreProps ?? (props.getForm ? form.getFieldsValue() : {});
    const fmp = Object.fromEntries(
      Object.entries(rawMoreProps ?? {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
    setPageNow(pn);
    setPageSize(ps);
    setSearchText(sk);
    setLoading(true);
    setError(undefined);
    Promise.resolve()
      .then(() =>
        props.API({
          pageNow: pn,
          pageSize: ps,
          searchKey: sk,
          ...fmp,
        }),
      )
      .then((data: any) => {
        if (requestId !== requestIdRef.current) return;
        // console.log("data", data)
        const rows = data.rows ?? [];
        if (props.APIRowsTransForm !== undefined) {
          setTableData(props.APIRowsTransForm(rows));
        } else setTableData(rows);
        const parsedTotal = Number(data.totalNum);
        if (Number.isFinite(parsedTotal)) {
          setTotal(parsedTotal);
          props.name &&
            props.setTableInfo?.(props.name, {
              total: parsedTotal,
              pageNow: pn,
              pageSize: ps,
              searchKey: sk,
              moreProps: fmp,
            });
        } else {
          const fallbackTotal = Number.isFinite(Number(data.totalPage))
            ? ps * Number(data.totalPage)
            : rows.length;
          setTotal(fallbackTotal);
          props.name &&
            props.setTableInfo?.(props.name, {
              total: fallbackTotal,
              pageNow: pn,
              pageSize: ps,
              searchKey: sk,
              moreProps: fmp,
            });
        }
      })
      .catch((requestError) => {
        if (requestId === requestIdRef.current) setError(requestError);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  };
  getInfoRef.current = getInfo;
  const retry = () => {
    getInfoRef.current?.(PageNow, PageSize, searchText, form.getFieldsValue(), false);
  };
  const hasError = error !== undefined;

  useEffect(() => {
    if (hasGetForm) form.setFieldsValue(initRequestPropsRef.current);
    if (apiChangedRef.current) {
      apiChangedRef.current = false;
      setPageNow(1);
      setSearchText(undefined);
      getInfoRef.current?.(
        1,
        pageSizeRef.current,
        undefined,
        initRequestPropsRef.current ?? {},
        false,
      );
    } else {
      getInfoRef.current?.();
    }
    const persistedVersion = tableDataStateRef.current[props.name]?.tableVersion;
    if (persistedVersion !== undefined && persistedVersion > 0) setTableVersion(persistedVersion);
    skipInitialVersionRef.current = persistedVersion !== undefined && persistedVersion > 0;
    return () => {
      requestIdRef.current += 1;
    };
  }, [props.name, apiSignature, hasGetForm, initRequestSignature, form]);

  // 带有表单的筛选
  const onFinish = () => {
    const values = form.getFieldsValue();
    getInfoRef.current?.(1, PageSize, undefined, values);
  };
  const onReset = () => {
    const values = form.getFieldsValue();
    form.resetFields();
    const valuesAfter = form.getFieldsValue();
    // 重置前后若发生改变，则重新加载表格
    if (JSON.stringify(values) !== JSON.stringify(valuesAfter)) {
      getInfoRef.current?.(1, PageSize, undefined, {}, false);
    }
  };

  useEffect(() => {
    // 监听表格的版本变化，当版本变更时更新表格
    const propsTableVersion = tableDataState[props.name]?.tableVersion;
    if (propsTableVersion !== undefined && tableVersion !== propsTableVersion) {
      if (skipInitialVersionRef.current && tableVersion === 0 && propsTableVersion > 0) {
        skipInitialVersionRef.current = false;
        return;
      }
      // 如果数据被外部应用更新，则用 redux 中的数据更新当前行
      if (propsTableVersion < 0) {
        requestIdRef.current += 1;
        setTableVersion(-propsTableVersion);
        const restoredRows = tableDataState[props.name]?.dataSource ?? [];
        // Redux already owns this external snapshot; do not dispatch it back and bump the version again.
        setTableDataX(restoredRows);
        setTotal(restoredRows.length);
        setLoading(false);
      } else {
        // 否则，重新进行请求
        setTableVersion(propsTableVersion);
        const values = form.getFieldsValue();
        getInfoRef.current?.(PageNow, PageSize, searchText, values);
      }
    }
  }, [tableDataState, tableVersion, PageNow, PageSize, searchText, form, props.name, setTableData]);

  return (
    <>
      {!props.getForm && <Form form={form} component={false} />}
      {props.useList && (
        <Card
          title={props.title}
          // 默认无边框，若需要显示边框通过 listCardBordered 设为 true
          variant={props.listCardBordered ? 'outlined' : 'borderless'}
          size={'default'}
          className={
            props.cardClassName ??
            (typeof props.cardProps === 'string' ? props.cardProps : 'zeroBodyPaddingLeft')
          }
          style={
            props.cardStyle ?? (typeof props.cardProps === 'object' ? props.cardProps : undefined)
          }
          styles={{
            header: { background: 'transparent', boxShadow: 'none' },
            body: { background: 'transparent', boxShadow: 'none', paddingTop: 0 },
          }}
          extra={
            (props.search === true || props.getForm !== undefined) && (
              <>
                {props.search === true && (
                  <Search
                    key={'search'}
                    placeholder={t('searchUser')}
                    onSearch={(text) => {
                      setSearchText(text);
                      setPageNow(1);
                      const values = form.getFieldsValue();
                      getInfo(1, PageSize, text, values);
                    }}
                    enterButton
                    style={{ width: 300 }}
                  />
                )}
                {props.getForm !== undefined && (
                  <Form form={form}>
                    {props.getForm(onFinish)}
                    {props.useFormBtn && (
                      <Space size={8}>
                        <Button type="primary" onClick={onFinish}>
                          {t('filtering')}
                        </Button>
                        <Button htmlType="button" onClick={onReset}>
                          {t('Reset')}
                        </Button>
                      </Space>
                    )}
                  </Form>
                )}
              </>
            )
          }
        >
          {hasError && (
            <Alert
              role="alert"
              type="error"
              showIcon
              message={t('LoadFailed', { defaultValue: '加载失败' })}
              action={<Button onClick={retry}>{t('Retry', { defaultValue: '重试' })}</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          <List
            grid={props.grid}
            itemLayout={'vertical'}
            loading={loading}
            size={props.size as any}
            dataSource={tableData}
            renderItem={props.renderItem}
            pagination={{
              onChange: (page, pageSize) => {
                getInfo(page, pageSize);
              },
              current: PageNow,
              pageSize: PageSize,
              total: total,
              size: 'small',
              hideOnSinglePage: true,
              showQuickJumper: true,
              showLessItems: true,
              showSizeChanger: ck(props.showSizeChanger, true),
              pageSizeOptions: ['5', '15', '20', '50', '80'],
            }}
          />
        </Card>
      )}
      {!props.useList && (
        <Card
          variant="borderless"
          size={'small'}
          styles={{
            header: { background: 'transparent', boxShadow: 'none' },
            body: { background: 'transparent', boxShadow: 'none', paddingTop: 0 },
          }}
          extra={
            (props.search === true || props.getForm !== undefined) && (
              <>
                {props.search === true && (
                  <Search
                    key={'search'}
                    placeholder={t('Search')}
                    onSearch={(text) => {
                      setSearchText(text);
                      setPageNow(1);
                      getInfo(1, PageSize, text);
                    }}
                    enterButton
                    style={{ width: 300 }}
                  />
                )}
                {props.getForm !== undefined && (
                  <Form form={form} layout="inline" className="table-filter-form">
                    <Space size={20} wrap align="center">
                      {props.getForm(onFinish)}
                      {(props.useFormBtn ?? true) && (
                        <Space size={12}>
                          <Button type="primary" onClick={onFinish}>
                            {t('filtering')}
                          </Button>
                          <Button htmlType="button" onClick={onReset}>
                            {t('Reset')}
                          </Button>
                        </Space>
                      )}
                    </Space>
                  </Form>
                )}
              </>
            )
          }
        >
          {hasError && (
            <Alert
              role="alert"
              type="error"
              showIcon
              message={t('LoadFailed', { defaultValue: '加载失败' })}
              action={<Button onClick={retry}>{t('Retry', { defaultValue: '重试' })}</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          <Table
            rowKey={props.rowKey}
            loading={loading}
            size={props.size}
            columns={props.columns}
            rowSelection={props.rowSelection}
            dataSource={tableData}
            pagination={
              props.pagination ?? {
                onChange: (page, pageSize) => {
                  getInfo(page, pageSize);
                },
                current: PageNow,
                pageSize: PageSize,
                total: total,
                hideOnSinglePage: false,
                showQuickJumper: true,
                showLessItems: true,
                showSizeChanger: ck(props.showSizeChanger, true),
                pageSizeOptions: ['5', '15', '20', '50', '80'],
              }
            }
          />
        </Card>
      )}
    </>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  const TState: TableState = state.TableReduce;
  return {
    roles: UState.userInfo?.roles,
    tableData: { ...TState.tableData },
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  setTableInfo: (name: string, data: any) =>
    dispatch({
      type: 'setTableInfo',
      name: name,
      data: data,
    }),
  setDataSource: (data: any, name: string) =>
    dispatch({ type: 'setDataSource', data: data, name: name, add: false }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(TableWithPagination as React.ComponentType<any>));
