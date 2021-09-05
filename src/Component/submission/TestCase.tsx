import {Component} from "react";
import {Popover, Tag} from "antd";
import Icon from '@ant-design/icons';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    FieldTimeOutlined
} from '@ant-design/icons';

import {ReactComponent as Memory} from "Assert/img/memory.svg"
import {ReactComponent as RE} from "Assert/img/bomb.svg"
import {ReactComponent as OLE} from "Assert/img/output.svg"
import {ReactComponent as Pending} from "Assert/img/pending.svg"
import {withTranslation, WithTranslation} from "react-i18next";

export enum TestCaseStates {
    "Pending",
    "Running",
    "Accepted",
    "WrongAnswer",
    "TimeLimitExceeded",
    "MemoryLimitExceeded",
    "RuntimeError"
}

export interface TestCaseProp {
    caseIndex: number
    caseType: TestCaseStates
    caseScore?: number
    caseTime?: string
    caseMemory?: string
    casePreview?: string
    type?: "tag" | "text" | "tag-simple" | "index"
}

interface ITestCaseProp extends WithTranslation, TestCaseProp {
}

class TestCase extends Component<ITestCaseProp, any> {


    constructor(props: Readonly<ITestCaseProp> | ITestCaseProp) {
        super(props);
        this.state = {
            MouseIn: false
        }
    }

    render() {
        const NameList =
            ["Pending", "Running", "Accepted",
                "WrongAnswer", "TimeLimitExceeded",
                "MemoryLimitExceeded", "RuntimeError"]
        const CaseList: { [key: string]: any } = {
            Pending: {
                icon: <Icon component={Pending}/>,
                text: "Pending",
                color: undefined
            },
            Running: {
                icon: <SyncOutlined spin/>,
                text: "Running",
                color: 'blue'
            },
            Accepted: {
                icon: <CheckCircleOutlined/>,
                text: "AC",
                color: "success"
            },
            WrongAnswer: {
                icon: <CloseCircleOutlined/>,
                text: "WA",
                color: "error"
            },
            TimeLimitExceeded: {
                icon: <FieldTimeOutlined/>,
                text: "TLE",
                color: "orange"
            },
            MemoryLimitExceeded: {
                icon: <Icon component={Memory}/>,
                text: "MLE",
                color: "orange"
            },
            RuntimeError: {
                icon: <Icon component={RE}/>,
                text: "RE",
                color: "purple"
            },
            OutputLimitExceeded: {
                icon: <Icon component={OLE}/>,
                text: "OLE",
                color: "orange"
            }
        }

        const type = NameList[this.props.caseType]

        const content: any = (
            <>
                <p>{this.props.t("Time")}: {this.props.caseTime}</p>
                <p>{this.props.t("Memory")}: {this.props.caseMemory}</p>
                {
                    [""].map(() => {
                        if (this.props.caseScore !== undefined)
                            return <p>{this.props.t("Score")}: {this.props.caseScore}</p>
                    })
                }
            </>
        )
        const visible =
            !(this.props.caseTime === undefined &&
            this.props.caseMemory === undefined &&
            this.props.caseScore === undefined)

        return (
            <>
                {
                    [''].map(()=>{
                        switch (this.props.type) {
                            case undefined:
                            case "tag":

                            case "tag-simple":

                            case "text":

                            case "index":
                                // TODO

                        }
                    })
                }
                <span
                    onMouseEnter={() => {
                        this.setState({MouseIn: true})
                    }}
                    onMouseLeave={() => {
                        this.setState({MouseIn: false})
                    }}
                    className={"test-case"}
                >
                <Popover content={content} visible={visible && this.state.MouseIn}>
                    <Tag icon={CaseList[type].icon} color={CaseList[type].color}>
                        #{this.props.caseIndex} {CaseList[type].text}
                    </Tag>
                </Popover>
            </span>
            </>
        )
    }

}

export default withTranslation()(TestCase)