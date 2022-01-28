import {TranslationProps, WithTranslation, withTranslation} from "react-i18next";
import Title from "antd/lib/typography/Title";
import {Button, Modal, Space} from "antd";
import Submit from "../submission/Submit";
import eApi from "../../Utils/API/e-api";
import RecentSubmission from "../submission/RecentSubmission";
import React, {useState} from "react";
import {JudgeTemplateAllType} from "../../Type/IProblem";

interface ProProgramProps {
    problemTitle: string       // 题目标题

    timeLimit: number
    memoryLimit: number
    source: string

    judgeTemplates: JudgeTemplateAllType[]

    SubmitAPI: any
    SubmitProps: any
    LeftSubmitCount: number

}

const ProProgram = (props: ProProgramProps & WithTranslation) => {

    const [recentSubmissionVis, setRecentSubmissionVis] = useState<boolean>(false)

    const ProgramHeader = (
        <div style={{textAlign: "center"}}>
            <Title level={2}>{props.problemTitle}</Title>
            <div>
                <Space style={{fontSize: "16px"}} size={30}>
                    <div>
                        <span style={{fontWeight: "bold"}}>
                            {props.t("TimeLimit")}
                        </span>
                        : {props.timeLimit} ms
                    </div>
                    <div>
                            <span style={{fontWeight: "bold"}}>
                                {props.t("MemoryLimit")}
                            </span>
                        : {props.memoryLimit / 1024} MB
                    </div>
                </Space>
            </div>
            <div style={{marginTop: "10px"}}>
                <Space size={25}>
                    <Submit
                        API={props.SubmitAPI}
                        data={props.SubmitProps}
                        title={props.problemTitle}
                        LeftSubmitCount={props.LeftSubmitCount}
                        TopSubmissionInfo={{
                            title: props.problemTitle,
                            TimeLimit: props.timeLimit,
                            MemoryLimit: props.memoryLimit,
                            // sumScore: this.props.sumScore,
                            // showScore: this.props.isSubmissionScoreVisible
                        }}
                        JudgeTemplates={props.judgeTemplates}
                    />

                    <Button
                        type={"default"}
                        onClick={() => {
                            setRecentSubmissionVis(true)
                        }}
                    >
                        记录
                    </Button>
                    <Modal
                        width={1250}
                        visible={recentSubmissionVis}
                        footer={false}
                        onCancel={() => {
                            setRecentSubmissionVis(false)
                        }}
                    >
                        {/*<RecentSubmission pageSize={20} getSubmissionList={this.getSubmissionList}/>*/}
                    </Modal>
                </Space>
            </div>
        </div>
    )
    return (
        <>

        </>
    )
}

export default withTranslation()(ProProgram)