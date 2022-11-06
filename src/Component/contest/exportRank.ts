export default async function exportRank(data: any) {
    let res: any = []
    console.log(data)
    for (const x of data) {
        if (x.official === true) {
            let obj: any = {
                "排名": x.rank,
                "姓名": x.nickname,
                "学号": x.username,
                "总分": x.sumScore,
                "过题数": x.ACNumber,
                "罚时": x.penalty,
            }
            for (const y in x.Cell) {
                obj["题目" + y + "-分数"] = x.Cell[y].score
                obj["题目" + y + "-提交次数"] = x.Cell[y].tries
                obj["题目" + y + "-通过情况"] = x.Cell[y].className
            }
            res.push(obj)
        }
    }
    return Promise.resolve(res)
}