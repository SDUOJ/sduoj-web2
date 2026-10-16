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

async function groupHeading(title: string) {
  const text = await screen.findByText(title, { selector: 'h5' });
  const link = text.closest('a');
  if (!link) throw new Error(`Missing group title link: ${title}`);
  // Check the heading's role and name inside its link instead of recomputing
  // accessible names for every card on every pagination/navigation assertion.
  return within(link).getByRole('heading', { name: title });
}

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
    // These flows exercise clicks and persisted filters, with no hover behavior.
    const user = userEvent.setup({ skipHover: true });
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
    await groupHeading('用户组-1');
    expect(cApi.getGroupList).toHaveBeenLastCalledWith(
      expect.objectContaining({ isParticipating: '1', pageNow: 1 }),
    );
    await user.click(screen.getByText('我的', { selector: '.ant-select-selection-item' }));
    await user.click(screen.getByText('全部', { selector: '.ant-select-item-option-content' }));
    if (search) {
      await user.click(screen.getByRole('searchbox'));
      await user.paste('training');
      await user.keyboard('{Enter}');
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
    await groupHeading(title);
    const nav = within(screen.getByRole('navigation', { name: '主导航' }));
    for (const [label] of navigation) await user.click(nav.getByText(label, { selector: 'a' }));
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
    expect(await groupHeading(title)).toBeVisible();
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
    expect(await groupHeading(`${search ? 'training' : '用户组'}-1`)).toBeVisible();
  },
  15000,
);
