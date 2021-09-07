import {Component} from "react";
import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/idea.css';


export default class CodeEditor extends Component<any, any> {

    render() {
        return (
            <>
                <CodeMirror
                    className={this.props.className}
                    value='select * from pub.student'
                    options={{
                        mode: 'sql',
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