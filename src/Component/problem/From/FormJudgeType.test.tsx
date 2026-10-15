import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form, Button } from 'antd';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import i18n from '../../../Config/i18n';
import mApi from '../../../Utils/API/m-api';
import FormJudgeType from './FormJudgeType';

jest.mock('../../../Utils/API/m-api', () => ({
  __esModule: true,
  default: { getJudgeTemplateList: jest.fn() },
}));
jest.mock('../../common/CodeEditor', () => ({ value, onChange }: any) => (
  <textarea
    aria-label="template source"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
  />
));
jest.mock('../../answerIde/AnswerEditor', () => ({ value, onChange }: any) => (
  <textarea
    aria-label="program source"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
  />
));
jest.mock('./Item/MetaTaskProgress', () => () => null);
const languages = [
  { id: '6', title: 'C++14', type: 0 },
  { id: '7', title: 'Python3', type: 0 },
];
const checker = { source: 'lcmp.cpp', spj: null };

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest
    .mocked(mApi.getJudgeTemplateList)
    .mockImplementation(async ({ type }: any) =>
      type === 0 ? languages : [{ id: '100', title: 'Custom pipeline', type: 2 }],
    );
});
function setup(initial?: any) {
  const saved = jest.fn();
  const store = createAppStore();
  if (initial) store.dispatch({ type: 'addManageInitData', key: 'ProblemInfo', data: initial });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Form initialValues={initial} onFinish={saved}>
          <FormJudgeType />
          <Button htmlType="submit">Save configuration</Button>
        </Form>
      </MemoryRouter>
    </Provider>,
  );
  return saved;
}

it('registers the visible default checker and uses selected languages for a new reference solution', async () => {
  const saved = setup();
  expect(screen.getByText('评测模式')).toBeVisible();
  expect(screen.getByText('输出判定')).toBeVisible();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '支持语言' }));
  fireEvent.click(await screen.findByText('C++14'));
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  fireEvent.click(screen.getByRole('switch', { name: '标准程序（代码 ≤64KB）' }));
  expect(screen.getByRole('combobox', { name: '标准程序评测语言' })).toBeInTheDocument();
  expect(screen.getByText('保存题目后可执行自检')).toBeVisible();
  expect(screen.getByRole('button', { name: '执行输入与标准程序自检' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save configuration' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0]).toMatchObject({
    judgeTemplates: ['6'],
    checkerConfig: { ...checker, standardProgram: { judgeTemplateId: '6', code: '' } },
  });
});

it('preserves loaded language and function-template fields when the optional panel is collapsed', async () => {
  const initial = {
    problemCode: 'P',
    judgeTemplates: ['6'],
    checkerConfig: checker,
    functionTemplates: {
      '6': {
        judgeTemplateId: '6',
        functionTemplate: 'wrapper',
        initialTemplate: 'starter',
        isShowFunctionTemplate: true,
      },
    },
  };
  const saved = setup(initial);
  await screen.findByText('C++14');
  const panel = await screen.findByRole('button', { name: /函数模板/ });
  await waitFor(() => expect(panel).toHaveAttribute('aria-expanded', 'true'));
  fireEvent.click(panel);
  fireEvent.click(screen.getByRole('button', { name: 'Save configuration' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0]).toMatchObject({
    judgeTemplates: initial.judgeTemplates,
    checkerConfig: initial.checkerConfig,
    functionTemplates: initial.functionTemplates,
  });
});

it('loads existing advanced templates without showing IO-only settings', async () => {
  const saved = setup({ problemCode: 'P', judgeTemplates: ['100'] });
  expect(await screen.findByText('Custom pipeline')).toBeVisible();
  expect(screen.queryByText('输出判定')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save configuration' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0].judgeTemplates).toEqual(['100']);
});
