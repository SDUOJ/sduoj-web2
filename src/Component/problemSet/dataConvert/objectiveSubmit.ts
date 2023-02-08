import {message} from "antd";

const objectiveSubmit = (value: any) => {
    const choice0: any = value.content.choice
    for (let i = 0; i < choice0.length; i++) {
        if (choice0[i].content.length === 0) {
            message.error("选项不能为空")
            return
        }
    }
    if (value.type === "1" && value.answer.length === 1) {
        message.error("多选题应该有两个及以上答案")
        return;
    }
    if (value.type === "0" && value.answer.length !== 1) {
        message.error("单选题只能有一个答案")
        return;
    }

    let choice: string[] = []
    for (let i = 0; i < choice0.length; i++) {
        choice.push(choice0[i].content)
    }
    value.content.choice = choice
    return value
}

export default objectiveSubmit;
