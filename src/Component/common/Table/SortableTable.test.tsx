import { useState } from 'react';
import { Table } from 'antd';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DragHandle,
  SortableTableScope,
  sortableTableComponents,
  sortIndices,
} from './SortableTable';

it('maps stable keys to current indices including numeric zero and reordered data', () => {
  expect(sortIndices([0, 2, 1], '0', '1')).toEqual({ oldIndex: 0, newIndex: 2 });
  expect(sortIndices(['b', 'a'], 'a', 'b')).toEqual({ oldIndex: 1, newIndex: 0 });
  expect(sortIndices([1], 1, null)).toBeUndefined();
  expect(sortIndices([1], 2, 1)).toBeUndefined();
  expect(sortIndices([1], 1, 1)).toBeUndefined();
});

function Fixture({ disabled = false }: { disabled?: boolean }) {
  const [rows, setRows] = useState([{ id: 0 }, { id: 1 }]);
  return (
    <SortableTableScope
      items={rows.map((row) => row.id)}
      disabled={disabled}
      onSortEnd={({ oldIndex, newIndex }) => {
        const next = [...rows];
        next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]);
        setRows(next);
      }}
    >
      <Table
        rowKey="id"
        pagination={false}
        dataSource={rows}
        components={sortableTableComponents}
        columns={[
          { title: 'Sort', render: () => <DragHandle /> },
          {
            title: 'Draft',
            render: (_, row) => (
              <input aria-label={`Draft ${row.id}`} defaultValue={`row${row.id}`} />
            ),
          },
        ]}
      />
    </SortableTableScope>
  );
}

it('retains input DOM and draft on rerender, with draggable handles outside text inputs', () => {
  const view = render(<Fixture />);
  const input = screen.getByLabelText('Draft 0');
  input.focus();
  fireEvent.change(input, { target: { value: 'unsaved' } });
  view.rerender(<Fixture />);
  expect(screen.getByLabelText('Draft 0')).toBe(input);
  expect(input).toHaveFocus();
  expect(input).toHaveValue('unsaved');
  expect(screen.getAllByRole('button', { name: /sort/i })).toHaveLength(2);
});

it('disables handles when sort mode is off', () => {
  render(<Fixture disabled />);
  screen
    .getAllByRole('button', { name: /sort/i })
    .forEach((handle) => expect(handle).toBeDisabled());
});
