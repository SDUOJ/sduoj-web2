import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import CProblem from './CProblem';
import { createAppStore } from '../../Redux/Store';
import CApi from 'Utils/API/c-api';

jest.mock('Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    getACProblem: jest.fn().mockResolvedValue([]),
    getProblemList: jest.fn().mockResolvedValue({
      total: 1,
      rows: [
        {
          problemCode: 'SDUOJ-1000',
          problemTitle: 'A+B Problem',
          source: 'demo',
          acceptNum: 1,
          isPublic: 1,
        },
      ],
    }),
  },
}));

jest.mock('../../Component/common/Table/TableWithPagination', () => ({
  __esModule: true,
  default: ({ columns }: any) => {
    const row: Record<string, unknown> = {
      problemCode: 'SDUOJ-1000',
      problemTitle: 'A+B Problem',
      source: 'demo',
      acceptNum: 1,
      isPublic: 1,
    };
    return (
      <table>
        <tbody>
          <tr>
            {columns.map((column: any) => (
              <td key={column.key ?? column.dataIndex}>
                {column.render
                  ? column.render(row[column.dataIndex as string], row)
                  : row[column.dataIndex as string]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  },
}));

it('renders problem titles as native links that can open in a new tab', async () => {
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <CProblem />
      </MemoryRouter>
    </Provider>,
  );

  const link = await screen.findByRole('link', { name: 'A+B Problem' });
  expect(link).toHaveAttribute('href', expect.stringContaining('/problem/SDUOJ-1000'));
  expect(link.tagName).toBe('A');
});
