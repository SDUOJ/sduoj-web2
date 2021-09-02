import {Component} from "react";
import {Tag} from "antd";
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';


export default class TestCase extends Component<any, any> {
    render() {
        const CaseList = {

        }
        return (
            <>
                <Tag icon={<SyncOutlined spin/>}>#1 Running</Tag>
                <Tag icon={<CheckCircleOutlined/>} color="success">#2 AC</Tag>
                <Tag icon={<CloseCircleOutlined/>} color="error">#3 WA</Tag>
                <Tag icon={<CloseCircleOutlined/>} color="purple">#4 MLE</Tag>
                <Tag icon={<CloseCircleOutlined/>} color="blue">#5 TLE</Tag>
                <Tag icon={<CloseCircleOutlined/>} color="volcano">#6 RE</Tag>
            </>
        )
    }

}