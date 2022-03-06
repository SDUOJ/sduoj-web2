import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/solarized.css';
import {ck} from "../../Utils/empty";
import 'codemirror/addon/display/autorefresh'

interface ICodeEditor {
    lang: "c" | "cpp" | "java" | "sql" | "python" | "text"
    code?: string
    value?: string
    className?: string
    onChange?: any
    readOnly?: boolean

}

require('codemirror/mode/sql/sql')
require('codemirror/mode/clike/clike')
require('codemirror/mode/python/python')


const langMap = {
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    java: "text/x-java",
    sql: "sql",
    python: "python",
    text: ""
}

const CodeEditor = (props: ICodeEditor) => {

    return (
        <>
            <CodeMirror
                className={"CodeMirror"}
                value={props.value as string}
                options={{
                    readOnly: ck(props.readOnly, false),
                    mode: langMap[props.lang],
                    theme: 'solarized',
                    indentUnit: 4,
                    tabSize: 4,
                    lineNumbers: true,
                    lineWrapping: true,
                    autoRefresh: true
                }}
                onChange={(editor, data, value) => {
                    props.onChange && props.onChange(value)
                }}
                onBeforeChange={(editor, data, value) => {
                    props.onChange && props.onChange(value)
                }}
            />
        </>
    )

}

export default CodeEditor