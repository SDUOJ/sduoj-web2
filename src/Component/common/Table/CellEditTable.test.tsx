import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CellEditTable from './CellEditTable';
import '../../../Config/i18n';

jest.mock('@ant-design/pro-components', () => ({
  EditableProTable: ({ editable }: { editable: { editableKeys: React.Key[] } }) => (
    <output aria-label="editable keys">{editable.editableKeys.join(',')}</output>
  ),
}));

function Fixture({ value }: { value: { id: number }[] }) {
  return (
    <MemoryRouter>
      <CellEditTable
        value={value}
        rowKey="id"
        columns={[]}
        rowButton={() => []}
        toolBar={() => null}
      />
    </MemoryRouter>
  );
}

it('updates editable keys when rows are replaced without changing the row count', async () => {
  const view = render(<Fixture value={[{ id: 1 }, { id: 2 }]} />);
  await waitFor(() => expect(screen.getByLabelText('editable keys')).toHaveTextContent('1,2'));
  view.rerender(<Fixture value={[{ id: 3 }, { id: 4 }]} />);
  await waitFor(() => expect(screen.getByLabelText('editable keys')).toHaveTextContent('3,4'));
});
