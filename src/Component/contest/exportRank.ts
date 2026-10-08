export default async function exportRank(data: any) {
    let res: any = []
    const rows = Array.isArray(data) ? data : [];
    for (const x of rows) {
        if (x.official === true) {
            let obj: any = {
                "排名": x.rank,
                "姓名": x.nickname,
                "学号": x.username,
                "总分": x.sumScore,
                "过题数": x.ACNumber,
                "罚时": x.penalty,
            }
            const cells = x.Cell && typeof x.Cell === 'object' ? x.Cell : {};
            for (const y in cells) {
                obj["题目" + y + "-分数"] = cells[y]?.score
                obj["题目" + y + "-提交次数"] = cells[y]?.tries
                obj["题目" + y + "-通过情况"] = cells[y]?.className
            }
            res.push(obj)
        }
    }
    return Promise.resolve(res)
}
