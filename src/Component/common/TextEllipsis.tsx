import {withTranslation} from "react-i18next";
import {Typography} from "antd";
import React from "react";

const TextEllipsis = (props: any) => {
    const text = props.text.replace(/^\s+|\s+$/g, '')
    return (
        <Typography.Text
            style={{width: 100}}
            ellipsis={{tooltip: <pre className={"preAutoLine mgb0"}>{text}</pre>}}
        >
            {text}
        </Typography.Text>
    )
}

export default withTranslation()(TextEllipsis)