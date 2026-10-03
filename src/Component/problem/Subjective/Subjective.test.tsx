import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Subjective from './Subjective';

jest.mock('../../../Utils/MarkdownText', () => () => null);
jest.mock('../../common/Editor', () => () => null);

it('waits for problem metadata and ignores an older answer response after switching questions', async () => {
  let resolveOld!: (value: any) => void;
  const oldAnswer = jest.fn(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  const newAnswer = jest.fn().mockResolvedValue({ answer_m: '', acceptanceQueue: [] });
  const view = (problemInfo: any, getAS: any) => (
    <MemoryRouter>
      <Subjective problemInfo={problemInfo} getAS={getAS} key_o="test" />
    </MemoryRouter>
  );
  const { rerender } = render(view(undefined, oldAnswer));
  expect(oldAnswer).not.toHaveBeenCalled();
  rerender(view({ type: 1 }, oldAnswer));
  expect(oldAnswer).toHaveBeenCalledTimes(1);
  await act(async () => {
    rerender(view({ type: 2 }, newAnswer));
  });
  expect(screen.getByText('验收')).toBeInTheDocument();
  expect(screen.queryByText('我的答案')).not.toBeInTheDocument();
  await act(async () => {
    resolveOld({ answer_m: ['old text'], acceptanceFinished: true });
  });
  expect(screen.getByText('验收')).toBeInTheDocument();
  expect(screen.queryByText('我的答案')).not.toBeInTheDocument();
  expect(screen.queryByText('已完成验收')).not.toBeInTheDocument();
});
