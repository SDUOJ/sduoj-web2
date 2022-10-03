import {withTranslation} from "react-i18next";
import ItemTitle from "../../common/Form/Item/ItemTitle";
import React, {useState} from "react";
import {Col, Form, Row, Select} from "antd";
import FormExtraInfo from "../../common/Form/FormExtraInfo";
import ItemTimeRange from "../../common/Form/Item/ItemTimeRange";
import ItemProblemAdd from "../../problem/From/Item/ItemProblemAdd";

const ProblemSetGroup = (props: any) => {
    const [type, setType] = useState<any>("")
    return (
        <>
            <ItemTitle label={"标题"}/>
            <Form.Item hidden name={""}>
                <FormExtraInfo v={type} setV={setType} eqs={(a: any, b: any) => a === b}/>
            </Form.Item>
            <ItemTimeRange label={"题单时间"}/>

            <Form.Item label={"题组类型"}>
                <Select value={type} onChange={(value, option) => {
                    setType(value)
                }}>
                    <Select.Option value={"objective"}>客观题</Select.Option>
                    <Select.Option value={"subjective"}>主观题</Select.Option>
                    <Select.Option value={"program"}>编程题</Select.Option>
                </Select>
            </Form.Item>

            <ItemProblemAdd
                name={"problems"}
                editable={true}
                problemType={"program"}
            />

            <Form.Item label={"延迟设定"}>

            </Form.Item>
        </>
    )
}

export default withTranslation()(ProblemSetGroup)