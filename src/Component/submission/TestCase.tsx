import {Component} from "react";
import {Popover, Tag, Tooltip} from "antd";
import Icon, {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    FieldTimeOutlined,
    SyncOutlined
} from '@ant-design/icons';

import {ReactComponent as Memory} from "Assert/img/memory.svg"
import {ReactComponent as RE} from "Assert/img/bomb.svg"
import {ReactComponent as OLE} from "Assert/img/output.svg"
import {withTranslation, WithTranslation} from "react-i18next";
import Title from "antd/lib/typography/Title";
import Text from "antd/lib/typography/Text";
import {displayType, StateList, TestCaseStates} from "../../Type/ISubmission";
import {ck} from "../../Utils/empty";


interface ViewType {
    type?: "tag" | "text" | "tag-simple" | "index"
}

export interface TestCaseProp {
    caseIndex?: number
    caseType: TestCaseStates
    caseScore?: number
    caseTime?: number
    caseMemory?: number
    casePreview?: string
    append?: string
    textLevel?: number
    scoreMod?: displayType
    caseID?: string
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
        const NameList = StateList
        const {t} = this.props
        const CaseList: { [key: string]: any } = {
            Pending: {
                icon: <ClockCircleOutlined/>,
                text: "Pending",
                textAll: t("Pending"),
                color: undefined,
            },
            Running: {
                icon: <SyncOutlined spin/>,
                text: "Running",
                textAll: t("Running"),
                color: 'blue'
            },
            Accepted: {
                icon: <CheckCircleOutlined/>,
                text: "AC",
                textAll: t("Accepted"),
                color: "success",
                type: "success",
                tagColor: "#3ad506"
            },
            TimeLimitExceeded: {
                icon: <FieldTimeOutlined/>,
                text: "TLE",
                textAll: t("TimeLimitExceeded"),
                color: "orange",
                type: "warning",
                tagColor: "#d46b08"
            },
            MemoryLimitExceeded: {
                icon: <Icon component={Memory}/>,
                text: "MLE",
                textAll: t("MemoryLimitExceeded"),
                color: "orange",
                type: "warning",
                tagColor: "#d46b08"
            },
            OutputLimitExceeded: {
                icon: <Icon component={OLE}/>,
                text: "OLE",
                textAll: t("OutputLimitExceeded"),
                color: "orange",
                type: "warning",
                tagColor: "#d46b08"
            },
            WrongAnswer: {
                icon: <CloseCircleOutlined/>,
                text: "WA",
                textAll: t("WrongAnswer"),
                color: "error",
                type: "danger",
                tagColor: "#ff1500"
            },
            RuntimeError: {
                icon: <Icon component={RE}/>,
                text: "RE",
                textAll: t("RuntimeError"),
                color: "error",
                type: "danger",
                tagColor: "#531dab"
            },
            CompilationError: {
                icon: <CloseCircleOutlined/>,
                text: "CE",
                textAll: t("compilationError"),
                color: "error",
                type: "warning",
                tagColor: "#c46304"
            },
            PresentationError: {
                icon: <CloseCircleOutlined/>,
                text: "PE",
                textAll: t("formatError"),
                color: "error",
                type: "danger",
                tagColor: "#ff1500"
            },
            SystemError: {
                icon: <CloseCircleOutlined/>,
                text: "SE",
                textAll: t("SystemError"),
                color: "error",
                type: "danger",
                tagColor: "#ff1500"
            },
            Queueing: {
                icon: <ClockCircleOutlined/>,
                text: "Queueing",
                textAll: t("Pending"),
                color: undefined
            },
            Compiling: {
                icon: <SyncOutlined spin/>,
                text: "Compiling",
                textAll: t("Compiling"),
                color: 'blue'
            },
            Judging: {
                icon: <SyncOutlined spin/>,
                text: "Judging",
                textAll: t("judging"),
                color: 'blue'
            },
            End: {
                icon: <CloseCircleOutlined/>,
                text: "END",
                textAll: t("End"),
                color: undefined,
            },
            Cancelled: {
                icon: <CloseCircleOutlined/>,
                text: "Cancelled",
                textAll: t("canceled"),
                color: "black"
            }
        }

        const type = NameList[this.props.caseType]

        const visible =
            !(this.props.caseTime === undefined &&
                this.props.caseMemory === undefined &&
                this.props.caseScore === undefined)

        const content: any = visible ? (
            <>
                {
                    this.props.caseTime !== undefined && (
                        <>
                            <Text strong>
                                {this.props.t("Time")}
                            </Text> : {this.props.caseTime} ms
                        </>
                    )
                }
                {
                    this.props.caseMemory !== undefined && (
                        <>
                            <br/>
                            <Text strong>
                                {this.props.t("Memory")}
                            </Text> : {Math.floor(this.props.caseMemory / 1024)} MB
                        </>
                    )
                }
                {
                    this.props.caseScore !== undefined && this.props.scoreMod === "show" && (
                        <>
                            <br/>
                            <Text strong>
                                {this.props.t("Score")}
                            </Text> : {this.props.caseType === TestCaseStates.Accepted ? this.props.caseScore : 0}
                        </>
                    )
                }
            </>
        ) : <></>

        return (
            <>
                {[''].map(() => {
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
                                    className={"test-case-e"}
                                >
                                <Popover content={content} visible={visible && this.state.MouseIn}
                                         zIndex={2001}>
                                    <Tag icon={CaseList[type].icon} color={CaseList[type].color}>
                                        #{this.props.caseIndex} {CaseList[type].text}
                                    </Tag>
                                </Popover>
                            </span>
                            )
                        case "tag-simple":
                            return (
                                <Tooltip title={CaseList[type].textAll}>
                                    <Tag color={CaseList[type].tagColor} className={"tag-simple"}>
                                        {CaseList[type].text}
                                    </Tag>
                                </Tooltip>
                            )

                        case "text":
                            return (
                                <Title
                                    level={ck(this.props.textLevel, 5)}
                                    type={CaseList[type].type}
                                    className={"TestCase-text"}
                                >
                                    {CaseList[type].textAll + (this.props.append !== undefined ? this.props.append : "")}
                                </Title>
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
                                        <Popover content={content} visible={visible && this.state.MouseIn}
                                                 zIndex={2001}>
                                             <Tag color={CaseList[type].color}> #{this.props.caseIndex} </Tag>
                                        </Popover>
                                    </span>
                            )
                    }
                    return undefined
                })}
            </>
        )
    }
}

export default withTranslation()(TestCase)
