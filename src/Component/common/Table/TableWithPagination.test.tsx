import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
