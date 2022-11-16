import {Button, Modal, Select} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import extApi from "../../Utils/API/ext-api";
import {connect} from "react-redux";

const MoveModal = (props: any) => {

    const [vis, setVis] = useState<boolean>(false)
    const [all, setAll] = useState<any>(null)
    const [hid, setHid] = useState<any>()

    useEffect(() => {
        if (vis && all === null) {
            extApi.getHomeworkListAll({cid: props.cid}).then((res) => {
                setAll(res)
            })
        }
    }, [vis, all])

    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => {
                setVis(true)
            }}>{props.btnText}</Button>
            <Modal
                title={props.btnText}
                width={600}
                visible={vis}
                onCancel={() => {
                    setVis(false)
                }}
                footer={<>
                    <Button type={"primary"} onClick={() => {
                        extApi.hwSubmitMove({
                            clone: props.clone,
                            sid: props.sid,
                            hid: hid
                        }).then((res) => {
                            props.addTableVersion("Ext-hwsHomeworkList-pre")
                            props.addTableVersion("Ext-hwsHomeworkList")
                            setVis(false)
                        })
                    }}>提交</Button>
                </>}
            >
                <Select
                    style={{width: 400}}
                    onChange={(value, option) => {
                        setHid(value)
                    }}
                    options={all}
                />
            </Modal>
        </>
    )
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MoveModal)