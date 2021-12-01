import {ProContent, ProType} from "./IProblem";

export interface SExamInfo {
    startTime: number       // 开始时间
    endTime: number         // 结束时间
    title: string           // 考试标题
    description: string     // 考试描述
}

export interface SProInfo {
    pid: string                         // 题库中的题目id
    index: number                       // 在本场考试中的题号
    type: ProType                       // 题目类型
    flag: boolean                       // 是否标记
    score: number                       // 题目分数
    content?: ProContent                // 题目内容
}


export interface ExamState {
    examInfo?: SExamInfo                // 考试信息
    examId?: string                     // 考试ID
    ExamInfoLoad: boolean               // 考试信息是否已加载
    proInfo?: SProInfo[]                // 题目信息
    ProListLoad: boolean                // 题目信息是否已加载
    TopProblemIndex: number             // 顶部问题ID
}

export interface IUserExamInfo {
    name?: string                        // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}