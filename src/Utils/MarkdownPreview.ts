// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import {isValueEmpty} from "./empty";

const runHost = "https://oj.qd.sdu.edu.cn"
// const runHost = "http://exam.yhf2000.cn"

export function MarkdownPreview(id: string, code?: string | null) {
    if (isValueEmpty(code)) code = ""
    code = code?.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g, "```plaintext\n$1")
    // 针对原本 $ 换行的公式，加以修正
    code = code?.replaceAll(/\$\n(.*)\n\$/g, "$ $1 $")

    const config = {
        mode: "light",
        cdn: process.env.NODE_ENV === 'development' ?
            "https://oj.cs.sdu.edu.cn:3000/vditor" :
            runHost + "/vditor",
        emojiPath: process.env.NODE_ENV === 'development' ?
            "https://oj.cs.sdu.edu.cn:3000/vditor/dist/images/emoji" :
            runHost + "/vditor/dist/images/emoji",
        theme: {
            path: process.env.NODE_ENV === 'development' ?
                "https://oj.cs.sdu.edu.cn:3000/vditor/dist/css/content-theme" :
                runHost + "/vditor/dist/css/content-theme"
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
    VditorPreview.preview(document.getElementById(id), code, config)
}
