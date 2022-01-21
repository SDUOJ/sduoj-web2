export type CodeLangType = "c" | "cpp" | "java" | "sql" | "python"

export const JudgeTemplate2lang = (id: number) : CodeLangType => {
    switch (id){
        case 1:
            return "cpp"
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:

    }
    return "cpp"
}