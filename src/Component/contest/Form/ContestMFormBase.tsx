import {withTranslation} from "react-i18next";
import ItemText from "../../common/Form/Item/ItemText";
import ItemTitle from "../../common/Form/Item/ItemTitle";
import {Col, Form, Radio, Row, Select} from "antd";
import React, {useState} from "react";
import FormExtraInfo from "../../common/Form/FormExtraInfo";
import ItemEditor from "../../common/Form/Item/ItemEditor";
import ItemSwitch01 from "../../common/Form/Item/ItemSwitch01";
import ItemTimeRange from "../../common/Form/Item/ItemTimeRange";

const ContestMFormBase = (props: any) => {

    const [openness, setOpenness] = useState("public")

    return (
        <div style={{width: 1100}}>
            <ItemTitle name={"contestTitle"}/>
            <Row>
                <Col span={5}>
                    <Form.Item label={props.t("Mode")} name={["features", "mode"]} required>
                        <Radio.Group>
                            <Radio value={"acm"}> ACM </Radio>
                            <Radio value={"oi"}> OI </Radio>
                            <Radio value={"ioi"}> IOI </Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>
                <Col span={3}>
                    <ItemSwitch01 name={"isPublic"} label={props.t("IsPublic")} ck={props.t("Yes")} unck={props.t("No")}/>
                </Col>
                <Col span={8}>
                    <Form.Item label={props.t("Openness")} required>
                        <Select style={{width: 310}} value={openness} onChange={(value, option) => {
                            setOpenness(value)
                        }}>
                            <Select.Option value={"public"}>{props.t("openness.public")}: {props.t("anyoneCanJoin")}</Select.Option>
                            <Select.Option value={"protected"}>{props.t("openness.protected")}: {props.t("problemsPublicButSubmissionRequiresPassword")}</Select.Option>
                            <Select.Option value={"private"}>{props.t("openness.private")}: {props.t("passwordRequiredToJoin")}</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    {openness !== "public" && (
                        <ItemText name={"password"} label={props.t("ContestPassword")} required={true}/>
                    )}

                </Col>
            </Row>
            <Row>
                <Col span={11}>
                    <ItemTimeRange label={props.t("ContestTimeRange")} required={true}/>
                </Col>
                <Col span={12}>
                    <ItemText name={"source"} label={props.t("source")} required={false}/>
                </Col>
            </Row>

            <Form.Item name={["features", "openness"]} hidden required>
                <FormExtraInfo v={openness} setV={setOpenness} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>

            <ItemEditor name={"markdownDescription"} label={props.t("ContestAnnouncement")}/>
        </div>
    )

}

export default withTranslation()(ContestMFormBase)
