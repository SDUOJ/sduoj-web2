import {Component} from "react";
import {Card, Space, Table} from "antd";
import {withTranslation} from "react-i18next";
import {InfoCircleOutlined} from "@ant-design/icons"

class Announcement extends Component<any, any> {

    render() {
        return (
            <>

                <Card
                    title={
                        <>
                            <Space>
                                <InfoCircleOutlined/>
                                {
                                    this.props.t("Announcement")
                                }
                            </Space>
                        </>
                    }
                >
                    <Table
                        // showHeader={false}
                        size={"small"}
                        columns={[
                            {
                                title: "ID",
                                dataIndex: "ID",
                                key: "ID"
                            },
                            {
                                title: "标题",
                                dataIndex: "title",
                                key: "title",
                                render: (text: string) =>{
                                    return <a href={"/#"}>{text}</a>
                                }
                            },
                            {
                                title: "发布日期",
                                dataIndex: "date",
                                key: "date"
                            }
                        ]}
                        dataSource={[
                            {
                                ID: 2,
                                title: "新版前端正式发布",
                                date: "2022年1月16日"
                            },
                            {
                                ID: 1,
                                title: "SDUOJ 成功承接计算导论期末考试",
                                date: "2022年1月15日"
                            }
                        ]}
                    >
                    </Table>
                </Card>
            </>
        )
    }
}

export default withTranslation()(Announcement)