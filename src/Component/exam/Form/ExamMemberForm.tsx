import React, {Dispatch} from "react";
import {Form, Skeleton} from "antd";
import {withTranslation} from "react-i18next";

import {connect} from "react-redux";
import {ManageState} from "../../../Type/IManage";

import SelectGroup from "../../group/SelectGroup";


// 新建 与 修改
export type problemGroupProType = "objective" | "program"


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
