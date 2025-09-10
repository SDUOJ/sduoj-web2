import React from "react";
import {Card, Space} from "antd";
import MApi from "../../Utils/API/m-api";
import mApi from "../../Utils/API/m-api";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {unix2Time} from "../../Utils/Time";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import TemplateMForm from "../../Component/judgeTemplate/Form/TemplateMForm";

const MJudgeTemplate = (props: any) => {
    const pathArray = props.location.pathname.split("/")
    const type = pathArray[pathArray.length - 1]

    let colData: any[] = [
        {
            title: "ID",
            dataIndex: "id",
            width: 50,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: props.t("Owner"),
            dataIndex: "username",
            width: "auto",
            responsive: ["lg"],
        },
        {
            title: props.t("title"),
            dataIndex: "title",
            width: "auto",
            responsive: ["lg", "sm"],
        },
        {
            title: props.t("comment"),
            dataIndex: "comment",
            width: "auto",
            responsive: ["lg"],
        },
        {
            title: props.t("CreateTime"),
            dataIndex: "gmtCreate",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: props.t("ModifiedTime"),
            dataIndex: "gmtModified",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: props.t("operator"),
            width: "150px",
            render: (text: any, rows: any) => {
                return <Space size={3}>
                    <ModalFormUseForm
                        TableName={`TemplateList-${type}`}
                        width={600}
                        title={rows.title}
                        type={"update"}
                        subForm={[
                            {
                                component: <TemplateMForm/>,
                                label: ""
                            },
                        ]}
                        dataLoader={async () => {
                            return mApi.getOneTemplate({id: rows.id}).then((value: any) => {
                                return Promise.resolve(value)
                            })
                        }}
                        updateAppendProps={{id: rows.id}}
                        dataSubmitter={(value: any) => {
                            return mApi.updateTemplate({type: type === "io" ? 0 : 2, ...value})
                        }}
                    />
                    <ModalFormUseForm
                        TableName={`TemplateList-${type}`}
                        width={600}
                        title={props.t("CreateTemplateFrom", {name: rows.title})}
                        type={"fork"}
                        subForm={[
                            {
                                component: <TemplateMForm/>,
                                label: ""
                            },
                        ]}
                        dataLoader={async () => {
                            return mApi.getOneTemplate({id: rows.id}).then((value: any) => {
                                return Promise.resolve(value)
                            })
                        }}
                        dataSubmitter={(value: any) => {
                            return mApi.createTemplate({type: type === "io" ? 0 : 2, ...value})
                        }}
                    />
                </Space>
            }
        }
    ]

    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={true}
                title={type === "io" ? props.t("ioTemplate") : props.t("advancedTemplate")}
                extra={
                    <>
                        <ModalFormUseForm
                            TableName={`TemplateList-${type}`}
                            width={600}
                            title={props.t("CreateTemplate")}
                            type={"create"}
                            subForm={[
                                {
                                    component: <TemplateMForm/>,
                                    label: ""
                                },
                            ]}
                            dataSubmitter={(value: any) => {
                                return mApi.createTemplate({type: type === "io" ? 0 : 2, ...value})
                            }}
                        />
                    </>
                }
            >
                <TableWithPagination
                    name={`TemplateList-${type}`}
                    columns={colData}
                    API={(paras: any) => {
                        return MApi.pageTemplateList({...paras, type: type === "io" ? 0 : 2})
                    }}
                    size={"small"}
                    rowKey={"id"}
                />
            </Card>
        </div>
    )

}

export default withTranslation()(withRouter(MJudgeTemplate))
