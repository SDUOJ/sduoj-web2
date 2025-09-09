import {RunningResultType} from "./ISubmission";
import {examID} from "./types";
import React from "react";

export type ProType = "Program" | "SingleChoice" | "MultipleChoice" | "FillInTheBlank" | "Subjective" | "TrueOrFalse"

export const ProNameMap: { [key: string]: string } = {
    "Program": "编程题",
    "FillInTheBlank": "填空题",
    "Subjective": "主观题",
    "SingleChoice": "单选题",
    "MultipleChoice": "多选题",
    "TrueOrFalse": "判断题"
}


// 单选题状态（选择，排除，初始）
export type ChoiceState = "used" | "unused" | "init"

export interface TestCase {
    input: string       // 输入数据
    output: string      // 输出数据
}

export interface JudgeTemplate {
    name: string            // 名称
    tid: string             // 模板ID
}

export interface JudgeTemplateAllType {
    id: string,
    title: string,
    type: number,
    comment: string
    acceptFileExtensions: string[]
}

export interface Submission {
    sid: string
    JudgeResult: RunningResultType
    Score: number
    Time: number
    Memory: number
    JudgeTemplate: JudgeTemplate
    SubmitTime: number
}

export interface ProgramContent {
    title?: string                      // 题目标题
    markdown?: string                   // 题目描述
    testCase?: TestCase[]               // 测试数据集合
    TimeLimit?: number                  // 时间限制
    MemoryLimit?: number                // 空间限制
    MaxSubmitNumber?: number            // 最大提交次数限制
    SumScore?: number                   // 题目总分数
    JudgeTemplate?: JudgeTemplateAllType[]  // 评测模板
}

export interface Choice {
    id: string              // 选项
    content?: string         // 内容
    state: ChoiceState
}

export interface ChoiceContent {
    content?: string         // 题干
    choice: Choice[]        // 选项
}


export type ProContent = ProgramContent | ChoiceContent


export function isChoiceContent(x: any): x is ChoiceContent {
    return "choice" in x
}

export function isProgramContent(x: any): x is ProgramContent {
    return "markdown" in x
}


export interface ICreateSubmit {
    code?: string
    contestId?: string
    examId?: string
    judgeTemplateId: string
    problemCode?: string
    problemIndex?: number
    groupIndex?: number
    zipFileId?: string

}

export interface ProblemState {
    ProblemInfo: {
        [key: string]: ProContent
    },
}

export interface IGetProInfo {
    examId: examID
    groupIndex: React.Key
    problemIndex: React.Key
}

export interface ProblemDescription {
    id: string
    isPublic: number
    problemCode: string
    problemId: string
    title: string
    userId: string
    username: string
    voteNum: number
}
