import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { Form } from 'antd';
import i18n from '../../../../Config/i18n';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import BodyChecker from './BodyChecker';
import PublicAutoSettings from './PublicAutoSettings';
import { CheckerConfig } from '../../../../Type/publicAuto';
import mApi from '../../../../Utils/API/m-api';
import { fileUpload } from '../../../../Utils/fileUpload';
jest.mock('../../../../Utils/fileUpload', () => ({ fileUpload: jest.fn() }));

jest.mock('../../../answerIde/AnswerEditor', () => ({ value, onChange }: any) => (
  <textarea aria-label="source" value={value} onChange={(e) => onChange(e.target.value)} />
));
jest.mock('../../../common/CodeEditor', () => () => null);
jest.mock('./MetaTaskProgress', () => () => null);
jest.mock('../../../../Utils/API/m-api', () => ({
  __esModule: true,
  default: { publicAutoStatus: jest.fn() },
}));
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
const config: CheckerConfig = {
  source: 'lcmp.cpp',
  spj: null,
  inputValidator: { source: 'validator', spj: '{}' },
  standardProgram: { judgeTemplateId: 6, code: 'standard' },
  publicCasePolicy: { autoAddEnabled: false, maxCount: 20 },
};
const problem = {
  problemCode: 'P',
  checkerConfig: config,
  publicAutoGate: { eligible: true, failReasons: [], fingerprint: 'f' },
  judgeTemplateListDTOList: [{ id: 6, type: 0, title: 'C++' }],
};
function Settings({ initial = config }: { initial?: CheckerConfig }) {
  const [value, setValue] = useState(initial);
  return <PublicAutoSettings value={value} onChange={setValue} problem={problem} />;
}
it('allows policy changes only with current gate evidence and disables it after editing source', async () => {
  render(<Settings />);
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeEnabled();
  fireEvent.click(screen.getByRole('switch', { name: '自动补全公共用例' }));
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeChecked();
  const editors = await screen.findAllByLabelText('source');
  fireEvent.change(editors[0], { target: { value: 'changed' } });
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeDisabled();
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).not.toBeChecked();
  expect(screen.getByText('配置有修改，请先保存并重新执行自检。')).toBeInTheDocument();
});
it('does not allow edited configuration to borrow the saved gate', () => {
  render(
    <Settings
      initial={{ ...config, standardProgram: { judgeTemplateId: 6, code: 'different' } }}
    />,
  );
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '执行输入与标准程序自检' })).toBeDisabled();
});
it('refreshes authoritative gate status', async () => {
  jest
    .mocked(mApi.publicAutoStatus)
    .mockResolvedValue({ eligible: false, failReasons: ['CONFIG_CHANGED'], fingerprint: 'new' });
  render(<Settings />);
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  fireEvent.click(screen.getByRole('button', { name: '刷新自检状态' }));
  await waitFor(() =>
    expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeDisabled(),
  );
  expect(screen.getByText('配置或测试集已变化，旧自检已失效')).toBeInTheDocument();
});
it('defaults input identity to raw bytes and requires renewed checks after explicit normalization', () => {
  render(
    <Settings initial={{ ...config, publicCasePolicy: { autoAddEnabled: true, maxCount: 20 } }} />,
  );
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  expect(screen.getByText('按原始字节去重（默认）')).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '输入去重规则' }));
  fireEvent.click(screen.getByText('统一换行并忽略末尾空行'));
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeDisabled();
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).not.toBeChecked();
  expect(screen.getByText('配置有修改，请先保存并重新执行自检。')).toBeInTheDocument();
});
it('changing the old output checker preserves the new configuration fields', () => {
  const changed = jest.fn();
  const store = createStore(() => ({
    ManageReducer: { manageInitData: { ProblemInfo: problem } },
  }));
  render(
    <Provider store={store}>
      <BodyChecker value={config} onChange={changed} />
    </Provider>,
  );
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '输出检查器' }));
  fireEvent.click(screen.getByText('按词比较（空白分隔） · wcmp.cpp'));
  expect(changed).toHaveBeenCalledWith({ ...config, source: 'wcmp.cpp', spj: null });
});

it('switching validator source to ZIP invalidates the gate and clears conflicting source', async () => {
  render(
    <Settings initial={{ ...config, publicCasePolicy: { autoAddEnabled: true, maxCount: 20 } }} />,
  );
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  const group = screen.getByRole('radiogroup', { name: '输入检查器形式' });
  fireEvent.click(group.querySelector('input[value="zip"]')!);
  expect(screen.getByRole('button', { name: '上传检查器 ZIP' })).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).toBeDisabled();
  expect(screen.getByRole('switch', { name: '自动补全公共用例' })).not.toBeChecked();
  fireEvent.click(group.querySelector('input[value="code"]')!);
  const editors = await screen.findAllByLabelText('source');
  expect(editors[0]).toHaveValue('');
});
it('loads saved validator ZIP and keeps it when editing its compile configuration', () => {
  const changed = jest.fn();
  const zipped = { ...config, inputValidator: { source: null, zipFileId: '123', spj: '{}' } };
  const view = render(<PublicAutoSettings value={config} onChange={changed} problem={problem} />);
  view.rerender(<PublicAutoSettings value={zipped} onChange={changed} problem={problem} />);
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  expect(screen.getByRole('button', { name: '上传检查器 ZIP' })).toBeInTheDocument();
  expect(screen.getByText('检查器 ZIP: 123')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(i18n.t('publicAuto.validatorConfig') as string), {
    target: { value: '{"compile":{}}' },
  });
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({
      inputValidator: { source: null, zipFileId: '123', spj: '{"compile":{}}' },
    }),
  );
});

it('uploads validator ZIP with the shared upload API and saves an exclusive ZIP configuration', async () => {
  jest.mocked(fileUpload).mockResolvedValue([{ id: '987' } as any]);
  const changed = jest.fn();
  const view = render(<PublicAutoSettings value={config} onChange={changed} problem={problem} />);
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  const group = screen.getByRole('radiogroup', { name: '输入检查器形式' });
  fireEvent.click(group.querySelector('input[value="zip"]')!);
  const file = new File(['archive'], 'validator.zip', { type: 'application/zip' });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
  await waitFor(() => expect(fileUpload).toHaveBeenCalledWith([file]));
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ inputValidator: { source: null, zipFileId: '987', spj: '{}' } }),
    ),
  );
});

it('keeps both ZIP radio groups selected inside the checkerConfig form field', () => {
  const zipped: CheckerConfig = {
    ...config,
    inputValidator: { source: null, zipFileId: '123', spj: '{}' },
    standardProgram: { judgeTemplateId: 6, zipFileId: '456' },
  };
  render(
    <Form initialValues={{ checkerConfig: zipped }}>
      <Form.Item name="checkerConfig">
        <PublicAutoSettings value={zipped} onChange={() => {}} problem={problem} />
      </Form.Item>
    </Form>,
  );
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  const validator = screen
    .getByRole('radiogroup', { name: '输入检查器形式' })
    .querySelector('input[value="zip"]')!;
  const standard = screen.getByRole('radio', { name: 'ZIP (≤5MB)' });
  expect(validator).toBeChecked();
  expect(standard).toBeChecked();
  expect(validator.getAttribute('name')).not.toBe(standard.getAttribute('name'));
});

it('hydrates a saved reference-solution ZIP after initial form values arrive', () => {
  const changed = jest.fn();
  const view = render(
    <PublicAutoSettings
      value={{ source: 'lcmp.cpp', spj: null }}
      onChange={changed}
      problem={problem}
    />,
  );
  view.rerender(
    <PublicAutoSettings
      value={{ ...config, standardProgram: { judgeTemplateId: 6, zipFileId: '456' } }}
      onChange={changed}
      problem={problem}
    />,
  );
  fireEvent.click(screen.getByText('输入校验与公共用例策略'));
  expect(screen.getByRole('radio', { name: 'ZIP (≤5MB)' })).toBeChecked();
  expect(screen.getByText('ZIP ID: 456')).toBeInTheDocument();
});
