import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import AnswerWorkspace from './AnswerWorkspace';
import useIdeDebug from './useIdeDebug';
import cApi from '../../Utils/API/c-api';
import i18n from '../../Config/i18n';
jest.mock('./useIdeDebug', () => ({
  __esModule: true,
  default: jest.fn(),
  debugMessage: () => 'error',
}));
jest.mock('./useDebugInspection', () => ({
  __esModule: true,
  default: () => ({ frames: [], variables: [], busy: false, refresh: jest.fn() }),
}));
jest.mock('./AnswerEditor', () => ({ debug, value, onChange }: any) => (
  <textarea
    aria-label="代码"
    value={value}
    onFocus={() => debug.cursor(12)}
    onChange={(e) => onChange(e.target.value)}
  />
));
jest.mock('../submission/SyncJudging', () => ({ SyncJudging: () => null }));
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    getLatestRun: jest.fn(async () => ({ detail: null, hasActiveRun: false })),
    getIdeHistory: jest.fn(async () => []),
    runCases: jest.fn(async () => 'run-1'),
    getRunQuery: jest.fn(async () => ({ submissionId: 'run-1', judgeResult: 1 })),
  },
}));
let debug: any;
beforeEach(async () => {
  process.env.REACT_APP_IDE_RUN = 'true';
  localStorage.clear();
  jest.clearAllMocks();
  await i18n.changeLanguage('zh');
  debug = {
    available: true,
    active: false,
    canInspect: false,
    sending: false,
    breakpoints: [],
    output: '',
    notice: '',
    start: jest.fn(),
    execute: jest.fn(async () => 'command'),
    control: jest.fn(),
    toggleBreakpoint: jest.fn(),
    updateBreakpoints: jest.fn(),
    writeInput: jest.fn(),
    clearOutput: jest.fn(),
    threadId: 7,
  };
  jest.mocked(useIdeDebug).mockImplementation(function useMockDebug() {
    const [commandHistory, setCommandHistory] = useState('');
    return { ...debug, commandHistory, setCommandHistory };
  });
});
afterEach(() => {
  delete process.env.REACT_APP_IDE_RUN;
});
function view() {
  return (
    <Provider store={createStore((s = {}) => s)}>
      <AnswerWorkspace
        problemCode="P1"
        username="alice"
        title="P1"
        templates={[{ id: '6', type: 0, title: 'C++', acceptFileExtensions: ['cpp'], comment: '' }]}
        querySubmission={async () => undefined}
      />
    </Provider>
  );
}
test('keeps Run and exposes Debug in the existing split button and console', async () => {
  render(view());
  // Cheap readiness queries let recovery microtasks finish before checking semantics.
  const run = (await screen.findByText('运行自定义用例', { selector: 'button span' })).closest(
    'button',
  )!;
  fireEvent.change(screen.getByLabelText('代码'), { target: { value: 'int main(){}' } });
  expect(run).toHaveRole('button');
  expect(run).toHaveAccessibleName('运行自定义用例');
  expect(run).toBeVisible();
  fireEvent.click(screen.getByLabelText('选择运行或调试'));
  const menu = (
    await screen.findByText('调试', { selector: '.ant-dropdown-menu-title-content' })
  ).closest('[role="menuitem"]')!;
  expect(menu).toHaveRole('menuitem');
  expect(menu).toHaveAccessibleName(/调试/);
  await waitFor(() => expect(menu).toBeVisible());
  fireEvent.click(menu);
  const start = screen.getByLabelText('调试');
  expect(start).toHaveRole('button');
  expect(start).toHaveAccessibleName('调试');
  expect(start).toBeVisible();
  fireEvent.click(start);
  expect(debug.start).toHaveBeenCalledTimes(1);
  const sidebar = document.querySelector('aside[aria-label="运行和调试"]');
  expect(sidebar).toHaveRole('complementary');
  expect(sidebar).toHaveAccessibleName('运行和调试');
  expect(sidebar).toBeVisible();
  const tablist = document.querySelector('.ide-console-tabs [role="tablist"]') as HTMLElement;
  for (const name of ['程序终端', '调试指令']) {
    const tab = within(tablist).getByText(name).closest('[role="tab"]')!;
    expect(tab).toHaveRole('tab');
    expect(tab).toHaveAccessibleName(name);
    expect(tab).toBeVisible();
  }
});
test('uses focused workspace VS Code keys once and preserves normal Run', () => {
  const page = render(view());
  const editor = screen.getByLabelText('代码');
  fireEvent.change(editor, { target: { value: 'int main(){}' } });
  fireEvent.focus(editor);
  fireEvent.keyDown(editor, { key: 'F9' });
  expect(debug.toggleBreakpoint).toHaveBeenCalledWith(12);
  fireEvent.keyDown(editor, { key: 'F5', repeat: true });
  expect(debug.start).not.toHaveBeenCalled();
  fireEvent.keyDown(editor, { key: 'F5' });
  expect(debug.start).toHaveBeenCalledTimes(1);
  debug = {
    ...debug,
    active: true,
    canInspect: true,
    session: { state: 'stopped', commands: [], stopId: 's1', sessionId: 'id1' },
  };
  page.rerender(view());
  fireEvent.keyDown(editor, { key: 'F10' });
  expect(debug.execute).toHaveBeenLastCalledWith('next', { threadId: 7 });
  fireEvent.keyDown(editor, { key: 'F11' });
  expect(debug.execute).toHaveBeenLastCalledWith('stepIn', { threadId: 7 });
  fireEvent.keyDown(editor, { key: 'F11', shiftKey: true });
  expect(debug.execute).toHaveBeenLastCalledWith('stepOut', { threadId: 7 });
  debug.canInspect = false;
  page.rerender(view());
  fireEvent.keyDown(editor, { key: 'F5', shiftKey: true });
  expect(debug.control).toHaveBeenCalledWith('stop');
  fireEvent.keyDown(document.body, { key: 'F5' });
  expect(debug.start).toHaveBeenCalledTimes(1);
  expect(cApi.runCases).not.toHaveBeenCalled();
});
test('command terminal rejects arbitrary GDB text and sends only protocol operations', async () => {
  debug.active = true;
  debug.canInspect = true;
  debug.session = { state: 'stopped', commands: [], stopId: 's1', sessionId: 'id1' };
  localStorage.setItem('answerIde:debugMode:alice:P1', 'debug');
  render(view());
  fireEvent.click(screen.getByRole('tab', { name: '调试指令' }));
  const input = screen.getByRole('textbox', { name: '调试指令' });
  fireEvent.change(input, { target: { value: 'shell id' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
  expect(await screen.findByText(/不支持此指令/)).toBeVisible();
  expect(debug.execute).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'next' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
  await waitFor(() => expect(debug.execute).toHaveBeenCalledWith('next', { threadId: 7 }));
});

test('Ctrl+F5 retains the original custom Run operation without creating a debugger', async () => {
  render(view());
  const run = (await screen.findByText('运行自定义用例', { selector: 'button span' })).closest(
    'button',
  )!;
  expect(run).toHaveRole('button');
  expect(run).toHaveAccessibleName('运行自定义用例');
  expect(run).toBeVisible();
  const editor = screen.getByLabelText('代码');
  fireEvent.change(editor, { target: { value: 'int main(){}' } });
  fireEvent.keyDown(editor, { key: 'F5', ctrlKey: true });
  await waitFor(() => expect(cApi.runCases).toHaveBeenCalledTimes(1));
  expect(debug.start).not.toHaveBeenCalled();
});

test('switching to Run releases the scene and hides all debug panels and terminals', async () => {
  localStorage.setItem('answerIde:debugMode:alice:P1', 'debug');
  debug.active = true;
  debug.control.mockResolvedValue(true);
  render(view());
  expect(screen.getByRole('tab', { name: '程序终端' })).toBeVisible();
  expect(screen.queryByRole('tab', { name: '自定义用例' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '选择运行或调试' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: /运行/ }));
  await waitFor(() => expect(debug.control).toHaveBeenCalledWith('stop'));
  await waitFor(() =>
    expect(screen.queryByRole('tab', { name: '程序终端' })).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('complementary', { name: '运行和调试' })).not.toBeInTheDocument();
});

test('shows command errors only for a live scene, avoiding duplicate terminal errors', () => {
  localStorage.setItem('answerIde:debugMode:alice:P1', 'debug');
  debug.session = { state: 'terminated', commands: [{ error: { code: 'timeout' } }] };
  const page = render(view());
  expect(screen.queryByText('error')).not.toBeInTheDocument();
  debug.active = true;
  debug.session.state = 'stopped';
  page.rerender(view());
  expect(screen.getByText('error')).toBeVisible();
});
