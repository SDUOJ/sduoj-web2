import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import TableWithAllData from './TableWithAllData';

const rows = [
  { id: 1, title: 'First' },
  { id: 2, title: 'Second' },
];
const columns = [{ title: 'Title', dataIndex: 'title' }];

function setup(API: jest.Mock, props: Record<string, unknown> = {}) {
  const store = createAppStore();
  const element = (overrides = {}) => (
    <Provider store={store}>
      <MemoryRouter>
        <TableWithAllData
          name="example"
          rowKey="id"
          columns={columns}
          API={API}
          {...props}
          {...overrides}
        />
      </MemoryRouter>
    </Provider>
  );
  const view = render(element());
  return {
    ...view,
    store,
    rerenderTable: (overrides: Record<string, unknown>) => view.rerender(element(overrides)),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  const getStyle = window.getComputedStyle;
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => getStyle(element));
});

it('updates selection when the number of selected rows stays the same', async () => {
  const API = jest.fn().mockResolvedValue(rows);
  const view = setup(API, { rowSelection: { selectedRowKeys: [1] } });
  await screen.findByText('First');
  expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
  view.rerenderTable({ rowSelection: { selectedRowKeys: [2] } });
  await waitFor(() => expect(screen.getAllByRole('checkbox')[2]).toBeChecked());
  expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
});

it.each([false, true])(
  'keeps drafts and focus during unrelated updates (drag=%s)',
  async (useDrag) => {
    const view = setup(jest.fn().mockResolvedValue(rows), {
      useDrag,
      columns: [
        {
          title: 'Draft',
          render: (_: unknown, row: (typeof rows)[number]) => (
            <input aria-label={`Draft ${row.id}`} defaultValue={row.title} />
          ),
        },
      ],
    });
    const input = await screen.findByLabelText('Draft 1');
    await userEvent.setup().type(input, ' draft');
    act(() => {
      view.store.dispatch({ type: 'setTableInfo', name: 'other', data: { pageNow: 2 } });
    });
    expect(screen.getByLabelText('Draft 1')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('First draft');
  },
);

it('stops loading after failure and permits a version-triggered retry', async () => {
  const pending = deferred<typeof rows>();
  const API = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(rows);
  const view = setup(API);
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  await act(async () => pending.reject(new Error('Offline')));
  await waitFor(() => expect(view.container.querySelector('.ant-spin-spinning')).toBeNull());
  act(() => {
    view.store.dispatch({ type: 'addTableVersion', name: 'example' });
  });
  expect(await screen.findByText('First')).toBeVisible();
  expect(API).toHaveBeenCalledTimes(2);
});

it('ignores an old response after switching table identity', async () => {
  const old = deferred<typeof rows>();
  const view = setup(jest.fn().mockReturnValue(old.promise));
  view.rerenderTable({ name: 'new', API: jest.fn().mockResolvedValue([{ id: 3, title: 'New' }]) });
  expect(await screen.findByText('New')).toBeVisible();
  await act(async () => old.resolve(rows));
  expect(screen.queryByText('First')).not.toBeInTheDocument();
  expect(view.store.getState().TableReduce.tableData.new.dataSource).toEqual([
    { id: 3, title: 'New' },
  ]);
});

it('adopts external negative versions without refetching and refreshes positive versions', async () => {
  const API = jest.fn().mockResolvedValue(rows);
  const view = setup(API);
  await screen.findByText('First');
  act(() => {
    view.store.dispatch({
      type: 'setDataSource',
      name: 'example',
      data: [{ id: 3, title: 'Draft' }],
      add: true,
    });
  });
  expect(await screen.findByText('Draft')).toBeVisible();
  expect(API).toHaveBeenCalledTimes(1);
  act(() => {
    view.store.dispatch({ type: 'addTableVersion', name: 'example' });
  });
  expect(await screen.findByText('First')).toBeVisible();
  expect(API).toHaveBeenCalledTimes(2);
});

it('does not publish a response to Redux after unmount', async () => {
  const pending = deferred<typeof rows>();
  const view = setup(jest.fn().mockReturnValue(pending.promise));
  const before = view.store.getState();
  view.unmount();
  await act(async () => pending.resolve(rows));
  expect(view.store.getState()).toBe(before);
});
