import {useTranslation} from "react-i18next";
import {Button, Card} from "antd";
import Title from "antd/es/typography/Title";
import MarkdownText from "../../Utils/MarkdownText";
import React, {useEffect, useState} from "react";

const SubjectivePreview = (props: any) => {
    const {t} = useTranslation();
    const [mxLength, setMxLength] = useState<any>(240);
    const [show, setShow] = useState<boolean>(false);

    const type = props.type; // 0: 文件; 1: 维持当前; 2: 验收(外部隐藏)

    useEffect(() => {
        setMxLength(240)
    }, [props.description, props.answer, type])

    // type=0 文件列表展示（answer 假设是文件对象数组）
    const renderFileAnswer = () => {
        const files = props?.answer ?? [];
        if (!Array.isArray(files) || files.length === 0) {
            return <span style={{color: '#999'}}>{t('Empty') ?? 'Empty'}</span>
        }
        return (
            <ul style={{paddingLeft: 16}}>
                {files.map((f: any) => {
                    const url = f.fileId ? `/api/filesys/download/${f.fileId}/${encodeURIComponent(f.fileName || 'file')}` : undefined
                    return (
                        <li key={f.fileId || f.fileName} style={{marginBottom: 8}}>
                            {url ? <a href={url} target={'_blank'} rel={'noreferrer'}>{f.fileName}</a> : f.fileName}
                        </li>
                    )
                })}
            </ul>
        )
    }

    return (
        <>
            {type !== 0 && (
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
            )}
            <Card
                title={<Title level={5}> {t("StudentAnswer")} </Title>}
                style={{marginTop: 24}}
                extra={type === 1 && (
                    <Button type={"default"} onClick={() => {
                        setShow(!show)
                    }}>{show ? t("ShowRendered") : t("ShowRaw")}</Button>
                )}
            >
                {type === 0 && renderFileAnswer()}
                {type === 1 && (
                    <>
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
                    </>
                )}
            </Card>
        </>
    )
}

export default SubjectivePreview
