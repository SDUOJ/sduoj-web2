// 全局引入 markdown 预览所需样式（仅在预览工具中引入，避免全局污染）
import 'vditor/dist/index.css';
import { isValueEmpty } from './empty';
import { getVditorResourceUrls } from './vditorResources';

export async function MarkdownPreview(code: string | null | undefined, id: string) {
  // Preview is used on demand by markdown-heavy views; keep the renderer out of
  // the initial entrypoint and load it with the first preview request.
  // @ts-ignore Vditor ships this runtime helper without a declaration file.
  const { default: VditorPreview } = await import('vditor/dist/method.min');
  if (isValueEmpty(code) || isValueEmpty(code?.trim())) code = '';
  code = code?.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g, '```plaintext\n$1');
  // 针对原本 $ 换行的公式，加以修正
  code = code?.replaceAll(/\$\n(.*)\n\$/g, '$ $1 $');
  const { cdn, emojiPath, themePath } = getVditorResourceUrls();
  const config = {
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
  return VditorPreview.preview(document.getElementById(id), code, config);
}
