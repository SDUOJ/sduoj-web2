import {Router, withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {Card, InputNumber, Select, Space} from "antd";
import ModalFormUseForm from "../../../Component/common/Form/ModalFormUseForm";
import UserFormProfile from "../../../Component/user/Form/UserFormProfile";
import UserFormAdditional from "../../../Component/user/Form/UserFormAdditional";
import mApi from "../../../Utils/API/m-api";
import judgeAuth from "../../../Utils/judgeAhtu";
import ItemPassword from "../../../Component/user/Form/Item/ItemPassword";
import React from "react";
import {Form} from "antd"
import MApi from "../../../Utils/API/m-api";
import TableWithSelection from "../../../Component/common/Table/TableWithSelection";
import ItemTitle from "../../../Component/common/Form/Item/ItemTitle";
import ItemEditor from "../../../Component/common/Form/Item/ItemEditor";
import ReviewStrategy from "../../../Component/subjectiveProblem/Form/Item/ReviewStrategy";
import ItemSwitch from "../../../Component/common/Form/Item/ItemSwitch";
import ItemSwitch01 from "../../../Component/common/Form/Item/ItemSwitch01";
import TextArea from "antd/es/input/TextArea";
import ItemCodeEditor from "../../../Component/common/Form/Item/ItemCodeEditor";
import ItemSelectGroup from "../../../Component/group/Form/Item/ItemSelectGroup";
import SubjectiveBase from "../../../Component/subjectiveProblem/Form/SubjectiveBase";
import {scoreModeDefault} from "../../../Config/constValue";
import TableWithPagination from "../../../Component/common/Table/TableWithPagination";

const MSubjective = (props: any) => {

    const SubjectiveForm = [
        {
            component: <SubjectiveBase/>,
            label: "基本信息"
        },
        {
            component:
                <>
                    <ItemEditor label={"题目内容"} name={"description"} id={"ItemEditor-description"}/>
                    <ItemEditor label={"题目答案"} name={"answer"} id={"ItemEditor-answer"}/>
                </>,
            label: "内容与答案"
        },
        {
            component:
                <>
                    {/*<Form.Item>*/}
                    {/*    <ReviewStrategy/>*/}
                    {/*</Form.Item>*/}

                    <ItemCodeEditor label={"评分策略"} name={"scoreStrategy"} initialValue={scoreModeDefault}/>
                </>,
            label: "题目评分"
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
            title: "题号",
            dataIndex: "code",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: "标题",
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
                            title={"编辑(" + rows.code + ")"}
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
                            title={"新建主观题(克隆自" + rows.code + ")"}
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
                bordered={false}
                title={"主观题列表"}
                extra={
                    <Space>
                        <ModalFormUseForm
                            TableName={"SubjectiveList"}
                            width={900}
                            title={"新建主观题"}
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
