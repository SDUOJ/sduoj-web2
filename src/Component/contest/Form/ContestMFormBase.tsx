import {withTranslation} from "react-i18next";
import ItemText from "../../common/Form/Item/ItemText";
import ItemTitle from "../../common/Form/Item/ItemTitle";
import {Col, DatePicker, Form, Radio, Row, Select} from "antd";
import ItemSwitch from "../../common/Form/Item/ItemSwitch";
import Item from "antd/es/list/Item";
import React, {useEffect, useState} from "react";
import FormExtraInfo from "../../common/Form/FormExtraInfo";
import ItemPassword from "../../user/Form/Item/ItemPassword";
import {InfoCircleOutlined} from "@ant-design/icons";
import moment from "moment";
import {isValueEmpty} from "../../../Utils/empty";
import ItemEditor from "../../common/Form/Item/ItemEditor";
import ItemSwitch01 from "../../common/Form/Item/ItemSwitch01";

const ContestMFormBase = (props: any) => {

    const [openness, setOpenness] = useState("public")
    const [timeRange, setTimeRange] = useState<any>()
    const [timeRange1, setTimeRange1] = useState<any>()
    const [timeRange2, setTimeRange2] = useState<any>()
    const {RangePicker} = DatePicker;

    useEffect(() => {
        setTimeRange([timeRange1, timeRange2])
    }, [timeRange1, timeRange2])

    return (
        <div style={{width: 1100}}>
            <ItemTitle name={"contestTitle"}/>
            <Row>
                <Col span={5}>
                    <Form.Item label={"模式"} name={["features", "mode"]} required>
                        <Radio.Group>
                            <Radio value={"acm"}> ACM </Radio>
                            <Radio value={"oi"}> OI </Radio>
                            <Radio value={"ioi"}> IOI </Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>
                <Col span={3}>
                    <ItemSwitch01 name={"isPublic"} label={"是否公开"} ck={"是"} unck={"否"}/>
                </Col>
                <Col span={8}>
                    <Form.Item label={"开放性"} required>
                        <Select style={{width: 310}} value={openness} onChange={(value, option) => {
                            setOpenness(value)
                        }}>
                            <Select.Option value={"public"}> 公开：任何人可以加入 </Select.Option>
                            <Select.Option value={"protected"}> 保护：题目是公开的，但是提交需要密码 </Select.Option>
                            <Select.Option value={"private"}> 私有：需要密码才能加入 </Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    {openness !== "public" && (
                        <ItemText name={"password"} label={"比赛密码"} required={true}/>
                    )}

                </Col>
            </Row>
            <Row>
                <Col span={11}>
                    <Form.Item
                        label="比赛起止时间"
                        required
                    >
                        <RangePicker
                            showTime={{minuteStep: 5, secondStep: 30}}
                            format={"YYYY-MM-DD HH:mm:ss"}
                            value={timeRange}
                            onChange={(v: any) => {
                                setTimeRange(v)
                                setTimeRange1(v[0])
                                setTimeRange2(v[1])
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <ItemText name={"source"} label={"来源"} required={false}/>
                </Col>
            </Row>

            <Form.Item name={["features", "openness"]} hidden required>
                <FormExtraInfo v={openness} setV={setOpenness} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>

            <Form.Item name={"gmtStart"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange1) ? undefined : timeRange1.unix() * 1000} setV={(v: any) => {
                    setTimeRange1(moment(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
            <Form.Item name={"gmtEnd"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange2) ? undefined : timeRange2.unix() * 1000} setV={(v: any) => {
                    setTimeRange2(moment(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>

            <ItemEditor name={"markdownDescription"} label={"比赛公告"}/>
        </div>
    )

}

export default withTranslation()(ContestMFormBase)