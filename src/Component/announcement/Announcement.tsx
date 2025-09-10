import {useState} from "react";
import {Button, Card, Modal, Space, Tag} from "antd";
import {withTranslation} from "react-i18next";
import {InfoCircleOutlined} from "@ant-design/icons"
import ANCContent from "./Content";
import TableWithPagination from "../common/Table/TableWithPagination";
import CApi from "Utils/API/c-api"
import {unix2Time} from "../../Utils/Time";
import "Assert/css/Announcement.css"

const Announcement = (props: any) => {

    const [show, setShow] = useState(false)
    const [showId, setShowId] = useState(0)
    const [showTitle, setShowTitle] = useState("")

    return (
        <>
            <Modal
                title={props.t("AnnouncementDetails") + " (" + showTitle + ")"}
                open={show}
                onCancel={() => {
                    setShow( false)
                }}
                onOk={() => {
                    setShow(false)
                }}
                footer={null}
                width={1100}
                destroyOnHidden={true}
            >
                <ANCContent id={showId}/>
            </Modal>
            <Card
                title={
                    <Space>
                        <InfoCircleOutlined/>
                        {props.t("Announcement")}
                    </Space>
                }
                className={"Announcement-Card"}
            >
                <TableWithPagination
                    size={"small"}
                    defaultPageSize={5}
                    columns={[
                        {
                            title: "ID",
                            dataIndex: "noticeId",
                            key: "ID"
                        },
                        {
                            title: props.t("title"),
                            dataIndex: "title",
                            key: "title",
                            render: (text: string, row: any) => {
                                return (
                                    <Space size={5}>
                                        <Button size={"small"} type={"link"} onClick={() => {
                                            setShow(true)
                                            setShowId(parseInt(row.noticeId))
                                            setShowTitle(row.title)
                                        }}>{text}</Button>
                                        {row.top === 1 && (<Tag color={"#e10000"}>{props.t("Top")}</Tag>)}
                                    </Space>

                                )

                            }
                        },
                        {
                            title: props.t("ReleaseDate"),
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

export default withTranslation()(Announcement)
