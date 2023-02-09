import {Button, Form, Modal, Tabs} from "antd";
import {withTranslation} from "react-i18next";
import React, {useState} from "react";
import {useForm} from "antd/es/form/Form";
import {PlusOutlined} from "@ant-design/icons";
import ItemSwitch from "../common/Form/Item/ItemSwitch";
import ItemText from "../common/Form/Item/ItemText";
import CodeHubList from "./CodeHubList";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import cApi from "../../Utils/API/c-api";

const ImportSubmission = (props: any) => {

    const [vis, setVis] = useState<any>()
    const [form] = useForm()

    const {TabPane} = Tabs;

    return (
        <>
            <Button
                icon={<PlusOutlined/>}
                type={"primary"}
                onClick={() => {
                    setVis(true)
                }}
            >{props.t("添加代码")}</Button>

            <Modal
                title={"添加代码"}
                visible={vis}
                destroyOnClose={true}
                width={1400}
                onCancel={() => {
                    setVis(false)
                }}
                okText={"提交"}
            >
                <Form form={form} layout={"vertical"}>
                    <ItemSwitch
                        name={"isReference"}
                        label={"是否为参考代码"}
                        ck={"是"}
                        unck={"否"}
                    />

                    <Tabs defaultActiveKey="1">
                        <TabPane tab="代码仓库" key="1">
                            <CodeHubList/>
                        </TabPane>
                        <TabPane tab="题库提交" key="2">
                            <SubmissionList
                                name={"SelectSubmission"}
                                useForm={true}
                                API={cApi.getSubmissionList}
                                QuerySubmissionAPI={(submissionId: string) => {
                                    return cApi.getSubmissionInfo({submissionId: submissionId})
                                }}
                                problemCodeRender={(text: any) => {
                                    let ps = text.split("-")
                                    return (
                                        <>
                                            <span style={{fontWeight: "bold"}}>{ps[0]}</span> - <span>{ps[1]}</span>
                                        </>
                                    )
                                }}
                            />
                        </TabPane>
                        <TabPane tab="比赛" key="3">
                            <ItemText label={"比赛ID"} name={"contestId"}/>
                            <ItemText label={"题目编号"} name={"problemId"}/>
                            <ItemText label={"认定参数"} name={"problemId"}/>
                        </TabPane>
                        <TabPane tab="考试认定代码" key="4">
                            <ItemText label={"考试ID"} name={"examId"}/>
                            <ItemText label={"题目编号"} name={"problemId"}/>
                        </TabPane>
                    </Tabs>

                </Form>
            </Modal>
        </>
    )
}

export default withTranslation()(ImportSubmission)
