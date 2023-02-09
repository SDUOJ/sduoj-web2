const problemSetGet = (data: any) => {
    if (data.groupInfo !== undefined) {
        let i: number = 0;
        for (let x of data.groupInfo) {
            x.id = i++;
        }
    }
    return data
}


export default problemSetGet;
