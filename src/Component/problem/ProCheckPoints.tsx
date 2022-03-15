import {Button, Form, Input, message, Modal, Switch, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import mApi from "Utils/API/m-api"
import {connect} from "react-redux";
import ModalFormUseForm from "../common/Form/ModalFormUseForm";
import {TableState} from "../../Type/ITable";
import TableWithAllData from "../common/Table/TableWithAllData";
import ItemTitle from "../common/Form/Item/ItemTitle";
import ItemSwitch from "../common/Form/Item/ItemSwitch";
import ItemText from "../common/Form/Item/ItemText";
import ItemSelectGroup from "../group/Form/Item/ItemSelectGroup";
import ItemEditor from "../common/Form/Item/ItemEditor";
import TableRowDeleteButton from "../common/Table/TableRowDeleteButton";

const ProCheckPoints = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)
    const name = `ProCheckPoints-${props.problemCode}`

    const CheckPointsForm = (
        <>
            <ItemTitle/>
            <ItemSwitch
                name={"isPublic"}
                label={"公开性"}
                ck={"公开"}
                unck={"不公开"}
            />
            <ItemEditor
                name={"markdownDescription"}
                label={"题面"}
            />
        </>
    )

    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => setVis(true)}> 测试点 </Button>
            <Modal
                title={`${props.problemCode} ${props.title}`}
                onCancel={() => setVis(false)}
                visible={vis}
                destroyOnClose={true}
                width={1050}
                footer={
                    <>
                        <ModalFormUseForm
                            TableName={name}
                            width={1200}
                            title={`${props.problemCode} 新建描述`}
                            type={"create"}
                            subForm={[{
                                component: <></>,
                                label: ""
                            }]}
                            dataSubmitter={(data: any) => {
                                data.isPublic = data.isPublic ? 1 : 0
                                return mApi.createDescription({...data, problemCode: props.problemCode})
                            }}
                        />
                    </>
                }
            >
                <TableWithAllData
                    name={name}
                    size={"small"}
                    columns={[
                        {title: "ID", dataIndex: "id"},
                        {title: "题目", dataIndex: "title"},
                        {
                            title: "公开性", dataIndex: "isPublic", render: (text: any, row: any) => {
                                return (
                                    <Switch
                                        checked={text === 1}
                                        checkedChildren={"公开"}
                                        unCheckedChildren={"不公开"}
                                        onChange={(checked, event) => {
                                            mApi.updateDescription({
                                                id: row.id,
                                                isPublic: checked ? 1 : 0
                                            }).then((value: any) => {
                                                props.addTableVersion(name);
                                            })
                                        }}
                                    />
                                )
                            }
                        },
                        {
                            title: "默认题面", dataIndex: "id", render: (text: any) => {
                                return (
                                    <Switch
                                        checked={text === props.defaultDescriptionId}
                                        checkedChildren={"是"}
                                        unCheckedChildren={"否"}
                                        onChange={(checked, event) => {
                                            mApi.updateProblemInfo({
                                                problemCode: props.problemCode,
                                                defaultDescriptionId: text
                                            }).then(() => {
                                                message.success("成功")
                                                props.addTableVersion("ProblemList");
                                            })
                                        }}
                                    />
                                )
                            }
                        },
                        {title: "投票", dataIndex: "voteNum"},
                        {title: "作者", dataIndex: "username"},
                        {
                            title: "操作", render: (text: any, row: any) => {
                                return <>
                                    <ModalFormUseForm
                                        TableName={name}
                                        width={1200}
                                        title={`${props.problemCode} - ${row.title}`}
                                        type={"update"}
                                        dataLoader={() => {
                                            return mApi.getProblemDescription({descriptionId: row.id})
                                        }}
                                        subForm={[{
                                            component: <></>,
                                            label: ""
                                        }]}
                                        dataSubmitter={(data: any) => {
                                            data.isPublic = data.isPublic ? 1 : 0
                                            return mApi.updateDescription({...data, id: row.id})
                                        }}
                                    />
                                    <TableRowDeleteButton
                                        type={"inline"}
                                        name={name}
                                        API={() => {
                                            return mApi.deleteDescription({id: row.id})
                                        }}
                                    />
                                </>
                            }
                        },
                    ]}
                    API={() => {
                        return mApi.getProblemDescriptionList({problemCode: props.problemCode})
                    }}
                    pagination={false}
                />
            </Modal>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    return {
        tableData: TState.tableData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProCheckPoints)