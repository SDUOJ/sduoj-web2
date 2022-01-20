import {Component} from "react";
import {Card, Modal, Space, Table} from "antd";
import {withTranslation} from "react-i18next";
import {InfoCircleOutlined} from "@ant-design/icons"
import ANCContent from "./Content";

class Announcement extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            show: false,
            showId: 0
        }
    }

    render() {
        return (
            <>
                <Modal
                    title={this.props.t("AnnouncementDetails")}
                    visible={this.state.show}
                    onCancel={() => {
                        this.setState({show: false})
                    }}
                    onOk={() => {
                        this.setState({show: true})
                    }}
                    footer={null}
                    width={1100}
                >
                    <ANCContent id={this.state.showId}/>
                </Modal>
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
                                render: (text: string) => {
                                    return <a onClick={() => {
                                        this.setState({
                                            show: true,
                                            showId: parseInt(text)
                                        })
                                    }}>{text}</a>
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