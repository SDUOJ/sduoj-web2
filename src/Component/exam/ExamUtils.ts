import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekday from 'dayjs/plugin/weekday';
import updateLocale from 'dayjs/plugin/updateLocale';
import {TimeDiff} from "../../Utils/Time";

dayjs.extend(localizedFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(updateLocale);

export const getDescription = (examInfo: any) => {
    if (examInfo === undefined) return ""
    let description: string = ""
    const start = dayjs(examInfo.startTime), end = dayjs(examInfo.endTime)
    description += "考试时长：" + TimeDiff(examInfo.startTime, examInfo.endTime) + "\n"
    description += "考试时间："
        + start.format("LL") + "(" + start.format("dddd") + ") "
        + start.format("HH:mm") + " - "
        + (start.format("LL") === end.format("LL") ? "" : (
            end.format("LL") + "(" + end.format("dddd") + ") "
        )) + end.format("HH:mm") + "\n"
    return description
}