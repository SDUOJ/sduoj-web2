import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {Card, Space} from "antd";
import ModalFormUseForm from "../../../Component/common/Form/ModalFormUseForm";
import mApi from "../../../Utils/API/m-api";
import React from "react";
import ItemEditor from "../../../Component/common/Form/Item/ItemEditor";
import ItemCodeEditor from "../../../Component/common/Form/Item/ItemCodeEditor";
import SubjectiveBase from "../../../Component/subjectiveProblem/Form/SubjectiveBase";
import {scoreModeDefault} from "../../../Config/constValue";
import TableWithPagination from "../../../Component/common/Table/TableWithPagination";

const MSubjective = (props: any) => {

    const SubjectiveForm = [
        {
            component: <SubjectiveBase/>,
            label: props.t("BasicInformation")
        },
        {
            component:
                <>
            <ItemEditor label={props.t("problemDescription")} name={"description"} id={"ItemEditor-description"}/>
            <ItemEditor label={props.t("answer")} name={"answer"} id={"ItemEditor-answer"}/>
                </>,
    label: props.t("ContentAndAnswer")
        },
        {
            component:
                <>
                    {/*<Form.Item>*/}
                    {/*    <ReviewStrategy/>*/}
                    {/*</Form.Item>*/}

            <ItemCodeEditor label={props.t("ScoringStrategy")} name={"scoreStrategy"} initialValue={scoreModeDefault}/>
                </>,
    label: props.t("ProblemScoring")
        },

    ]


    const colData: any[] = [
        {
                title: "ID",
            dataIndex: "id",
            width: 64,
            responsive: ["lg", "sm", "xs"]
        },
        {
                title: props.t("problemCode"),
            dataIndex: "code",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
                title: props.t("title"),
            dataIndex: "title",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: props.t("Owner"),
            dataIndex: "ownerName",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: props.t("operator"),
            width: "200px",
            render: (text: any, rows: any) => {
                return (
                    <Space>
                        <ModalFormUseForm
                            TableName={"SubjectiveList"}
                            width={900}
                            title={props.t("EditWithName", {name: rows.code})}
                            type={"update"}
                            subForm={SubjectiveForm}
                            formName={"SubjectiveForm"}
                            updateAppendProps={{problemCode: rows.code}}
                            dataLoader={async () => {
                                // return mApi.getSubjectiveInfo({problemCode: rows.code}).then((value: any) => {
                                //     return Promise.resolve(value)
                                // })
                            }}
                            dataSubmitter={(value: any) => {
                                // return mApi.updateSubjective(value)
                            }}
                        />
                        <ModalFormUseForm
                            TableName={"SubjectiveList"}
                            width={900}
                            title={props.t("CreateSubjectiveFrom", {name: rows.code})}
                            type={"fork"}
                            subForm={SubjectiveForm}
                            formName={"SubjectiveForm"}
                            dataLoader={async () => {
                                // return mApi.getSubjectiveInfo({problemCode: rows.code}).then((value: any) => {
                                //     return Promise.resolve(value)
                                // })
                            }}
                            dataSubmitter={(value: any) => {
                                return mApi.createSubjective(value)
                            }}
                        />
                    </Space>
                )
            }
        }
    ]

    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={true}
                title={props.t("SubjectiveProblemList")}
                extra={
                    <Space>
                        <ModalFormUseForm
                            TableName={"SubjectiveList"}
                            width={900}
                            title={props.t("CreateSubjective")}
                            type={"create"}
                            subForm={SubjectiveForm}
                            dataSubmitter={(value: any) => {
                                return mApi.createSubjective(value)
                            }}
                        />
                    </Space>
                }
            >
                <TableWithPagination
                    name={"SubjectiveList"}
                    columns={colData}
                    // API={MApi.getSubjectiveList}
                    size={"small"}
                />
            </Card>
        </div>
    )
}

export default withTranslation()(withRouter(MSubjective))
