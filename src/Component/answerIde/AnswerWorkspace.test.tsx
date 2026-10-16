jest.mock('../submission/SyncJudging', () => ({ SyncJudging: () => null }));
import i18n from '../../Config/i18n';
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import cApi from '../../Utils/API/c-api';
import AnswerWorkspace from './AnswerWorkspace';

jest.mock('./AnswerEditor', () => ({ value, onChange }: any) => (
  <textarea aria-label="代码" value={value} onChange={(e) => onChange(e.target.value)} />
));
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    submit: jest.fn(),
    runCases: jest.fn(),
    getRunQuery: jest.fn(),
    cancelRun: jest.fn(),
    getLatestRun: jest.fn(),
    getIdeHistory: jest.fn(),
    getIdeCode: jest.fn(),
    saveIdeCode: jest.fn(),
  },
}));
const props = {
  problemCode: 'P',
  username: 'alice',
  title: 'Problem',
  templates: [{ id: '6', title: 'C++', type: 0, comment: '', acceptFileExtensions: ['cpp'] }],
  querySubmission: jest.fn(),
};
const actions: any[] = [];
const store = createStore((state = {}, action: any) => {
  actions.push(action);
  return state;
});
function view(username = 'alice') {
  return (
    <Provider store={store}>
      <AnswerWorkspace key={username} {...props} username={username} />
    </Provider>
  );
}
beforeEach(() => {
  process.env.REACT_APP_IDE_CLOUD_CODE = 'true';
  process.env.REACT_APP_IDE_RUN = 'true';
  localStorage.clear();
  actions.length = 0;
  jest.mocked(cApi.getLatestRun).mockResolvedValue({ detail: null, hasActiveRun: false });
  jest.mocked(cApi.getIdeHistory).mockResolvedValue([]);
});
afterEach(() => {
  delete process.env.REACT_APP_IDE_CLOUD_CODE;
  delete process.env.REACT_APP_IDE_RUN;
});

it('keeps the default editor local and submits through the existing API without cloud or Run requests', async () => {
  delete process.env.REACT_APP_IDE_CLOUD_CODE;
  delete process.env.REACT_APP_IDE_RUN;
  localStorage.setItem('answerIde:active:alice:P', 'abc');
  jest.mocked(cApi.submit).mockResolvedValue('formal123');
  render(view());
  const source = screen.getByLabelText('代码');
  fireEvent.change(source, { target: { value: 'local source' } });
  fireEvent.keyDown(source, { key: 's', ctrlKey: true });
  expect(JSON.parse(localStorage.getItem('answerIde:draft:alice:P')!).codes).toEqual({
    '6': 'local source',
  });
  fireEvent.keyDown(source, { key: 'Enter', ctrlKey: true });
  window.dispatchEvent(
    new CustomEvent('answerIde:publicCase', {
      detail: { problemCode: 'P', input: '1', expectedOutput: '1' },
    }),
  );
  expect(screen.queryByRole('button', { name: '运行自定义用例' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '保存到云端' })).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: '代码历史' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '正式提交' }));
  await waitFor(() =>
    expect(cApi.submit).toHaveBeenCalledWith({
      problemCode: 'P',
      judgeTemplateId: '6',
      code: 'local source',
    }),
  );
  expect(actions).toContainEqual({ type: 'setSubmissionModalVis', data: true });
  expect(cApi.getLatestRun).not.toHaveBeenCalled();
  expect(cApi.getRunQuery).not.toHaveBeenCalled();
  expect(cApi.runCases).not.toHaveBeenCalled();
  expect(cApi.cancelRun).not.toHaveBeenCalled();
  expect(cApi.getIdeHistory).not.toHaveBeenCalled();
  expect(cApi.getIdeCode).not.toHaveBeenCalled();
  expect(cApi.saveIdeCode).not.toHaveBeenCalled();
});

it.each([
  ['true', undefined],
  [undefined, 'true'],
])('enables cloud %s and Run %s independently', async (cloud, run) => {
  delete process.env.REACT_APP_IDE_CLOUD_CODE;
  delete process.env.REACT_APP_IDE_RUN;
  if (cloud) process.env.REACT_APP_IDE_CLOUD_CODE = cloud;
  if (run) process.env.REACT_APP_IDE_RUN = run;
  render(view());
  await act(async () => {
    await Promise.resolve();
  });
  expect(Boolean(screen.queryByRole('button', { name: '保存到云端' }))).toBe(Boolean(cloud));
  expect(Boolean(screen.queryByRole('button', { name: '运行自定义用例' }))).toBe(Boolean(run));
  expect(jest.mocked(cApi.getIdeHistory).mock.calls.length > 0).toBe(Boolean(cloud));
  expect(jest.mocked(cApi.getLatestRun).mock.calls.length > 0).toBe(Boolean(run));
});

it('retains business submission callbacks and history in local mode', async () => {
  delete process.env.REACT_APP_IDE_CLOUD_CODE;
  delete process.env.REACT_APP_IDE_RUN;
  const submitCode = jest.fn().mockResolvedValue('contest123');
  render(
    <Provider store={store}>
      <AnswerWorkspace
        {...props}
        context={{ type: 1, bizId: '77', problemCode: '1' }}
        scopeKey="Contest-77-1"
        submitCode={submitCode}
        submissionHistory={<div>contest submissions</div>}
      />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'contest code' } });
  expect(screen.getByRole('tab', { name: '提交记录' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('contest submissions')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '正式提交' }));
  await waitFor(() => expect(submitCode).toHaveBeenCalledWith('6', 'contest code'));
  expect(cApi.submit).not.toHaveBeenCalled();
  expect(cApi.runCases).not.toHaveBeenCalled();
  expect(cApi.getLatestRun).not.toHaveBeenCalled();
});
it('saves the final edit on unmount and keeps user drafts isolated', () => {
  const page = render(view());
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'latest code' } });
  page.rerender(view('bob'));
  expect(screen.getByLabelText('代码')).toHaveValue('');
  page.rerender(view('alice'));
  expect(screen.getByLabelText('代码')).toHaveValue('latest code');
});
it('handles run shortcuts once, ignores held keys, and saves the case collapse state', async () => {
  let resolve!: (id: string) => void;
  jest.mocked(cApi.runCases).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'abc', judgeResult: -1 });
  const page = render(view());
  await screen.findByRole('button', { name: '运行自定义用例' });
  const code = screen.getByLabelText('代码');
  fireEvent.change(code, { target: { value: 'source' } });
  fireEvent.keyDown(code, { key: 'Enter', ctrlKey: true });
  fireEvent.keyDown(code, { key: 'Enter', ctrlKey: true });
  fireEvent.keyDown(code, { key: 'Enter', ctrlKey: true, repeat: true });
  expect(cApi.runCases).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve('abc');
  });
  await waitFor(() => expect(screen.getByRole('button', { name: /秒后可运行/ })).toBeDisabled());
  fireEvent.click(screen.getByRole('tab', { name: '自定义测试用例' }));
  fireEvent.click(screen.getByRole('button', { name: /自定义测试用例/ }));
  page.unmount();
  render(view());
  fireEvent.click(screen.getByRole('tab', { name: '自定义测试用例' }));
  expect(screen.getByRole('button', { name: /自定义测试用例/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});
it.each(['ctrlKey', 'metaKey'])(
  'uses %s+S to save once without submitting or bypassing the save cooldown',
  async (modifier) => {
    let resolve!: (snapshot: any) => void;
    jest.mocked(cApi.saveIdeCode).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    render(view());
    const code = screen.getByLabelText('代码');
    await waitFor(() => expect(screen.queryByText('正在同步云端代码…')).not.toBeInTheDocument());
    expect(fireEvent.keyDown(code, { key: 's', [modifier]: true })).toBe(false);
    expect(cApi.saveIdeCode).not.toHaveBeenCalled();
    expect(cApi.submit).not.toHaveBeenCalled();
    fireEvent.change(code, { target: { value: 'source' } });
    fireEvent.keyDown(code, { key: 's', [modifier]: true });
    fireEvent.keyDown(code, { key: 's', [modifier]: true, repeat: true });
    fireEvent.keyDown(code, { key: 'S', [modifier]: true });
    expect(cApi.saveIdeCode).toHaveBeenCalledTimes(1);
    expect(cApi.saveIdeCode).toHaveBeenCalledWith({
      context: { type: 0, problemCode: 'P' },
      judgeTemplateId: '6',
      code: 'source',
    });
    expect(cApi.submit).not.toHaveBeenCalled();
    await act(async () => {
      resolve({ submissionId: 'saved1', savedAt: Date.now(), judgeTemplateId: '6', codeLength: 6 });
    });
    fireEvent.change(code, { target: { value: 'changed again' } });
    fireEvent.keyDown(code, { key: 's', [modifier]: true });
    expect(cApi.saveIdeCode).toHaveBeenCalledTimes(1);
    expect(cApi.submit).not.toHaveBeenCalled();
  },
);
it('formal submit uses the existing submit API and opens its existing result modal', async () => {
  jest.mocked(cApi.submit).mockResolvedValue('formal123');
  render(view());
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'source' } });
  fireEvent.click(screen.getByRole('button', { name: '正式提交' }));
  await waitFor(() =>
    expect(cApi.submit).toHaveBeenCalledWith({
      problemCode: 'P',
      judgeTemplateId: '6',
      code: 'source',
    }),
  );
  await waitFor(() =>
    expect(actions).toContainEqual(
      expect.objectContaining({ type: 'setTopSubmission', submissionID: 'formal123' }),
    ),
  );
  expect(cApi.runCases).not.toHaveBeenCalled();
  expect(actions).toContainEqual({ type: 'setSubmissionModalVis', data: true });
});

it.each(['', ' \t\n'])(
  'does not save blank code %j through either save shortcut',
  async (value) => {
    render(view());
    await waitFor(() => expect(screen.queryByText('正在同步云端代码…')).not.toBeInTheDocument());
    const code = screen.getByLabelText('代码');
    fireEvent.change(code, { target: { value } });
    fireEvent.keyDown(code, { key: 's', ctrlKey: true });
    fireEvent.keyDown(code, { key: 's', metaKey: true });
    expect(screen.getByRole('button', { name: '保存到云端' })).toBeDisabled();
    expect(cApi.saveIdeCode).not.toHaveBeenCalled();
    expect(cApi.submit).not.toHaveBeenCalled();
  },
);
it('runs a selected public case with the current code without replacing custom-case drafts', async () => {
  jest.mocked(cApi.runCases).mockResolvedValue('public123');
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'public123', judgeResult: 1 });
  const page = render(view());
  await screen.findByRole('button', { name: '运行自定义用例' });
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'current code' } });
  await act(async () => {
    window.dispatchEvent(
      new CustomEvent('answerIde:publicCase', {
        detail: { problemCode: 'Q', input: '4 5\n', expectedOutput: '9\n' },
      }),
    );
  });
  expect(cApi.runCases).not.toHaveBeenCalled();
  await act(async () => {
    window.dispatchEvent(
      new CustomEvent('answerIde:publicCase', {
        detail: { problemCode: 'P', input: '4 5\n', expectedOutput: '9\n' },
      }),
    );
  });
  expect(cApi.runCases).toHaveBeenCalledWith(
    expect.objectContaining({
      problemCode: 'P',
      code: 'current code',
      judgeTemplateId: '6',
      cases: [{ input: '4 5\n', expectedOutput: '9\n' }],
    }),
  );
  page.unmount();
  expect(JSON.parse(localStorage.getItem('answerIde:draft:alice:P')!).cases).toEqual([
    { key: 'initial', input: '' },
  ]);
});

it('places submission history immediately after run results in the console tabs', async () => {
  render(
    <Provider store={store}>
      <AnswerWorkspace {...props} submissionHistory={<div>recent submission fixture</div>} />
    </Provider>,
  );
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    '自定义测试用例',
    '运行结果',
    '提交记录',
    '代码历史',
  ]);
  fireEvent.click(screen.getByRole('tab', { name: '提交记录' }));
  expect(screen.getByText('recent submission fixture')).toBeVisible();
});

it('ignores the saved comparison preference and sends only cases for the problem checker', async () => {
  localStorage.setItem(
    'answerIde:draft:alice:P',
    JSON.stringify({
      templateId: '6',
      codes: { '6': 'source' },
      compareMode: 'exact',
      cases: [{ key: 'old', input: '1 2', expectedOutput: '3\n' }],
    }),
  );
  jest.mocked(cApi.runCases).mockResolvedValue('configured-checker');
  jest
    .mocked(cApi.getRunQuery)
    .mockResolvedValue({ submissionId: 'configured-checker', judgeResult: 1 });
  const page = render(view());
  expect(screen.queryByRole('combobox', { name: '输出比较方式' })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: '运行自定义用例' }));
  await waitFor(() => expect(cApi.runCases).toHaveBeenCalled());
  const payload = jest.mocked(cApi.runCases).mock.calls[0][0];
  expect(payload).not.toHaveProperty('compareMode');
  expect(payload.cases).toEqual([{ input: '1 2', expectedOutput: '3\n' }]);
  page.unmount();
  expect(JSON.parse(localStorage.getItem('answerIde:draft:alice:P')!)).not.toHaveProperty(
    'compareMode',
  );
});

it.each([undefined, [], [{ input: 'missing output' }, null, { input: 12, output: '3' }]])(
  'hides sample loading when no structured input/output pair is available (%j)',
  (samples) => {
    render(
      <Provider store={store}>
        <AnswerWorkspace {...props} samples={samples as any} />
      </Provider>,
    );
    expect(screen.queryByRole('button', { name: '载入题面样例' })).not.toBeInTheDocument();
  },
);

it('loads only valid structured samples and preserves a deliberately empty output', () => {
  render(
    <Provider store={store}>
      <AnswerWorkspace
        {...props}
        samples={
          [
            { input: '1 2', output: '3\n' },
            { input: '', output: '' },
            { input: 'invalid' },
            null,
          ] as any
        }
      />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: '载入题面样例' }));
  expect(screen.getByLabelText('用例 1 输入')).toHaveValue('1 2');
  expect(screen.getByLabelText('用例 1 期望输出')).toHaveValue('3\n');
  expect(screen.getByLabelText('用例 2 期望输出')).toHaveValue('');
  expect(screen.queryByLabelText('用例 3 输入')).not.toBeInTheDocument();
});

it('does not bypass an exhausted business submission limit with the keyboard shortcut', async () => {
  render(
    <Provider store={store}>
      <AnswerWorkspace {...props} remainingSubmissions={0} />
    </Provider>,
  );
  const source = screen.getByLabelText('代码');
  fireEvent.change(source, { target: { value: 'source' } });
  expect(screen.getByRole('button', { name: '正式提交' })).toBeDisabled();
  fireEvent.keyDown(source, { key: 's', metaKey: true });
  expect(cApi.submit).not.toHaveBeenCalled();
});

it('collapses the console to its tabs, persists it, and expands when a tab is selected', async () => {
  const page = render(view());
  await screen.findByRole('button', { name: '运行自定义用例' });
  const input = screen.getByRole('textbox', { name: '用例 1 输入' });
  fireEvent.change(input, { target: { value: 'preserved input' } });
  fireEvent.click(screen.getByRole('button', { name: '折叠测试与结果面板' }));
  expect(screen.getByRole('button', { name: '展开测试与结果面板' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(document.querySelector('.ide-console-collapsed')).toBeInTheDocument();
  expect(input).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '自定义测试用例' })).toBeVisible();
  fireEvent.click(screen.getByRole('tab', { name: '自定义测试用例' }));
  expect(screen.getByRole('button', { name: '折叠测试与结果面板' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(input).toHaveValue('preserved input');
  fireEvent.click(screen.getByRole('tab', { name: '自定义测试用例' }));
  expect(document.querySelector('.ide-console-collapsed')).toBeInTheDocument();
  page.unmount();
  render(view());
  expect(screen.getByRole('button', { name: '展开测试与结果面板' })).toBeVisible();
  fireEvent.click(screen.getByRole('tab', { name: '代码历史' }));
  expect(screen.getByRole('button', { name: '折叠测试与结果面板' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '代码历史' })).toHaveAttribute('aria-selected', 'true');
});
it('opens a collapsed console when the user starts a run', async () => {
  jest.mocked(cApi.runCases).mockResolvedValue('abc');
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'abc', judgeResult: 1 });
  render(view());
  const button = await screen.findByRole('button', { name: '运行自定义用例' });
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'source' } });
  fireEvent.click(screen.getByRole('button', { name: '折叠测试与结果面板' }));
  fireEvent.click(button);
  await waitFor(() => expect(cApi.runCases).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: '折叠测试与结果面板' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '运行结果' })).toHaveAttribute('aria-selected', 'true');
});
