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
    "C11": "c",
    "Java8": "java",
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
    checkpointNum: number
    checkpointResults: checkPointType[]
    code: string
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

export interface TopSubmissionInfoType {
    title: string
    TimeLimit: number
    MemoryLimit: number
    sumScore?: number
    showScore: boolean
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
}