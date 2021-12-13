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
import SelectGroup from "../../group/SelectGroup";

const {Option} = Select;

// 新建 与 修改
export type problemGroupProType = "objective" | "program"
export type problemGroupUIMode = "easy" | "all"


const ExamMemberForm = (props: any) => {
    const formRef = props.getRef()     // 页面表单的操作引用

    return (
        <>
            <Skeleton active loading={!props.isDataLoad}>
                <Form
                    className={"exam-form"}
                    ref={formRef}
                    layout={"vertical"}
                    initialValues={props.initData}
                >
                    <SelectGroup label={"管理组"} name={"ManageGroup"} groupInfo={props.groupInfo}/>
                    <SelectGroup mode={"multiple"} label={"考生组"} name={"ParticipatingGroup"}
                                 groupInfo={props.groupInfo}/>
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
