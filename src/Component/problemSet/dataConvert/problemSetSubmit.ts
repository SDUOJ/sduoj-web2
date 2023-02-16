const problemSetSubmit = (data: any) => {
    for (let x in data.config) {
        if(x !== "practiceScoreCalculate" && x !== "practiceTimeSetting"){
            if (data.config[x] === null) {
                data.config[x] = 0
            }
        }
    }
    return data
}

export default problemSetSubmit;
