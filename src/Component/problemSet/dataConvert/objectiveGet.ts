const objectiveGet = (resData: any) => {
    const choice = resData.content.choice
    let Choice = []
    for (let i = 0; i < choice.length; i++) {
        Choice.push({
            id: i,
            content: choice[i]
        })
    }
    resData.content.choice = Choice
    return resData
}

export default objectiveGet;
