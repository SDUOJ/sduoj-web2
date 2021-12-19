// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import apiAddress from "./API/apiAddress";

export function MarkdownPreview(id: string, code: string) {
    VditorPreview.preview(
        document.getElementById(id),
        code,
        process.env.NODE_ENV === 'development' ? {} :
        {
            cdn: "https://oj.qd.sdu.edu.cn/vditor",
            emojiPath: "https://oj.qd.sdu.edu.cn/vditor/dist/images/emoji",
            theme: {
                path: "https://oj.qd.sdu.edu.cn/vditor/dist/css/content-theme"
            }
        }
    )
}