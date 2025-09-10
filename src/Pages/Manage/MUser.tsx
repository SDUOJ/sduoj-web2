import React, {Dispatch} from "react";
import {withRouter} from "react-router";
import {Role, Sex, UserState} from "../../Type/Iuser";
import TableWithSelection from "../../Component/common/Table/TableWithSelection";
import {Button, Card, Dropdown, Menu, Space, Tag} from "antd";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {withTranslation} from "react-i18next";
import MApi from "../../Utils/API/m-api";
import ButtonWithSelection from "../../Component/common/Table/ButtonWithSelection";
import {connect, useDispatch} from "react-redux";
import judgeAuth from "../../Utils/judgeAhtu";
import UserFormProfile from "../../Component/user/Form/UserFormProfile";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import UserFormAdditional from "../../Component/user/Form/UserFormAdditional";
import mApi from "Utils/API/m-api"
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";
import YesNoOperConfirm from "../../Component/common/YesNoOperConfirm";

const MUser = (props: any) => {
    const dispatch = useDispatch()
    let colData: any[] = [
        {
            title: "ID",
            dataIndex: "userId",
            width: 50,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: props.t("username"),
            dataIndex: "username",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: props.t("nickname"),
            dataIndex: "nickname",
            width: "auto",
            responsive: ["lg", "sm"],
        },
        {
            title: props.t("sex"),
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
            title: props.t("student_id"),
            dataIndex: "studentId",
            width: "auto",
            responsive: ["lg"],
        },
        {
            title: props.t("sdu_id"),
            dataIndex: "sduId",
            width: "auto",
            responsive: ["lg"],
        },
        {
            title: props.t("email"),
            dataIndex: "email",
            width: "auto",
            responsive: ["lg", "sm"],
        },
        {
            title: props.t("roles"),
            width: "200px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        {
                            rows.roles !== null && rows.roles.map((value: Role) => {
                                switch (value) {
                                    case "user":
                                        return <Tag>{props.t("user")}</Tag>
                                    case "admin":
                                        return <Tag color={"gold"}>{props.t("admin")}</Tag>
                                    case "superadmin":
                                        return <Tag color={"red"}>{props.t("superadmin")}</Tag>
                                }
                                return undefined
                            })
                        }
                    </Space>
                )
            }
        },
        {
            title: props.t("operator"),
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
                                {component: <UserFormProfile editUsername={false}/>, label: props.t("BasicInformation")},
                                {component: <UserFormAdditional/>, label: props.t("AdditionalConfiguration")},
                            ]}
                            initData={rows}
                            updateAppendProps={{userId: rows.userId}}
                            dataSubmitter={(value: any) => {
                                value.features.banThirdParty = (value.features.banThirdParty ? 1 : 0)
                                value.features.banEmailUpdate = (value.features.banEmailUpdate ? 1 : 0)
                                value.features.banInfoUpdate = (value.features.banInfoUpdate ? 1 : 0)
                                return mApi.updateUserInfo(value)
                            }}
                        />
                        {judgeAuth(props.roles, ['superadmin']) && (
                            <>
                                <Dropdown
                                    overlay={
                                        <Menu>
                                            <Menu.Item key="1">
                                                <ModalFormUseForm
                                                    btnName={props.t("ChangePass")}
                                                    btnIcon={false}
                                                    btnType={"link"}
                                                    title={rows.username}
                                                    subForm={[
                                                        {component: <ItemPassword/>, label: props.t("password")},
                                                    ]}
                                                    updateAppendProps={{username: rows.username}}
                                                    dataSubmitter={(value: any) => mApi.updateUserPasswd(value)}
                                                />
                                            </Menu.Item>
                                            {rows.sduId && (
                                                <Menu.Item key="2">
                                                    <YesNoOperConfirm
                                                        onConfirm={() => {
                                                            return mApi.thirdPartyUnbinding({
                                                                thirdParty: "SDUCAS",
                                                                username: rows.username
                                                            }).then(() => {
                                                                dispatch({type: "addTableVersion", name: "UserList"})
                                                            })
                                                        }}
                                                        content={
                                                            <Button type={"link"} style={{
                                                                paddingLeft: 5,
                                                                paddingRight: 5
                                                            }}>{props.t("unbindSdusForUnifiedAuthentication")}</Button>
                                                        }
                                                    />
                                                </Menu.Item>
                                            )}
                                        </Menu>
                                    }
                                >
                                    <Button type="link">
                                        {props.t("more")}
                                    </Button>
                                </Dropdown>
                            </>
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
                bordered={true}
                title={props.t("userList")}
                extra={
                    <Space>
                        <ButtonWithSelection
                            type={"export"}
                            ButtonText={props.t("exportBatch")}
                            fileName={`${props.t("userList")}_${Date.now()}`}
                            rowKey={"userId"}
                            tableName={"UserList"}
                        />
                        {judgeAuth(props.roles, ['superadmin']) && (
                            <ButtonWithSelection
                                type={"delete"}
                                ButtonText={props.t("deleteBatch")}
                                rowKey={"userId"}
                                deleteKey={"username"}
                                tableName={"UserList"}
                                delAPI={(data: any) => {
                                    return MApi.deleteUsers(data)
                                }}
                            />
                        )}
                        <ModalFormUseForm
                            TableName={"UserList"}
                            width={600}
                            title={props.t("AddUser")}
                            type={"create"}
                            subForm={[
                                {
                                    component: <UserFormProfile editUsername={true} needPassword={true}/>,
                                    label: props.t("BasicInformation")
                                },
                                {component: <UserFormAdditional/>, label: props.t("AdditionalConfiguration")},
                            ]}
                            dataSubmitter={(value: any) => {
                                value.features.banThirdParty = (value.features.banThirdParty ? 1 : 0)
                                value.features.banEmailUpdate = (value.features.banEmailUpdate ? 1 : 0)
                                value.features.banInfoUpdate = (value.features.banInfoUpdate ? 1 : 0)
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
