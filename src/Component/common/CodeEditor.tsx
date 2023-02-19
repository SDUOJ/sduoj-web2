import CodeMirror from '@uiw/react-codemirror';
import {githubLight, githubLightInit, githubDark, githubDarkInit} from '@uiw/codemirror-theme-github';
import {cpp} from '@codemirror/lang-cpp';
import {java} from '@codemirror/lang-java';
import {sql} from '@codemirror/lang-sql';
import {python} from '@codemirror/lang-python';


interface ICodeEditor {
    lang: "c" | "cpp" | "java" | "sql" | "python"
    code?: string
    value?: string
    className?: string
    onChange?: any
    readOnly?: boolean

}


const langMap = {
    cpp: cpp,
    c: cpp,
    java: java,
    sql: sql,
    python: python
}

const CodeEditor = (props: ICodeEditor) => {

    console.log(props.lang)

    return (
        <>
            <CodeMirror
                value={props.value}
                height={"400px"}
                readOnly={props.readOnly ?? false}
                theme={githubLight}
                autoFocus={true}
                extensions={[
                    (langMap[props.lang])()
                ]}
                basicSetup={{
                    lineNumbers: true,
                    autocompletion: true,
                    syntaxHighlighting: true,
                    tabSize: 4,
                    completionKeymap:true,
                    lintKeymap: true,
                    foldKeymap: true,
                    searchKeymap: true,
                    allowMultipleSelections: true,
                    bracketMatching: true
                }}
                // options={{
                //     indentUnit: 4,
                //     smartIndent: true,
                //     lineWrapping: true,
                //     autoRefresh: true,
                //     electricChars: true
                // }}
                onChange={(value) => {
                    props.onChange && props.onChange(value)
                }}
            />
        </>
    )

}

export default CodeEditor
