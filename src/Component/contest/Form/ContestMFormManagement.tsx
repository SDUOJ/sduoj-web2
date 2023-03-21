import {withTranslation} from "react-i18next";
import {Form, InputNumber, Table} from "antd";
import "Assert/css/MContest.css"
import ItemSelectGroup from "../../group/Form/Item/ItemSelectGroup";
import React from "react";
import TextArea from "antd/es/input/TextArea";
import ItemSwitch01 from "../../common/Form/Item/ItemSwitch01";

const ContestMFormManagement = (props: any) => {
    return (
        <div style={{width: 1100}}>
            <Form.Item label={"封榜时间(分钟)"} name={["features", "frozenTime"]}
                       initialValue={0} required help={"比赛的最后多少分钟封榜"}>
                <InputNumber/>
            </Form.Item>
            <Table
                className={"ContestMFormManagementTable"}
                title={() => {
                    return "比赛参数";
                }}
                columns={[
                    {title: "", dataIndex: "name"},
                    {
                        title: "显示他人提交",
                        render: (text: any, rows: any) => {
                            return (
                                <ItemSwitch01
                                    InitValue={1}
                                    name={["features", rows.type, "displayPeerSubmission"]}
                                    ck={"显示"}
                                    unck={"不显示"}
                                />
                            )
                        }
                    },
                    {
                        title: "显示排行榜",
                        render: (text: any, rows: any) => {
                            return (
                                <ItemSwitch01
                                    InitValue={1}
                                    name={["features", rows.type, "displayRank"]}
                                    ck={"显示"}
                                    unck={"不显示"}
                                />
                            )
                        }
                    },
                    {
                        title: "显示评测分数",
                        render: (text: any, rows: any) => {
                            return (
                                <ItemSwitch01
                                    InitValue={1}
                                    name={["features", rows.type, "displayJudgeScore"]}
                                    ck={"显示"}
                                    unck={"不显示"}
                                />
                            )
                        }
                    },
                    {
                        title: "显示测试点信息",
                        render: (text: any, rows: any) => {
                            return (
                                <ItemSwitch01
                                    InitValue={1}
                                    name={["features", rows.type, "displayCheckpointResult"]}
                                    ck={"显示"}
                                    unck={"不显示"}
                                />
                            )
                        }
                    },
                    {
                        title: "允许提交",
                        render: (text: any, rows: any) => {
                            return (
                                <ItemSwitch01
                                    InitValue={1}
                                    name={["features", rows.type, "allowToSubmit"]}
                                    ck={"允许"}
                                    unck={"不允许"}
                                />
                            )
                        }
                    },
                ]}
                dataSource={[{name: "比赛进行中", type: "contestRunning"}, {name: "比赛结束后", type: "contestEnd"}]}
                pagination={false}
                size={"small"}
            />
            <Form.Item name={"participants"} label={"参赛者"} help={"使用 TAB '\\t', 空格 ' ', 换行 '\\n' 或 逗号 ',' 分隔用户名"}>
                <TextArea rows={6}/>
            </Form.Item>
            <Form.Item name={"unofficialParticipants"} label={"非正式参赛者"}
                       help={"使用 TAB '\\t', 空格 ' ', 换行 '\\n' 或 逗号 ',' 分隔用户名"}>
                <TextArea rows={6}/>
            </Form.Item>
            <ItemSelectGroup name={"groupId"} label={"管理组"} formName={"ContestForm"}/>
            <ItemSelectGroup name={"participatingGroups"} label={"参赛组"} mode={"multiple"}
                             help={"参赛组中的参赛者不需要输入密码"} formName={"ContestForm"}/>
        </div>
    )
}

export default withTranslation()(ContestMFormManagement)
