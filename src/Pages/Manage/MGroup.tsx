import React, {Component, Dispatch} from "react";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import {Button, Card} from "antd";
import TableWithSelection from "../../Component/common/Table/TableWithSelection";
import MApi from "../../Utils/API/m-api";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {unix2Time} from "../../Utils/Time";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";


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
                dataIndex:"openness",
                width: "auto",
                responsive: ["lg"],
                render: (text: any) => {
                    switch (text) {
                        case 0:
                            return "公开"
                        case 1:
                            return "申请"
                        case 2:
                            return "私有"
                    }
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
                render: () => {
                    return (
                        <>
                            <Button type={"link"}>{this.props.t("Edit")}</Button>
                        </>
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
                        <>

                        </>
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

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(withRouter(MGroup))
)
