import { Table } from 'antd';
import type { TableProps } from 'antd';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DragHandle, SortableTableScope, sortableTableComponents, SortEnd } from './SortableTable';
import { arrayMoveImmutable } from 'array-move';
import { useAppDispatch, useAppSelector } from '../../../Redux/Store/hooks';

export interface TableWithAllDataProps<Row extends object> extends Omit<
  TableProps<Row>,
  'dataSource'
> {
  name: string;
  API: () => Promise<Row[] | null | undefined> | void;
  APIRowsTransForm?: (rows: Row[]) => Row[];
  useDrag?: boolean;
  afterDrag?: (previousRows: Row[], oldIndex: number, newIndex: number) => void;
  updateTrick?: unknown;
}

function TableWithAllData<Row extends object>({
  name,
  API,
  APIRowsTransForm,
  useDrag = false,
  afterDrag,
  updateTrick,
  columns,
  onRow,
  ...tableProps
}: TableWithAllDataProps<Row>) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.TableReduce.tableData[name]);
  const version = entry?.tableVersion ?? 0;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const previousName = useRef<string>();
  const source = useRef({ API, APIRowsTransForm, dataSource: entry?.dataSource });

  // Inline API functions are common in callers; changing their identity is not a refresh request.
  useLayoutEffect(() => {
    source.current = { API, APIRowsTransForm, dataSource: entry?.dataSource };
  }, [API, APIRowsTransForm, entry?.dataSource]);

  useEffect(
    () => () => {
      previousName.current = undefined;
    },
    [],
  );

  useEffect(() => {
    const sameTable = previousName.current === name;
    previousName.current = name;
    if (sameTable && version < 0) {
      setRows(source.current.dataSource ?? []);
      setLoading(false);
      return;
    }

    let active = true;
    const { API: load, APIRowsTransForm: transform } = source.current;
    if (!sameTable) setRows([]);
    setLoading(true);
    Promise.resolve()
      .then(() => (active ? (load() ?? undefined) : undefined))
      .then((data) => {
        if (!active) return;
        const nextRows = transform ? transform(data ?? []) : (data ?? []);
        setRows(nextRows);
        dispatch({ type: 'setDataSource', name, data: nextRows, add: false });
      })
      .catch(() => {
        // The request layer presents errors. Keep existing rows available for a retry.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, name, version]);

  const onSortEnd = useCallback<(indices: SortEnd) => void>(
    ({ oldIndex, newIndex }) => {
      if (
        oldIndex === newIndex ||
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= rows.length ||
        newIndex >= rows.length
      )
        return;
      const nextRows = arrayMoveImmutable(rows, oldIndex, newIndex);
      setRows(nextRows);
      dispatch({ type: 'setDataSource', name, data: nextRows, add: false });
      // Preserve the existing callback contract: consumers receive the previous order and indices.
      afterDrag?.(rows, oldIndex, newIndex);
    },
    [afterDrag, dispatch, name, rows],
  );

  const keys = rows.map((row, index) =>
    typeof tableProps.rowKey === 'function'
      ? tableProps.rowKey(row, index)
      : (row as Record<string, React.Key>)[String(tableProps.rowKey ?? 'key')],
  );

  const allColumns = useDrag
    ? [
        {
          title: '',
          key: 'sort',
          width: 50,
          className: 'drag-visable',
          render: () => <DragHandle />,
        },
        ...(columns ?? []),
      ]
    : columns;

  return (
    <SortableTableScope items={keys} onSortEnd={onSortEnd} disabled={!useDrag}>
      <Table<Row>
        {...tableProps}
        loading={loading}
        columns={allColumns}
        dataSource={rows}
        pagination={false}
        onRow={onRow}
        components={useDrag ? sortableTableComponents : tableProps.components}
      />
    </SortableTableScope>
  );
}

export default TableWithAllData;
