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
            content: "加载中",
            duration: 0,
        })
        MApi.updateGroup(d).then((res: any) => {
            hied && hied()
            setOwner(data)
            updateTable()
        }).catch((e: any) => {
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
        }).catch((e: any) => {
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
        MApi.updateUserStatus(d).then((res: any) => {
            initData.map((v: any) => {
                data.forEach((d: any) => {
                    v.status = v.userId === d.userId ? status : v.status
                })
            })
            let changeData = initData.filter((v: any) => v.status === 2 || v.status === 1)
            setInitData(changeData)
            setMemberData(initData.filter((v: any) => v.status === 2))
            setApplyData(initData.filter((v: any) => v.status === 1))
            updateTable()
        }).catch((e: any) => {
            console.log("error")
        })
    }

    // 通过学号、昵称等信息添加用户
    const addUser = () => {
        let data = {
            "groupId": props.groupId,
            "usernames": addUserData.current
        }
        MApi.addUsersToGroup(data).then((res: any) => {
            getGroupDetail()
            updateTable()
        }).catch((e: any) => {
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
                            content={<Button type="link" size={"small"}>同意</Button>}
                        />
                        <YesNoOperConfirm
                            onConfirm={() => setUserStatus([rows], 3)}
                            content={<Button type="link" size={"small"}>拒绝</Button>}
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
                                    content={<Button type="link" size={"small"}>转让</Button>}
                                />
                                <YesNoOperConfirm
                                    onConfirm={() => setUserStatus([rows], 3)}
                                    content={<Button type="link" size={"small"}>移除</Button>}
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
                visible={vis}
                destroyOnClose={true}
                title={props.title}
                width={1200}
                onCancel={() => {
                    setVis(false)
                }}
                footer={false}
            >
                <Space wrap>
                    <div>申请用户({applyData !== undefined ? applyData.length : 0})</div>
                    <YesNoOperConfirm
                        onConfirm={() => setUserStatus(applyData, 2)}
                        content={<Button type="primary" size={"small"}>Accept All</Button>}
                        disabled={applyData.length === 0}
                    />
                    <YesNoOperConfirm
                        onConfirm={() => setUserStatus(applyData, 3)}
                        content={<Button type="primary" danger size={"small"}>Reject All</Button>}
                        disabled={applyData.length === 0}
                    />

                    <Table
                        size={"small"}
                        columns={ApplyColumns}
                        dataSource={applyData}
                        pagination={false}
                        scroll={{y: 200}}
                    />

                    <div>用户列表({memberData.length})</div>
                    {/*<Button type="primary" size={"small"} ></Button>*/}
                    {/*<Button type="primary" danger size={"small"} >Reject All</Button>*/}

                    <TextArea
                        onChange={(e) => {
                            addUserData.current = e.currentTarget.value.split(/,|，|\n| |\t/)
                        }}
                        cols={180}
                        rows={4}
                        placeholder={"将用户名用空格' ',TAB'\\t',换行'\\n'或逗号','分隔"}
                    />

                    <Button type={"primary"} size={"small"} onClick={addUser}>
                        添加用户
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