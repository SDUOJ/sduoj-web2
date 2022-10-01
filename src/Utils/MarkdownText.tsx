import {MarkdownPreview} from "./MarkdownPreview";
import {useEffect} from "react";

const MarkdownText = (props: any) => {

    useEffect(() => {
        MarkdownPreview(props.id, props.text)
    }, [props.id, props.text])

    return (
        <div id={props.id}>
        </div>
    )
}

export default MarkdownText