import {Button, Form, Modal, Tabs} from "antd";
import {useTranslation} from "react-i18next";
import React, {useState} from "react";
import {useForm} from "antd/es/form/Form";
import {PlusOutlined} from "@ant-design/icons";
import ItemSwitch from "../common/Form/Item/ItemSwitch";
import ItemText from "../common/Form/Item/ItemText";
import CodeHubList from "./CodeHubList";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import cApi from "../../Utils/API/c-api";

const ImportSubmission = (props: any) => {
    const { t } = useTranslation();

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
            >{t("AddCode")}</Button>

            <Modal
                title={t("AddCode")}
                visible={vis}
                destroyOnClose={true}
                width={1400}
                onCancel={() => {
                    setVis(false)
                }}
        okText={t("Submit")}
            >
                <Form form={form} layout={"vertical"}>
                    <ItemSwitch
                        name={"isReference"}
            label={t("IsReferenceCode")}
            ck={t("YesSimple")}
            unck={t("NoSimple")}
                    />

                    <Tabs defaultActiveKey="1">
            <TabPane tab={t("CodeRepositoryTab") } key="1">
                            <CodeHubList/>
                        </TabPane>
            <TabPane tab={t("ProblemBankSubmissionTab")} key="2">
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
                        <TabPane tab={t("Contest") } key="3">
                            <ItemText label={t("ContestId")} name={"contestId"}/>
                            <ItemText label={t("ProblemCodeLabel")} name={"problemId"}/>
                            <ItemText label={t("RecognitionParam")} name={"problemId"}/>
                        </TabPane>
                        <TabPane tab={t("ExamRecognitionCodeTab")} key="4">
                            <ItemText label={t("ExamId")} name={"examId"}/>
                            <ItemText label={t("ProblemCodeLabel")} name={"problemId"}/>
                        </TabPane>
                    </Tabs>

                </Form>
            </Modal>
        </>
    )
}

export default ImportSubmission
