import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { createStore } from 'redux';
import cApi from '../../Utils/API/c-api';
import CGroupInfo from './CGroupInfo';
import i18n from '../../Config/i18n';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getGroupInfo: jest.fn(), getProblemSetLabelList: jest.fn() },
}));
jest.mock('../../Component/autolab/CourseTab', () => () => <div>Unfinished courses</div>);
jest.mock('../../Component/group/CourseManagement', () => () => (
  <div>Unfinished course management</div>
));
jest.mock('../../Component/contest/ContestList', () => () => null);
jest.mock('../../Component/group/QuitGroupBtn', () => () => null);
jest.mock('../../Component/group/JoinGroupBtn', () => () => null);
jest.mock('../../Component/common/GroupUserListCard', () => () => null);
jest.mock('../../Component/problemSet/ProblemSetList', () => () => null);
jest.mock('../../Component/problemSet/ProblemSetSummary', () => () => null);
jest.mock('../../Utils/MarkdownText', () => () => <div>Group announcement</div>);

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.mocked(cApi.getGroupInfo).mockResolvedValue({ title: 'Group', groupId: 8, members: [] });
  jest.mocked(cApi.getProblemSetLabelList).mockResolvedValue({ label: [], score: {}, sum: 0 });
});
function setup(activeKey = 'Announcement') {
  const store = createStore(
    (
      state = {
        UserReducer: { userInfo: { username: 'alice', roles: ['admin'] } },
        CommonReducer: { keyValueData: { 'Group-C-activeKey-8': activeKey } },
      },
    ) => state,
  );
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/group/8']}>
        <Route path="/v2/group/:groupId" component={CGroupInfo} />
      </MemoryRouter>
    </Provider>,
  );
}
it('marks development course tabs with DEV', async () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  setup();
  expect(await screen.findByRole('tab', { name: /课程管理.*DEV/ })).toBeVisible();
  expect(screen.getByRole('tab', { name: /^课程\s*DEV$/ })).toBeVisible();
});
it.each(['course', 'courseManagement'])(
  'hides unfinished course tabs in release and restores a safe tab from %s',
  async (activeKey) => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      NODE_ENV: 'production',
      REACT_APP_DEPLOYMENT_ENV: 'production',
    });
    setup(activeKey);
    await waitFor(() => expect(cApi.getGroupInfo).toHaveBeenCalled());
    expect(screen.queryByRole('tab', { name: /课程/ })).not.toBeInTheDocument();
    expect(screen.queryByText('DEV')).not.toBeInTheDocument();
    expect(screen.queryByText(/Unfinished/)).not.toBeInTheDocument();
    expect(screen.getByText('Group announcement')).toBeVisible();
  },
);
