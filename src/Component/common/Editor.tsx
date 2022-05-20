import {Dispatch, useEffect} from "react";
import Vditor from "vditor";
import {fileUpload} from "../../Utils/fileUpload";
import {Button, message, notification, Space} from "antd";
import ClipboardJS from "clipboard";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {ConfigState} from "../../Type/IConfig";
import apiAddress from "../../Utils/API/apiAddress";

export interface EditorProps {
    value: string
    height?: number
    save: any
}

const CopiedButton = (props: any) => {

    const rds = Date.now().toString()

    const clipboard = new ClipboardJS("." + props.btnText + rds, {
        text(elem: Element): string {
            return props.text
        }
    })
    clipboard.on('success', function (e) {
        message.success("复制成功")
    });

    return (
        <Button
            className={props.btnText + rds}
            size={"small"}
        >
            {props.btnText}
        </Button>
    )
}

const Editor = (props: EditorProps & any) => {
    useEffect(() => {
        const vditor0 = new Vditor("vditor", {
            height: props.height === undefined ? 800 : props.height,
            mode: "ir", //及时渲染模式
            placeholder: "支持 Markdown，支持 KaTex 公式\n表格插入一行：Ctrl+'+' \n表格插入一列：Ctrl+Shift+'+'",
            lang: props.langCode,
            cdn: process.env.NODE_ENV === 'development' ?
                "http://oj.cs.sdu.edu.cn:3000/vditor" :
                "https://oj.qd.sdu.edu.cn/vditor",
            outline: {
                enable: false,
                position: 'left',
            },
            hint: {
                emojiPath: process.env.NODE_ENV === 'development' ?
                    "http://oj.cs.sdu.edu.cn:3000/vditor/dist/images/emoji" :
                    "https://oj.qd.sdu.edu.cn/vditor/dist/images/emoji"
            },
            preview: {
                delay: 500,
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
            },
            toolbar: [
                "emoji", "headings", "bold", "italic", "strike", "link", "|",
                "list", "ordered-list", "check", "outdent", "indent", "|",
                "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
                "upload", "table", "|",
                "undo", "redo", "|",
                "outline", "fullscreen", "edit-mode",
                {
                    name: "more",
                    toolbar: [
                        "code-theme", "content-theme", "export", "help"
                    ]
                },
                "|",
                {
                    hotkey: "⌘-S",
                    name: "save",
                    tipPosition: "s",
                    tip: "保存",
                    className: "right",
                    icon: `<img style="height: 16px" src='https://img.58cdn.com.cn/escstatic/docs/imgUpload/idocs/save.svg' alt="save"/>`,
                    click() {
                        props.onChange && props.onChange(vditor0.getValue())
                    }
                }
            ],
            after() {
                vditor0.setValue(props.value === undefined ? "" : props.value);
            },
            blur() {
                props.onChange && props.onChange(vditor0.getValue())
            },
            upload: {
                accept: "*/*",
                multiple: false,
                filename(name) {
                    return name
                        .replaceAll(/[^(a-zA-Z0-9\u4e00-\u9fa5.)]/g, "")
                        .replaceAll(/[?\\/:|<>*\[\]()$%{}@~]/g, "")
                        .replaceAll("/\\s/g", "");
                },
                handler(files: File[]): any {
                    function callback(value: any) {
                        const path = apiAddress().CLIENT_SERVER + "/api/filesys/download/" + value.id + "/" + value.name
                        let name = files[0] && files[0].name;
                        name = name
                            .replaceAll(/[^(a-zA-Z0-9\u4e00-\u9fa5.)]/g, "")
                            .replaceAll(/[?\\/:|<>*\[\]()$%{}@~]/g, "")
                            .replaceAll("/\\s/g", "")
                        notification.open({
                            message: '文件上传成功',
                            description: (
                                <>
                                    <span>文件名：{name}</span><br/>
                                    {/*<span>文件地址：{path}</span><br/>*/}
                                    <Space>
                                        点击复制：
                                        <CopiedButton text={path} btnText={"纯路径"}/>
                                        <CopiedButton text={`[${name}](${path})`} btnText={"MD链接"}/>
                                        <CopiedButton text={`![${name}](${path})`} btnText={"MD图片"}/>
                                    </Space><br/>
                                    <Space>
                                        <CopiedButton text={`<a href="${path}">${name}</a>`}
                                                      btnText={"HTML链接"}/>
                                        <CopiedButton text={`<img src="${path}" alt="${name}" style="zoom:100%;" />`}
                                                      btnText={"HTML图片"}/>
                                    </Space>
                                </>
                            ),
                            duration: null,
                            type: "success",
                        });
                    }
                    fileUpload(files, callback);
                }
            }
        });
    }, [props.langCode])

    return (
        <>
            <div id="vditor" className="vditor"/>
        </>
    )


}

const mapStateToProps = (state: any) => {
    const CState: ConfigState = state.ConfigReducer
    return {
        langCode: CState.langCode
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(Editor)
    ))
