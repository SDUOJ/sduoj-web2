import {useTranslation} from "react-i18next";
import {Button, Card} from "antd";
import Title from "antd/es/typography/Title";
import MarkdownText from "../../Utils/MarkdownText";
import React, {useEffect, useState} from "react";

const SubjectivePreview = (props: any) => {
    const {t} = useTranslation();
    const [mxLength, setMxLength] = useState<any>(240);
    const [show, setShow] = useState<boolean>(false);

    useEffect(() => {
        setMxLength(240)
    }, [props.description, props.answer])


    return (
        <>
            <div>
                <Card
                    title={<Title level={5}> {t("OriginalProblem")} </Title>}
                    style={{marginTop: 24}}
                    extra={<Button type={"default"} onClick={() => {
                        if (mxLength === 998244353) {
                            setMxLength(240)
                        } else {
                            setMxLength(998244353)
                        }
                    }}>{mxLength === 998244353 ? t("CollapseFullText") : t("ExpandFullText")}</Button>}
                >
                    <MarkdownText
                        id={"proDescription"}
                        text={(props?.description ?? "").substr(0, mxLength)}
                    />
                </Card>
            </div>
            <Card
                title={
                    <Title level={5}> {t("StudentAnswer")} </Title>
                }
                style={{marginTop: 24}}
                extra={<Button type={"default"} onClick={() => {
                    setShow(!show)
                }}>{show ? t("ShowRendered") : t("ShowRaw")}</Button>}
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
