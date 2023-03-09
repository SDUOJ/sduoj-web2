import {MarkdownPreview} from "./MarkdownPreview";
import {useEffect, useState} from "react";
import {isValueEmpty} from "./empty";

const MarkdownText = (props: any) => {

    const [running, setRunning] = useState<boolean>(false);
    const [nowText, setNowText] = useState<boolean>(false);

    useEffect(() => {
        if (!isValueEmpty(props.text) && !running && nowText !== props.text) {
            setRunning(true)
            setNowText(props.text)
            MarkdownPreview(props.text, props.id).then((res: any) => {
                setRunning(false)
            })
        }
    }, [props.id, props.text, running])

    return (
        <div id={props.id} style={{overflowY: "hidden"}}>
        </div>
    )
}

export default MarkdownText
