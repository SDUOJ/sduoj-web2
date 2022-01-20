import {Component, Dispatch, useEffect, useState} from "react";
import Vditor from "vditor";
import {fileUpload} from "../../Utils/fileUpload";
import {Button, message, notification, Space} from "antd";
import * as path from "path";
import {save} from "react-cookies";
import CopyableCode from "../submission/CopyableCode";
import ClipboardJS from "clipboard";
import {UserState} from "../../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {ConfigState} from "../../Type/IConfig";
import "Assert/css/vditor.css"

export interface EditorProps {
    value: string
    minHeight: number
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
    const [vditor, setVditor] = useState<any>()
    const [value, setValue] = useState<string>(props.value)

    useEffect(() => {
        const vditor0 = new Vditor("vditor", {
            height: "auto",
            minHeight: props.minHeight,
            mode: "ir", //及时渲染模式
            placeholder: "支持 Markdown，支持 KaTex 公式\n表格插入一行：Ctrl+'+' \n表格插入一列：Ctrl+Shift+'+'",
            lang: props.langCode,
            cdn: process.env.NODE_ENV === 'development' ?
                "http://oj.cs.sdu.edu.cn:3000/vditor" :
                "https://oj.qd.sdu.edu.cn/vditor",
            outline: {
                enable: true,
                position: 'left',
            },
            hint: {
                emojiPath: process.env.NODE_ENV === 'development' ?
                    "http://oj.cs.sdu.edu.cn:3000/vditor/dist/images/emoji" :
                    "https://oj.qd.sdu.edu.cn/vditor/dist/images/emoji"
            },
            preview: {
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
                "fullscreen", "edit-mode",
                {
                    name: "more",
                    toolbar: [
                        "code-theme", "content-theme", "export", "outline", "help"
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
                        setValue(vditor0.getValue())
                        save()
                    }
                }
            ],
            after() {
                vditor0.setValue(value);
            },
            blur() {
                setValue(vditor0.getValue())
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
                    function callback(path: any) {
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
                                    <span>文件地址：{path}</span><br/>
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
        setVditor(vditor0)
    }, [props.langCode])



    const save = () => {
        props.save && props.save((vditor.getValue()))
        console.log(vditor.getValue())
    }


    return (
        <>
            <div id="vditor"/>
            <Button onClick={save}>a</Button>
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
