import LoginCheck from "../../Component/common/LoginCheck";
import {Card, Space} from "antd";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import React, {Dispatch} from "react";
import judgeAuth from "../../Utils/judgeAhtu";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import extApi from "../../Utils/API/ext-api";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {unix2Time} from "../../Utils/Time";
import {withRouter} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {UrlPrefix} from "../../Config/constValue";

const ExtHws = (props: any) => {
    const {t} = useTranslation()

    let form = (
        <>
            <ItemText name={"name"} label={t("CollectName")}/>
            <ItemSelectGroup name={"groupId"} label={t("SubmitUserGroup")}/>
            <ItemSelectGroup name={"manageGroupId"} label={t("ManageGroup")}/>
            <ItemEditor name={"description"} label={t("CollectDescription")}/>
        </>
    )
    let colData: any[] = [
        {
            title: "ID",
            dataIndex: "cid",
            width: 50,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: t("CollectName"),
            dataIndex: "name",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
            render: (text: string, rows: any) => {
                return <>
                    <a style={{color: "black"}} onClick={() => {
                        props.history.push(UrlPrefix + "/hws/" + rows.cid)
                    }}>{text}</a>
                </>

            }
        },
        {
            title: t("CreateTime"),
            dataIndex: "create_time",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: t("Creator"),
            dataIndex: "username",
            width: "auto",
            responsive: ["lg"],
        }
    ]
    if (judgeAuth(props.roles, ["admin"])) {
        colData.push({
            title: t("operator"),
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        <ModalFormUseForm
                            TableName={"Ext-hwsCourseList"}
                            width={1200}
                            title={t("EditWithName", {name: rows.name})}
                            type={"update"}
                            subForm={[{component: form, label: ""}]}
                            formName={"Ext-hwsCourseList-Form"}
                            updateAppendProps={{cid: rows.cid}}
                            initData={rows}
                            dataSubmitter={(value: any) => {
                                return extApi.editCourse(value)
                            }}
                        />
                    </Space>

                )
            }
        })
    }
    return (
        <>
            <LoginCheck jump={true}/>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <Card title={t("FileSubmitComponent")} extra={
                        <>
                            {judgeAuth(props.roles, ["admin"]) && (
                                <ModalFormUseForm
                                    TableName={"Ext-hwsCourseList"}
                                    width={1200}
                                    title={t("NewCollect")}
                                    type={"create"}
                                    subForm={[{component: form, label: ""}]}
                                    dataSubmitter={(value: any) => {
                                        return extApi.createCourse(value)
                                    }}
                                />
                            )}
                        </>
                    }>
                        <TableWithPagination
                            name={"Ext-hwsCourseList"}
                            columns={colData}
                            API={extApi.getCourseList}
                            size={"small"}
                        />
                    </Card>
                </div>
            </div>
        </>
    )
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer

    return {
        username: UState.userInfo?.username,
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExtHws))
