import {ExamAction, genAnswerSheet} from "../Action/exam";
import {Choice, ChoiceContent, ProgramContent} from "../../Type/IProblem";
import eApi from "Utils/API/e-api"
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";
import deepClone from "Utils/deepClone";


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
                if (group.type === "Program") {
                    if (pro.content === undefined) pro.content = action.data
                    else{
                        const submission = (pro.content as ProgramContent).Submissions
                        pro.content = action.data;
                        (pro.content as ProgramContent).Submissions = submission
                    }
                } else if (group.type === "SingleChoice" || group.type === "MultipleChoice") {
                    if (pro.content === undefined) pro.content = action.data
                    else {
                        const ChCon = (action.data as ChoiceContent);
                        const ProCon = (pro.content as ChoiceContent)
                        ProCon.content = ChCon.content
                        ProCon.isLoad = true
                        for (const x of ChCon.choice) {
                            const pos = ProCon.choice.findIndex(value => value.id === x.id)
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
                    if (orgPro.content !== undefined && orgPro.content.isLoad) {
                        const choice = (orgPro.content as ChoiceContent).choice
                        for (const y of x.choice) {
                            const Index = choice.findIndex(value => value.id === y)
                            choice[Index].state = x.answer.indexOf(y) !== -1 ? "used" : (x.pass.indexOf(y) !== -1 ? "unused" : "init")
                        }
                    } else {
                        let choice: Choice[] = []
                        for (const y of x.choice) {
                            choice.push({
                                id: y,
                                state: x.answer.indexOf(y) !== -1 ? "used" : (x.pass.indexOf(y) !== -1 ? "unused" : "init")
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

            case "setProgramSubmissionList":
                let content = nowPro.content as ProgramContent
                if(content !== undefined)
                    content.Submissions = action.data
                else{
                    nowPro.content = {
                        isLoad: false,
                        Submissions: action.data
                    }
                }
                break

            case "cleanExamInfo":
                State.ExamInfoLoad = false
                State.examInfo = undefined
                break

            case "cleanProList":
                State.ProListLoad = false
                State.proGroupInfo = undefined
                break

            case "cleanExam":
                State = initState
                break

            default:
                break
        }
    } else {
        switch (action.type) {
            case "cleanExam":
                State = initState
                break

            case "setProList":
                State.ProListLoad = true
                State.TopGroupIndex = 1;
                State.TopProblemIndex = 1;
                State.proGroupInfo = action.data
                while (State.AnswerSheetLoad.length < action.data.length) State.AnswerSheetLoad.push(false);
                break

            case "setExamInfo":
                State.ExamInfoLoad = true
                State.examInfo = action.data
                break

            case "cleanExamInfo":
                State.ExamInfoLoad = false
                State.examInfo = undefined
                break

            case "cleanProList":
                State.ProListLoad = false
                State.proGroupInfo = undefined
                break
        }
    }

    return State
}