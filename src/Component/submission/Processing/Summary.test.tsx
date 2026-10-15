import { render, screen } from '@testing-library/react';
import { Summary } from './Summary';
import i18n from '../../../Config/i18n';
import { TestCaseStates } from '../../../Type/ISubmission';

jest.mock('./JudgeResult', () => ({ title }: any) => <div>{title}</div>);
jest.mock('../Func/DownloadTestCase', () => () => null);
const props = {
  t: (key: string) => i18n.t(key),
  roles: [],
  testcaseMod: 'show',
  scoreMod: 'show',
  sumScore: 100,
  TestCaseStateList: [{ caseIndex: 1, caseType: TestCaseStates.Pending }],
  PublicTestCaseStateList: [{ caseIndex: 1, caseType: TestCaseStates.Pending }],
  submissionInfo: {
    judgeResult: 8,
    judgeLog: 'error: missing semicolon',
    submissionId: 'ce',
    problemCode: 'P',
  },
};

beforeEach(async () => {
  await i18n.changeLanguage('zh');
});

it('hides statistics, first failing case, and datasets for compilation errors even with stale pending cases', () => {
  render(<Summary {...props} />);
  expect(screen.getByRole('region', { name: '编译日志' })).toHaveTextContent('missing semicolon');
  expect(screen.queryByText('统计')).not.toBeInTheDocument();
  expect(screen.queryByText('评测数据集')).not.toBeInTheDocument();
  expect(screen.queryByText('公开数据集')).not.toBeInTheDocument();
  expect(document.body).not.toHaveTextContent(/在测试点|NaN|Pending/);
});

it('preserves datasets and statistics for an executed wrong-answer submission', () => {
  render(
    <Summary
      {...props}
      submissionInfo={{ ...props.submissionInfo, judgeResult: 6 }}
      TestCaseStateList={[{ caseIndex: 1, caseType: TestCaseStates.WrongAnswer }]}
    />,
  );
  expect(screen.getByText('统计')).toBeVisible();
  expect(screen.getByText('评测数据集')).toBeVisible();
  expect(screen.getByText('公开数据集')).toBeVisible();
});
