import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Card, Col, Form, Input, Row, Space} from "antd";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import mApi from "../../Utils/API/m-api";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import MApi from "../../Utils/API/m-api";
import React from "react";
import ItemTitle from "../../Component/common/Form/Item/ItemTitle";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemTimeRange from "../../Component/common/Form/Item/ItemTimeRange";
import ItemSwitch01 from "../../Component/common/Form/Item/ItemSwitch01";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import MGroupInfo from "../../Component/problemSet/MGroupInfo";
import {Radio} from 'antd';
import ProblemListInGroup from "../../Component/problemSet/problemGroup/ProblemListInGroup";
import groupSubmit from "../../Component/problemSet/dataConvert/groupSubmit";
import groupGet from "../../Component/problemSet/dataConvert/groupGet";

const MProblemGroup = (props: any) => {

    const base = (edit: boolean) => <>
        <ItemTitle name={"name"}/>
        <Form.Item name={"type"} label={props.t("ProblemType")} required>
            <Radio.Group disabled={edit}>
                <Radio value={0}>{props.t("ObjectiveQuestions")}</Radio>
                <Radio value={1}>{props.t("SubjectiveQuestions")}</Radio>
                <Radio value={2}>{props.t("ProgrammingQuestions")}</Radio>
            </Radio.Group>
        </Form.Item>
        <ItemSelectGroup
            label={props.t("ManagementGroup")}
            name={"manageGroupId"}
            formName={"ProblemGroupForm"}
        />
    </>

    const ProblemGroupForm = [
        {
            component: base(false),
            label: props.t("BasicInformation")
        }
    ]

    const ProblemGroupEditForm = (type: number, gid: any) => [
        {
            component: <>
                {base(true)}
                <ProblemListInGroup type={type} gid={gid}/>
            </>,
            label: props.t("ProblemList")
        }
    ]


    const colData: any[] = [
        {
            title: "ID",
            dataIndex: "gid",
            width: 64,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: props.t("title"),
            dataIndex: "name",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: props.t("CreateTime"),
            dataIndex: "create_time",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: props.t("QuestionType"),
            dataIndex: "type",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: any, rows: any) => {
                if (text === 0)
                    return props.t("ObjectiveQuestions")
                else if (text === 1)
                    return props.t("SubjectiveQuestions")
                else if (text === 2)
                    return props.t("ProgrammingQuestions")
            }
        },
        {
            title: props.t("Owner"),
            dataIndex: "username",
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
                            TableName={"ProblemGroupList"}
                            width={1200}
                            title={"编辑(" + rows.name + ")"}
                            type={"update"}
                            subForm={ProblemGroupEditForm(rows.type, rows.gid)}
                            formName={"ProblemGroupForm"}
                            updateAppendProps={{gid: rows.gid}}
                            dataLoader={async () => {
                                return mApi.getProblemGroupInfo({gid: rows.gid}).then((value: any) => {
                                    return Promise.resolve(groupGet(value))
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                return mApi.editProblemGroup(groupSubmit(value))
                            }}
                        />
                        <ModalFormUseForm
                            TableName={"ProblemGroupList"}
                            width={1200}
                            title={"新建题组(克隆自" + rows.name + ")"}
                            type={"fork"}
                            subForm={ProblemGroupForm}
                            formName={"ProblemGroupForm"}
                            dataLoader={async () => {
                                return mApi.getProblemGroupInfo({gid: rows.gid}).then((value: any) => {
                                    return Promise.resolve(groupGet(value))
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                value.problemInfo = []
                                return mApi.createProblemGroup(value)
                            }}
                        />

                    </Space>
                )
            }
        }
    ]

    return (
        <>
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card
                    size={"small"}
                    bordered={false}
                    title={props.t("ProblemGroupList")}
                    extra={
                        <Space>
                            <ModalFormUseForm
                                TableName={"ProblemGroupList"}
                                width={1200}
                                title={"新建题组"}
                                type={"create"}
                                subForm={ProblemGroupForm}
                                dataSubmitter={(value: any) => {
                                    value.problemInfo = []
                                    return mApi.createProblemGroup(value)
                                }}
                            />
                        </Space>
                    }
                >
                    <TableWithPagination
                        name={"ProblemGroupList"}
                        columns={colData}
                        API={MApi.getProblemGroupList}
                        size={"small"}
                    />
                </Card>
            </div>
        </>
    )
}

export default withTranslation()(withRouter(MProblemGroup))
