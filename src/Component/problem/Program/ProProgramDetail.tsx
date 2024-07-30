import {withTranslation} from "react-i18next";
import {Card, Table} from "antd";
import {getJudgeStr} from "./ProProgram";
import React, {Dispatch} from "react";
import {connect} from "react-redux";
import {isValueEmpty} from "../../../Utils/empty";


const ProProgramDetail = (props: any) => {

    const problemInfo = props.problemInfo
    return (
        <>
            <Card title={props.t("problemDetails")} className={"smallBodyPaddingTop"}>
                <Table
                    size={"small"}
                    pagination={false}
                    dataSource={[
                        {
                            key: props.t("TimeLimit"),
                            value: isValueEmpty(problemInfo?.timeLimit) ? "" :
                                problemInfo?.timeLimit + " ms",
                            color: 'rgb(158,10,17)'
                        },
                        {
                            key: props.t("MemoryLimit"),
                            value: isValueEmpty(problemInfo?.memoryLimit) ? "" :
                                Math.floor(problemInfo?.memoryLimit / 1024) + " MB",
                            color: 'rgb(158,10,17)'
                        },
                        {
                            key: props.t("template"),
                            value: getJudgeStr(problemInfo?.judgeTemplates)
                        },
                        {
                            key: props.t("source"),
                            value: problemInfo?.source
                        },
                    ]}
                    showHeader={false}
                    columns={[
                        {
                            dataIndex: "key",
                            width: "115px"
                        },
                        {
                            dataIndex: "value",
                            render: (text, record) => {
                                return (
                                    <span style={{color: record.color}}>{text}</span>
                                )
                            }
                        }
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
