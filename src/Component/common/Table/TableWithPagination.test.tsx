import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Input } from 'antd';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import TableWithPagination from './TableWithPagination';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(API: jest.Mock) {
  const store = createAppStore();
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={API}
          rowKey="id"
          size="small"
          search
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  return { ...view, store };
}

it('keeps the newest search result when an older request resolves later', async () => {
  const initial = deferred<{ rows: { id: number; name: string }[]; totalNum: number }>();
  const latest = deferred<{ rows: { id: number; name: string }[]; totalNum: number }>();
  const API = jest.fn().mockReturnValueOnce(initial.promise).mockReturnValueOnce(latest.promise);
  setup(API);
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Search'), 'new');
  await user.click(screen.getByRole('button', { name: 'search' }));
  await waitFor(() => expect(API).toHaveBeenCalledTimes(2));
  await act(async () => latest.resolve({ rows: [{ id: 2, name: 'Newest' }], totalNum: 1 }));
  expect(await screen.findByText('Newest')).toBeVisible();
  await act(async () => initial.resolve({ rows: [{ id: 1, name: 'Stale' }], totalNum: 1 }));
  expect(screen.queryByText('Stale')).not.toBeInTheDocument();
});

it('stops loading after rejection and supports a version-triggered retry', async () => {
  const failed = deferred<{ rows: []; totalNum: number }>();
  const API = jest
    .fn()
    .mockReturnValueOnce(failed.promise)
    .mockResolvedValue({ rows: [{ id: 2, name: 'Recovered' }], totalNum: 1 });
  const view = setup(API);
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  await act(async () => failed.reject(new Error('Offline')));
  await waitFor(() => expect(view.container.querySelector('.ant-spin-spinning')).toBeNull());
  act(() => {
    view.store.dispatch({ type: 'addTableVersion', name: 'records' });
  });
  expect(await screen.findByText('Recovered')).toBeVisible();
});

it('reloads when the API changes while the table name stays the same', async () => {
  const first = jest.fn().mockResolvedValue({ rows: [{ id: 1, name: 'First' }], totalNum: 1 });
  const second = jest.fn().mockResolvedValue({ rows: [{ id: 2, name: 'Second' }], totalNum: 1 });
  const store = createAppStore();
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={first}
          rowKey="id"
          size="small"
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
  view.rerender(
    <Provider store={store}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={second}
          rowKey="id"
          size="small"
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('Second')).toBeVisible();
  expect(screen.queryByText('First')).not.toBeInTheDocument();
});

it('prefers initRequestProps over stale cached filters', async () => {
  const API = jest.fn().mockResolvedValue({ rows: [], totalNum: 0 });
  const store = createAppStore();
  store.dispatch({
    type: 'setTableInfo',
    name: 'records',
    data: { pageNow: 3, pageSize: 15, searchKey: 'old', moreProps: { status: 'old' } },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={API}
          rowKey="id"
          size="small"
          initRequestProps={{ status: 'new' }}
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  expect(API.mock.calls[0][0]).toMatchObject({ status: 'new', pageNow: 3, pageSize: 15 });
  expect(API.mock.calls[0][0].searchKey).toBe('old');
});

it('restores externally managed rows for a negative table version', async () => {
  const pending = deferred<{ rows: []; totalNum: number }>();
  const API = jest.fn().mockReturnValue(pending.promise);
  const { store } = setup(API);
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  act(() => {
    store.dispatch({
      type: 'setDataSource',
      name: 'records',
      data: [{ id: 7, name: 'Injected' }],
      add: true,
    });
  });
  expect(await screen.findByText('Injected')).toBeVisible();
  await act(async () => pending.resolve({ rows: [], totalNum: 0 }));
  expect(screen.getByText('Injected')).toBeVisible();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('keeps an explicit zero total when totalPage is omitted', async () => {
  const API = jest.fn().mockResolvedValue({ rows: [], totalNum: '0' });
  const { store } = setup(API);
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(store.getState().TableReduce.tableData.records.tableInfo.total).toBe(0),
  );
});

it('does not duplicate the initial request for a persisted positive version', async () => {
  const API = jest.fn().mockResolvedValue({ rows: [], totalNum: 0 });
  const store = createAppStore();
  store.dispatch({ type: 'addTableVersion', name: 'records' });
  store.dispatch({ type: 'addTableVersion', name: 'records' });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={API}
          rowKey="id"
          size="small"
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
});

it('reloads page one when a filter is cleared and submitted', async () => {
  const API = jest.fn().mockResolvedValue({ rows: [], totalNum: 0 });
  const user = userEvent.setup();
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <TableWithPagination
          name="records"
          API={API}
          rowKey="id"
          size="small"
          useFormBtn
          getForm={() => (
            <Form.Item name="status" label="Status">
              <Input />
            </Form.Item>
          )}
          columns={[{ title: 'Name', dataIndex: 'name' }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(API).toHaveBeenCalledTimes(1));
  await user.type(screen.getByLabelText('Status'), 'active');
  await user.click(screen.getByRole('button', { name: /filtering/i }));
  await waitFor(() => expect(API).toHaveBeenCalledTimes(2));
  await user.clear(screen.getByLabelText('Status'));
  await user.click(screen.getByRole('button', { name: /filtering/i }));
  await waitFor(() => expect(API).toHaveBeenCalledTimes(3));
  expect(API.mock.calls[2][0]).toMatchObject({ pageNow: 1 });
  expect(API.mock.calls[2][0]).not.toHaveProperty('status');
});
