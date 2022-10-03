import {Card, Col, Form, Input, Row, Select, Space} from "antd";
import MApi from "../../Utils/API/m-api";
import {withRouter} from "react-router-dom";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {withTranslation} from "react-i18next";
import mApi from "Utils/API/m-api"
import {TimeDiff, unix2Time} from "../../Utils/Time";
import ItemTitle from "../../Component/common/Form/Item/ItemTitle";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import ItemTimeRange from "../../Component/common/Form/Item/ItemTimeRange";
import React from "react";
import ItemSwitch01 from "../../Component/common/Form/Item/ItemSwitch01";
import MGroupInfo from "../../Component/problemSet/MGroupInfo";

const MProblemSet = (props: any) => {
    const pathArray = props.location.pathname.split("/")
    const type = pathArray[pathArray.length - 1]

    const ProblemSetForm = [
        {
            component: <>
                <ItemTitle name={"problemSetTitle"}/>
                <Form.Item hidden name={"type"} initialValue={type}>
                    <Input/>
                </Form.Item>
                <Row gutter={24}>
                   <Col span={12}>
                       <ItemText name={"tag"} label={"标签"} help={"例如：作业，实验，练习"}/>
                   </Col>
                   <Col span={12}>
                       <ItemTimeRange label="起止时间" required={true}/>
                   </Col>
                </Row>
                <Row gutter={24}>
                    {type === "exam" && (
                        <Col span={6}>
                            <ItemSwitch01 label={"是否开启考试报告"} ck={"是"} unck={"否"} required={true}/>
                        </Col>
                    )}
                    <Col span={6}>
                        <ItemSwitch01 label={"是否显示分值"} ck={"是"} unck={"否"} required={true}/>
                    </Col>
                    <Col span={6}>
                        <ItemSwitch01 label={"是否显示得分"} ck={"是"} unck={"否"} required={true}/>
                    </Col>
                </Row>
                <ItemSelectGroup
                    label={"管理组"}
                    name={"groupId"}
                    formName={"ProblemSetForm"}
                />
                <ItemSelectGroup
                    label={"作答组"}
                    name={"participatingGroups"}
                    formName={"ProblemSetForm"}
                    mode={"multiple"}/>
                <ItemEditor name={"description"} label={"题单描述"}/>
            </>,
            label: "基本信息"
        }
    ]


    const colData: any[] = [
        {
            title: "ID",
            dataIndex: "problemSetId",
            width: 64,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: "标题",
            dataIndex: "problemSetTitle",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: "标签",
            dataIndex: "tag",
            width: "auto",
            responsive: ["lg", "sm"],
        },
        {
            title: props.t("StartTime"),
            dataIndex: "gmtStart",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: "持续时间",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string, rows: any) => {
                return TimeDiff(rows.gmtStart, rows.gmtEnd)
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
                            TableName={"ProblemSetList"}
                            width={900}
                            title={"编辑(" + rows.code + ")"}
                            type={"update"}
                            subForm={ProblemSetForm}
                            formName={"SubjectiveForm"}
                            updateAppendProps={{problemSetId: rows.problemSetId}}
                            dataLoader={async () => {
                                return mApi.getProblemSetInfo({problemSetId: rows.problemSetId}).then((value: any) => {
                                    return Promise.resolve(value)
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                return mApi.updateProblemSet(value)
                            }}
                        />
                        <ModalFormUseForm
                            TableName={"ProblemSetList"}
                            width={900}
                            title={"新建题单(克隆自" + rows.problemSetTitle + ")"}
                            type={"fork"}
                            subForm={ProblemSetForm}
                            formName={"SubjectiveForm"}
                            dataLoader={async () => {
                                return mApi.getSubjectiveInfo({problemSetId: rows.problemSetId}).then((value: any) => {
                                    return Promise.resolve(value)
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                return mApi.createProblemSet(value)
                            }}
                        />
                        <MGroupInfo problemSetId={rows.problemSetId} problemSetTitle={rows.problemSetTitle}/>
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
                            TableName={"ProblemSetList"}
                            width={900}
                            title={"新建题单"}
                            type={"create"}
                            subForm={ProblemSetForm}
                            dataSubmitter={(value: any) => {
                                return mApi.createSubjective(value)
                            }}
                        />
                    </Space>
                }
            >
                <TableWithPagination
                    name={"ProblemSetList"}
                    columns={colData}
                    API={MApi.getProblemSetList}
                    size={"small"}
                />
            </Card>
        </div>
    )
}

export default withTranslation()(withRouter(MProblemSet))