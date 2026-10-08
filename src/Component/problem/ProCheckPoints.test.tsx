import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import ProCheckPoints from './ProCheckPoints';
import { createAppStore } from '../../Redux/Store';
import mApi from 'Utils/API/m-api';

jest.mock('Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    getCheckpointList: jest.fn(),
    updateProblemCheckpoints: jest.fn(),
    zipDownload: jest.fn(),
    uploadSingleCheckpoint: jest.fn(),
    uploadCheckpointFiles: jest.fn(),
  },
}));

const rows = [
  {
    checkpointId: 'c1',
    checkpointScore: 10,
    caseIndex: null,
    inputPreview: '1 2',
    outputPreview: '3',
    inputFilename: null,
    outputFilename: null,
    gmtCreate: 0,
    inputFileId: 'in1',
    outputFileId: 'out1',
  },
  {
    checkpointId: 'c2',
    checkpointScore: 20,
    caseIndex: null,
    inputPreview: '4 5',
    outputPreview: '9',
    inputFilename: null,
    outputFilename: null,
    gmtCreate: 0,
    inputFileId: 'in2',
    outputFileId: 'out2',
  },
];

function setup() {
  const store = createAppStore();
  (mApi.getCheckpointList as jest.Mock).mockResolvedValue(rows);
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <ProCheckPoints problemCode="SDUOJ-1" title="A+B" />
      </MemoryRouter>
    </Provider>,
  );
  return { ...view, store };
}

beforeEach(() => {
  jest.clearAllMocks();
  const getStyle = window.getComputedStyle;
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => getStyle(element));
});

it('keeps an unsaved score when a row is added as a sample', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  const c1 = await screen.findByDisplayValue('10');
  await user.clear(c1);
  await user.type(c1, '37');
  await waitFor(() => expect(c1).toHaveValue('37'));

  const row = c1.closest('tr')!;
  const plus = row.querySelector('[aria-label="plus"], [aria-label="加"]') as HTMLElement;
  expect(plus).toBeTruthy();
  await user.click(plus);

  await waitFor(() => {
    expect(screen.getByDisplayValue('37')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });
  // 表单节点不应被重置回 10
  expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument();
});

it('retains score input focus while typing characters', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  const c1 = await screen.findByDisplayValue('10');
  await user.clear(c1);
  await user.type(c1, '37');
  expect(c1).toHaveFocus();
  expect(c1).toHaveValue('37');
});

it('still initializes untouched scores from the server payload', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  expect(await screen.findByDisplayValue('10')).toBeInTheDocument();
  expect(screen.getByDisplayValue('20')).toBeInTheDocument();
});

it('keeps dirty scores when a sample is toggled off and on again', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  const c1 = await screen.findByDisplayValue('10');
  await user.clear(c1);
  await user.type(c1, '37');
  const row = c1.closest('tr')!;
  const toggle = row.querySelector('[aria-label="plus"], [aria-label="加"]') as HTMLElement;
  await user.click(toggle);
  await waitFor(() => expect(screen.getByDisplayValue('37')).toBeInTheDocument());

  // 移除样例（图标变为 minus）
  const remove = row.querySelector('[aria-label="minus"], [aria-label="减"]') as HTMLElement;
  expect(remove).toBeTruthy();
  await user.click(remove);
  await waitFor(() => expect(screen.getByDisplayValue('37')).toBeInTheDocument());

  // 再次添加样例，脏值仍不得被服务端 10 覆盖
  const addAgain = row.querySelector('[aria-label="plus"], [aria-label="加"]') as HTMLElement;
  await user.click(addAgain);
  await waitFor(() => expect(screen.getByDisplayValue('37')).toBeInTheDocument());
  expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument();
});

it('preserves multiple dirty scores across a sample toggle', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  const c1 = await screen.findByDisplayValue('10');
  const c2 = screen.getByDisplayValue('20');
  await user.clear(c1);
  await user.type(c1, '37');
  await user.clear(c2);
  await user.type(c2, '41');

  const row = c1.closest('tr')!;
  await user.click(row.querySelector('[aria-label="plus"], [aria-label="加"]') as HTMLElement);

  await waitFor(() => {
    expect(screen.getByDisplayValue('37')).toBeInTheDocument();
    expect(screen.getByDisplayValue('41')).toBeInTheDocument();
  });
});

it('cancel leaves the create/update API untouched', async () => {
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByRole('button', { name: /Checkpoint|测试点/ }));
  const c1 = await screen.findByDisplayValue('10');
  await user.clear(c1);
  await user.type(c1, '37');
  await user.click(screen.getByRole('button', { name: /Cancel|取.*消/ }));
  expect(mApi.updateProblemCheckpoints).not.toHaveBeenCalled();
});
