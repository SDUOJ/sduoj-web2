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

it('hides the intelligent management shortcut in release while retaining ordinary tools', () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_DEPLOYMENT_ENV: 'production',
  });
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <MProblem />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.queryByRole('link', { name: /智能管理/ })).not.toBeInTheDocument();
  expect(screen.queryByText('DEV')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '客观题 / 主观题组' })).toBeVisible();
});
