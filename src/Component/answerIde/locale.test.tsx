jest.mock('../submission/SyncJudging', () => ({ SyncJudging: () => null }));
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import i18n from '../../Config/i18n';
import AnswerWorkspace from './AnswerWorkspace';
import RunResults from './RunResults';
import en from '../../Assert/lang/en.json';
import zh from '../../Assert/lang/zh.json';
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    getLatestRun: jest.fn(async () => ({ detail: null, hasActiveRun: false })),
    getIdeHistory: jest.fn(async () => []),
  },
}));
jest.mock('./AnswerEditor', () => () => <textarea aria-label="Code" />);
it('provides matching translation keys and displays English workspace/results', async () => {
  expect(Object.keys(en.answerIde).sort()).toEqual(Object.keys(zh.answerIde).sort());
  expect(Object.keys(en.answerIde.state).sort()).toEqual(Object.keys(zh.answerIde.state).sort());
  await i18n.changeLanguage('en');
  const page = render(
    <Provider store={createStore((state = {}) => state)}>
      <AnswerWorkspace
        problemCode="P"
        username="alice"
        title="Problem"
        templates={[]}
        querySubmission={async () => undefined}
      />
      <RunResults
        detail={{
          submissionId: 'abc',
          judgeResult: 6,
          run: {
            mode: 'cases',
            cases: [
              {
                index: 0,
                input: '',
                expectedOutput: '',
                stdout: 'wrong',
                judgeResult: 6,
                stdoutTruncated: true,
              },
            ],
          },
        }}
      />
    </Provider>,
  );
  expect(await screen.findByRole('button', { name: 'Run' }, { timeout: 5000 })).toBeVisible();
  expect(screen.getByText('Standard output')).toBeVisible();
  expect(screen.getByText('Standard error')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Output differences/ }));
  expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  expect(
    Array.from(document.querySelectorAll('[aria-label], [placeholder]'))
      .map((node) => node.getAttribute('aria-label') ?? node.getAttribute('placeholder'))
      .join(' '),
  ).not.toMatch(/[\u3400-\u9fff]/);
  await act(async () => {
    await i18n.changeLanguage('zh');
  });
  expect(screen.getByRole('button', { name: '运行' })).toBeVisible();
  expect(screen.getByText('标准输出')).toBeVisible();
  expect(screen.getByText('标准错误输出')).toBeVisible();
  page.unmount();
});
