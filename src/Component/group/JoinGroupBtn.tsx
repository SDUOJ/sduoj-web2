import {Dispatch, useState} from "react";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {Button, message, Popconfirm} from "antd";
import cApi from "Utils/API/c-api"

const JoinGroupBtn = (props: any) => {
    const [visible, setVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    return (
        <>
            <Popconfirm
                title={`你确定要申请加入${props.groupName}吗？`}
                open={visible}
                onConfirm={()=>{
                    setConfirmLoading(true);
                    cApi.joinGroupApply({groupId: props.groupId}).then(()=>{
                        setVisible(false);
                        props.addTableVersion("GroupList")
                        message.success("申请成功");
                    }).catch(()=>{
                        message.error(props.t ? props.t("failed") : "failed");
                    }).finally(()=>{
                        setConfirmLoading(false);
                    })
                }}
                okButtonProps={{ loading: confirmLoading }}
                onCancel={()=>{
                    setVisible(false);
                }}
            >
                <Button type="link" onClick={()=>{
                    setVisible(true);
                }}>
                    加入
                </Button>
            </Popconfirm>
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
)(withRouter(JoinGroupBtn))
