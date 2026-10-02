import {MarkdownPreview} from "./MarkdownPreview";
import {useEffect, useRef} from "react";
import {isValueEmpty} from "./empty";

const MarkdownText = (props: any) => {

    const generation = useRef(0);

    useEffect(() => {
        const currentGeneration = ++generation.current;
        const target = document.getElementById(props.id);
        if (!target || isValueEmpty(props.text)) {
            if (target) target.replaceChildren();
            return () => undefined;
        }
        target.replaceChildren();
        Promise.resolve(MarkdownPreview(props.text, props.id)).catch(() => {
            if (generation.current === currentGeneration && target.isConnected) {
                target.replaceChildren();
            }
        });
        return () => {
            generation.current += 1;
        };
    }, [props.id, props.text])

    return (
        <div id={props.id} style={{overflowY: "hidden"}}>
        </div>
    )
}

export default MarkdownText
