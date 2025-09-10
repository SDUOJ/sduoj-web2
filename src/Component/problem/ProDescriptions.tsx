import {Button, message, Modal, Switch} from "antd";
import React, {Dispatch, useState} from "react";
import {useTranslation} from "react-i18next";
import mApi from "Utils/API/m-api"
import {connect} from "react-redux";
import ModalFormUseForm from "../common/Form/ModalFormUseForm";
import TableWithAllData from "../common/Table/TableWithAllData";
import ItemTitle from "../common/Form/Item/ItemTitle";
import ItemSwitch from "../common/Form/Item/ItemSwitch";
import ItemEditor from "../common/Form/Item/ItemEditor";
import TableRowDeleteButton from "../common/Table/TableRowDeleteButton";

const ProDescriptions = (props: any) => {
    const { t } = useTranslation();
    const [vis, setVis] = useState<boolean>(false)
    const tableName = `ProDescriptions-${props.problemCode}`
    const [defaultDescriptionId, setDefaultDescriptionId] = useState(props.defaultDescriptionId)

    const DescriptionForm = (
        <>
            <ItemTitle/>
            <ItemSwitch
                name={"isPublic"}
                label={t('PublicStatus')}
                ck={t('Public')}
                unck={t('Private')}
            />
            <ItemEditor
                name={"markdownDescription"}
                label={t('ProblemDescription')}
            />
        </>
    )

    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => setVis(true)}> {t('ProblemDescriptions')} </Button>
            <Modal
                title={`${props.problemCode} ${props.title}`}
                onCancel={() => setVis(false)}
                visible={vis}
                destroyOnClose={true}
                width={1200}
                footer={
                    <>
                        <ModalFormUseForm
                            TableName={tableName}
                            width={1200}
                            title={`${props.problemCode} ${t('CreateDescription')}`}
                            type={"create"}
                            subForm={[{
                                component: DescriptionForm,
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
                    updateTrick={defaultDescriptionId}
                    name={tableName}
                    size={"small"}
                    columns={[
                        {title: "ID", dataIndex: "id"},
                        {title: t('Title'), dataIndex: "title"},
                        {
                            title: t('PublicStatus'), dataIndex: "isPublic", render: (text: any, row: any) => {
                                return (
                                    <Switch
                                        checked={text === 1}
                                        checkedChildren={t('Public')}
                                        unCheckedChildren={t('Private')}
                                        onChange={(checked, event) => {
                                            mApi.updateDescription({
                                                id: row.id,
                                                isPublic: checked ? 1 : 0
                                            }).then((value: any) => {
                                                props.addTableVersion(tableName);
                                            })
                                        }}
                                    />
                                )
                            }
                        },
                        {
                            title: t('DefaultDescription'), dataIndex: "id", render: (text: any) => {
                                // console.log(text, defaultDescriptionId, text === defaultDescriptionId)
                                return (
                                    <Switch
                                        checked={text === defaultDescriptionId}
                                        checkedChildren={t('YesSimple')}
                                        unCheckedChildren={t('NoSimple')}
                                        onChange={(checked, event) => {
                                            if(defaultDescriptionId !== text){
                                                mApi.updateProblemInfo({
                                                    problemCode: props.problemCode,
                                                    defaultDescriptionId: parseInt(text)
                                                }).then((res) => {
                                                    message.success(t('Success'))
                                                    setDefaultDescriptionId(text)
                                                })
                                            }
                                        }}
                                    />
                                )
                            }
                        },
                        {title: t('Vote'), dataIndex: "voteNum"},
                        {title: t('Author'), dataIndex: "username"},
                        {
                            title: t('operator'), render: (text: any, row: any) => {
                                return <>
                                    <ModalFormUseForm
                                        TableName={tableName}
                                        width={1200}
                                        title={`${props.problemCode} - ${row.title}`}
                                        type={"update"}
                                        dataLoader={() => {
                                            return mApi.getProblemDescription({descriptionId: row.id})
                                        }}
                                        subForm={[{
                                            component: DescriptionForm,
                                            label: ""
                                        }]}
                                        dataSubmitter={(data: any) => {
                                            data.isPublic = data.isPublic ? 1 : 0
                                            return mApi.updateDescription({...data, id: row.id})
                                        }}
                                    />
                                    <TableRowDeleteButton
                                        type={"inline"}
                                        name={tableName}
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
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProDescriptions)
