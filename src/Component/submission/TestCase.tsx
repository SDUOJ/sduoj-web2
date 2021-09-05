import {Component} from "react";
import {Popover, Tag, Space, Tooltip} from "antd";
import Icon from '@ant-design/icons';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    FieldTimeOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

import {ReactComponent as Memory} from "Assert/img/memory.svg"
import {ReactComponent as RE} from "Assert/img/bomb.svg"
import {ReactComponent as OLE} from "Assert/img/output.svg"
import {ReactComponent as Pending} from "Assert/img/pending.svg"
import {withTranslation, WithTranslation} from "react-i18next";
import Title from "antd/lib/typography/Title";
import Text from "antd/lib/typography/Text";

export enum TestCaseStates {
    "Pending",
    "Running",
    "Accepted",
    "WrongAnswer",
    "TimeLimitExceeded",
    "MemoryLimitExceeded",
    "RuntimeError",
    OutputLimitExceeded
}

interface ViewType {
    type?: "tag" | "text" | "tag-simple" | "index"

}

export interface TestCaseProp {
    caseIndex?: number
    caseType: TestCaseStates
    caseScore?: number
    caseTime?: string
    caseMemory?: string
    casePreview?: string
}

interface ITestCaseProp extends WithTranslation, TestCaseProp, ViewType {
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
                "MemoryLimitExceeded", "RuntimeError", "OutputLimitExceeded"]
        const CaseList: { [key: string]: any } = {
            Pending: {
                icon: <ClockCircleOutlined/>,
                text: "Pending",
                textAll: "Pending",
                color: undefined,
            },
            Running: {
                icon: <SyncOutlined spin/>,
                text: "Running",
                textAll: "Running",
                color: 'blue'
            },
            Accepted: {
                icon: <CheckCircleOutlined/>,
                text: "AC",
                textAll: "Accepted",
                color: "success",
                type: "success",
                tagColor: "#3ad506"
            },
            WrongAnswer: {
                icon: <CloseCircleOutlined/>,
                text: "WA",
                textAll: "Wrong Answer",
                color: "error",
                type: "danger",
                tagColor: "#ff1500"
            },
            TimeLimitExceeded: {
                icon: <FieldTimeOutlined/>,
                text: "TLE",
                textAll: "Time Limit Exceeded",
                color: "orange",
                type: "warning",
                tagColor: "rgb(16, 142, 233)"
            },
            MemoryLimitExceeded: {
                icon: <Icon component={Memory}/>,
                text: "MLE",
                textAll: "Memory Limit Exceeded",
                color: "orange",
                type: "warning",
                tagColor: "#d46b08"
            },
            RuntimeError: {
                icon: <Icon component={RE}/>,
                text: "RE",
                textAll: "Runtime Error",
                color: "purple",
                type: "danger",
                tagColor: "#531dab"
            },
            OutputLimitExceeded: {
                icon: <Icon component={OLE}/>,
                text: "OLE",
                textAll: "Output Limit Exceeded",
                color: "orange",
                type: "warning",
                tagColor: "#d46b08"
            }
        }

        const type = NameList[this.props.caseType]

        const content: any = (
            <>
                <Text strong>{this.props.t("Time")}</Text>:{this.props.caseTime}
                <br/><Text strong>{this.props.t("Memory")}</Text>:{this.props.caseMemory}
                {
                    [""].map(() => {
                        if (this.props.caseScore !== undefined)
                            return <><br/><Text strong>{this.props.t("Score")}</Text>:{this.props.caseScore}</>
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
                    [''].map(() => {
                        switch (this.props.type) {
                            case undefined:
                            case "tag":
                                return (
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
                                )
                            case "tag-simple":
                                return (
                                    <Tooltip title={CaseList[type].textAll}>
                                        <Tag color={CaseList[type].tagColor}>
                                            {CaseList[type].text}
                                        </Tag>
                                    </Tooltip>
                                )

                            case "text":
                                return (
                                    <Title level={4} type={CaseList[type].type}>{CaseList[type].textAll}</Title>
                                )
                            case "index":
                                return (
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
                                             <Tag color={CaseList[type].color}> #{this.props.caseIndex} </Tag>
                                        </Popover>
                                    </span>
                                )
                        }
                    })
                }

            </>
        )
    }

}

export default withTranslation()(TestCase)