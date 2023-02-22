import React, {Component, Dispatch} from "react";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import {Card, Space} from "antd";
import MApi from "../../Utils/API/m-api";
import mApi from "../../Utils/API/m-api";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {unix2Time} from "../../Utils/Time";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import GroupFormProfile from "../../Component/group/Form/Item/GroupFormProfile";
import GroupMember from "../../Component/group/GroupMember";

class MGroup extends Component<any, any> {

    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "groupId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("title"),
                dataIndex: "title",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: "描述",
                dataIndex: "description",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: "创建时间",
                dataIndex: "gmtCreate",
                width: "170px",
                responsive: ["lg"],
                render: (text: any) => {
                    return unix2Time(text)
                }
            },
            {
                title: "组长",
                width: "auto",
                responsive: ["lg"],
                render: (text: any, row: any) => {
                    return row.owner.username + "(" + row.owner.nickname + ")"
                }
            },
            {
                title: "开放性",
                dataIndex: "openness",
                width: "auto",
                responsive: ["lg"],
                render: (text: any) => {
                    return ["公开", "申请", "私有"][text]
                }
            },
            {
                title: "成员数量",
                width: "auto",
                dataIndex: "memberNum",
                responsive: ["lg"]
            },
            {
                title: this.props.t("operator"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return (
                        <Space>
                            <ModalFormUseForm
                                TableName={"GroupList"}
                                width={1200}
                                title={rows.title}
                                type={"update"}
                                subForm={[
                                    {component: <GroupFormProfile/>}
                                ]}
                                dataLoader={async () => mApi.getGroupDetail({groupId: rows.groupId})}
                                updateAppendProps={{groupId: rows.groupId}}
                                dataSubmitter={(value: any) => {
                                    return mApi.updateGroup(value)
                                }}
                            />
                            <GroupMember
                                btnName={"成员管理"}
                                btnType={"link"}
                                width={1200}
                                title={"Members in " + rows.title + "(Group ID:" + rows.groupId + ")"}
                                initData={rows}
                                groupId={rows.groupId}
                            />
                            {/*删除组*/}
                            {/*<TableRowDeleteButton*/}
                            {/*    type={"inline"}*/}
                            {/*    API={MApi.deleteGroup}*/}
                            {/*    data={{groupId: rows.groupId}}*/}
                            {/*    name={"GroupList"}*/}
                            {/*/>*/}
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
                    title={"用户组列表"}
                    extra={
                        <Space>
                            <ModalFormUseForm
                                TableName={"GroupList"}
                                width={1200}
                                title={"新建用户组"}
                                type={"create"}
                                subForm={[
                                    {component: <GroupFormProfile/>, label: ""}
                                ]}
                                dataSubmitter={(value: any) => {
                                    return mApi.createGroup(value)
                                }}
                            />
                        </Space>
                    }
                >
                    <TableWithPagination
                        name={"GroupList"}
                        columns={colData}
                        disableSelection={true}
                        API={MApi.getGroupList}
                        size={"small"}
                        rowKey={"groupId"}
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

const mapDispatchToProps = () => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(withRouter(MGroup))
)
