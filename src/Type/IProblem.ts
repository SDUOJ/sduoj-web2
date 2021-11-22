export type ProType = "Program" | "SingleChoice" | "MultipleChoice" | "FillInTheBlank" | "Subjective" | "TrueOrFalse"
export const ProNameMap: { [key: string]: string } = {
    "Program": "编程题",
    "FillInTheBlank": "填空题",
    "Subjective": "主观题",
    "SingleChoice": "单选题",
    "MultipleChoice": "多选题",
    "TrueOrFalse": "判断题"
}
export type ChoiceState = "used" | "unused" | "init"

export interface TestCase {
    inputData: string       // 输入数据
    outputData: string      // 输出数据
}

export interface JudgeTemplate {
    name: string            // 名称
    tid: number             // 模板ID
}

export interface ProgramContent {
    markdown: string                // 题目描述
    testCase: TestCase[]            // 测试数据集合
    code: string                    // 题号
    TimeLimit: number               // 时间限制
    MemoryLimit: number             // 空间限制
    JudgeTemplate: JudgeTemplate[]  // 评测模板
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


