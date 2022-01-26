import {Component} from "react";
import {Card, Modal, Space, Table, Tag} from "antd";
import {withTranslation} from "react-i18next";
import {InfoCircleOutlined} from "@ant-design/icons"
import ANCContent from "./Content";
import TableWithPagination from "../common/Table/TableWithPagination";
import CApi from "Utils/API/c-api"
import {unix2Time} from "../../Utils/Time";


class Announcement extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            show: false,
            showId: 0,
            showTitle: ""
        }
    }


    render() {
        return (
            <>
                <Modal
                    title={this.props.t("AnnouncementDetails") +" (" +  this.state.showTitle + ")"}
                    visible={this.state.show}
                    onCancel={() => {
                        this.setState({show: false})
                    }}
                    onOk={() => {
                        this.setState({show: true})
                    }}
                    footer={null}
                    width={1100}
                    destroyOnClose={true}
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
                    <TableWithPagination
                        size={"small"}
                        columns={[
                            {
                                title: "ID",
                                dataIndex: "noticeId",
                                key: "ID"
                            },
                            {
                                title: "标题",
                                dataIndex: "title",
                                key: "title",
                                render: (text: string, row:any) => {
                                    return (
                                        <Space size={5}>
                                            <a onClick={() => {
                                                this.setState({
                                                    show: true,
                                                    showId: parseInt(row.noticeId),
                                                    showTitle: row.title
                                                })
                                            }}>{text}</a>
                                            {row.top === 1 && (<Tag color={"#e10000"}>{this.props.t("Top")}</Tag>)}
                                        </Space>

                                    )

                                }
                            },
                            {
                                title: "发布日期",
                                dataIndex: "gmtCreate",
                                key: "date",
                                render: (text: any) => {
                                    return unix2Time(parseInt(text))
                                }
                            }
                        ]}
                        API={CApi.getAnnouncementList}
                    />

                </Card>
            </>
        )
    }
}

export default withTranslation()(Announcement)