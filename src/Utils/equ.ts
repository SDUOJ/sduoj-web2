const equ = (obj1: any, obj2: any) => {
    if(obj1 === undefined && obj2 === undefined) return true;
    if(obj1 === undefined || obj2 === undefined) return false;
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export default equ;
