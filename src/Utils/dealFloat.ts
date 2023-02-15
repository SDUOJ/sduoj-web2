import {isValueEmpty} from "./empty";

const dealFloat = (v: number) => {
    if(isValueEmpty(v)) return 0
    if(v.toString().length > 6) return v.toFixed(2)
    return v
}

export default dealFloat;
