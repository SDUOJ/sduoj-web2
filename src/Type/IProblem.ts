import {TestCaseType} from "./ISubmission";

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
    inputData: string       // 输入数据
    outputData: string      // 输出数据
}

export interface JudgeTemplate {
    name: string            // 名称
    tid: string             // 模板ID
}

export interface Submission {
    sid: string
    JudgeResult: TestCaseType
    Score: number
    Time: number
    Memory: number
    JudgeTemplate: JudgeTemplate
    SubmitTime: number

}

export interface ProgramContent {
    title: string                   // 题目标题
    markdown: string                // 题目描述
    testCase: TestCase[]            // 测试数据集合
    // code: string                    // 题号
    TimeLimit: number               // 时间限制
    MemoryLimit: number             // 空间限制
    JudgeTemplate: JudgeTemplate[]  // 评测模板
    Submissions: Submission[]       // 提交信息
}

export interface Choice {
    id: string              // 选项
    content: string         // 内容
    state: ChoiceState
}

export interface ChoiceContent {
    content: string         // 题干
    choice: Choice[]        // 选项
}


export type ProContent = ProgramContent | ChoiceContent


export function isChoiceContent(x: any): x is ChoiceContent {
    return (<ChoiceContent>x).content !== undefined
}

export function isProgramContent(x: any): x is ProgramContent {
    return (<ProgramContent>x).markdown !== undefined
}


export interface ICreateSubmit {
    code: string
    contestId?: string
    examId?: string
    judgeTemplateId: string
    problemCode: string
}

export interface ProblemState {
    SubmitModalVis: boolean         // 提交对话框是否可见
    TopSubmissionId?: string
}