import {ExamAction, genAnswerSheet} from "../Action/exam";
import {
    Choice,
    ChoiceContent, isProgramContent, JudgeTemplate,
    ProContent, ProgramContent,
    ProType
} from "../../Type/IProblem";
import eApi from "Utils/API/e-api"
import {deepClone} from "@ant-design/charts/es/util";
import {ProgramTest} from "../../Utils/Problem";
import {ExamState, SExamInfo, SProGroupInfo, SProInfo} from "../../Type/IExam";
import {store} from "../Store";
import {ProblemAction} from "../Action/problem";


function getProInfo(pid: string): ProContent {

    if (pid.split('-')[0] == "SDUOJ") {
        return {
            isLoad: true,
            title: pid + "合并数字",
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
                {name: "C++11", tid: "10"},
                {name: "C11", tid: "11"},
                {name: "Java8", tid: "12"},
                {name: "Python3", tid: "13"}
            ],
            Submissions: []
        }
    } else {
        return {
            isLoad: true,
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

const initState: ExamState = {
    ExamInfoLoad: false,
    ProListLoad: false,
    TopProblemIndex: 0,
    TopGroupIndex: 0,
    AnswerSheetLoad: []
}


export const ExamReducer = (state: ExamState = initState, action: ExamAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: ExamState = deepClone(state)
    if (State.ProListLoad) {
        let ProGroupInfo = (State.proGroupInfo as SProGroupInfo[])
        let nowGroup = ProGroupInfo[State.TopGroupIndex - 1]
        let nowPro = (nowGroup.proList as SProInfo[])[State.TopProblemIndex - 1]
        const nowType = nowGroup.type

        switch (action.type) {
            // 更新当前选项
            case "updateChoice":
                let nowChoice = (nowPro.content as ChoiceContent).choice
                // 若为单选或判断且当前为选取操作，先取消当前已选的选项
                if (action.ChoiceState === "used" && nowType === "SingleChoice" || nowType === "TrueOrFalse") {
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
                // 更新当前答题卡
                eApi.setAnswerSheet({problemAnswer: genAnswerSheet(State)}, action.examId, State.TopGroupIndex - 1)
                break

            // 切换当前题目
            case "updateTop":
                State.TopProblemIndex = action.topProIndex
                State.TopGroupIndex = action.topGroupIndex
                break

            // 切换当前组件标记
            case "flipFlag":
                nowPro.flag = !nowPro.flag
                eApi.setAnswerSheet({problemAnswer: genAnswerSheet(State)}, action.examId, State.TopGroupIndex - 1)
                break
            case "setProInfo":
                const group = ProGroupInfo[action.groupId]
                const pro = group.proList[action.proId]
                if (group.type == "Program") pro.content = action.data
                else if (group.type == "SingleChoice" || group.type == "MultipleChoice") {
                    if (pro.content == undefined) pro.content = action.data
                    else {
                        const ChCon = (action.data as ChoiceContent);
                        const ProCon = (pro.content as ChoiceContent)
                        ProCon.content = ChCon.content
                        ProCon.isLoad = true
                        for (const x of ChCon.choice) {
                            const pos = ProCon.choice.findIndex(value => value.id == x.id)
                            ProCon.choice[pos].content = x.content
                        }
                    }
                }
                break

            case "setAnswerSheet":
                let proList = (State.proGroupInfo as SProGroupInfo[])[action.problemGroupId].proList
                State.AnswerSheetLoad[action.problemGroupId] = true
                for (const x of action.data) {
                    proList[x.index].flag = x.marked
                    const orgPro = proList[x.index]
                    if(orgPro.content != undefined && orgPro.content.isLoad){
                        const choice = (orgPro.content as ChoiceContent).choice
                        for (const y of x.choice) {
                            const Index = choice.findIndex(value => value.id == y)
                            choice[Index].state = x.answer.indexOf(y) != -1 ? "used" : (x.pass.indexOf(y) != -1 ? "unused" : "init")
                        }
                    }else{
                        let choice: Choice[] = []
                        for (const y of x.choice) {
                            choice.push({
                                id: y,
                                state: x.answer.indexOf(y) != -1 ? "used" : (x.pass.indexOf(y) != -1 ? "unused" : "init")
                            })
                        }
                        proList[x.index].content = {
                            isLoad: false,
                            choice: choice
                        }
                    }
                }
                break
            case "cleanProInfo":
                State.proGroupInfo = undefined
                State.ProListLoad = false
                State.TopGroupIndex = 0
                State.TopProblemIndex = 0
                State.AnswerSheetLoad = []
                break

            default:
                break
        }
    } else {
        switch (action.type) {
            case "setProList":
                State.ProListLoad = true
                State.TopGroupIndex = 1;
                State.TopProblemIndex = 1;
                State.proGroupInfo = action.data
                while(State.AnswerSheetLoad.length < action.data.length) State.AnswerSheetLoad.push(false);
                break

            case "setExamInfo":
                State.ExamInfoLoad = true
                State.examInfo = action.data
                break
        }
    }

    return State
}