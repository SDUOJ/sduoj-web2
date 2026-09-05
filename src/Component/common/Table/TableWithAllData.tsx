import { Table } from 'antd';
import type { TableProps } from 'antd';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import type { SortEndHandler } from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
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

const DragContext = createContext<SortEndHandler | undefined>(undefined);
const DragHandle = SortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);
const SortableRow = SortableElement((props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...props} />
));
const SortableBody = SortableContainer((props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props} />
));

function DraggableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  const onSortEnd = useContext(DragContext);
  return (
    <SortableBody
      {...props}
      useDragHandle
      disableAutoscroll
      helperClass="row-dragging"
      onSortEnd={onSortEnd}
    />
  );
}

function DraggableRow({
  'data-sort-index': index,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { 'data-sort-index'?: number }) {
  if (index === undefined || index < 0) return <tr {...props} />;
  return <SortableRow {...props} index={index} />;
}

const draggableComponents = { body: { wrapper: DraggableBody, row: DraggableRow } };

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

  const onSortEnd = useCallback<SortEndHandler>(
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

  const rowProps = useCallback<NonNullable<TableProps<Row>['onRow']>>(
    (record, index) => ({
      ...onRow?.(record, index),
      'data-sort-index': rows.indexOf(record),
    }),
    [onRow, rows],
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
    <DragContext.Provider value={onSortEnd}>
      <Table<Row>
        {...tableProps}
        loading={loading}
        columns={allColumns}
        dataSource={rows}
        pagination={false}
        onRow={useDrag ? rowProps : onRow}
        components={useDrag ? draggableComponents : tableProps.components}
      />
    </DragContext.Provider>
  );
}

export default TableWithAllData;
