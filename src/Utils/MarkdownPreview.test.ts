jest.mock('vditor/dist/method.min', () => ({
  __esModule: true,
  default: { preview: jest.fn().mockResolvedValue(undefined) },
}));

// @ts-ignore Vditor ships this runtime helper without a declaration file.
import VditorPreview from 'vditor/dist/method.min';
import { MarkdownPreview } from './MarkdownPreview';

it('passes an explicit sanitize policy to Vditor markdown rendering', async () => {
  document.body.innerHTML = '<div id="markdown-security"></div>';
  await MarkdownPreview('<img src="x" onerror="alert(1)">', 'markdown-security');

  expect(VditorPreview.preview).toHaveBeenCalledTimes(1);
  const config = (VditorPreview.preview as jest.Mock).mock.calls[0][2];
  expect(config.markdown.sanitize).toBe(true);
});
