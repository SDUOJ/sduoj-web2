import React, {useEffect} from 'react';
import Options from "./Options";
import {withRouter} from "react-router-dom";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";


const Choice = (props: any) => {

    useEffect(() => {
        if (props.description !== undefined) {
            MarkdownPreview("Choice-title-id" + (props.id ?? ""), props.description.content)
        }
    }, [props.description?.content])

    const choice = props.description?.choice

    // console.log("answer", props.answer)

    return (
        <div className={"Choice"}>
            <div className={"Choice-title"} id={"Choice-title-id" + (props.id ?? "")}>

            </div>
            {choice !== undefined && (
                Object.keys(choice).map((v: any) => {
                    return (
                        <Options
                            answer={props.answer}
                            topInfo={props.topInfo}
                            ChoiceID={v}
                            ChoiceContent={choice[v]}
                        />
                    )
                })
            )}
        </div>
    )

}


export default withRouter(Choice)
