import {Component} from "react";
import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/idea.css';


interface ICodeEditor {
    mode: string
    initValue: string
    className?: string
}

export default class CodeEditor extends Component<ICodeEditor, any> {

    render() {
        return (
            <>
                <CodeMirror
                    className={this.props.className}
                    value={this.props.initValue}
                    options={{
                        mode: this.props.mode,
                        theme: 'idea',
                        lineNumbers: true
                    }}
                    onChange={(editor, data, value) => {
                    }}
                />
            </>
        )
    }
}