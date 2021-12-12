import React, {Dispatch, useEffect, useRef, useState} from "react";
import {Button, Form, Select, Skeleton, Space} from "antd";
import ProTable, {ActionType, ProColumns} from "@ant-design/pro-table";
import {withTranslation} from "react-i18next";

import TextArea from "antd/lib/input/TextArea";
import Search from "antd/lib/input/Search";
import {connect} from "react-redux";
import {examUserType, ManageState} from "../../../Type/IManage";
import {groupSelection} from "../../../Type/Igroup";
import mApi from "../../../Utils/API/m-api";
import {QuestionCircleOutlined} from "@ant-design/icons"

const {Option} = Select;

// 新建 与 修改
export type problemGroupProType = "objective" | "program"
export type problemGroupUIMode = "easy" | "all"


const ExamMemberForm = (props: any) => {
    const formRef = props.getRef()     // 页面表单的操作引用

    const [ManageGroupInfo, setManageGroupInfo] = useState<groupSelection[]>(
        props.groupInfo != undefined ? props.groupInfo : []
    )
    const [ParticipatingGroupInfo, setParticipatingGroupInfo] = useState<groupSelection[]>(
        props.groupInfo != undefined ? props.groupInfo : []
    )


    function onSearch(type: "Manage" | "Participating", val: any) {
        mApi.queryGroupTitle({title: val}).then((resData) => {
            if (resData != null) {
                const data = resData as unknown as groupSelection[]
                if (type == "Manage") setManageGroupInfo(data)
                if (type == "Participating") setParticipatingGroupInfo(data)
            }
        })
    }

    return (
        <>
            <Skeleton active loading={!props.isDataLoad}>
                <Form
                    className={"exam-form"}
                    ref={formRef}
                    layout={"vertical"}
                    initialValues={props.initData}
                >
                    <Form.Item label={"管理组"} name={"ManageGroup"}
                               tooltip={{icon: <QuestionCircleOutlined/>, title: "设置一个管理组"}}
                    >
                        <Select
                            showSearch
                            placeholder="请查询并选择管理组"
                            onSearch={(value) => onSearch("Manage", value)}
                        >
                            {
                                ManageGroupInfo.map((value: groupSelection) => {
                                    return <Option value={value.groupId}>{value.groupId + ": " + value.title}</Option>
                                })
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item label={"考生组"} name={"ParticipatingGroup"}
                               tooltip={{icon: <QuestionCircleOutlined/>, title: "设置若干个考生组"}}
                    >
                        <Select
                            mode={"multiple"}
                            placeholder="请查询并选择考生组"
                            onSearch={(value) => onSearch("Participating", value)}
                        >
                            {
                                ParticipatingGroupInfo.map((value: groupSelection) => {
                                    return <Option value={value.groupId}>{value.groupId + ": " + value.title}</Option>
                                })
                            }
                        </Select>
                    </Form.Item>
                </Form>
            </Skeleton>
        </>
    );
}

const mapStateToProps = (state: any) => {
    const State: ManageState = state.ManageReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamMemberForm))
