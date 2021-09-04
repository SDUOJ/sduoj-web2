import {Component} from "react";
import {Alert, Progress, Spin, Steps, Tag} from 'antd';
import {WithTranslation, withTranslation} from "react-i18next";

import {LoadingOutlined} from '@ant-design/icons';
import TestCase, {TestCaseProp, TestCaseStates} from "./TestCase";


enum CompileStates {
    Waiting,
    Compiling,
    Success,
    Warning,
    Failed,
    SystemError
}

interface SProcessing {
    currentStep: number
    showStep: number
    PendingNumberInit: number
    PendingNumberLeft: number
    CompileState: CompileStates
    CompileMessage: string
    IsRunning: boolean
    TestCaseStateList: TestCaseProp[]
}

interface IProcessingProp extends WithTranslation {
    TestCaseNumber: number
}

class Processing extends Component<IProcessingProp, SProcessing> {
    constructor(props: Readonly<IProcessingProp> | IProcessingProp) {
        super(props);

        let TestCaseInit: TestCaseProp[] = []
        for(let i = 1; i <= this.props.TestCaseNumber; i ++){
            TestCaseInit.push({caseIndex: i, caseType: Math.floor(Math.random()*7)})
        }

        this.state = {
            IsRunning: false,
            currentStep: 2,
            showStep: 2,
            PendingNumberInit: 0,
            PendingNumberLeft: 0,
            CompileState: CompileStates.Compiling,
            CompileMessage: "solution.cc: In function 'int main()':\n" +
                "solution.cc:22:9: error: 'sortList' was not declared in this scope\n" +
                "  list = sortList(list);\n" +
                "         ^~~~~~~~\n" +
                "solution.cc:22:9: note: suggested alternative: 'sort'\n" +
                "  list = sortList(list);\n" +
                "         ^~~~~~~~\n" +
                "         sort",
            TestCaseStateList: TestCaseInit
        }


        /*
        "solution.cc: In function 'int main()':\n" +
                    "solution.cc:22:9: error: 'sortList' was not declared in this scope\n" +
                    "  list = sortList(list);\n" +
                    "         ^~~~~~~~\n" +
                    "solution.cc:22:9: note: suggested alternative: 'sort'\n" +
                    "  list = sortList(list);\n" +
                    "         ^~~~~~~~\n" +
                    "         sort"
        * */
    }


    OnChange = (current: number) => {
        this.setState({showStep: current});
    };

    render() {
        const {Step} = Steps;
        const nameList = ['pending', "compile", "evaluation", "summary"]

        const getStatus = (name: string) => {
            if (name === "compile"
                && (this.state.CompileState === CompileStates.Failed
                    || this.state.CompileState === CompileStates.SystemError))
                return "error"

            // if(!this.state.IsRunning) return "finish"

            const NameIndex = nameList.indexOf(name)
            if (this.state.currentStep === NameIndex) return "process";
            if (this.state.currentStep < NameIndex) return "wait";
            if (this.state.currentStep > NameIndex) return "finish";
        }
        const getDisabled = (name: string) => {
            return this.state.currentStep < nameList.indexOf(name);
        }
        const getIcon = (name: string) => {
            return (this.state.IsRunning && this.state.currentStep === nameList.indexOf(name)) ?
                <LoadingOutlined/> : undefined
        }
        const getCompileMessage = () => {
            if (this.state.CompileMessage.length === 0) {
                return this.props.t('NoMoreInfo')
            } else return (
                <pre>
                    {this.state.CompileMessage}
                </pre>

            )
        }

        let steps: { [key: string]: any } = {
            pending: {
                title: this.props.t("Pending"),
                icon: getIcon("pending"),
                status: getStatus("pending"),
                disabled: getDisabled("pending"),
                cssClass: "steps-content-pending",
                content: (
                    <>
                        {
                            [''].map(() => {
                                if (this.state.PendingNumberLeft === 0) {
                                    return <Progress type="circle" percent={100}
                                                     format={() => this.props.t("Done")}/>
                                } else {
                                    return <Progress
                                        className={"Progress-pending"}
                                        type="circle"
                                        percent={this.state.PendingNumberLeft * 100 / this.state.PendingNumberInit}
                                        format={() => `${this.props.t("HaiYou")}${this.state.PendingNumberLeft} ${this.props.t("submissionLeft")}`}/>
                                }
                            })
                        }
                    </>
                )
            },
            compile: {
                title: this.props.t("Compile"),
                icon: getIcon("compile"),
                status: getStatus("compile"),
                disabled: getDisabled("compile"),
                cssClass: "steps-content-compile",
                content: (
                    <>
                        <Spin tip={this.props.t("Compiling")}
                              spinning={this.state.CompileState === CompileStates.Compiling}
                              className={"steps-content-compile-spin"}>
                            {
                                [""].map(() => {
                                    switch (this.state.CompileState) {
                                        case CompileStates.Success:
                                            return (<Alert message={this.props.t("CompileSuccess")}
                                                           description={getCompileMessage()}
                                                           type="success" showIcon/>)
                                        case CompileStates.Failed:
                                            return (<Alert message={this.props.t("CompileFailed")}
                                                           description={getCompileMessage()}
                                                           type="error" showIcon/>)
                                        case CompileStates.SystemError:
                                            return (<Alert message={this.props.t("SystemError")}
                                                           description={this.props.t("CallAdmin")}
                                                           type="error" showIcon/>)
                                        case CompileStates.Warning:
                                            return (<Alert message={this.props.t("CompileSuccessWithWarning")}
                                                           description={getCompileMessage()}
                                                           type="warning" showIcon/>)
                                    }
                                })
                            }
                        </Spin>
                    </>
                )
            },
            evaluation: {
                title: this.props.t("Evaluation"),
                icon: getIcon("evaluation"),
                status: getStatus("evaluation"),
                disabled: getDisabled("evaluation"),
                cssClass: "steps-content-evaluation",
                content: (
                    <>
                        {
                            this.state.TestCaseStateList.map((value)=>{
                                return <TestCase {...value} />
                            })
                        }
                    </>
                )
            },
            summary: {
                title: this.props.t("Summary"),
                icon: getIcon("summary"),
                status: getStatus("summary"),
                disabled: getDisabled("summary"),
                cssClass: "steps-content-pending",
                content: (
                    <>
                    </>
                )
            }


        }

        return (
            <>
                <Steps type="navigation" current={this.state.showStep} onChange={this.OnChange}>
                    {
                        nameList.map((name) => {
                            return <Step
                                title={steps[name].title}
                                icon={steps[name].icon}
                                status={steps[name].status}
                                disabled={steps[name].disabled}
                            />
                        })
                    }
                </Steps>
                <div className={`steps-content ${steps[nameList[this.state.showStep]].cssClass}`}>
                    {steps[nameList[this.state.showStep]].content}
                </div>
            </>
        )
    }

}

export default withTranslation()(Processing)