import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthoringWorkbench from './AuthoringWorkbench';
import {
  authoringApi,
  AuthoringNativePlan,
  AuthoringResource,
} from '../../../Utils/API/ai-authoring';
import i18n from '../../../Config/i18n';

jest.mock('../../../Utils/API/ai-authoring', () => ({
  authoringApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    generate: jest.fn(),
    getJob: jest.fn(),
    review: jest.fn(),
    nativePlan: jest.fn(),
    createProgram: jest.fn(),
    getProgram: jest.fn(),
    updateDescription: jest.fn(),
    uploadCheckpoint: jest.fn(),
    configureProblem: jest.fn(),
    finalize: jest.fn(),
    downloadBundle: jest.fn(),
  },
}));

const resource = (state = 'review'): AuthoringResource => ({
  id: 'author-1',
  kind: 'authoring',
  version: 3,
  state,
  data: {
    title: '整数翻倍',
    requirements: '读取整数，输出两倍',
    candidate: {
      title: 'Double',
      description: 'Read n and print 2n.',
      reference_code: 'n=int(input());print(2*n)',
      language: 'python',
      generator_code: 'seed=int(input());print(seed)',
      validator_code: "int(input());print('OK')",
      generator_seeds: [3],
      explanation: 'Multiply by two.',
      revision: 2,
      parent_hash: 'parent',
      package_hash: 'package-hash',
      validated: true,
      test_plan: [
        {
          index: 1,
          input: '1\n',
          output: '2\n',
          score: 34,
          public: true,
          purpose: 'sample',
          generated: false,
          input_sha256: 'i1',
          output_sha256: 'o1',
        },
        {
          index: 2,
          input: '2\n',
          output: '4\n',
          score: 33,
          public: false,
          purpose: 'small',
          generated: false,
          input_sha256: 'i2',
          output_sha256: 'o2',
        },
        {
          index: 3,
          input: '3\n',
          output: '6\n',
          score: 33,
          public: false,
          purpose: 'generated',
          generated: true,
          seed: 3,
          input_sha256: 'i3',
          output_sha256: 'o3',
        },
      ],
    },
  },
});

let current: AuthoringResource;

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.clearAllMocks();
  sessionStorage.clear();
  current = resource();
  (authoringApi.list as jest.Mock).mockImplementation(async () => ({
    rows: [current],
    totalNum: 1,
  }));
  (authoringApi.get as jest.Mock).mockImplementation(async () => current);
  (authoringApi.generate as jest.Mock).mockResolvedValue({ taskId: 'job-1', status: 'pending' });
  (authoringApi.review as jest.Mock).mockImplementation(async () => {
    current = resource('approved');
    return { state: 'approved', version: 4 };
  });
});

afterEach(async () => {
  await i18n.changeLanguage('zh');
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/v2/ai-authoring']}>
      <AuthoringWorkbench />
    </MemoryRouter>,
  );
}

test('renders the validated package and submits a continuous revision', async () => {
  renderPage();
  expect(await screen.findByText('Double')).toBeInTheDocument();
  expect(screen.getByText('修订 2')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('修订要求'), { target: { value: '增加负数边界' } });
  fireEvent.click(screen.getByRole('button', { name: /生成新修订/ }));
  await waitFor(() =>
    expect(authoringApi.generate).toHaveBeenCalledWith(
      'author-1',
      3,
      expect.stringMatching(/^authoring-/),
      '增加负数边界',
    ),
  );
});

test('teacher approval unlocks native publication', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /批准/ }));
  fireEvent.change(await screen.findByLabelText('审查意见'), {
    target: { value: '题面和测试已核对' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(authoringApi.review).toHaveBeenCalledWith('author-1', 3, true, '题面和测试已核对'),
  );
  expect(await screen.findByRole('button', { name: /录入 OJ/ })).toBeEnabled();
});

test('uploads every checkpoint and asks Autolab to verify before binding', async () => {
  current = resource('approved');
  const plan: AuthoringNativePlan = {
    resource_id: 'author-1',
    version: 3,
    revision: 2,
    package_hash: 'package-hash',
    marker: 'autolab-ai:author-1:v3',
    problem: { source: 'autolab-ai:author-1:v3' },
    description: { markdownDescription: 'Read n and print 2n.' },
    checkpoints: current.data.candidate!.test_plan,
  };
  (authoringApi.nativePlan as jest.Mock).mockResolvedValue(plan);
  (authoringApi.createProgram as jest.Mock).mockResolvedValue('SDUOJ-99');
  (authoringApi.getProgram as jest.Mock).mockResolvedValue({
    source: plan.marker,
    defaultDescriptionId: 88,
  });
  (authoringApi.uploadCheckpoint as jest.Mock)
    .mockResolvedValueOnce({ checkpointId: 101 })
    .mockResolvedValueOnce({ checkpointId: 102 })
    .mockResolvedValueOnce({ checkpointId: 103 });
  (authoringApi.configureProblem as jest.Mock).mockResolvedValue(undefined);
  (authoringApi.finalize as jest.Mock).mockResolvedValue({
    version: 4,
    problem_code: 'SDUOJ-99',
    ready_for_judging: true,
    replay: false,
  });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /录入 OJ/ }));
  fireEvent.change(await screen.findByLabelText('编程题组 ID'), { target: { value: '8' } });
  fireEvent.click(screen.getByRole('button', { name: '上传并验证' }));
  await waitFor(() => expect(authoringApi.finalize).toHaveBeenCalled(), { timeout: 5000 });
  expect(authoringApi.uploadCheckpoint).toHaveBeenCalledTimes(3);
  expect(authoringApi.configureProblem).toHaveBeenCalledWith('SDUOJ-99', plan, [101, 102, 103], 6);
  expect(authoringApi.finalize).toHaveBeenCalledWith(
    'author-1',
    expect.objectContaining({
      version: 3,
      group_id: 8,
      problem_code: 'SDUOJ-99',
      checkpoints: [
        { index: 1, checkpoint_id: 101 },
        { index: 2, checkpoint_id: 102 },
        { index: 3, checkpoint_id: 103 },
      ],
    }),
  );
});

test('refreshes immediately when generate replays an already successful job', async () => {
  (authoringApi.generate as jest.Mock).mockResolvedValue({
    taskId: 'job-finished',
    status: 'success',
    replay: true,
  });
  renderPage();
  expect(await screen.findByText('Double')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('修订要求'), { target: { value: '重放修订' } });
  fireEvent.click(screen.getByRole('button', { name: /生成新修订/ }));

  await waitFor(() => expect(authoringApi.get).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('alert')).toHaveTextContent('命题修订已生成并通过测试包验证');
});

test('shows a recoverable state when the authoring version conflicts', async () => {
  (authoringApi.generate as jest.Mock).mockRejectedValue('Authoring resource version conflict');
  renderPage();
  expect(await screen.findByText('Double')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('修订要求'), { target: { value: '过期修订' } });
  fireEvent.click(screen.getByRole('button', { name: /生成新修订/ }));

  const refresh = await screen.findByRole('button', { name: '刷新当前版本' });
  expect(screen.getByRole('alert')).toHaveClass('ant-alert-warning');
  fireEvent.click(refresh);
  await waitFor(() => expect(authoringApi.list).toHaveBeenCalledTimes(2));
});

test('translates the authoring workbench in English', async () => {
  await i18n.changeLanguage('en');
  try {
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'Programming problem authoring' }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Authoring project').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /New authoring project/ })).toBeInTheDocument();
    expect(screen.getByText('Revision 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download authoring package/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Revision requirements')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate revision/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New authoring project/ }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Authoring requirements');
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Topics')).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('zh');
  }
});

test.each(['resolve', 'reject'])(
  'a late selected project cannot %s into the current project',
  async (outcome) => {
    let resolveOld!: (value: AuthoringResource) => void;
    let rejectOld!: (reason: Error) => void;
    const pending = new Promise<AuthoringResource>((resolve, reject) => {
      resolveOld = resolve;
      rejectOld = reject;
    });
    const first = resource();
    first.data.title = 'Project A';
    first.data.candidate!.title = 'Package A';
    const second = {
      ...resource(),
      id: 'author-2',
      data: {
        ...resource().data,
        title: 'Project B',
        candidate: { ...resource().data.candidate!, title: 'Package B' },
      },
    };
    (authoringApi.list as jest.Mock).mockResolvedValue({ rows: [first, second], totalNum: 2 });
    (authoringApi.get as jest.Mock).mockImplementation((id: string) =>
      id === first.id ? pending : Promise.resolve(second),
    );
    (authoringApi.downloadBundle as jest.Mock).mockResolvedValue(undefined);
    renderPage();
    await waitFor(() => expect(authoringApi.get).toHaveBeenCalledWith(first.id));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '命题项目' }));
    fireEvent.click(await screen.findByText('Project B'));
    expect(await screen.findByText('Package B')).toBeInTheDocument();
    await act(async () => {
      if (outcome === 'resolve') resolveOld(first);
      else rejectOld(new Error('Old project failed'));
    });
    expect(screen.getByText('Package B')).toBeInTheDocument();
    expect(screen.queryByText('Package A')).not.toBeInTheDocument();
    expect(screen.queryByText('Error: Old project failed')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /下载命题包/ }));
    expect(authoringApi.downloadBundle).toHaveBeenCalledWith(second.id);
  },
);
