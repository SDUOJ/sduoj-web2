import { act, render, screen, waitFor } from '@testing-library/react';
import i18n from '../Config/i18n';
import MarkdownText from './MarkdownText';
import { MarkdownPreview } from './MarkdownPreview';

jest.mock('./MarkdownPreview', () => ({ MarkdownPreview: jest.fn() }));

it('clears failed render output and gives the user a translated fallback', async () => {
  await i18n.changeLanguage('en');
  jest.mocked(MarkdownPreview).mockRejectedValue(new Error('oversized'));
  render(<MarkdownText id="preview-failure" text="fixture" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to preview this content');
  expect(document.getElementById('preview-failure')).toBeEmptyDOMElement();
});

it('ignores a late failed render after a newer content generation', async () => {
  let reject!: (reason: Error) => void;
  jest
    .mocked(MarkdownPreview)
    .mockReturnValueOnce(
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
    )
    .mockResolvedValue(undefined);
  const view = render(<MarkdownText id="preview-race" text="old" />);
  view.rerender(<MarkdownText id="preview-race" text="new" />);
  reject(new Error('late'));
  await waitFor(() => expect(MarkdownPreview).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('aborts pending preview work when its view unmounts', () => {
  jest.mocked(MarkdownPreview).mockReturnValue(new Promise(() => {}));
  const view = render(<MarkdownText id="preview-unmount" text="fixture" />);
  const signal = jest.mocked(MarkdownPreview).mock.calls[0][2]?.signal;
  expect(signal?.aborted).toBe(false);
  view.unmount();
  expect(signal?.aborted).toBe(true);
});

it('keeps the completed statement visible until its next preview commits atomically', async () => {
  const pending: Array<() => void> = [];
  jest.mocked(MarkdownPreview).mockImplementation(
    (text, id) =>
      new Promise((resolve) => {
        const target = document.getElementById(id)!;
        target.className = 'vditor-reset';
        pending.push(() => {
          target.textContent = text ?? '';
          resolve(undefined);
        });
      }),
  );
  const view = render(<MarkdownText id="atomic" text="First" retainScope="problem-alice" />);
  await act(async () => pending[0]());
  const completed = document.querySelector('#atomic > .vditor-reset')!;
  expect(completed).toBeVisible();
  view.rerender(<MarkdownText id="atomic" text="Second" retainScope="problem-alice" />);
  expect(completed).toBeVisible();
  expect(completed).toHaveTextContent('First');
  expect(document.querySelector('#atomic > [aria-hidden]')).not.toBeVisible();
  await act(async () => pending[1]());
  expect(completed).not.toBeInTheDocument();
  expect(document.querySelector('#atomic > .vditor-reset')).toHaveTextContent('Second');
});

it('isolates late preview DOM writes and clears retained content at a scope boundary', async () => {
  const pending: Array<() => void> = [];
  jest.mocked(MarkdownPreview).mockImplementation(
    (text, id) =>
      new Promise((resolve) => {
        const target = document.getElementById(id)!;
        pending.push(() => {
          target.textContent = text ?? '';
          resolve(undefined);
        });
      }),
  );
  const view = render(<MarkdownText id="isolation" text="Private A" retainScope="alice" />);
  await act(async () => pending[0]());
  view.rerender(<MarkdownText id="isolation" text="Late A" retainScope="alice" />);
  view.rerender(<MarkdownText id="isolation" text="Public B" retainScope="bob" />);
  expect(document.getElementById('isolation')).not.toHaveTextContent('Private A');
  await act(async () => pending[2]());
  await act(async () => pending[1]());
  expect(document.getElementById('isolation')).toHaveTextContent('Public B');
  expect(document.getElementById('isolation')).not.toHaveTextContent('Late A');
});

it('never renders into a retained Markdown element that duplicates a pending preview ID', async () => {
  let collisionId = '';
  jest.mocked(MarkdownPreview).mockImplementation(async (text, id) => {
    const target = document.getElementById(id)!;
    if (text === 'First') {
      const sequence = Number(id.slice(id.lastIndexOf('-') + 1));
      collisionId = `collision-pending-${sequence + 1}`;
      const content = document.createElement('div');
      content.id = collisionId;
      target.appendChild(content);
    } else {
      expect(id).not.toBe(collisionId);
      target.textContent = text ?? '';
    }
  });
  const view = render(<MarkdownText id="collision" text="First" retainScope="alice" />);
  await waitFor(() => expect(document.getElementById(collisionId)).toBeInTheDocument());
  view.rerender(<MarkdownText id="collision" text="Second" retainScope="alice" />);
  await waitFor(() => expect(document.getElementById('collision')).toHaveTextContent('Second'));
});
