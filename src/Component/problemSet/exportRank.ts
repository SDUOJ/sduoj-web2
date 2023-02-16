import {unix2Time} from "../../Utils/Time";
import {isValueEmpty} from "../../Utils/empty";

const exportRank = async (rankInfo: any, psInfo: any) => {
    let res: any = []
    for (const x of rankInfo) {
        let obj: any = {
            "排名": x.rank,
            "姓名": x.nickname,
            "学号": x.username,
            "总分": x.sum_score,
            "ip数量": x.ips.length,
            "ip地址": x.ips.toString(),
            "交卷时间": !isValueEmpty(x.finish_time) ? unix2Time(x.finish_time) : ""
        }
        for (const y in x) {
            if (y.indexOf("-") !== -1) {
                obj[y + "-分数"] = x[y].s
                if (x[y].code !== undefined)
                    obj[y + "-代码"] = x[y].code.substr(0, 32766)

            }
        }
        res.push(obj)
    }
    return Promise.resolve(res)
}

export default exportRank;
