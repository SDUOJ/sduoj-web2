import moment from "moment";


export function TimeRangeState(start: number, end: number) {
    if (start > Date.now()) return "wait"
    if (end < Date.now()) return "end"
    return "running"
}

export function getDiffSecond(start: number, end: number) {
    const Start: any = moment(start)
    const End: any = moment(end)
    return End.diff(Start, "second")
}

export function TimeDiff(start: number, end: number, d: string = "天", h: string = "时", m: string = "分", s: string = "秒") {
    const diffSecond: number = getDiffSecond(start, end)
    let res = ""
    if (Math.floor(diffSecond / 3600 / 24) != 0)
        res += Math.floor(diffSecond / 3600 / 24).toString() + d
    if (Math.floor((diffSecond % (3600 * 24)) / 3600) != 0)
        res += Math.floor((diffSecond % (3600 * 24)) / 3600).toString() + h
    if (Math.floor((diffSecond % 3600) / 60) != 0)
        res += Math.floor((diffSecond % 3600) / 60).toString() + m
    if (diffSecond % 60 != 0)
        res += (diffSecond % 60).toString() + s
    return res
}

export function unix2Time(time: number) {
    return moment(time).format('YYYY-MM-DD HH:mm:ss')
}