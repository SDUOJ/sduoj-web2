import {withTranslation} from "react-i18next";
import {Button, Form, Select, Switch} from "antd";
import {PREDEFINED_CHECKERS, SPJ_Code, SPJ_Config} from "../../../../Config/constValue";
import React, {useEffect, useState} from "react";
import CodeEditor from "../../../common/CodeEditor";

const BodyChecker = (props: any) => {
    const [selectValue, setSelectValue] = useState<string>("lcmp.cpp")
    const [source, setSource] = useState<string>("")
    const [spj, setSpj] = useState<string>("")


    useEffect(() => {
        if (selectValue === "@") {
            props.onChange({
                source: source,
                spj: spj
            })
        } else {
            setSource("")
            setSpj("")
            props.onChange({
                source: selectValue,
                spj: null
            })
        }
    }, [source, spj, selectValue])

    return (
        <>
            <Select value={selectValue} onChange={setSelectValue}>
                <Select.Option value={"@"}> 自定义 </Select.Option>
                {PREDEFINED_CHECKERS.map(({name, description}) => {
                    return (
                        <Select.Option value={name}>{name + " - " + description}</Select.Option>
                    )
                })}
            </Select>
            {selectValue === "@" && (
                <div className={"ProblemAddChecker"} style={{paddingTop: 20}}>
                    <div style={{marginBottom: 20}}>
                        <Button type={"primary"} ghost size={"small"} onClick={() => {
                            setSource(SPJ_Code)
                            setSpj(SPJ_Config)
                        }}>使用C++预设</Button>
                    </div>
                    <Form.Item label={"代码"} required>
                        <CodeEditor lang={"text"} code={source} save={setSource}/>
                    </Form.Item>
                    <Form.Item label={"配置"} required>
                        <CodeEditor lang={"text"} code={spj} save={setSpj}/>
                    </Form.Item>
                </div>
            )}
        </>
    )
}

export default withTranslation()(BodyChecker)