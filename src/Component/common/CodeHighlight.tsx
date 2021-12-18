import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from 'react-syntax-highlighter/dist/esm/styles/prism';
import Paragraph from "antd/lib/typography/Paragraph";
import React from "react";
import {withTranslation} from "react-i18next";


export interface ICodeHighlight {
    lang: string
    code: string
}

const CodeHighlight = (props: ICodeHighlight & any) => {

    return (
        <>
            <Paragraph
                className={"SyntaxHighlighter-Copy"}
                copyable={
                    {
                        tooltips: [props.t("Copy"), props.t("Copied")],
                        text: props.code
                    }}
            />
            <SyntaxHighlighter
                language={props.lang}
                style={darcula}
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={true}
            >
                {props.code}
            </SyntaxHighlighter>
        </>

    );
};

export default withTranslation()(CodeHighlight)