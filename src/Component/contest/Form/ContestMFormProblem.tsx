import {withTranslation} from "react-i18next";
import React from "react";
import ItemProblemAdd from "../../problem/From/Item/ItemProblemAdd";
import {isValueEmpty} from "../../../Utils/empty";


const ContestMFormProblem = (props: any) =>{
    return (
        <div style={{width: 1100}}>
            <ItemProblemAdd
                name={"problems"}
                editable={true}
                problemType={"program"}
                useColor={true}
                initNewLine={(data: any[], keyMapping:any) => {
                    const length = data.length
                    const last = length === 0 ? undefined : data[data.length - 1]
                    const code = isValueEmpty(last?.[keyMapping["ProblemCode"]]) ? undefined : last?.[keyMapping["ProblemCode"]]
                    const score = last?.[keyMapping["ProblemScore"]]
                    const submitNumber = last?.[keyMapping["ProblemSubmitNumber"]]
                    const number = code === undefined ? 0 : parseInt(code.substr(-4))
                    const NewCode = code === undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
                    return {
                        id: Date.now(),
                        [keyMapping["ProblemCode"]]: NewCode,
                        [keyMapping["ProblemScore"]]: score,
                        [keyMapping["ProblemSubmitNumber"]]: submitNumber,
                    }
                }}
                keyMapping={{
                    ProblemCode: "problemCode",
                    ProblemAlias: "problemTitle",
                    defaultDescriptionId: "problemDescriptionId",
                    ProblemScore: "problemWeight",
                    problemColor: "problemColor"
                }}
            />
        </div>
    )

}

export default withTranslation()(ContestMFormProblem)
