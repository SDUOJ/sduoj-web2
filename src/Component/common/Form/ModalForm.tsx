import {ManageState} from "../../../Type/IManage";
import React, {Dispatch, useState} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Button, message, Modal, Tabs} from "antd";
import {ButtonType} from "antd/lib/button/button";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import TabPane from "@ant-design/pro-card/lib/components/TabPane";
import {ck} from "../../../Utils/empty";
import {TableState} from "../../../Type/ITable";

interface subFormType {

}

interface ModalFormProps {
    // 表单类型
    type: "create" | "update" | "batchUpdate"
    // 初始化数据，必须包含 initData 或 dataLoader 之一
    initData?: { [key: string]: {} }
    dataLoader?: () => Promise<any>   // 异步数据加载
    dataChecker: (data: any) => Promise<any>
    dataSubmitter: (data: any) => Promise<any>
    dataUpdater: (data: any) => Promise<any>
    updateAppendProps: { [key: string]: any }

    title: string           // 弹窗标题
    TableName?: string      // 若有需要更新的表格，其名称
    className: any          // 类名
    subForm: subFormType[]  // 子表单信息
}

const ModalForm = (props: ModalFormProps & any) => {

    const [formData, setFormData] = useState<{ [key: string]: {} }>(ck(props.initData, {}))
    const [formVis, setFormVis] = useState<boolean>(false)

    const BtnTypeMap: { [key: string]: ButtonType } = {
        create: "primary",
        update: "link",
        batchUpdate: "primary"
    }

    const setFormData0 = (key: string, data: any) => {
        formData[key] = data
        setFormData(formData)
    }

    const loadData = () => {
        if (props.type === "create") {

        } else if (props.type === "update") {
            if (props.initData === undefined) {
                const hied = message.loading({
                    content: "加载中",
                    duration: 0,
                })
                if(props.dataLoader === undefined) {
                    hied()
                    message.error("未定义数据加载器")
                    return
                }
                props.dataLoader && props.dataLoader().then((data: any) => {
                    setFormData(data)
                    hied()
                    setFormVis(true)
                }).catch((e: any) => {
                    hied()
                    message.error(e)
                })
            } else setFormVis(true)
        }
    }

    const submitData = () => {
        props.dataChecker(formData).then(() => {
            if (props.type === "create") {
                props.dataSubmitter(formData).then((res: any) => {
                    setFormVis(false)
                    if (props.TableName !== undefined)
                        props.addTableVersion(props.TableName)
                    message.success("成功")
                })
            } else if (props.type === "update") {
                Object.assign(formData, props.updateAppendProps)
                props.dataUpdater(formData).then((res: any) => {
                    setFormVis(false)
                    if (props.TableName !== undefined)
                        props.addTableVersion(props.TableName)
                    message.success("成功")
                })
            }
        }).catch((e: any) => {
            message.error(e)
        })
    }


    return (
        <>
            <Button
                type={BtnTypeMap[props.type]}
                onClick={loadData}
            >
                {
                    [''].map(() => {
                        if (props.type === "create") return <PlusOutlined/>
                        if (props.type === "batchUpdate") return <EditOutlined/>
                    })
                }
                {
                    [''].map(() => {
                        switch (props.type) {
                            case "create":
                                return props.t("create")
                            case "update":
                                return props.t("Edit")
                            default:
                                return "批量修改"
                        }
                    })
                }
            </Button>
            <Modal
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
                <Tabs defaultActiveKey="1">
                    {
                        props.subForm.map((item: any, index: number) => {
                            const ItemForm = item.component
                            return (
                                <TabPane tab={item.label} key={(index + 1).toString()}>
                                    <ItemForm
                                        setData={(data: any) => {
                                            setFormData0(item.key, data)
                                        }}
                                        initData={formData[item.key]}
                                    />
                                </TabPane>
                            )
                        })
                    }
                </Tabs>
            </Modal>
        </>
    )
}

const mapStateToProps = (state: any) => {}

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