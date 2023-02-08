const groupSubmit = (value: any) => {
    if(value.type === 2){
        for (let x of value.problemInfo){
            x.pid = parseInt(x.pid.split("-")[1])
        }
    }
    return value
}

export default groupSubmit;
