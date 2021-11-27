import {ExamAction} from "../Action/exam";
import {
    ChoiceContent,
    ProContent,
    ProType
} from "../../Type/IProblem";
import examApi from "Utils/API/e-api"
import {deepClone} from "@ant-design/charts/es/util";
import {ProgramTest} from "../../Utils/Problem";


interface SExamInfo {
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
    examInfo?: SExamInfo
    ExamInfoLoad: boolean
    proInfo?: SProInfo[]
    ProListLoad: boolean
    TopProblemIndex: number
}


function getProInfo(pid: string): ProContent {
    examApi.getPro({pid: pid}).then(r => {
        console.log(r)
    })
    if (pid.split('-')[0] == "SDUOJ") {
        return {
            title: "合并数字",
            markdown: ProgramTest,
            testCase: [
                {inputData: "3\n-3 -1 4", outputData: "8"},
                {inputData: "6\n1 -2 4 -3 3 -1", outputData: "14"},
                {
                    inputData: "15\n-62208205 -468209857 170731921 595947512 242239468 -24833033 157706648 -351341144 355114451 -481362346 -108966996 -165688094 626521688 -109650172 741981679",
                    outputData: "4662503214"
                },
            ],
            TimeLimit: 1000,
            MemoryLimit: 512 * 1024,
            JudgeTemplate: [
                {name: "C++11", tid: 10},
                {name: "C11", tid: 11},
                {name: "Java8", tid: 12},
                {name: "Python3", tid: 13}
            ],
            Submissions: []
        }
    } else {
        return {
            content: pid.toString() + ". 中国共产党是中国社会主义事业的领导核心，这句话说明了（）。",
            choice: [
                {
                    id: "A",
                    content: "党的阶级性和先进性",
                    state: "init"
                },
                {
                    id: "B",
                    content: "党的根本宗旨",
                    state: "init"
                },
                {
                    id: "C",
                    content: "党的地位和作用",
                    state: "init"
                },
                {
                    id: "D",
                    content: "党的性质",
                    state: "init"
                },
            ]
        }
    }
}

function getExamInfo(eid: number): SExamInfo {
    // let data =

    return {
        "startTime": Date.now() + 1000 * 60 * 10,
        "endTime": Date.now() + 1000 * 60 * 10 + 1000 * 60 * 120,
        "title": "2021年《程序设计与算法导论》期末考试",
        "description": "请使用山东大学统一身份认证平台登录，完成登录后即可开始考试",
    }
}

function getProList(): SProInfo[] {

    return [
        {pid: "Choice-1000", index: 1, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1001", index: 2, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1002", index: 3, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1003", index: 4, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1004", index: 5, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1005", index: 6, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1006", index: 7, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1007", index: 8, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1008", index: 9, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1009", index: 10, type: "SingleChoice", flag: false, score: 5},
        {pid: "Choice-1010", index: 11, type: "MultipleChoice", flag: false, score: 5},
        {pid: "Choice-1011", index: 12, type: "MultipleChoice", flag: false, score: 5},
        {pid: "Choice-1012", index: 13, type: "MultipleChoice", flag: false, score: 5},
        {pid: "Choice-1013", index: 14, type: "MultipleChoice", flag: false, score: 5},
        {pid: "Choice-1014", index: 15, type: "MultipleChoice", flag: false, score: 5},
        {pid: "SDUOJ-1000", index: 16, type: "Program", flag: false, score: 5},
        {pid: "SDUOJ-1001", index: 17, type: "Program", flag: false, score: 5},
        {pid: "SDUOJ-1002", index: 18, type: "Program", flag: false, score: 5},
        {pid: "SDUOJ-1003", index: 19, type: "Program", flag: false, score: 5},
        {pid: "SDUOJ-1004", index: 20, type: "Program", flag: false, score: 5},
    ]
}

const initState: ExamState = {
    ExamInfoLoad: false,
    ProListLoad: false,
    TopProblemIndex: 0
}

export const ExamReducer = (state: ExamState = initState, action: ExamAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = deepClone(state)
    if (State.ProListLoad) {
        let ProInfo = (State.proInfo as SProInfo[])
        let nowPro = ProInfo[State.TopProblemIndex - 1]
        switch (action.type) {

            // 更新当前选项
            case "updateChoice":
                let nowChoice = (nowPro.content as ChoiceContent).choice
                // 若为单选或判断且当前为选取操作，先取消当前已选的选项
                if (action.ChoiceState === "used" && nowPro.type === "SingleChoice" || nowPro.type === "TrueOrFalse") {
                    nowChoice.map((value, index) => {
                        if (value.state === "used") {
                            nowChoice[index].state = "init"
                        }
                    })
                }
                // 更新所选项属性
                nowChoice.map((value, index) => {
                    if (value.id === action.ChoiceID) {
                        nowChoice[index].state = action.ChoiceState
                    }
                })
                return State

            // 切换当前题目
            case "updateTop":
                if (action.topIndex <= 0 || action.topIndex > ProInfo.length) return State
                State.TopProblemIndex = action.topIndex
                if (ProInfo[State.TopProblemIndex - 1].content === undefined) {
                    ProInfo[State.TopProblemIndex - 1].content = getProInfo(ProInfo[State.TopProblemIndex - 1].pid)
                }
                return State

            // 切换当前组件标记
            case "flipFlag":
                nowPro.flag = !nowPro.flag
                return State

            default:
                return State
        }
    } else {
        switch (action.type) {
            case "GetProList":
                State.proInfo = getProList()
                State.ProListLoad = true
                State.TopProblemIndex = 1;
                const ProInfo = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
                ProInfo.content = getProInfo(ProInfo.pid)
                return State
        }
    }
    return State
}