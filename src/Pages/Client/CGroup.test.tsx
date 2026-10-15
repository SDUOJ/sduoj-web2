import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Route, Switch } from 'react-router-dom';
import i18n from '../../Config/i18n';
import { createAppStore } from '../../Redux/Store';
import cApi from '../../Utils/API/c-api';
import CGroup from './CGroup';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getGroupList: jest.fn() },
}));
jest.mock('../../Component/user/Avatar', () => () => null);
jest.mock('../../Component/group/QuitGroupBtn', () => () => null);
jest.mock('../../Component/group/JoinGroupBtn', () => () => null);

const navigation = [
  ['主页', 'home'],
  ['题目', 'problem'],
  ['提交', 'submission'],
  ['比赛', 'contest'],
  ['用户组', 'group'],
];

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest
    .mocked(cApi.getGroupList)
    .mockImplementation(async ({ pageNow, pageSize, isParticipating, title }) => {
      const totalNum = isParticipating === '0' ? 60 : 2;
      const start = (pageNow - 1) * pageSize;
      return {
        totalNum,
        rows: Array.from({ length: Math.max(0, Math.min(pageSize, totalNum - start)) }, (_, i) => ({
          groupId: String(start + i + 1),
          title: `${title || '用户组'}-${start + i + 1}`,
          owner: { username: 'owner', email: '' },
          status: 2,
          gmtCreate: '1792047600000',
          memberNum: 1,
        })),
      };
    });
});

it.each([false, true])(
  'restores All and page four after the full navigation sequence (search=%s)',
  async (search) => {
    const user = userEvent.setup();
    const store = createAppStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/v2/group']}>
          <nav aria-label="主导航">
            {navigation.map(([label, path]) => (
              <Link key={path} to={`/v2/${path}`}>
                {label}
              </Link>
            ))}
          </nav>
          <Switch>
            <Route exact path="/v2/group" component={CGroup} />
            <Route render={() => <div>其他页面</div>} />
          </Switch>
        </MemoryRouter>
      </Provider>,
    );
    await screen.findByRole('heading', { name: '用户组-1' });
    expect(cApi.getGroupList).toHaveBeenLastCalledWith(
      expect.objectContaining({ isParticipating: '1', pageNow: 1 }),
    );
    await user.click(screen.getByText('我的', { selector: '.ant-select-selection-item' }));
    await user.click(screen.getByText('全部', { selector: '.ant-select-item-option-content' }));
    if (search) {
      await user.type(screen.getByRole('searchbox'), 'training{Enter}');
      await waitFor(() =>
        expect(cApi.getGroupList).toHaveBeenLastCalledWith(
          expect.objectContaining({ title: 'training' }),
        ),
      );
    }
    for (const pageNow of [2, 3, 4]) {
      await user.click(screen.getByTitle(String(pageNow)));
      await waitFor(() =>
        expect(cApi.getGroupList).toHaveBeenLastCalledWith(
          expect.objectContaining({ isParticipating: '0', pageNow }),
        ),
      );
    }
    const title = `${search ? 'training' : '用户组'}-37`;
    await screen.findByRole('heading', { name: title });
    const nav = within(screen.getByRole('navigation', { name: '主导航' }));
    for (const [label] of navigation) await user.click(nav.getByRole('link', { name: label }));
    await waitFor(() =>
      expect(cApi.getGroupList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isParticipating: '0',
          pageNow: 4,
          pageSize: 12,
          ...(search ? { title: 'training' } : {}),
        }),
      ),
    );
    expect(await screen.findByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByText('全部', { selector: '.ant-select-selection-item' })).toBeVisible();
    expect(document.querySelector('.ant-pagination-item-active')).toHaveAttribute('title', '4');
    if (search) expect(screen.getByRole('searchbox')).toHaveValue('training');

    await user.click(screen.getByText('全部', { selector: '.ant-select-selection-item' }));
    await user.click(screen.getByText('我的', { selector: '.ant-select-item-option-content' }));
    await waitFor(() =>
      expect(cApi.getGroupList).toHaveBeenLastCalledWith(
        expect.objectContaining({ isParticipating: '1', pageNow: 1 }),
      ),
    );
    expect(
      await screen.findByRole('heading', { name: `${search ? 'training' : '用户组'}-1` }),
    ).toBeVisible();
  },
  15000,
);
