import {examBasicType, examDataType, examProblemGroupType, examProblemListType} from "../../Type/IManage";
import {message} from "antd";

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
    return true
}

function examProblemGroupInfoChecker(data: examProblemGroupType): boolean {
    return true
}

function examProblemListInfoChecker(data: examProblemListType): boolean {
    return true
}

export function examFormChecker(examForm: examDataType): boolean {
    if (!examBasicInfoChecker(examForm.examBasicInfo)) return false
    for (const x of examForm.examProblemGroupInfo) if (!examProblemGroupInfoChecker(x)) return false
    for (const x of examForm.examProblemListInfo) if (!examProblemListInfoChecker(x)) return false
    return true
}