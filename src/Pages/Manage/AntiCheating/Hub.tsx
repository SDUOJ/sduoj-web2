import {Card, Space} from "antd";
import ButtonWithSelection from "../../../Component/common/Table/ButtonWithSelection";
import judgeAuth from "../../../Utils/judgeAhtu";
import MApi from "../../../Utils/API/m-api";
import mApi from "../../../Utils/API/m-api";
import ModalFormUseForm from "../../../Component/common/Form/ModalFormUseForm";
import UserFormProfile from "../../../Component/user/Form/UserFormProfile";
import UserFormAdditional from "../../../Component/user/Form/UserFormAdditional";
import React from "react";
import {withTranslation} from "react-i18next";

const Hub = (props: any) => {
    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={false}
                title={props.t("代码仓库列表")}
                extra={
                    <Space>
                        {judgeAuth(props.roles, ['admin']) && (
                            <ButtonWithSelection
                                type={"delete"}
                                ButtonText={"批量删除"}
                                rowKey={"userId"}
                                deleteKey={"username"}
                                tableName={"UserList"}
                                delAPI={(data: any)=>{
                                    return MApi.deleteUsers(data)
                                }}
                            />
                        )}
                        <ModalFormUseForm
                            TableName={"UserList"}
                            width={600}
                            title={"新建用户"}
                            type={"create"}
                            subForm={[
                                {
                                    component: <UserFormProfile editUsername={true} needPassword={true}/>,
                                    label: "基本信息"
                                },
                                {component: <UserFormAdditional/>, label: "附加信息"},
                            ]}
                            dataSubmitter={(value: any) => {
                                value.features.banThirdParty = (value.features.banThirdParty ? 1 : 0)
                                value.features.banEmailUpdate = (value.features.banEmailUpdate ? 1 : 0)
                                return mApi.addUsers([value])
                            }}
                        />
                    </Space>
                }
            >
                {/*<TableWithSelection*/}
                {/*    name={"UserList"}*/}
                {/*    search={true}*/}
                {/*    columns={[]}*/}
                {/*    API={async ()=>{}}*/}
                {/*    size={"small"}*/}
                {/*    rowKey={"userId"}*/}
                {/*/>*/}
            </Card>
        </div>
    )
}

export default withTranslation()(Hub)
