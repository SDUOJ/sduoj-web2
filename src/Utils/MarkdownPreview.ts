// 全局引入 markdown 预览所需样式（仅在预览工具中引入，避免全局污染）
import 'vditor/dist/index.css';
import { isValueEmpty } from './empty';
import { getVditorResourceUrls } from './vditorResources';
import { isSafeHtmlUrl } from './sanitizeHtml';

export const MAX_MARKDOWN_CHARACTERS = 1024 * 1024;

const sanitizeRenderedMarkdown = (target: ParentNode, removeStyles = false) => {
  target
    .querySelectorAll(
      'script, iframe, object, embed, foreignObject, form, input, button, textarea, meta, link, base, style, animate, animateMotion, animateTransform, set, use',
    )
    .forEach((node) => node.remove());
  target.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (
        name.startsWith('on') ||
        name === 'srcdoc' ||
        name === 'srcset' ||
        (removeStyles && name === 'style') ||
        ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'poster') &&
          !isSafeHtmlUrl(attribute.value))
      ) {
        element.removeAttribute(attribute.name);
      }
    });
    if (element.tagName.toLowerCase() === 'a' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });
};

export async function MarkdownPreview(
  code: string | null | undefined,
  id: string,
  options?: { signal?: AbortSignal },
) {
  if (code && code.length > MAX_MARKDOWN_CHARACTERS) throw new Error('MarkdownPreviewTooLarge');
  const target = document.getElementById(id);
  if (!target || options?.signal?.aborted) return;
  // Preview is used on demand by markdown-heavy views; keep the renderer out of
  // the initial entrypoint and load it with the first preview request.
  // @ts-ignore Vditor ships this runtime helper without a declaration file.
  const { default: VditorPreview } = await import('vditor/dist/method.min');
  if (!target.isConnected || options?.signal?.aborted) return;
  if (isValueEmpty(code) || isValueEmpty(code?.trim())) code = '';
  code = code?.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g, '```plaintext\n$1');
  // 针对原本 $ 换行的公式，加以修正
  code = code?.replaceAll(/\$\n(.*)\n\$/g, '$ $1 $');
  const { cdn, emojiPath, themePath } = getVditorResourceUrls();
  const config = {
    transform: (html: string) => {
      if (options?.signal?.aborted) throw new Error('MarkdownPreviewCancelled');
      const template = document.createElement('template');
      template.innerHTML = html;
      sanitizeRenderedMarkdown(template.content, true);
      return template.innerHTML;
    },
    mode: 'both',
    cdn,
    emojiPath,
    theme: {
      current: 'light',
      path: themePath,
    },
    hljs: {
      style: 'github',
      defaultLang: 'plaintext',
      lineNumber: true,
    },
    markdown: {
      toc: true,
      mark: true,
      footnotes: true,
      autoSpace: true,
      sanitize: true,
    },
    math: {
      inlineDigit: true,
      engine: 'KaTeX',
    },
  };
  // return VditorPreview.md2html(code, config)
  const result = await VditorPreview.preview(target, code, config);
  if (target) sanitizeRenderedMarkdown(target);
  return result;
}
