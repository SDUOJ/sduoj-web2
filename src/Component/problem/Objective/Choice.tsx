import React, {useEffect} from 'react';
import Options from "./Options";
import {withRouter} from "react-router-dom";
import MarkdownText from "../../../Utils/MarkdownText";


const Choice = (props: any) => {

    const choice = props.description?.choice

    // console.log("answer", props.answer)

    return (
        <div className={"Choice"}>
            <div className={"Choice-title"}>
                <MarkdownText id={"Choice-title-id" + (props.id ?? "")} text={props.description?.content}/>
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
