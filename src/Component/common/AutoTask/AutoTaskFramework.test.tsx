import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AutoTaskFramework from './AutoTaskFramework';
import cApi from '../../../Utils/API/c-api';
import i18n from '../../../Config/i18n';

jest.mock('../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { listGroupAutoTasks: jest.fn(), listProblemSetAutoTasks: jest.fn() },
}));
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    Table: ({ dataSource, pagination }: any) => (
      <div>
        <output data-testid="page-total">{pagination.total}</output>
        <output data-testid="page-number">{pagination.current}</output>
        {dataSource.map((row: { id: string }) => (
          <div key={row.id}>{row.id}</div>
        ))}
        <button onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}>
          Next page
        </button>
      </div>
    ),
  };
});

const allTasks = [
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `summary-${index}`,
    task_type: 'summary_report',
    status: 'success',
  })),
  ...Array.from({ length: 25 }, (_, index) => ({
    id: `review-${index}`,
    task_type: 'subjective_review',
    status: 'success',
  })),
];
function page(query: { taskType?: string; pageNow: number; pageSize: number }) {
  const rows = query.taskType
    ? allTasks.filter((row) => row.task_type === query.taskType)
    : allTasks;
  return Promise.resolve({
    rows: rows.slice((query.pageNow - 1) * query.pageSize, query.pageNow * query.pageSize),
    total: rows.length,
    pageIndex: query.pageNow,
    pageSize: query.pageSize,
  });
}
beforeEach(async () => {
  await i18n.changeLanguage('en');
  jest.mocked(cApi.listGroupAutoTasks).mockReset().mockImplementation(page);
  jest.mocked(cApi.listProblemSetAutoTasks).mockReset().mockImplementation(page);
});
afterEach(async () => {
  await i18n.changeLanguage('zh');
});

it.each([{ groupId: 7 }, { psid: 9 }])(
  'paginates a sole task type on the server for %o',
  async (scope) => {
    render(<AutoTaskFramework {...scope} taskTypeFilter={['subjective_review']} />);
    expect(await screen.findByText('review-0')).toBeInTheDocument();
    expect(screen.queryByText('summary-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-total')).toHaveTextContent('25');
    expect(
      screen.queryByRole('combobox', { name: i18n.t('AutoTaskFilterType') }),
    ).not.toBeInTheDocument();
    const api = scope.groupId ? cApi.listGroupAutoTasks : cApi.listProblemSetAutoTasks;
    expect(api).toHaveBeenLastCalledWith(
      expect.objectContaining({ taskType: 'subjective_review', pageNow: 1, pageSize: 20 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('review-24')).toBeInTheDocument();
    expect(screen.queryByText('review-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-number')).toHaveTextContent('2');
    expect(screen.getByTestId('page-total')).toHaveTextContent('25');
    expect(api).toHaveBeenLastCalledWith(
      expect.objectContaining({ taskType: 'subjective_review', pageNow: 2 }),
    );
  },
);

it('selects one allowed type for a multi-type scope and resets to its server page and count', async () => {
  render(
    <AutoTaskFramework
      groupId={7}
      taskTypeFilter={['subjective_review', 'summary_report']}
      getTaskTypeLabel={(value) => value}
      showFilters={{ taskType: false }}
    />,
  );
  expect(await screen.findByText('review-0')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('review-24');
  fireEvent.mouseDown(screen.getByRole('combobox', { name: i18n.t('AutoTaskFilterType') }));
  fireEvent.click(
    screen
      .getAllByText('summary_report')
      .find((node) => node.classList.contains('ant-select-item-option-content'))!,
  );
  expect(await screen.findByText('summary-0')).toBeInTheDocument();
  expect(screen.queryByText('review-24')).not.toBeInTheDocument();
  expect(screen.getByTestId('page-total')).toHaveTextContent('20');
  expect(screen.getByTestId('page-number')).toHaveTextContent('1');
  expect(cApi.listGroupAutoTasks).toHaveBeenLastCalledWith(
    expect.objectContaining({ taskType: 'summary_report', pageNow: 1 }),
  );
});

it('discards a late response from the previous task scope', async () => {
  let finish!: (response: Awaited<ReturnType<typeof page>>) => void;
  jest
    .mocked(cApi.listGroupAutoTasks)
    .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
  const view = render(<AutoTaskFramework groupId={7} taskTypeFilter={['subjective_review']} />);
  view.rerender(<AutoTaskFramework groupId={7} taskTypeFilter={['summary_report']} />);
  expect(await screen.findByText('summary-0')).toBeInTheDocument();
  await act(async () =>
    finish(await page({ taskType: 'subjective_review', pageNow: 1, pageSize: 20 })),
  );
  await waitFor(() => expect(screen.queryByText('review-0')).not.toBeInTheDocument());
  expect(screen.getByTestId('page-total')).toHaveTextContent('20');
});
