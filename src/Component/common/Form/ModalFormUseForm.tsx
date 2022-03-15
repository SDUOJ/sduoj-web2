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
        fork: "link",
        batchUpdate: "primary"
    }


    const loadData = () => {
        if (props.type === "update" || props.type === "fork") {
            // 若初始化信息为空，则调用数据加载器进行异步数据加载
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
                })
            } else {
                // 否则直接进行数据加载
                setSaveInitData(props.initData)
                setFormVis(true)
            }
        } else {
            setFormVis(true)
        }
    }

    // 当表单的可见性发生改变时，维护表单信息
    useEffect(() => {
        // 延迟向表单注入信息
        setTimeout(() => {
            formMapRef.current.forEach((formInstanceRef) => {
                formInstanceRef.current?.setFieldsValue(saveInitData);
            });
        }, 100)

        // 当表单消失时，清除相关数据
        if (!formVis) {
            setCurrent(0)
            formMapRef.current.forEach((formInstanceRef) => {
                formInstanceRef.current?.resetFields()
            });
            props.formName && props.addManageInitData(props.formName, undefined)
        }
    }, [formVis])

    useEffect(() => {
        props.formName && props.addManageInitData(props.formName, saveInitData)
    }, [saveInitData])

    // 提交数据
    const submitData = (values: any) => {
        const submit = (value: any) => {
            console.log("inner", value)
            // 在提交表单数据之前，追加数据
            props.updateAppendProps && Object.assign(value, props.updateAppendProps)
            props.dataSubmitter(value).then((res: any) => {
                setFormVis(false)
                // 当数据绑定表格时，更新表格数据
                props.TableName && props.addTableVersion(props.TableName)
                message.success("成功")
            })
        }

        if (props.subForm.length === 1) {
            // 只有一页的表单，需要手动进行验证
            form.validateFields().then((value) => {
                submit(value)
            }).catch((e: any) => {
                message.error('表单不完整')
            })
        } else submit(values)
    }

    return (
        <>
            <Button
                type={ck(props.btnType, BtnTypeMap[props.type])}
                onClick={loadData}
                style={
                    (props.type === "fork" || props.type === "update" || props.btnType === "link") ? {
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
                        case "fork":
                            return "克隆"
                        default:
                            return "批量修改"
                    }
                })()}
            </Button>
            {props.subForm.length === 1 && (
                <Modal
                    width={props.width}
                    destroyOnClose={true}
                    title={props.title}
                    className={props.className}
                    visible={formVis}
                    maskClosable={false}
                    onCancel={() => {
                        setFormVis(false)
                    }}
                    footer={[
                        <Button type="primary" key="submit" onClick={submitData}>
                            {props.t("Submit")}
                        </Button>
                    ]}
                >
                    <Form
                        form={form}
                        layout={"vertical"}
                        initialValues={props.initData}
                        scrollToFirstError
                        preserve={false}
                    >
                        {props.subForm.map((item: any) => {
                            return item.component
                        })}
                    </Form>
                </Modal>
            )}
            {props.subForm.length !== 1 && (
                <StepsForm
                    current={current}
                    onCurrentChange={(currentPage: number) => {
                        setCurrent(currentPage)
                    }}
                    formMapRef={formMapRef}
                    onFinish={async (values) => {
                        submitData(values)
                    }}
                    stepsFormRender={(dom, submitter) => {
                        return (
                            <Modal
                                destroyOnClose={true}
                                title={props.title}
                                className={props.className}
                                visible={formVis}
                                maskClosable={false}
                                width={props.width ?? 1200}
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
    addManageInitData: (key: string, data: any) => dispatch({type: "addManageInitData", key: key, data: data})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ModalForm)
    ))