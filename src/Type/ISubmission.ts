export type TestCaseType =
    "Pending" | "Running" | "Accepted" |
    "WrongAnswer" | "TimeLimitExceeded" | "MemoryLimitExceeded" |
    "RuntimeError" | "OutputLimitExceeded"

export type RunningStateType = "-4" | "-3" | "-2" | "-1"
export type RunningResultType = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "99"
export const RunningResultList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "99"]

export const SubmissionMap: any = {
    "-4": "Queueing",
    "-3": "Compiling",
    "-2": "Judging",
    "-1": "End",
    "0": "Pending",
    "1": "Accepted",
    "2": "TimeLimitExceeded",
    "3": "MemoryLimitExceeded",
    "4": "RuntimeError",
    "5": "SystemError",
    "6": "WrongAnswer",
    "7": "PresentationError",
    "8": "CompilationError",
    "9": "OutputLimitExceeded",
    "99": "Cancelled"
}

export enum TestCaseStates {
    "Pending",
    "Running",
    "Accepted",
    "WrongAnswer",
    "TimeLimitExceeded",
    "MemoryLimitExceeded",
    "RuntimeError",
    "OutputLimitExceeded",
    "CompilationError",
    "PresentationError",
    "SystemError",
    "Queueing",
    "Compiling",
    "Judging",
    "End",
    "Cancelled"
}


export const StateList =
    ["Pending", "Running", "Accepted", "WrongAnswer", "TimeLimitExceeded",
        "MemoryLimitExceeded", "RuntimeError", "OutputLimitExceeded", "CompilationError",
        "PresentationError", "SystemError", "Queueing", "Compiling", "Judging", "End", "Cancelled"]


export const langMap: any = {
    "C++11": "cpp",
    "C++14": "cpp",
    "C++17": "cpp",
    "C++20": "cpp",
    "C11": "c",
    "Java8": "java",
    "Java11": "java",
    "Python3": "python",
    "cpp11": "cpp"
}

export interface checkPointType {
    RunningResult: RunningResultType
    Score: number
    Time: number
    Memory: number
}

export interface submissionInfoType {
    timeLimit?: number
    memoryLimit?: number
    sumScore?: number
    checkpointNum: number
    checkpointResults: checkPointType[]
    code: string | null
    codeLength: number
    gmtCreate?: string
    gmtModified?: string
    isPublic: number
    judgeLog: string
    judgeResult: number
    judgeScore: number
    judgeTemplateId: string
    judgeTemplateTitle: string
    judgeTemplateType: number
    problemCode: string
    problemId: string
    problemTitle: string
    submissionId: string
    usedMemory: number
    usedTime: number
    userId: string
    username: string
    valid: number
    zipFileId: string | null
}

// 对于分数：
//          完全显示
//          显示【未通过，部分通过，通过】对应【0分，部分分，满分】
//          不显示
// 对于测试点：
//          完全显示
//          显示【总测试点数量】与【第一个错误的测试点编号】
//          不显示
export type displayType = "show" | "partial" | "disable"

export interface TopSubmissionInfoType {
    title: string
    TimeLimit?: number
    MemoryLimit?: number
    // 对分数的显示模式
    scoreMod: displayType
    sumScore?: number   // 在 scoreMod 不是 disable 时，需要提供题目的总分
    // 对测试点数据的显示模式
    testcaseMod: displayType
    // 下载 testcase 的API
    downloadAPI: any
    // 请求 Submission 信息的 API
    QuerySubmissionAPI: any
    // 重测 API
    RejudgeAPI?: any
    // 取消成绩 API
    InvalidateAPI?: any
}

export interface RunningSubmissionInfo {
    SubmissionId: string
    TestCaseNumber: number
    TestCaseInfo: any[]
}

export interface SubmissionState {
    TopSubmissionId?: string
    TopSubmissionInfo?: TopSubmissionInfoType
    SubmissionModalVis: boolean
    submissionListInfo: {[key: string]: any}
}
