jest.mock('vditor/dist/method.min', () => ({
  __esModule: true,
  default: { preview: jest.fn().mockResolvedValue(undefined) },
}));

// @ts-ignore Vditor ships this runtime helper without a declaration file.
import VditorPreview from 'vditor/dist/method.min';
import { MarkdownPreview, MAX_MARKDOWN_CHARACTERS } from './MarkdownPreview';

it('passes an explicit sanitize policy to Vditor markdown rendering', async () => {
  document.body.innerHTML = '<div id="markdown-security"></div>';
  await MarkdownPreview('<img src="x" onerror="alert(1)">', 'markdown-security');

  expect(VditorPreview.preview).toHaveBeenCalledTimes(1);
  const config = (VditorPreview.preview as jest.Mock).mock.calls[0][2];
  expect(config.markdown.sanitize).toBe(true);
  expect(config.transform('<iframe srcdoc="<script>evil()</script>"></iframe><p>safe</p>')).toBe(
    '<p>safe</p>',
  );
});

it('removes executable rendered nodes and URL protocols while preserving ordinary markup', async () => {
  document.body.innerHTML = '<div id="markdown-rendered"></div>';
  (VditorPreview.preview as jest.Mock).mockImplementation(async (target: HTMLElement) => {
    target.innerHTML =
      '<p>safe</p><iframe srcdoc="<script>evil()</script>"></iframe>' +
      '<a href="javascript:evil()" onclick="evil()">link</a><svg><path /></svg>';
  });
  await MarkdownPreview('fixture', 'markdown-rendered');
  const target = document.getElementById('markdown-rendered')!;
  expect(target.querySelector('p')).toHaveTextContent('safe');
  expect(target.querySelector('iframe')).toBeNull();
  expect(target.querySelector('[onclick]')).toBeNull();
  expect(target.querySelector('[href^="javascript:"]')).toBeNull();
  expect(target.querySelector('svg')).not.toBeNull();
});

it('rejects oversized Markdown before loading or invoking the renderer', async () => {
  await expect(
    MarkdownPreview('x'.repeat(MAX_MARKDOWN_CHARACTERS + 1), 'oversized'),
  ).rejects.toThrow('MarkdownPreviewTooLarge');
  expect(VditorPreview.preview).not.toHaveBeenCalled();
});

it('uses PUBLIC_URL for preview runtime, emoji and theme resources', async () => {
  const previousPublicUrl = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = '/v2/';
  try {
    document.body.innerHTML = '<div id="markdown-assets"></div>';
    await MarkdownPreview('# Preview', 'markdown-assets');

    const config = (VditorPreview.preview as jest.Mock).mock.calls[0][2];
    expect(config.cdn).toBe('/v2/vditor/development');
    expect(config.emojiPath).toBe('/v2/vditor/development/dist/images/emoji');
    expect(config.theme.path).toBe('/v2/vditor/development/dist/css/content-theme');
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});
