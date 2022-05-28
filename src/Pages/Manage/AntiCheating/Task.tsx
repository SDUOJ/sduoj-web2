import ImportSubmission from "../../../Component/antiCheating/ImportSubmission";
import UserFormProfile from "../../../Component/user/Form/UserFormProfile";
import UserFormAdditional from "../../../Component/user/Form/UserFormAdditional";
import mApi from "../../../Utils/API/m-api";
import ModalFormUseForm from "../../../Component/common/Form/ModalFormUseForm";
import React from "react";
import ItemText from "../../../Component/common/Form/Item/ItemText";
import ItemSwitch from "../../../Component/common/Form/Item/ItemSwitch";
import {Checkbox, Form, Select} from "antd";
import TaskSubmission from "../../../Component/antiCheating/TaskSubmission";

const Task = (props: any) => {
    return (
        <>
            <ImportSubmission/>
            <br/>
            <br/>
            <TaskSubmission/>
            <br/>
            <br/>
            <ModalFormUseForm
                TableName={"AntiCheatingTaskList"}
                width={600}
                title={"新建查重任务"}
                type={"create"}
                subForm={[
                    {
                        component: <>
                            <ItemText name={"title"} label={"标题"}/>
                            <ItemText name={"description"} label={"描述"}/>
                            <ItemSwitch name={"isPublic"} label={"是否公开"} ck={"是"} unck={"否"}/>
                            <ItemText name={"simRate"} label={"查重率"}/>
                            <Form.Item name={"codesimCoreID"} label={"查重核心"}>
                                <Checkbox.Group options={[
                                    {label: "JPlag", value: "1"},
                                    {label: "Winnowing", value: "2"},
                                    {label: "Needle", value: "3"},
                                ]}/>
                            </Form.Item>
                        </>,
                        label: ""
                    }
                ]}
                dataSubmitter={(value: any) => {
                    return
                }}
            />
        </>
    )
}

export default Task