// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import {isValueEmpty} from "./empty";

const runHost = "https://oj.qd.sdu.edu.cn"
const devHost = "https://oj.cs.sdu.edu.cn:3000"
const host = process.env.NODE_ENV === 'development' ? devHost : runHost;

export function MarkdownPreview(code: string | null | undefined, id: string) {
    if (isValueEmpty(code) || isValueEmpty(code?.trim())) code = ""
    code = code?.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g, "```plaintext\n$1")
    // 针对原本 $ 换行的公式，加以修正
    code = code?.replaceAll(/\$\n(.*)\n\$/g, "$ $1 $")
    const config = {
        mode: "light",
        cdn: host + "/vditor",
        emojiPath: host + "/vditor/dist/images/emoji",
        theme: {
            path: host + "/vditor/dist/css/content-theme"
        },
        hljs: {
            lineNumber: false
        },
        markdown: {
            toc: true,
            mark: true,
            footnotes: true,
            autoSpace: true,
        },
        math: {
            inlineDigit: true,
            engine: 'KaTeX'
        }
    }
    // return VditorPreview.md2html(code, config)
    return VditorPreview.preview(document.getElementById(id), code, config)
}
