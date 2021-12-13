import React, {Dispatch, useEffect, useRef, useState} from "react";
import {Button, Form, Select, Skeleton, Space} from "antd";
import ProTable, {ActionType, ProColumns} from "@ant-design/pro-table";
import {withTranslation} from "react-i18next";

import TextArea from "antd/lib/input/TextArea";
import Search from "antd/lib/input/Search";
import {connect} from "react-redux";
import {examUserType, ManageState} from "Type/IManage";
import {groupSelection} from "Type/Igroup";
import mApi from "Utils/API/m-api";
import {QuestionCircleOutlined} from "@ant-design/icons"

const {Option} = Select;


const SelectGroup = (props: any) => {

    const [GroupInfo, setGroupInfo] = useState<groupSelection[]>(
        props.groupInfo != undefined ? props.groupInfo : []
    )

    function onSearch(val: any) {
        mApi.queryGroupTitle({title: val}).then((resData: any) => {
            if (resData != null) {
                const data = resData as unknown as groupSelection[]
                setGroupInfo(data)
            }
        })
    }

    return (
        <>
            <Form.Item label={props.label} name={props.name}>
                <Select
                    mode={props.mode} // "multiple"
                    showSearch
                    placeholder="请查询并选择组"
                    onSearch={(value) => onSearch(value)}
                >
                    {
                        GroupInfo.map((value: groupSelection) => {
                            return <Option value={value.groupId}>{value.groupId + ": " + value.title}</Option>
                        })
                    }
                </Select>
            </Form.Item>

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
)(withTranslation()(SelectGroup))
