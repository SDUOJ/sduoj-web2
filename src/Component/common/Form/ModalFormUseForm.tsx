import React, {Dispatch, useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Button, Form, message, Modal, Tabs} from "antd";
import {ButtonType} from "antd/lib/button/button";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {ck} from "../../../Utils/empty";
import {useForm} from "antd/es/form/Form";
import {ProFormInstance, StepsForm} from "@ant-design/pro-form";

interface subFormType {
    component: any
    label: string
}

interface ModalFormProps {
    // 表单类型
    type: "create" | "update" | "batchUpdate"
    // 初始化数据，必须包含 initData 或 dataLoader 之一
    initData?: { [key: string]: {} }
    dataLoader?: () => Promise<any>   // 异步数据加载
    dataSubmitter: (data: any) => Promise<any>
    updateAppendProps?: { [key: string]: any }

    title: string           // 弹窗标题
    TableName?: string      // 若有需要更新的表格，其名称
    className?: any          // 类名
    subForm: subFormType[]  // 子表单信息
}

const ModalForm = (props: ModalFormProps & any) => {

    const [form] = useForm()
    const formMapRef = useRef<React.MutableRefObject<ProFormInstance<any> | undefined>[]>([]);
    const [formVis, setFormVis] = useState<boolean>(false)
    const [saveInitData, setSaveInitData] = useState();
    const [current, setCurrent] = useState<number>(0)

    const BtnTypeMap: { [key: string]: ButtonType } = {
        create: "primary",
        update: "link",
        batchUpdate: "primary"
    }


    const loadData = () => {
        if (props.type === "update") {
            if (props.initData === undefined) {
                const hied = message.loading({
                    content: "加载中",
                    duration: 0,
                })
                if (props.dataLoader === undefined) {
                    hied()
                    message.error("未定义数据加载器")
                    return
                }
                props.dataLoader && props.dataLoader().then((data: any) => {
                    if (props.subForm.length !== 1) {
                        setSaveInitData(data)
                    } else form.setFieldsValue(data)
                    hied()
                    setFormVis(true)
                }).catch((e: any) => {
                    hied()
                    message.error(e)
                })
            } else {
                setSaveInitData(props.initData)
                setFormVis(true)
            }
        } else {
            setFormVis(true)
        }
    }

    useEffect(() => {
        setTimeout(()=>{
            console.log(formMapRef.current[0]?.current)
            formMapRef.current.forEach((formInstanceRef) => {
                console.log("ok 1")
                formInstanceRef.current?.setFieldsValue(saveInitData);
            });
        }, 100)
    }, [formVis])

    useEffect(()=>{
        if(!formVis) setCurrent(0)
    }, [formVis])

    const submitData = () => {
        form.validateFields().then((value) => {
            console.log("inner", value)
            props.updateAppendProps && Object.assign(value, props.updateAppendProps)
            props.dataSubmitter(value).then((res: any) => {
                setFormVis(false)
                if (props.TableName !== undefined)
                    props.addTableVersion(props.TableName)
                message.success("成功")
            })
        }).catch((e: any) => {
            message.error('表单不完整')
        })
    }

    return (
        <>
            <Button
                type={ck(props.btnType, BtnTypeMap[props.type])}
                onClick={loadData}
                style={
                    (props.type === "update" || props.btnType === "link") ? {
                        paddingLeft: 5,
                        paddingRight: 5
                    } : undefined
                }
            >
                {(() => {
                    if (props.btnIcon !== false) {
                        if (props.type === "create") return <PlusOutlined/>
                        if (props.type === "batchUpdate") return <EditOutlined/>
                    }
                })()}
                {(() => {
                    if (props.btnName !== undefined)
                        return props.btnName
                    switch (props.type) {
                        case "create":
                            return props.t("create")
                        case "update":
                            return props.t("Edit")
                        default:
                            return "批量修改"
                    }
                })()}
            </Button>
            {props.subForm.length === 1 && (
                <Modal
                    destroyOnClose={true}
                    title={props.title}
                    className={props.className}
                    visible={formVis}
                    maskClosable={false}
                    onCancel={() => {
                        setFormVis(false)
                    }}
                    footer={
                        [
                            <Button type="primary" key="submit" onClick={submitData}>
                                {props.t("Submit")}
                            </Button>
                        ]
                    }
                >
                    <Form
                        form={form}
                        layout={"vertical"}
                        initialValues={props.initData}
                        scrollToFirstError
                    >
                        {props.subForm.map((item: any) => item.component)}
                    </Form>
                </Modal>
            )}
            {props.subForm.length !== 1 && (
                <StepsForm
                    current={current}
                    onCurrentChange={(currentPage: number)=>{
                        setCurrent(currentPage)
                    }}
                    formMapRef={formMapRef}
                    onFinish={async (values) => {
                        props.updateAppendProps && Object.assign(values, props.updateAppendProps)
                        props.dataSubmitter(values).then((res: any) => {
                            setFormVis(false)
                            if (props.TableName !== undefined)
                                props.addTableVersion(props.TableName)
                            message.success("成功")
                        })
                    }}
                    stepsFormRender={(dom, submitter) => {
                        return (
                            <Modal
                                destroyOnClose={true}
                                title={props.title}
                                className={props.className}
                                visible={formVis}
                                maskClosable={false}
                                width={1200}
                                onCancel={() => {
                                    setFormVis(false)
                                }}
                                footer={submitter}
                            >
                                {dom}
                            </Modal>
                        );
                    }}
                >
                    {props.subForm.map((item: any, index: number) => {
                        return (
                            <StepsForm.StepForm
                                name={"step" + index}
                                title={item.label}
                                onFinish={async () => {
                                    return true;
                                }}
                            >
                                {item.component}
                            </StepsForm.StepForm>
                        )
                    })}
                </StepsForm>

            )}
        </>
    )
}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ModalForm)
    ))