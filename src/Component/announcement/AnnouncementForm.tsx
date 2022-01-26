import {withTranslation} from "react-i18next";
import {Form, message} from "antd";
import {ModalForm, ProFormInstance, ProFormSwitch, ProFormText} from "@ant-design/pro-form";
import Editor from "../common/Editor";
import {Dispatch, useRef, useState} from "react";
import MApi from "Utils/API/m-api"
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {ManageState} from "../../Type/IManage";
import {addTableVersion} from "../../Redux/Action/manage";

const AnnouncementForm = (props: any) => {
    const [editValue, setEditValue] = useState<string>(props.text)
    const formRef = useRef<ProFormInstance<any>>();
    return (
        <ModalForm<any>
            formRef={formRef}
            title={props.title}
            trigger={props.button}
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnClose: true,
                width: 1100,
                okText: "提交"
            }}
            onFinish={async (v) => {
                const ret = await formRef.current?.validateFields().then((values: any) => {
                    const data = {
                        title: values.title,
                        top: values.top ? 1 : 0,
                        text: editValue,
                        noticeId: props.row?.noticeId
                    }
                    if (props.type === "create") {
                        return MApi.createAnnouncement(data).then((values) => {
                            props.addTableVersion()
                            message.success("成功")
                        })
                    }else{
                        return MApi.updateAnnouncement(data).then((values)=>{
                            props.addTableVersion()
                            message.success("成功")
                        })
                    }
                })
                return true;
            }}
        >
            <ProFormSwitch
                name={"top"}
                label={props.t("IsTop")}
                initialValue={props.row?.top === 1}
                fieldProps={{
                    checkedChildren: props.t("Top"),
                    unCheckedChildren: props.t("UnTop")
                }}
                rules={[{required: true}]}
            />
            <ProFormText
                name={"title"}
                label={"标题"}
                initialValue={props.row?.title}
                rules={[{required: true}]}
            />
            <Form.Item label={"公告内容"}>
                <Editor
                    save={setEditValue}
                    value={props.row?.text}
                    height={500}
                />
            </Form.Item>
        </ModalForm>
    )

}


const mapStateToProps = (state: any) => {
    const MState: ManageState = state.ManageReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: () => dispatch({type: "addTableVersion", data: "Announcement"})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(AnnouncementForm)
    ))