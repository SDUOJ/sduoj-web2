import {isValueEmpty} from "../../../Utils/empty";

const subjectiveGet = (data: any) => {
    if (!isValueEmpty(data.config.fileList)) {
        let l = data.config.fileList.length
        for (let i = 0; i < l; i++) {
            data.config.fileList[i].id = i
        }
    }
    if (!isValueEmpty(data.config.judgeConfig)) {
        let l = data.config.judgeConfig.length
        for (let i = 0; i < l; i++) {
            data.config.judgeConfig[i].id = i
        }
    }
    return data
}

export default subjectiveGet;
