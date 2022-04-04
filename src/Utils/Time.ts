import moment from "moment";


export function TimeRangeState(start: number | string, end: number | string) {
    if (typeof start === "string") start = parseInt(start)
    if (typeof end === "string") end = parseInt(end)
    if (start > Date.now()) return "wait"
    if (end < Date.now()) return "end"
    return "running"
}

export function getDiffSecond(start: number | string, end: number | string) {
    if (typeof start === "string") start = parseInt(start)
    if (typeof end === "string") end = parseInt(end)
    const Start: any = moment(start)
    const End: any = moment(end)
    return End.diff(Start, "second")
}

export function TimeDiff(start: number | string, end: number | string, d: string = "天", h: string = "时", m: string = "分", s: string = "秒") {
    if (typeof start === "string") start = parseInt(start)
    if (typeof end === "string") end = parseInt(end)
    const diffSecond: number = getDiffSecond(start, end)
    let res = ""
    if (Math.floor(diffSecond / 3600 / 24) !== 0)
        res += Math.floor(diffSecond / 3600 / 24).toString() + d
    if (Math.floor((diffSecond % (3600 * 24)) / 3600) !== 0)
        res += Math.floor((diffSecond % (3600 * 24)) / 3600).toString() + h
    if (Math.floor((diffSecond % 3600) / 60) !== 0)
        res += Math.floor((diffSecond % 3600) / 60).toString() + m
    if (diffSecond % 60 !== 0)
        res += (diffSecond % 60).toString() + s
    if (res === "") res = "0" + s
    return res
}

export function unix2Time(time: number | string) {
    if (typeof time === "string") time = parseInt(time)
    return moment(time).format('YYYY-MM-DD HH:mm:ss')
}

export function unix2Date(time: number | string) {
    if (typeof time === "string") time = parseInt(time)
    return moment(time).format('YYYY-MM-DD')
}