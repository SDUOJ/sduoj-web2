// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import apiAddress from "./API/apiAddress";

export function MarkdownPreview(id: string, code: string) {
    if(code == null) code = ""
    code = code.replaceAll("$", " $ ")
    code = code.replaceAll("  $", " $")
    code = code.replaceAll("$  ", "$ ")
    VditorPreview.preview(
        document.getElementById(id),
        code,
        process.env.NODE_ENV === 'development' ?
            {
                cdn: "http://oj.cs.sdu.edu.cn:3000/vditor",
                emojiPath: "http://oj.cs.sdu.edu.cn:3000/vditor/dist/images/emoji",
                theme: {
                    path: "http://oj.cs.sdu.edu.cn:3000/vditor/dist/css/content-theme"
                }
            } :
            {
                cdn: "https://oj.qd.sdu.edu.cn/vditor",
                emojiPath: "https://oj.qd.sdu.edu.cn/vditor/dist/images/emoji",
                theme: {
                    path: "https://oj.qd.sdu.edu.cn/vditor/dist/css/content-theme"
                }
            }
    )
}