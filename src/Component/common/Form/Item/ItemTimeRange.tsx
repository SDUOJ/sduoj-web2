import {withTranslation} from "react-i18next";
import {DatePicker, Form} from "antd";
import React, {useEffect, useState} from "react";
import FormExtraInfo from "../FormExtraInfo";
import {isValueEmpty} from "../../../../Utils/empty";
import dayjs, {Dayjs} from "dayjs";

const ItemTimeRange = (props: any) =>{
    const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>()
    const [timeRange1, setTimeRange1] = useState<Dayjs | null>()
    const [timeRange2, setTimeRange2] = useState<Dayjs | null>()
    const {RangePicker} = DatePicker;

    useEffect(() => {
        if (timeRange1 && timeRange2) setTimeRange([timeRange1, timeRange2])
        else setTimeRange(null)
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
                    value={timeRange as any}
                    onChange={(v) => {
                        setTimeRange(v as any)
                        setTimeRange1(v?.[0] ?? null)
                        setTimeRange2(v?.[1] ?? null)
                    }}
                />
            </Form.Item>
            <Form.Item name={props.startName ?? "gmtStart"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange1) ? undefined : timeRange1?.valueOf()} setV={(v: any) => {
                    setTimeRange1(dayjs(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
            <Form.Item name={props.endName ?? "gmtEnd"} hidden required>
                <FormExtraInfo v={isValueEmpty(timeRange2) ? undefined : timeRange2?.valueOf()} setV={(v: any) => {
                    setTimeRange2(dayjs(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemTimeRange)