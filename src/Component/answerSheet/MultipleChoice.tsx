import {Component} from "react";
import {Checkbox} from "antd";


export class MultipleChoice extends Component<any, any> {


    onChange(checkedValues: any) {
        console.log('checked = ', checkedValues);
    }

    render() {
        return (
            <>
                <Checkbox.Group style={{width: '100%'}} onChange={this.onChange}>
                    <Checkbox value="A">A</Checkbox>
                    <Checkbox value="B">B</Checkbox>
                    <Checkbox value="C">C</Checkbox>
                    <Checkbox value="D">D</Checkbox>
                    <Checkbox value="E">E</Checkbox>
                </Checkbox.Group>
            </>
        )
    }
}