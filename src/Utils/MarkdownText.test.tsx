import { render, screen, waitFor } from '@testing-library/react';
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
