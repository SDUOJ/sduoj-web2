import moment from "moment";
import {TimeDiff} from "../../Utils/Time";

export const getDescription = (examInfo: any) => {
    if (examInfo === undefined) return ""
    let description: string = ""
    const start = moment(examInfo.startTime), end = moment(examInfo.endTime)
    description += "考试时长：" + TimeDiff(examInfo.startTime, examInfo.endTime) + "\n"
    description += "考试时间："
        + start.format("LL") + "(" + start.format("dddd") + ") "
        + start.format("HH:mm") + " - "
        + (start.format("LL") === end.format("LL") ? "" : (
            end.format("LL") + "(" + end.format("dddd") + ") "
        )) + end.format("HH:mm") + "\n"
    return description
}