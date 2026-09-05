import { render, screen } from '@testing-library/react';
import useProblemInfo from '../../Component/problem/API/getProblemInfo';
import { CProblemInfo } from './CProblemInfo';

jest.mock('../../Component/problem/API/getProblemInfo');
jest.mock('../../Component/problem/Program/ProProgram', () => () => <div>program</div>);
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

it('clears derived details while a new problem or session value is loading', () => {
  jest.mocked(useProblemInfo).mockReturnValue({ problemTitle: 'Problem A' });
  const view = render(<CProblemInfo {...route('SDUOJ-1')} />);
  expect(screen.getByText('detail:Problem A')).toBeInTheDocument();

  jest.mocked(useProblemInfo).mockReturnValue(undefined);
  view.rerender(<CProblemInfo {...route('SDUOJ-2')} />);

  expect(screen.queryByText('detail:Problem A')).not.toBeInTheDocument();
  expect(screen.getByText('detail:empty')).toBeInTheDocument();
  expect(screen.getByText('description:empty')).toBeInTheDocument();
});
