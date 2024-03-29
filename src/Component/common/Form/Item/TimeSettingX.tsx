import React, {useState} from "react";
import {useForm} from "antd/es/form/Form";
import {Button, Form, InputNumber, Modal, Space} from "antd";
import {unix2Time} from "../../../../Utils/Time";
import ItemTimeRange from "./ItemTimeRange";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

const TimeSettingX = (props: any) => {
    const {value, onChange} = props
    const [open, setOpen] = useState<boolean>(false)
    const [form] = useForm()
    return (
        <>
            <Space>
                {(value && value.length !== 0) && (
                    <span>
                        {unix2Time(parseInt(value[0].tm_start))} - {unix2Time(parseInt(value[value.length - 1].tm_end))}
                    </span>
                )}
                <Button
                    type={"link"}
                    size={"small"}
                    onClick={() => {
                        form.resetFields()
                        form.setFieldsValue({"data": value})
                        setOpen(true)
                    }}
                >
                    设置时间
                </Button>
            </Space>

            <Modal
                title={props.title ?? "时间设定"}
                visible={open}
                maskClosable={false}
                onCancel={() => {
                    setOpen(false)
                }}
                onOk={() => {
                    onChange(form.getFieldsValue().data)
                    setOpen(false)
                }}
                destroyOnClose={true}
            >
                <Form
                    form={form}
                    style={{maxWidth: 600}}
                    autoComplete="off"
                >
                    <Form.List name="data">
                        {(fields, {add, remove}) => (
                            <>
                                {fields.map(({key, name, ...restField}) => (
                                    <Space key={key} style={{display: 'flex', marginBottom: 8}} align="baseline">
                                        <ItemTimeRange startName={[name, "tm_start"]} endName={[name, "tm_end"]}/>
                                        <Form.Item name={[name, "weight"]}>
                                            <InputNumber placeholder={"权重"}/>
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)}/>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                        新增时间
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </>
    )

}

export default TimeSettingX;
