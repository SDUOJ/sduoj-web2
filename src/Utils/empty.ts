export const ck = (v1: any, v2: any) => {
    if (v1 !== undefined) return v1
    return v2
}

export const eck = (v1: any, v2: any) => {
    if (!isValueEmpty(v1)) return v1
    return v2
}

export const isValueEmpty = (value: any)=>{
    if(value === undefined) return true
    if(value === null) return true
    try{
        return value.toString().length === 0;
    }catch (e){
        return false
    }

}

export const get = (x:any, y?:string)=>{
    if(y === undefined) return x;
    if(x === undefined) return undefined
    return x[y]
}