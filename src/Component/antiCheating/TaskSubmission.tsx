import {withTranslation} from "react-i18next";
import React, {useState} from "react";
import {PlusOutlined} from "@ant-design/icons";
import {Button, Col, Modal, Row, Tabs} from "antd";
import CodeHubList from "./CodeHubList";
import ImportSubmission from "./ImportSubmission";
import cApi from "../../Utils/API/c-api";
import SubmissionList from "../submission/SubmissionList/SubmissionList";

const TaskSubmission = (props: any) => {

    const [vis, setVis] = useState<any>()

    const {TabPane} = Tabs;

    return (
        <>
            <Button
                type={"link"}
                onClick={() => {
                    setVis(true)
                }}
            >{props.t("任务代码")}</Button>
            <Modal
                title={"查重任务代码"}
                visible={vis}
                destroyOnClose={true}
                width={1300}
                onCancel={() => {
                    setVis(false)
                }}
                okButtonProps={{style: {display: "none"}}}
                cancelText={"关闭"}
                okText={"添加"}
            >
                <div style={{position: "relative", left: 1100}}>
                    <ImportSubmission/>
                </div>
                <Tabs defaultActiveKey="1">
                    <TabPane tab="查重代码" key="1">
                        <Row gutter={24}>
                            <Col>

                            </Col>
                        </Row>
                    </TabPane>
                    <TabPane tab="参考代码" key="2">

                    </TabPane>
                </Tabs>
            </Modal>
        </>
    )
}

export default withTranslation()(TaskSubmission)