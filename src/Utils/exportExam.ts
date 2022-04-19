import {examID} from "../Type/types";
import mApi from "Utils/API/m-api"


export function getColMap(Data: any) {
    let data = {
        id: "用户编号",
        username: "学号",
        nickname: "姓名",
        score: "总分数",
    }

    return data
}

export function getData(eid: examID) {

    return [
        {id: 1, content: "123"},
        {id: 2, content: "234"},
        {id: 3, content: "345"},
        {id: 4, content: "456"},
        {id: 5, content: "567"}
    ]
}

export function getExamJson(eid: examID) {
    return mApi.judgeExam(eid).then((resData: any) => {
        let data: any = []
        for (const x of resData) {
            let baseUserInfo: any = {
                "用户编号": x.userId,
                "学号": x.username,
                "姓名": x.nickname,
                "总分数": x.score,
                "使用IP数量": x.ip !== undefined ? x.ip.length : "",
                "IP列表": x.ip !== undefined ? x.ip.toString() : ""
            }
            let proInfo: any = []
            let groupCnt = 0
            for (const y of x.problemGroupResult) {
                groupCnt += 1
                if (y.type === "Program") {
                    proInfo['题组' + groupCnt + "-类型"] = "编程题"
                    proInfo['题组' + groupCnt + "-总分数"] = y.score
                    let proCnt = 0
                    for (const z of y.problemResult[0]) {
                        proCnt += 1
                        proInfo[groupCnt + "-" + proCnt + "-分数"] = z.realScore
                        proInfo[groupCnt + "-" + proCnt + "-评测分数"] = z.score
                        proInfo[groupCnt + "-" + proCnt + "-得分代码"] = z.code.substr(0, 32767)
                    }
                } else if (y.type === "SingleChoice" || y.type === "MultipleChoice") {
                    proInfo['题组' + groupCnt + "-类型"] = "选择题"
                    proInfo['题组' + groupCnt + "-总分数"] = y.score
                    let proCnt = 0
                    for (const z of y.problemResult[0]) {
                        proCnt += 1
                        proInfo[groupCnt + "-" + proCnt + "-分数"] = z.score
                        proInfo[groupCnt + "-" + proCnt + "-学生卷中选项"] = z.orgAnswer.toString()
                        proInfo[groupCnt + "-" + proCnt + "-学生实际选项"] = z.answer.toString()
                        proInfo[groupCnt + "-" + proCnt + "-标准答案"] = z.realAnswer.toString()
                    }
                }
            }
            data.push(Object.assign(baseUserInfo, proInfo))
        }
        return Promise.resolve(data)
    })

}