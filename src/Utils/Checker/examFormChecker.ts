import {message} from "antd";
import moment from "moment";
import {
    examBasicType,
    examDataType,
    examProblemGroupType,
    examProblemListType,
    examProblemType, problemGroupProType
} from "../../Type/IExam";

function examBasicInfoChecker(data: examBasicType): boolean {
    if (data.examTitle === undefined ||
        data.examDescription === undefined ||
        data.examStartEndTime === undefined) {
        message.error("考试基本信息不完整")
        return false
    }
    if (data.examTitle.length === 0) {
        message.error("考试标题不能为空")
        return false
    }
    if (data.examDescription.length === 0) {
        message.error("考试描述不能为空")
        return false
    }
    return true
}

function examProblemGroupInfoChecker(data: examProblemGroupType): boolean {
    if (data.ProblemGroupName === undefined ||
        data.ProblemGroupType === undefined) {
        message.error("考试题组信息不完整")
        return false
    }
    return true
}

function examProblemChecker(data: examProblemType, type: problemGroupProType) {
    if (data.ProblemCode === undefined ||
        data.ProblemScore === undefined) {
        message.error("题目编号与分数不完整")
        return false
    }
    if (type === "program") {
        if (data.ProblemCode.match(/SDUOJ-[0-9]{4}/) === null) {
            message.error("题目题号不合法")
            return false
        }
        if (data.ProblemSubmitNumber === undefined) {
            message.error("题目提交次数限制不完整")
            return false
        }
        if (data.ProblemAlias === undefined || data.ProblemAlias.length === 0) {
            message.error("题目别名不能为空")
            return false
        }
        if (data.ProblemDescription === undefined || data.ProblemDescription.length === 0) {
            message.error("题目描述不能为空")
            return false
        }
    } else {
        if (data.ProblemCode.match(/SDUOJ-C-[0-9]{4}/) === null) {
            message.error("题目题号不合法")
            return false
        }
    }
    return true
}

function examProblemListInfoChecker(data: examProblemListType, group: examProblemGroupType[]): boolean {
    const groupIndex = group.findIndex((value) => {
        return value.id === data.groupId
    })
    if (groupIndex !== -1) {
        const type = group[groupIndex].ProblemGroupType as problemGroupProType
        for (const x of data.proList) if (!examProblemChecker(x, type)) return false;
    }
    return true
}

export function examFormChecker(examForm: examDataType): boolean {
    if (!examBasicInfoChecker(examForm.examBasicInfo)) return false
    for (const x of examForm.examProblemGroupInfo) if (!examProblemGroupInfoChecker(x)) return false
    for (const x of examForm.examProblemListInfo) if (!examProblemListInfoChecker(x, examForm.examProblemGroupInfo)) return false
    return true
}