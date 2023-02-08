const groupGet = (value: any) => {
    if (value.type === 2) {
        let i = 0;
        for (let x of value.problemInfo) {
            x.pid = "SDUOJ-" + x.pid
            x.desId = x.desId.toString()
            x.id = i++;
        }
    }
    // console.log("afterData", value)
    return value
}

export default groupGet;
