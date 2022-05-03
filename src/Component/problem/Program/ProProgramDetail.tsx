import {withTranslation} from "react-i18next";
import {Card, Table} from "antd";
import {getJudgeStr} from "./ProProgram";
import React, {Dispatch} from "react";
import {connect} from "react-redux";


const ProProgramDetail = (props: any) => {

    const problemInfo = props.problemInfo
    return (
        <>
            <Card title={"题目详情"} className={"smallBodyPaddingTop"}>
                <Table
                    size={"small"}
                    pagination={false}
                    dataSource={[
                        {key: props.t("TimeLimit"), value: problemInfo?.timeLimit + " ms"},
                        {key: props.t("MemoryLimit"), value: Math.floor(problemInfo?.memoryLimit / 1024) + " MB"},
                        {key: "评测模板", value: getJudgeStr(problemInfo?.judgeTemplates)},
                        {key: "来源", value: problemInfo?.source},
                    ]}
                    showHeader={false}
                    columns={[
                        {dataIndex: "key"},
                        {dataIndex: "value"}
                    ]}
                />
            </Card>
        </>
    )
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProProgramDetail))