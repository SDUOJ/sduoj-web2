import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import MProblem from './MProblem';
import { createAppStore } from '../../../Redux/Store';

const capturedColumns: any[] = [];

jest.mock('../../../Component/common/Table/TableWithPagination', () => ({
  __esModule: true,
  default: ({ columns }: any) => {
    capturedColumns.length = 0;
    capturedColumns.push(...columns);
    return <div data-testid="problem-table" />;
  },
}));

jest.mock('Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    getProblemList: jest.fn().mockResolvedValue({ total: 0, rows: [] }),
    getProblem: jest.fn(),
    updateProblemInfo: jest.fn(),
    createProblem: jest.fn(),
    createDescription: jest.fn(),
  },
}));

beforeEach(() => {
  capturedColumns.length = 0;
});

it('keeps the operator column mounted at every responsive breakpoint', () => {
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <MProblem />
      </MemoryRouter>
    </Provider>,
  );

  expect(screen.getByTestId('problem-table')).toBeInTheDocument();
  // 全部列禁止 responsive 裁剪：增删列会让行内 Modal 卸载
  for (const column of capturedColumns) {
    expect(column.responsive).toBeUndefined();
  }
  const renderedWithoutDataIndex = capturedColumns.filter(
    (column) => !column.dataIndex && typeof column.render === 'function',
  );
  expect(renderedWithoutDataIndex.length).toBeGreaterThanOrEqual(2);
  const operator = renderedWithoutDataIndex[renderedWithoutDataIndex.length - 1];
  expect(typeof operator.render).toBe('function');
});
