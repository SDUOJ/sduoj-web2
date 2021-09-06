// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import {Component} from "react";

interface IProblemProp{
    markdown: string
    style?: any
}

export default class Problem extends Component<IProblemProp, any>{

    componentDidMount() {
        VditorPreview.preview(
            document.getElementById("problem-content"),
            this.props.markdown
        )
    }

    render() {
        return (
            <div id={"problem-content"} style={this.props.style}>

            </div>
        )
    }
}