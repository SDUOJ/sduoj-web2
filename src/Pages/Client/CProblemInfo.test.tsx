import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import cApi from '../../Utils/API/c-api';
import useProblemInfo from '../../Component/problem/API/getProblemInfo';
import { CProblemInfo } from './CProblemInfo';
import { CProblemIde } from './CProblemIde';

jest.mock('../../Component/problem/API/getProblemInfo');
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { runCapabilities: jest.fn().mockResolvedValue({ enabled: true }) },
}));
jest.mock('../../Component/answerIde/AnswerWorkspace', () => () => <div>IDE editor</div>);
jest.mock(
  '../../Component/problem/Program/ProProgram',
  () =>
    ({ hideSubmit, headerBefore }: any) => (
      <div>
        {headerBefore?.(null)}program{!hideSubmit && <button>legacy submit</button>}
      </div>
    ),
);
jest.mock('../../Component/problem/Program/ProProgramDetail', () => ({ problemInfo }: any) => (
  <div>detail:{problemInfo?.problemTitle ?? 'empty'}</div>
));
jest.mock('../../Component/problem/Program/ProProgramDescription', () => ({ problemInfo }: any) => (
  <div>description:{problemInfo?.problemTitle ?? 'empty'}</div>
));
jest.mock('../../Component/submission/SubmissionList/RecentSubmissionList', () => () => null);

const route = (problemCode: string) => ({
  match: { params: { ProblemCode: problemCode } },
  location: { search: '' },
  username: 'alice',
  t: (key: string) => key,
});

it('keeps the standard submit page separate and preserves description selection in the IDE link', async () => {
  jest.mocked(useProblemInfo).mockReturnValue({ problemTitle: 'P', judgeTemplates: [{ type: 0 }] });
  render(
    <MemoryRouter>
      <CProblemInfo {...route('SDUOJ-1')} location={{ search: '?descriptionId=2' }} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: 'legacy submit' })).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /answerIde.open/ })).toBeInTheDocument(),
  );
  expect(screen.getByRole('button', { name: /answerIde.open/ }).closest('a')).toHaveAttribute(
    'href',
    '/v2/problem/SDUOJ-1/ide?descriptionId=2',
  );
  expect(screen.queryByText('IDE editor')).not.toBeInTheDocument();
});

it('opens the IDE on its own route with a return link and no duplicate legacy submit', async () => {
  jest.mocked(useProblemInfo).mockReturnValue({ problemTitle: 'P', judgeTemplates: [{ type: 0 }] });
  render(
    <MemoryRouter>
      <CProblemIde {...route('SDUOJ-1')} location={{ search: '?descriptionId=2' }} />
    </MemoryRouter>,
  );
  expect(
    (await screen.findByRole('button', { name: /answerIde.back/ })).closest('a'),
  ).toHaveAttribute('href', '/v2/problem/SDUOJ-1?descriptionId=2');
  await waitFor(() => expect(screen.getByText('IDE editor')).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'legacy submit' })).not.toBeInTheDocument();
});

it('does not expose the IDE entry when the server disables Run', async () => {
  jest.mocked(cApi.runCapabilities).mockResolvedValueOnce({ enabled: false, maxCases: 10 });
  jest.mocked(useProblemInfo).mockReturnValue({ problemTitle: 'P', judgeTemplates: [{ type: 0 }] });
  render(
    <MemoryRouter>
      <CProblemInfo {...route('SDUOJ-1')} />
    </MemoryRouter>,
  );
  await waitFor(() => expect(cApi.runCapabilities).toHaveBeenCalled());
  expect(screen.queryByRole('button', { name: /answerIde.open/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'legacy submit' })).toBeInTheDocument();
});

it('clears derived details while a new problem or session value is loading', async () => {
  jest.mocked(cApi.runCapabilities).mockResolvedValueOnce({ enabled: false, maxCases: 10 });
  jest.mocked(useProblemInfo).mockReturnValue({ problemTitle: 'Problem A' });
  const view = render(<CProblemInfo {...route('SDUOJ-1')} />);
  expect(screen.getByText('detail:Problem A')).toBeInTheDocument();

  jest.mocked(useProblemInfo).mockReturnValue(undefined);
  view.rerender(<CProblemInfo {...route('SDUOJ-2')} />);

  expect(screen.queryByText('detail:Problem A')).not.toBeInTheDocument();
  expect(screen.getByText('detail:empty')).toBeInTheDocument();
  expect(screen.getByText('description:empty')).toBeInTheDocument();
  await waitFor(() => expect(cApi.runCapabilities).toHaveBeenCalled());
});
