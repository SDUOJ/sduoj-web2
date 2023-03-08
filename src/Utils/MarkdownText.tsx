import {MarkdownPreview} from "./MarkdownPreview";
import {useEffect, useState} from "react";
import {isValueEmpty} from "./empty";

const MarkdownText = (props: any) => {
    useEffect(() => {
        if (!isValueEmpty(props.text)) {
            MarkdownPreview(props.text, props.id)
        }
    }, [props.id, props.text])

    return (
        <div id={props.id} style={{overflowY: "hidden"}}>
        </div>
    )
}

export default MarkdownText
