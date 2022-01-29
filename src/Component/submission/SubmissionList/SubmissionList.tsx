export {}
// import {withTranslation} from "react-i18next";
// import {Button, Card, Form, Input, Select, Space, Table} from "antd";
// import {SyncJudging} from "../SyncJudging";
// import RJudge from "../ReJudge";
// import cApi from "../../../Utils/API/c-api";
// import {ReloadOutlined} from "@ant-design/icons";
// import {RunningResultList, StateList, SubmissionMap} from "../../../Type/ISubmission";
// import TestCase from "../TestCase";
// import React from "react";
// import moment from "moment";
// import TableWithPagination from "../../common/Table/TableWithPagination";
// import TableWithSelection from "../../common/Table/TableWithSelection";
//
// const SubmissionList = (props: any) => {
//
//     const onFinish = () => {
//         const values = this.formRef.current?.getFieldsValue()
//         this.setState({
//             judgeResult: values.judgeResult,
//             problemCode: values.problemCode,
//             username: values.username
//         })
//     };
//
//     const onReset = () => {
//         this.formRef.current!.resetFields();
//         this.setState({
//             judgeResult: undefined,
//             problemCode: undefined,
//             username: undefined
//         })
//     };
//
//     const columnsAll = [
//         {
//             title: "ID",
//             dataIndex: "submissionId",
//             key: "submissionId",
//             render: (text: any, record: any) => {
//                 return <a onClick={() => {
//                     this.props.setNowExamId(this.props.examId)
//                     this.props.setTopSubmission(record.submissionId, {
//                         title: "",
//                         TimeLimit: record.timeLimit,
//                         MemoryLimit: record.memoryLimit,
//                         sumScore: record.sumScore,
//                         showScore: true
//                     })
//                     this.props.setSubmissionModalVis(true)
//                 }}>
//                     {text}
//                 </a>
//             }
//         },
//         {
//             title: "用户名",
//             dataIndex: "username",
//             key: "username"
//         },
//         {
//             title: "题目编号",
//             dataIndex: "problemCode",
//             key: "problemCode"
//         },
//         {
//             title: "题目名",
//             dataIndex: "problemTitle",
//             key: "problemTitle"
//         },
//         {
//             title: "结果",
//             dataIndex: "result",
//             key: "result",
//             render: (text: any, record: any) => {
//                 return <TestCase
//                     type={"text"}
//                     caseType={StateList.indexOf(SubmissionMap[text])}
//                     append={text === "-2" ? "(" + record.RunningStep + "/" + record.checkpointNum + ")" : ""}
//                 />
//             }
//         },
//         {
//             title: "得分",
//             dataIndex: "score",
//             key: "score",
//             render: (text: number, record: any) => {
//                 return Math.floor(text / record.sumScore * 100) + "%"
//             }
//         },
//         {
//             title: "评测模板",
//             dataIndex: "judgeTemplateTitle",
//             key: "judgeTemplateTitle"
//         },
//         {
//             title: "内存使用",
//             dataIndex: "usedMemory",
//             key: "usedMemory",
//             render: (text: any) => {
//                 return text + " KB"
//             }
//         },
//         {
//             title: "时间使用",
//             dataIndex: "usedTime",
//             key: "usedTime",
//             render: (text: any) => {
//                 return text + " ms"
//             }
//         },
//         {
//             title: "提交时间",
//             dataIndex: "submitTime",
//             key: "submitTime",
//             render: (text: any) => {
//                 return moment(text).fromNow();
//             }
//         }
//     ]
//
//     return (
//         <>
//             <Card
//                 title={
//                     <Space>
//                         提交记录
//                         <SyncJudging
//                             open={this.state.webSocketOpen}
//                             dataHandle={this.addCaseInfo}
//                             queryList={this.state.webSocketQueryList}/>
//                     </Space>
//
//                 }
//                 className={"Recent-submission"}
//                 extra={
//                     <Space>
//                         <RJudge
//                             API={cApi.rejudge}
//                             data={this.state.selectedRowsIndex}
//                             afterSuccess={() => {
//                                 this.setState({selectedRowsIndex: []})
//                                 this.updateList()
//                             }}
//                         />
//                         <Button
//                             icon={<ReloadOutlined/>}
//                             onClick={() => {
//                                 this.setState({refreshDisable: true})
//                                 this.updateList(true)
//                                 setTimeout(() => {
//                                     this.setState({refreshDisable: false})
//                                 }, 3000)
//                             }}
//                             disabled={this.state.refreshDisable}
//                         >
//                             刷新
//                         </Button>
//                     </Space>
//
//                 }
//             >
//                 <Form
//                     ref={this.formRef}
//                 >
//                     <Space size={30}>
//                         <Form.Item label={"用户名"} name={"username"}>
//                             <Input
//                                 onPressEnter={(e: any) => {
//                                     this.onFinish()
//                                 }}
//                                 allowClear
//                             />
//                         </Form.Item>
//                         <Form.Item label={"题目编号"} name={"problemCode"}>
//                             <Input
//                                 onPressEnter={(e: any) => {
//                                     this.onFinish()
//                                 }}
//                                 allowClear
//                             />
//                         </Form.Item>
//                         <Form.Item label={"评测结果"} name={"judgeResult"}>
//                             <Select onChange={this.onFinish} allowClear style={{width: 200}}>
//                                 {
//                                     RunningResultList.map((value) => {
//                                         return <Select.Option value={parseInt(value)}>
//                                             <TestCase type={"text"}
//                                                       caseType={StateList.indexOf(SubmissionMap[value])}/>
//                                         </Select.Option>
//                                     })
//                                 }
//                             </Select>
//                         </Form.Item>
//                     </Space>
//                     <Space style={{float: "right"}} size={20}>
//                         <Button type="primary" onClick={this.onFinish}>
//                             筛选
//                         </Button>
//                         <Button htmlType="button" onClick={this.onReset}>
//                             重置
//                         </Button>
//                     </Space>
//                 </Form>
//
//                 <TableWithSelection
//                     size={"small"}
//                     columns={columnsAll}
//                     dataSource={this.state.tableData}
//                     rowKey={"submissionId"}
//                     rowSelection={{
//                         onChange: (selectedRowKeys, selectedRows) => {
//                             this.setState({selectedRowsIndex: selectedRowKeys})
//                         },
//                         selectedRowKeys: this.state.selectedRowsIndex
//                     }}
//                 />
//             </Card>
//         </>
//     )
// }
//
// export default withTranslation()(SubmissionList)