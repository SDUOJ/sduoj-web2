import React, { Component } from "react";
import { Card, Space, Tag, Table } from "antd";
import mApi from "../../Utils/API/mapi_test";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import UserListButton from "../../Component/screenrecord/UserListButton";

class MReplay extends Component<any, any> {
    state = {
        dataSource: [],
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0,
        },
        loading: false,
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = (params = {}) => {
        this.setState({ loading: true });
        mApi.getPSList().then((data) => {
            this.setState({
                dataSource: data,
                pagination: {
                    ...this.state.pagination,},
                loading: false,
            });
        });
    };

    handleTableChange = (pagination:any) => {
        this.fetchData({
            current: pagination.current,
            pageSize: pagination.pageSize,
        });
    };

    render() {
        const { dataSource, pagination, loading } = this.state;
        const { t } = this.props;

        const colData: any[] = [
            {
                title: "ID",
                dataIndex: "psid",
                width: 50,
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: t("名称"),
                dataIndex: "name",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: t("描述"),
                dataIndex: "description",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: t("开始时间"),
                dataIndex: "tm_start",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => text ? text : t("未开始"),
            },
            {
                title: "结束时间",
                dataIndex: "tm_end",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => text ? text : t("进行中"),
            },
            {
                title: t("群组ID"),
                dataIndex: "groupId",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: t("标签"),
                dataIndex: "tag",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (tag: string) => <Tag color="blue">{tag}</Tag>,
            },
            {
                title: t("操作"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <UserListButton psid={rows.psid}  token={rows.token}/>
                        </Space>
                    );
                }
            }
        ];

        return (
            <div style={{ marginTop: -20, overflow: "hidden" }}>
                <Card
                    size="small"
                    bordered
                    title={t("开启录屏功能的题单列表")}
                >
                    <Table
                        columns={colData}
                        dataSource={dataSource}
                        pagination={pagination}
                        loading={loading}
                        onChange={this.handleTableChange}
                        size="small"
                    />
                </Card>
            </div>
        );
    }
}

export default withTranslation()(withRouter(MReplay));