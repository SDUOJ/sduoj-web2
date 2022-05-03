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
    //  TODO  此处有 bug，该软件发布的版本过低，其依赖中包含有 bug
    // 该 bug 由 wrapLines={true} wrapLongLines={true} 引起

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
                // wrapLines={true}
                // wrapLongLines={true}
            >
                {props.code}
            </SyntaxHighlighter>
        </>

    );
};

export default withTranslation()(CodeHighlight)