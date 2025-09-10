import React, {Dispatch, useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import MApi from "../../Utils/API/m-api";
import {Button, Input, message, Modal, Space, Table} from "antd";
import {ColumnsType} from "antd/es/table";
import YesNoOperConfirm from "../common/YesNoOperConfirm";

const {TextArea} = Input;

interface DataType {
    // 用户id
    userId: number;
    // 用户姓名
    username: string;
    // 用户昵称
    nickname: string;
    // 邮箱
    email: string;
}

const GroupMember = (props: any) => {
    // 组件初始化数据
    const [initData, setInitData] = useState<any[]>(props.initData)
    // 申请加入数据
    const [applyData, setApplyData] = useState<any[]>([])
    // 组内成员数据
    const [memberData, setMemberData] = useState<any[]>([])
    // 组长
    const [owner, setOwner] = useState<DataType>()
    // 表单可见性
    const [vis, setVis] = useState<boolean>(false)

    const addUserData = useRef<string[]>([])
    const [addUserValue, setAdduserValue] = useState("")

    const updateTable = () => {
        props.addTableVersion("GroupList")
    }

    // 更换组长
    const transferGroupLeader = (data: any) => {
        let d = {
            "groupId": props.groupId,
            "userId": data.userId
        }
        const hied = message.loading({
            content: props.t("Loading"),
            duration: 0,
        })
        MApi.updateGroup(d).then(() => {
            hied && hied()
            setOwner(data)
            updateTable()
        }).catch(() => {
            console.log("error")
        })
    }

    // 更新页面数据
    const updateData = (data: any) => {
        setInitData(data)
        setMemberData(data.filter((v: any) => v.status === 2))
        setApplyData(data.filter((v: any) => v.status === 1))
    }

    const getGroupDetail = () => {
        MApi.getGroupDetail({groupId: props.groupId}).then((data: any) => {
            updateData(data.members)
            setOwner(data.owner)
        }).catch(() => {
            console.log("error")
        })
    }

    // 更新用户信息，申请通过、拒绝和移除用户
    const setUserStatus = (data: any, status: number) => {
        let d = {
            "groupId": props.groupId,
            "userIds": data.map((v: any) => {
                return v.userId
            }),
            "status": status
        }
        MApi.updateUserStatus(d).then(() => {
            initData.map((v: any) => {
                data.forEach((d: any) => {
                    v.status = v.userId === d.userId ? status : v.status
                })
                return undefined
            })
            let changeData = initData.filter((v: any) => v.status === 2 || v.status === 1)
            setInitData(changeData)
            setMemberData(initData.filter((v: any) => v.status === 2))
            setApplyData(initData.filter((v: any) => v.status === 1))
            updateTable()
        }).catch(() => {
            console.log("error")
        })
    }

    // 通过学号、昵称等信息添加用户
    const addUser = () => {
        let data = {
            "groupId": props.groupId,
            "usernames": addUserData.current
        }
        MApi.addUsersToGroup(data).then(() => {
            getGroupDetail()
            updateTable()
            // 提示成功并清除文本框内的数据
            message.success("Success!")
            setAdduserValue("")
            addUserData.current = []
        }).catch(() => {
            console.log("error in add user")
        })
    }

    useEffect(() => {
        if (props.groupId !== undefined && vis) {
            getGroupDetail()
        }
    }, [props.groupId, vis])

    const columnsBase: ColumnsType<DataType> = [
        {
            title: 'ID',
            dataIndex: 'userId',
            width: 70
        },
        {
            title: props.t("username"),
            dataIndex: 'username',
            width: "auto",
        },
        {
            title: props.t("nickname"),
            dataIndex: 'nickname',
            width: "auto",
        },
        {
            title: props.t("email"),
            dataIndex: 'email',
            width: "auto",
        },
    ]

    const ApplyColumns: ColumnsType<DataType> = [
        ...columnsBase,
        {
            title: props.t("operator"),
            width: "150px",
            render: (text: any, rows: any) => {
                // console.log("rows", rows)
                return (
                    <Space>
                        <YesNoOperConfirm
                            onConfirm={() => setUserStatus([rows], 2)}
                            content={<Button type="link" size={"small"}>{props.t("Agree")}</Button>}
                        />
                        <YesNoOperConfirm
                            onConfirm={() => setUserStatus([rows], 3)}
                            content={<Button type="link" size={"small"}>{props.t("Reject")}</Button>}
                        />
                    </Space>
                )
            }
        }
    ]

    const columns: ColumnsType<DataType> = [
        ...columnsBase,
        {
            title: props.t("operator"),
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space>
                        {owner && rows.userId !== owner.userId && (
                            <>
                                <YesNoOperConfirm
                                    onConfirm={() => transferGroupLeader(rows)}
                                    content={<Button type="link" size={"small"}>{props.t("Transfer")}</Button>}
                                />
                                <YesNoOperConfirm
                                    onConfirm={() => setUserStatus([rows], 3)}
                                    content={<Button type="link" size={"small"}>{props.t("Remove")}</Button>}
                                />
                            </>
                        )}
                    </Space>
                )
            }

        }
    ];

    return (
        <>
            <Button type={props.btnType} size={"small"} onClick={() => {
                setVis(true)
            }}>
                {props.btnName}
            </Button>
            <Modal
                open={vis}
                destroyOnHidden={true}
                title={props.title}
                width={1200}
                onCancel={() => {
                    setVis(false)
                }}
                footer={false}
            >
                <Space wrap>
                    <div>{props.t("ApplyingUsers")}({applyData !== undefined ? applyData.length : 0})</div>
                    <YesNoOperConfirm
                        onConfirm={() => setUserStatus(applyData, 2)}
                        content={<Button type="primary" size={"small"}>{props.t("AcceptAll")}</Button>}
                        disabled={applyData.length === 0}
                    />
                    <YesNoOperConfirm
                        onConfirm={() => setUserStatus(applyData, 3)}
                        content={<Button type="primary" danger size={"small"}>{props.t("RejectAll")}</Button>}
                        disabled={applyData.length === 0}
                    />

                    <Table
                        size={"small"}
                        columns={ApplyColumns}
                        dataSource={applyData}
                        pagination={false}
                        scroll={{y: 200}}
                    />

                    <div>{props.t("UserListLabel")}({memberData.length})</div>
                    {/*<Button type="primary" size={"small"} ></Button>*/}
                    {/*<Button type="primary" danger size={"small"} >Reject All</Button>*/}

                    <TextArea
                        onChange={(e) => {
                            addUserData.current = e.currentTarget.value.split(/,|，|\n| |\t/)
                            setAdduserValue(e.currentTarget.value)
                        }}
                        value={addUserValue}
                        cols={180}
                        rows={4}
                        placeholder={props.t("SplitUsernamesHint")}
                    />

                    <Button type={"primary"} size={"small"} onClick={addUser}>
                        {props.t("AddUser")}
                    </Button>

                    <Table
                        size={"small"}
                        columns={columns}
                        dataSource={memberData}
                        pagination={false}
                        scroll={{y: 240}}
                    />

                </Space>
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
)(
    withTranslation()(
        withRouter(GroupMember)
    ))
