import {Dispatch, useEffect, useState} from "react";
import Vditor from "vditor";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {ConfigState} from "../../Type/IConfig";
import {isValueEmpty} from "../../Utils/empty";
import {Button, Modal} from "antd";


const MD2export = (props: any) => {

    const [vis, setVis] = useState<boolean>(false)

    const setEditor = () => {
        const vditor0 = new Vditor(props.id ?? "vditor-export", {
            height: props.height === undefined ? 800 : props.height,
            mode: "ir",
            placeholder: "",
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
                "export",
            ],
            after() {
                vditor0.setValue(props.value)
            },
            blur() {
            },
        });
    }

    useEffect(() => {
        if (!isValueEmpty(props.langCode) && vis)
            setEditor()
    }, [props.langCode, vis])

    return (
        <>
            <Button type={"link"} onClick={() => {
                setVis(true)
            }}> Markdown 文本 </Button>

            <Modal
                title={"Markdown 文本"}
                visible={vis}
                footer={false}
                width={1200}
                onCancel={() => {
                    setVis(false)
                }}
            >
                <div id={props.id ?? "vditor-export"} className="vditor"/>
            </Modal>

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
        withRouter(MD2export)
    ))
