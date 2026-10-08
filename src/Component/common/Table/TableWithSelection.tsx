import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import TableWithPagination from './TableWithPagination';
import { TableState } from '../../../Type/ITable';
import { ck } from '../../../Utils/empty';
import TableWithAllData from './TableWithAllData';

const TableWithSelection = (props: any) => {
  const { t } = useTranslation();
  const selectedRowKeys = ck(props.tableData[props.name]?.selectedRowKeys, []);
  const useAllData = props.useAllData ?? props.uesAlldata;

  const setSelectedRowKeys = (data: any) => {
    props.setSelectedRowKeys(data, props.name);
  };

  let rowSelection: any = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    // 多选时的下拉选项
    selections: [
      {
        key: 'all',
        text: t('selectedAll'),
        onSelect: (changeableRowKeys: React.Key[]) => {
          let newSelectedRowKeys = changeableRowKeys;
          newSelectedRowKeys = newSelectedRowKeys.concat(
            selectedRowKeys.filter((key: React.Key) => {
              return !changeableRowKeys.includes(key);
            }),
          );
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: 'clear',
        text: t('clear'),
        onSelect: (changeableRowKeys: React.Key[]) => {
          let newSelectedRowKeys = selectedRowKeys.filter((key: React.Key) => {
            return !changeableRowKeys.includes(key);
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: 'invert',
        text: t('invert'),
        onSelect: (changeableRowKeys: React.Key[]) => {
          let newSelectedRowKeys = changeableRowKeys.filter((key: React.Key) => {
            return !selectedRowKeys.includes(key);
          });
          newSelectedRowKeys = newSelectedRowKeys.concat(
            selectedRowKeys.filter((key: React.Key) => {
              return !changeableRowKeys.includes(key);
            }),
          );
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  return (
    <>
      {useAllData && (
        <TableWithAllData
          {...props}
          name={props.name}
          API={props.API}
          rowSelection={props.disableSelection ? undefined : rowSelection}
        />
      )}
      {useAllData !== true && (
        <TableWithPagination
          {...props}
          rowSelection={props.disableSelection ? undefined : rowSelection}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: any) => {
  const TState: TableState = state.TableReduce;
  return {
    tableData: TState.tableData,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  setSelectedRowKeys: (data: React.Key[], name: string) =>
    dispatch({ type: 'setSelectedRowKeys', data: data, name: name }),
});

export default connect(mapStateToProps, mapDispatchToProps)(TableWithSelection);
