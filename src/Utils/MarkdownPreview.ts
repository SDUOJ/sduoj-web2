// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'


export function MarkdownPreview(id: string, code: string) {
    if (code == null) code = ""
    // code = code.replaceAll("$", " $ ")
    // code = code.replaceAll("  $", " $")
    // code = code.replaceAll("$  ", "$ ")
    setTimeout(()=>{
        VditorPreview.preview(
            document.getElementById(id),
            code,
            {
                mode: "light",
                cdn: process.env.NODE_ENV === 'development' ?
                    "http://oj.cs.sdu.edu.cn:3000/vditor" :
                    "https://oj.qd.sdu.edu.cn/vditor",
                emojiPath: process.env.NODE_ENV === 'development' ?
                    "http://oj.cs.sdu.edu.cn:3000/vditor/dist/images/emoji" :
                    "https://oj.qd.sdu.edu.cn/vditor/dist/images/emoji",
                theme: {
                    path: process.env.NODE_ENV === 'development' ?
                        "http://oj.cs.sdu.edu.cn:3000/vditor/dist/css/content-theme" :
                        "https://oj.qd.sdu.edu.cn/vditor/dist/css/content-theme"
                },
                hljs: {
                    lineNumber: true
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
        )
    }, 200)
}