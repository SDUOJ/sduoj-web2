import React, {Component, Dispatch} from "react";
import {withRouter} from "react-router";
import {Role, Sex, UserState} from "../../Type/Iuser";
import TableWithSelection from "../../Component/common/Table/TableWithSelection";
import {Card, Space, Tag} from "antd";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {withTranslation} from "react-i18next";
import MApi from "../../Utils/API/m-api";
import ButtonWithSelection from "../../Component/common/Table/ButtonWithSelection";
import {connect} from "react-redux";
import judgeAuth from "../../Utils/judgeAhtu";
import UserFormProfile from "../../Component/user/Form/UserFormProfile";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import UserFormAdditional from "../../Component/user/Form/UserFormAdditional";
import mApi from "Utils/API/m-api"
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";

class MUser extends Component<any, any> {


    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "userId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("username"),
                dataIndex: "username",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: this.props.t("nickname"),
                dataIndex: "nickname",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("sex"),
                dataIndex: "gender",
                width: 50,
                responsive: ["lg"],
                render: (sex: Sex) => {
                    switch (sex) {
                        case Sex.Male:
                            return <ManOutlined/>
                        case Sex.Female:
                            return <WomanOutlined/>
                        case Sex.Unknown:
                            return <QuestionOutlined/>
                    }
                }
            },
            {
                title: this.props.t("student_id"),
                dataIndex: "studentId",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("sdu_id"),
                dataIndex: "sduId",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("email"),
                dataIndex: "email",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("roles"),
                width: "200px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            {
                                rows.roles !== null && rows.roles.map((value: Role) => {
                                    switch (value) {
                                        case "user":
                                            return <Tag>{this.props.t("user")}</Tag>
                                        case "admin":
                                            return <Tag color={"gold"}>{this.props.t("admin")}</Tag>
                                        case "superadmin":
                                            return <Tag color={"red"}>{this.props.t("superadmin")}</Tag>
                                    }
                                })
                            }
                        </Space>
                    )
                }
            },
            {
                title: this.props.t("operator"),
                width: "200px",
                render: (text: any, rows: any) => {
                    return (
                        <Space>
                            <ModalFormUseForm
                                TableName={"UserList"}
                                width={600}
                                title={rows.username}
                                type={"update"}
                                subForm={[
                                    {component: <UserFormProfile editUsername={false}/>, label: "基本信息"},
                                    {component: <UserFormAdditional/>, label: "附加信息"},
                                ]}
                                initData={rows}
                                updateAppendProps={{userId: rows.userId}}
                                dataSubmitter={(value: any) => {
                                    value.features.banThirdParty = (value.features.banThirdParty ? 1 : 0)
                                    value.features.banEmailUpdate = (value.features.banEmailUpdate ? 1 : 0)
                                    return mApi.updateUserInfo(value)
                                }}
                            />
                            {judgeAuth(this.props.roles, ['superadmin']) && (
                                <ModalFormUseForm
                                    btnName={"修改密码"}
                                    btnIcon={false}
                                    btnType={"link"}
                                    title={rows.username}
                                    subForm={[
                                        {component: <ItemPassword/>, label: "密码"},
                                    ]}
                                    updateAppendProps={{username: rows.username}}
                                    dataSubmitter={(value: any) => {
                                        return mApi.updateUserPasswd(value)
                                    }}
                                />
                            )}
                        </Space>
                    )
                }
            }
        ]

        return (
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card
                    size={"small"}
                    bordered={false}
                    title={this.props.t("userList")}
                    extra={
                        <Space>
                            <ButtonWithSelection
                                type={"export"}
                                ButtonText={"批量导出"}
                                fileName={"用户列表导出_" + Date.now()}
                                rowKey={"userId"}
                                tableName={"UserList"}
                            />
                            {judgeAuth(this.props.roles, ['superadmin']) && (
                                <ButtonWithSelection
                                    type={"delete"}
                                    ButtonText={"批量删除"}
                                    rowKey={"userId"}
                                    deleteKey={"username"}
                                    tableName={"UserList"}
                                    delAPI={(data: any)=>{
                                        return MApi.deleteUsers(data)
                                    }}
                                />
                            )}
                            <ModalFormUseForm
                                TableName={"UserList"}
                                width={600}
                                title={"新建用户"}
                                type={"create"}
                                subForm={[
                                    {
                                        component: <UserFormProfile editUsername={true} needPassword={true}/>,
                                        label: "基本信息"
                                    },
                                    {component: <UserFormAdditional/>, label: "附加信息"},
                                ]}
                                dataSubmitter={(value: any) => {
                                    value.features.banThirdParty = (value.features.banThirdParty ? 1 : 0)
                                    value.features.banEmailUpdate = (value.features.banEmailUpdate ? 1 : 0)
                                    return mApi.addUsers([value])
                                }}
                            />
                        </Space>
                    }
                >
                    <TableWithSelection
                        name={"UserList"}
                        search={true}
                        columns={colData}
                        API={MApi.getUserList}
                        size={"small"}
                        rowKey={"userId"}
                    />
                </Card>
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(withRouter(MUser))
)
