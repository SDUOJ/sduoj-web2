import { act, render } from '@testing-library/react';
import { JudgeMessage } from '../judgeMessages';
import { SubmissionList } from './SubmissionList';

let handleJudgeMessage: ((message: JudgeMessage) => void) | undefined;

jest.mock('../SyncJudging', () => ({
  SyncJudging: ({ dataHandle }: { dataHandle: (message: JudgeMessage) => void }) => {
    handleJudgeMessage = dataHandle;
    return null;
  },
}));
jest.mock('antd', () => {
  const Container = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    Button: Container,
    Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
      <>
        {title}
        {children}
      </>
    ),
    Form: Object.assign(Container, { Item: Container }),
    Input: Container,
    message: { success: jest.fn() },
    Select: Object.assign(Container, { Option: Container }),
    Space: Container,
    Tooltip: Container,
  };
});
jest.mock('@ant-design/icons', () => ({ ReloadOutlined: () => null }));
jest.mock('../../common/Table/TableWithSelection', () => () => null);
jest.mock('../Func/ReJudge', () => () => null);
jest.mock('../TestCase', () => () => null);
jest.mock('./ModalSubmissionList', () => () => null);
jest.mock('../../../Utils/judgeAhtu', () => () => false);
jest.mock('../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { rejudge: jest.fn() },
}));

it('accumulates checkpoint types and resets progress for a synchronous rejudge version', () => {
  const setDataSource = jest.fn();
  render(
    <SubmissionList
      name="submissions"
      t={(key: string) => key}
      tableData={{
        submissions: {
          selectedRowKeys: [],
          dataSource: [{ submissionId: 'abc', result: '-2', score: 0 }],
        },
      }}
      setDataSource={setDataSource}
      setTopSubmission={jest.fn()}
      setSubmissionModalVis={jest.fn()}
      addTableVersion={jest.fn()}
      setSelectedRowKeys={jest.fn()}
      API={jest.fn()}
    />,
  );

  act(() => {
    handleJudgeMessage?.(['abc', 1, 0, 0, 10, 1, 10, 1, 128]);
    handleJudgeMessage?.(['abc', 1, 1, 0, 11, 1, 20, 2, 256]);
  });

  const rows = setDataSource.mock.calls[1][0];
  expect(rows[0]).toMatchObject({ score: 30, RunningStep: 2 });
  expect(Array.from(rows[0].cur_cpt)).toEqual(['0:0', '1:0']);

  act(() => {
    handleJudgeMessage?.(['abc', 2, null, -4, 0, 0, null, null, null]);
    handleJudgeMessage?.(['abc', 2, 0, 0, 10, 1, 5, 1, 128]);
  });

  const rejudgedRows = setDataSource.mock.calls[3][0];
  expect(rejudgedRows[0]).toMatchObject({ score: 5, RunningStep: 1, liveVersion: 2 });
  expect(Array.from(rejudgedRows[0].cur_cpt)).toEqual(['0:0']);
});
