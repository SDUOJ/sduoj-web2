import {Dispatch, useEffect, useState} from "react";
import Vditor from "vditor";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {ConfigState} from "../../Type/IConfig";
import apiAddress from "../../Utils/API/apiAddress";
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
            cdn: apiAddress().FRONT_SERVER + "/vditor",
            outline: {
                enable: true,
                position: 'left',
            },
            hint: {
                emojiPath: apiAddress().FRONT_SERVER + "/vditor/dist/images/emoji"
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
            }}> {props.t("markdownText")} </Button>

            <Modal
                title={props.t("markdownText")}
                open={vis}
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
