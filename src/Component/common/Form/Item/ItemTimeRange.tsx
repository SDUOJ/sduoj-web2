import {withTranslation} from "react-i18next";
import {DatePicker, Form} from "antd";
import React, {useEffect, useState} from "react";
import FormExtraInfo from "../FormExtraInfo";
import {isValueEmpty} from "../../../../Utils/empty";
import moment from "moment";

const ItemTimeRange = (props: any) =>{
    const [timeRange, setTimeRange] = useState<any>()
    const [timeRange1, setTimeRange1] = useState<any>()
    const [timeRange2, setTimeRange2] = useState<any>()
    const {RangePicker} = DatePicker;

    useEffect(() => {
        setTimeRange([timeRange1, timeRange2])
    }, [timeRange1, timeRange2])

    return (
        <>
            <Form.Item
                label={props.label}
                required={props.required}
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
            <Form.Item name={props.startName ?? "gmtStart"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange1) ? undefined : timeRange1.unix() * 1000} setV={(v: any) => {
                    setTimeRange1(moment(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
            <Form.Item name={props.endName ?? "gmtEnd"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange2) ? undefined : timeRange2.unix() * 1000} setV={(v: any) => {
                    setTimeRange2(moment(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemTimeRange)