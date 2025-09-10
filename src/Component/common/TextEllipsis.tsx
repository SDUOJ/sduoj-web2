import {Typography} from "antd";
import React from "react";

const TextEllipsis = (props: any) => {
    const text = props.text.replace(/^\s+|\s+$/g, '')
    return (
        <Typography.Text
            style={{width: props.width ?? 100}}
            ellipsis={{tooltip: <pre className={"preAutoLine mgb0"}>{text}</pre>}}
        >
            {text}
        </Typography.Text>
    )
}

export default TextEllipsis