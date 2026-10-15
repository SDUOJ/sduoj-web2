import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../Config/i18n';
import { createAppStore } from '../../Redux/Store';
import { mergeQuickEntries, QuickEntries, QuickEntry } from '../../Type/quickEntry';
import cApi from '../../Utils/API/c-api';
import UpcomingListHome from './UpcomingListHome';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getContestQuickEntries: jest.fn(), getProblemSetQuickEntries: jest.fn() },
}));
const now = 1_800_000_000_000;
const empty: QuickEntries = { running: [], upcoming: [] };
function entry(type: QuickEntry['type'], id: string, start: number, end: number): QuickEntry {
  return {
    type,
    id,
    title: `${type}-${id}`,
    startTime: String(now + start),
    endTime: String(now + end),
    groupId: '7',
    groupTitle: 'Group 7',
    tag: null,
  };
}
function setup(store = createAppStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <UpcomingListHome />
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(now);
  await i18n.changeLanguage('zh');
  jest.mocked(cApi.getContestQuickEntries).mockResolvedValue(empty);
  jest.mocked(cApi.getProblemSetQuickEntries).mockResolvedValue(empty);
});

it('merges both types without ID collisions and reclassifies time boundaries before global sorting', () => {
  const contest = entry('contest', '1', -10, 100);
  const ps = entry('problemSet', '1', -10, 50);
  const future = entry('contest', '2', 10, 100);
  const data = mergeQuickEntries(
    [
      { running: [contest], upcoming: [future, entry('contest', '3', 86400001, 86400002)] },
      { running: [ps, entry('problemSet', '2', -10, 0)], upcoming: [contest] },
    ],
    now,
  );
  expect(data.running.map((e) => e.title)).toEqual(['problemSet-1', 'contest-1']);
  expect(data.upcoming.map((e) => e.title)).toEqual(['contest-2']);
  expect(mergeQuickEntries([data], now + 10).running.map((e) => e.title)).toContain('contest-2');
});

it('shows mixed types, distinct destinations and independent running/upcoming pagination', async () => {
  jest.mocked(cApi.getContestQuickEntries).mockResolvedValue({
    running: Array.from({ length: 3 }, (_, i) =>
      entry('contest', String(i), -1000, (i * 2 + 1) * 60000),
    ),
    upcoming: Array.from({ length: 3 }, (_, i) =>
      entry('contest', `up${i}`, (i * 2 + 1) * 60000, 999999),
    ),
  });
  jest.mocked(cApi.getProblemSetQuickEntries).mockResolvedValue({
    running: Array.from({ length: 3 }, (_, i) =>
      entry('problemSet', String(i), -1000, (i * 2 + 2) * 60000),
    ),
    upcoming: Array.from({ length: 3 }, (_, i) =>
      entry('problemSet', `up${i}`, (i * 2 + 2) * 60000, 999999),
    ),
  });
  setup();
  const running = await screen.findByRole('region', { name: '进行中' });
  const upcoming = screen.getByRole('region', { name: '即将到来' });
  expect(
    within(running)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(['contest-0', 'problemSet-0', 'contest-1', 'problemSet-1', 'contest-2']);
  expect(screen.getByRole('link', { name: 'contest-0' })).toHaveAttribute('href', '/v2/contest/0');
  expect(screen.getByRole('link', { name: 'problemSet-0' })).toHaveAttribute(
    'href',
    '/v2/problemSet/0/overview',
  );
  expect(within(running).getAllByText('比赛')).toHaveLength(3);
  expect(within(running).getAllByText('题单')).toHaveLength(2);
  expect(within(upcoming).getAllByText(/距开始/)).toHaveLength(5);
  fireEvent.click(within(running).getByTitle('2'));
  expect(
    within(running)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(['problemSet-2']);
  expect(within(upcoming).getAllByRole('link')).toHaveLength(5);
});

it.each(['contest', 'problemSet'] as const)(
  'keeps the other source visible when %s fails and supports retry',
  async (failed) => {
    const bad = failed === 'contest' ? cApi.getContestQuickEntries : cApi.getProblemSetQuickEntries;
    const good =
      failed === 'contest' ? cApi.getProblemSetQuickEntries : cApi.getContestQuickEntries;
    const goodType = failed === 'contest' ? 'problemSet' : 'contest';
    jest
      .mocked(bad)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ running: [entry(failed, 'recovered', -1, 1000)], upcoming: [] });
    jest
      .mocked(good)
      .mockResolvedValue({ running: [entry(goodType, 'visible', -1, 1000)], upcoming: [] });
    setup();
    expect(await screen.findByRole('link', { name: `${goodType}-visible` })).toBeVisible();
    expect(screen.getByText('部分入口加载失败，请重试')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
    expect(await screen.findByRole('link', { name: `${failed}-recovered` })).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByText('部分入口加载失败，请重试')).not.toBeInTheDocument(),
    );
  },
);

it('refreshes each minute and removes expired entries', async () => {
  jest.useFakeTimers({ now });
  try {
    jest
      .mocked(cApi.getContestQuickEntries)
      .mockResolvedValue({ running: [entry('contest', 'expiring', -1, 30000)], upcoming: [] });
    setup();
    await act(async () => {});
    expect(screen.getByRole('link', { name: 'contest-expiring' })).toBeInTheDocument();
    jest.spyOn(Date, 'now').mockReturnValue(now + 60000);
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    expect(cApi.getContestQuickEntries).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('link', { name: 'contest-expiring' })).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

it('discards a previous account response after switching users and clears entries on logout', async () => {
  const store = createAppStore();
  const user = (username: string) => ({
    userId: username,
    username,
    nickname: username,
    studentId: username,
    roles: ['user' as const],
  });
  store.dispatch({ type: 'setUserInfo', data: user('alice') });
  store.dispatch({ type: 'userLogin' });
  let finishAlice!: (value: QuickEntries) => void;
  jest
    .mocked(cApi.getContestQuickEntries)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishAlice = resolve;
        }),
    )
    .mockResolvedValueOnce({ running: [entry('contest', 'bob', -1, 1000)], upcoming: [] })
    .mockResolvedValue(empty);
  setup(store);
  await act(async () => {
    store.dispatch({ type: 'setUserInfo', data: user('bob') });
  });
  expect(await screen.findByRole('link', { name: 'contest-bob' })).toBeVisible();
  await act(async () => {
    finishAlice({ running: [entry('contest', 'alice', -1, 1000)], upcoming: [] });
  });
  expect(screen.queryByRole('link', { name: 'contest-alice' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'contest-bob' })).toBeVisible();
  await act(async () => {
    store.dispatch({ type: 'userLogout' });
  });
  await waitFor(() => expect(cApi.getContestQuickEntries).toHaveBeenCalledTimes(3));
  expect(screen.queryByRole('link', { name: 'contest-bob' })).not.toBeInTheDocument();
});
