import {withTranslation} from "react-i18next";
import {Button, Card, Modal, Space} from "antd";
import TableWithAllData from "../common/Table/TableWithAllData";
import React, {useState} from "react";
import ModalFormUseForm from "../common/Form/ModalFormUseForm";
import TableRowDeleteButton from "../common/Table/TableRowDeleteButton";
import ProblemSetGroup from "./Form/ProblemSetGroup";

const MGroupInfo = (props: any) => {

    const [vis, setVis] = useState(false)
    const tableName = "ProblemSet-" + props.problemSetId + "-Group"

    const ProblemSetGroupForm: any = [
        {
            component: <ProblemSetGroup/>,
            label: ""
        }
    ]

    return (
        <>
            <Button type={"link"} onClick={() => setVis(true)}>题组</Button>
            <Modal
                open={vis}
                onCancel={() => setVis(false)}
                width={1200}
                destroyOnHidden={true}
            >
                <Card
                    title={`题单 ${props.problemSetTitle} 的题组`}
                    size={"small"}
                    bordered={false}
                    extra={
                        <Space>
                            <ModalFormUseForm
                                TableName={"ProblemSetList"}
                                width={900}
                                title={"新建题组"}
                                type={"create"}
                                subForm={ProblemSetGroupForm}
                                dataSubmitter={(value: any) => {
                                    // return mApi.createProblemSetGroup(value)
                                }}
                            />
                        </Space>
                    }>
                    <TableWithAllData
                        useDrag={true}
                        name={tableName}
                        size={"small"}
                        columns={[
                            {title: "ID", dataIndex: "id"},
                            {title: "题目", dataIndex: "title"},

                            {
                                title: "操作", render: (text: any, row: any) => {
                                    return <>
                                        <ModalFormUseForm
                                            TableName={tableName}
                                            width={1200}
                                            title={`${props.problemCode} - ${row.title}`}
                                            type={"update"}
                                            dataLoader={() => {
                                                // return mApi.getProblemSetGroupInfo({descriptionId: row.id})
                                            }}
                                            subForm={ProblemSetGroupForm}
                                            dataSubmitter={(data: any) => {
                                                // return mApi.updateProblemSetGroup({...data, id: row.id})
                                            }}
                                        />
                                        <TableRowDeleteButton
                                            type={"inline"}
                                            name={tableName}
                                            API={() => {
                                                // return mApi.deleteProblemSetGroup({id: row.id})
                                            }}
                                        />
                                    </>
                                }
                            },
                        ]}
                        API={() => {
                            // return mApi.getProblemSetGroupList({problemCode: props.problemCode})
                        }}
                        pagination={false}
                    />
                </Card>
            </Modal>
        </>
    )
}

export default withTranslation()(MGroupInfo)
