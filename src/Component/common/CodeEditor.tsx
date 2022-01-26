import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/solarized.css';

interface ICodeEditor {
    lang: "c" | "cpp" | "java" | "sql" | "python"
    code?: string
    className?: string
    save?: any
}

require('codemirror/mode/sql/sql')
require('codemirror/mode/clike/clike')
require('codemirror/mode/python/python')


const langMap = {
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    java: "text/x-java",
    sql: "sql",
    python: "python"
}

const CodeEditor = (props: ICodeEditor) => {

    return (
        <>
            <CodeMirror
                className={"CodeMirror"}
                value={props.code}
                options={{
                    mode: langMap[props.lang],
                    theme: 'solarized',
                    indentUnit: 4,
                    tabSize: 4,
                    lineNumbers: true,
                    lineWrapping: true,
                }}
                onChange={(editor, data, value) => {
                    props.save && props.save(value)
                }}
            />
        </>
    )

}

export default CodeEditor