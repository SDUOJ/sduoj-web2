import {DatePicker, Form} from "antd";
import FormExtraInfo from "../FormExtraInfo";
import {isValueEmpty} from "../../../../Utils/empty";
import dayjs, {Dayjs} from "dayjs";
import React, {useState} from "react";


const ItemTime = (props: any) => {
    const [time, setTime] = useState<Dayjs | null>()
    return (
        <>
            <Form.Item
                label={props.label}
                required={props.required}
            >
                <DatePicker showTime value={time as any} onChange={(v) => {setTime(v)}}/>
            </Form.Item>
            <Form.Item name={props.name} hidden required={props.required}>
                <FormExtraInfo v={isValueEmpty(time) ? undefined : time?.valueOf()} setV={(v: any) => {
                    setTime(dayjs(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
        </>
    )
}

export default ItemTime