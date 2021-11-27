import {isChoiceContent, isProgramContent, ProContent, ProgramContent} from "../Type/IProblem";

export function getPoint(point: number | undefined) {
    if (point === 0 || point == undefined) return "point"
    else return "points"
}

export function GetMaxScore(Program: ProgramContent): number {
    let maxValue: number = 0
    Program.Submissions.map(value => {
        if (maxValue < value.Score) maxValue = value.Score
    })
    return maxValue
}

export function IsAnswer(obj: ProContent): boolean {
    if (isChoiceContent(obj)) {
        let usedNum = 0;
        obj.choice.map(value => {
            if (value.state === "used") usedNum += 1;
        })
        return usedNum !== 0
    } else if (isProgramContent(obj)) {
        return obj.Submissions.length !== 0
    }
    return false
}

export const ProgramTest =
    "### 题目描述\n" +
    "\n" +
    "给定一个长度为 $n$ 的序列 $A$，其元素记为 $A_1, A_2, \\dots, A_n$。\n" +
    "\n" +
    "现在你可以进行合并操作，每次选择序列中两个**当前相邻**的元素 $A_i,A_{j}\\ (i<j)$ ，将其合并为 $A_i^{'}$ （将  $A_j$ 合并到 $A_i$），可以令 $A_i^{'}=A_i+A_j$ 或 $A_i^{'}=A_i-A_j$。显然，在 $n-1$ 次操作后，序列中将只剩下一个元素。\n" +
    "\n" +
    "请找到最优的合并方案，使最后剩余的元素绝对值最大，并输出其绝对值。\n" +
    "\n" +
    "### 输入格式\n" +
    "\n" +
    "第一行包含一个整数 $n$，表示序列 $A$ 中的元素个数。\n" +
    "接下来一行包含 $n$ 个以空格隔开的整数，其中第 $i$ 个数表示 $A_i$。\n" +
    "\n" +
    "### 输出格式\n" +
    "\n" +
    "输出一行，一个整数，表示绝对值的最大值。\n" +
    "\n" +
    "### 数据特性\n" +
    "\n" +
    "|   测试点   | 分数 |       $A_i$       |        $n$        |\n" +
    "| :--------: | :--: | :---------------: | :---------------: |\n" +
    "|  $ 1,2,3$   | $ 30$ | $ 0\\le A_i\\le 100$ | $ 1\\le n \\le 100$  |\n" +
    "|  $ 4,5,6$   | $ 30$ |  \\|$A_i$\\| $\\le 100$  | $ 1\\le n \\le 1000$ |\n" +
    "| $ 7,8,9,10$ | $ 40$ | \\|$A_i$\\| $\\le 10^9$  | $ 1\\le n \\le 10^5$ |\n" +
    "\n"