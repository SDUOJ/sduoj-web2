import {Button, Card} from "antd";
import Title from "antd/es/typography/Title";
import MarkdownText from "../../Utils/MarkdownText";
import React, {useEffect, useState} from "react";

const SubjectivePreview = (props: any) => {
    const [mxLength, setMxLength] = useState<any>(240);
    const [show, setShow] = useState<boolean>(false);

    useEffect(() => {
        setMxLength(240)
    }, [props.description, props.answer])


    return (
        <>
            <div>
                <Card
                    title={<Title level={5}> 原问题 </Title>}
                    style={{marginTop: 24}}
                    extra={<Button type={"default"} onClick={() => {
                        if (mxLength === 998244353) {
                            setMxLength(240)
                        } else {
                            setMxLength(998244353)
                        }
                    }}>{mxLength === 998244353 ? "收齐全文" : "展开全文"}</Button>}
                >
                    <MarkdownText
                        id={"proDescription"}
                        text={(props?.description ?? "").substr(0, mxLength)}
                    />
                </Card>
            </div>
            <Card
                title={
                    <Title level={5}> 学生答案 </Title>
                }
                style={{marginTop: 24}}
                extra={<Button type={"default"} onClick={() => {
                    setShow(!show)
                }}>{show ? "显示渲染" : "显示原文"}</Button>}
            >
                {show && (
                    <pre>
                        {props?.answer?.[0]}
                    </pre>
                )}
                {!show && (
                    <MarkdownText
                        id={"userAnswer"}
                        text={props?.answer?.[0]}
                    />
                )}
            </Card>
        </>
    )
}

export default SubjectivePreview
