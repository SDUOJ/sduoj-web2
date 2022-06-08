import React, {Dispatch, useEffect, useState} from "react";
import {Form, Select} from "antd";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {ManageState} from "Type/IManage";
import {groupSelection} from "Type/Igroup";
import mApi from "Utils/API/m-api";

const {Option} = Select;


const ItemSelectGroup = (props: any) => {

    const [GroupInfo, setGroupInfo] = useState<groupSelection[]>(
        props.groupInfo !== undefined ? props.groupInfo : []
    )

    function onSearch(val: any) {
        mApi.queryGroupTitle({title: val}).then((resData: any) => {
            if (resData !== null) {
                const data = resData as unknown as groupSelection[]
                setGroupInfo(data)
            }
        })
    }

    useEffect(()=>{
        if(props.formName !== undefined){
            setGroupInfo(props.manageInitData[props.formName]?.managerGroupDTOList ?? [])
        }
    }, [props.manageInitData])

    return (
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
    );
}

const mapStateToProps = (state: any) => {
    const State: ManageState = state.ManageReducer
    return {manageInitData: State.manageInitData}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ItemSelectGroup))
