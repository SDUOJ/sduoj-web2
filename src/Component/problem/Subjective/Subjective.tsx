import MarkdownText from "../../../Utils/MarkdownText";
import {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {Alert, Button, Card, message, Space, Upload, Select, Divider} from "antd";
import Editor from "../../common/Editor";
import Title from "antd/es/typography/Title";
import {isValueEmpty} from "../../../Utils/empty";

// 主观题组件：支持三种子类型
// 0 文件题 1 文本题 2 验收题（排队）

const Subjective = (props: any) => {
    // ---------------- State ----------------
    const [answerSheet, setAnswerSheet] = useState<any>()
    const [open, setOpen] = useState<boolean>(false)              // 编辑开关（文件题/文本题）
    const [segments, setSegments] = useState<string[]>([""])      // 文本题多段
    const [fileAnswers, setFileAnswers] = useState<any[]>([])     // 本地已上传（未必提交）
    const [serverFileAnswers, setServerFileAnswers] = useState<any[]>([]) // 服务器已保存
    const [queueValue, setQueueValue] = useState<string>("")       // 验收题选择的队列
    const [subType, setSubType] = useState<number>(1)              // 当前子类型
    const [refreshCooldown, setRefreshCooldown] = useState<number>(0) // 验收题刷新冷却秒数

    // ---------------- Helpers ----------------
    const detectSubType = (as: any, problemInfo: any): number => {
        if (problemInfo?.type !== undefined) return problemInfo.type
        if (!as) return 1
        if (Array.isArray(as.answer_m)) {
            if (as.answer_m.length > 0 && typeof as.answer_m[0] === 'object' && as.answer_m[0] !== null && as.answer_m[0].fileId) return 0
            return 1
        }
        if (typeof as.answer_m === 'string') return 2
        if (as.acceptanceQueue !== undefined) return 2
        return 1
    }

    const updateAnswerSheet = () => {
        return props.getAS().then((res: any) => {
            if (res.answer_m === null || res.answer_m === undefined) res.answer_m = [""]
            const st = detectSubType(res, props.problemInfo)
            setSubType(st)
            if (st === 1) {
                // 文本题
                let arr: string[] = []
                if (Array.isArray(res.answer_m)) arr = [...res.answer_m]
                else if (typeof res.answer_m === 'string') arr = [res.answer_m]
                if (arr.length === 0) arr = [""]
                setSegments(arr)
            } else if (st === 0) {
                // 文件题
                if (!Array.isArray(res.answer_m)) res.answer_m = []
                setFileAnswers(res.answer_m || [])
                setServerFileAnswers(res.answer_m || [])
            } else if (st === 2) {
                // 验收题，answer_m 为已加入的队列名
                if (typeof res.answer_m === 'string') setQueueValue(res.answer_m)
            }
            setAnswerSheet(res)
            return res
        })
    }

    // 刷新冷却计时器
    useEffect(() => {
        if (refreshCooldown <= 0) return
        const timer = setInterval(() => {
            setRefreshCooldown(prev => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [refreshCooldown])

    // 初始化 / problemInfo 变化重新拉取
    useEffect(() => {
        updateAnswerSheet()
        setOpen(false)
    }, [props.problemInfo])

    // problemInfo.type 变化时尝试重算 subtype
    useEffect(() => {
        if (!answerSheet) return
        const st = detectSubType(answerSheet, props.problemInfo)
        if (st !== subType) setSubType(st)
    }, [props.problemInfo?.type])

    // ---------------- Render ----------------
    return (
        <>
            <MarkdownText
                id={"subjective-content-" + props.key_o}
                text={props.problemInfo?.description}
            />
            {subType !== 2 && (
                <Card title={<Title level={5}> 我的答案 </Title>} style={{marginTop: 24}}>
                    {/* 文件题 */}
                    {subType === 0 && (
                    <>
                        <div style={{fontWeight: 'bold', marginBottom: 12}}>提交文件</div>
                        {open === false && (
                            <>
                                {props.problemInfo?.config?.fileList?.map((cfg: any, idx: number) => {
                                    const serverExist = serverFileAnswers[idx]
                                    return (
                                        <div key={idx} style={{marginBottom: 8}}>
                                            {cfg.name}：{serverExist ? (
                                                <a onClick={() => {
                                                    const url = require("../../../Utils/API/c-api").default.getFileDownloadUrl(serverExist.fileId, serverExist.fileName)
                                                    window.open(url)
                                                }}>{serverExist.fileName}</a>
                                            ) : (
                                                <span style={{color: 'red'}}>未提交</span>
                                            )}
                                        </div>
                                    )
                                })}
                                {props.finish !== true && (
                                    <div style={{textAlign: 'center', marginTop: 16}}>
                                        <Button type="primary" onClick={() => setOpen(true)}>开始作答</Button>
                                    </div>
                                )}
                            </>
                        )}
                        {open === true && (
                            <>
                                {props.problemInfo?.config?.fileList?.map((cfg: any, idx: number) => {
                                    const exist = fileAnswers[idx]
                                    const serverExist = serverFileAnswers[idx]
                                    const unsaved = !!exist && (!!serverExist ? (exist.fileId !== serverExist.fileId) : true)
                                    return (
                                        <div key={idx} style={{marginBottom: 12, border: '1px dashed #ccc', padding: 12, borderRadius: 6}}>
                                            <Space direction="vertical" style={{width: '100%'}}>
                                                <div>
                                                    {cfg.name}（最大 {cfg.maxSizeMB}MB / {cfg.fileType}）
                                                    {exist && (
                                                        <span style={{marginLeft: 8, color: unsaved ? 'red' : '#52c41a'}}>
                                                            {exist.fileName}
                                                            {unsaved && <span style={{marginLeft: 8}}>未提交</span>}
                                                            {!unsaved && (
                                                                <a style={{marginLeft:8}} onClick={() => {
                                                                    const url = require("../../../Utils/API/c-api").default.getFileDownloadUrl(exist.fileId, exist.fileName)
                                                                    window.open(url)
                                                                }}>下载</a>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        if (cfg.maxSizeMB && file.size > cfg.maxSizeMB * 1024 * 1024) {
                                                            message.error(`文件超过大小限制 ${cfg.maxSizeMB}MB`)
                                                            return Upload.LIST_IGNORE
                                                        }
                                                        if (cfg.fileType) {
                                                            const allow = cfg.fileType.toLowerCase().split(',').map((s:string)=>s.trim())
                                                            const ok = allow.some((ext:string)=> ext && file.name.toLowerCase().endsWith('.'+ext))
                                                            if (!ok) {
                                                                message.error(`文件类型不符合要求: 需要 ${cfg.fileType}`)
                                                                return Upload.LIST_IGNORE
                                                            }
                                                        }
                                                        return true
                                                    }}
                                                    customRequest={(options: any) => {
                                                        const {file, onSuccess, onError} = options
                                                        import("../../../Utils/fileUpload").then(mod => {
                                                            mod.fileUpload([file as File], (value: any) => {
                                                                const newAnswers = [...fileAnswers]
                                                                newAnswers[idx] = {fileId: value.fileId || value.id || value.file_id, fileName: value.fileName || value.name}
                                                                setFileAnswers(newAnswers)
                                                                props.getAS().then((remote: any) => {
                                                                    if (!Array.isArray(remote.answer_m)) remote.answer_m = []
                                                                    setServerFileAnswers(remote.answer_m || [])
                                                                })
                                                                onSuccess && onSuccess(value)
                                                            })
                                                        }).catch(e => onError && onError(e))
                                                    }}
                                                    showUploadList={false}
                                                >
                                                    <Button type="dashed">{exist ? '重新上传' : '上传'}</Button>
                                                </Upload>
                                            </Space>
                                        </div>
                                    )
                                })}
                                {props.finish !== true && (
                                    <div style={{textAlign: 'center'}}>
                                        <Button type="primary" onClick={() => {
                                            const expected = props.problemInfo?.config?.fileList?.length || 0
                                            if (fileAnswers.length !== expected || fileAnswers.filter(f => f && f.fileId).length !== expected) {
                                                message.error(`文件数量不匹配，需 ${expected} 个`)
                                                return
                                            }
                                            props.onAnswerM(fileAnswers).then(() => {
                                                message.success('已提交')
                                                updateAnswerSheet().then(()=> setOpen(false))
                                            })
                                        }}>提交答案</Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                    {/* 文本题 */}
                    {subType === 1 && (
                    <>
                        {open === false && (
                            <MarkdownText
                                id={"subjective-content-myAnswer-" + props.key_o}
                                text={isValueEmpty(segments[0]) ? "<div style='text-align: center; font-weight: bold'>未作答</div>" : segments.map((s,i)=>`<p><b>[${i+1}]</b></p>\n${s}`).join('\n\n')}
                            />
                        )}
                        {open === true && (
                            <>
                                {segments.map((seg, i) => (
                                    <div key={i} style={{marginBottom: 16}}>
                                        <Editor
                                            height={200}
                                            value={seg}
                                            onChange={(value: string) => {
                                                const newS = [...segments]
                                                newS[i] = value
                                                setSegments(newS)
                                            }}
                                        />
                                    </div>
                                ))}
                                <Space>
                                    <Button type="dashed" onClick={() => {
                                        const limit = props.problemInfo?.config?.maxCount || 10
                                        if (segments.length >= limit) {
                                            message.warning(`已达最大段数 ${limit}`)
                                            return
                                        }
                                        setSegments([...segments, ""])
                                    }}>新增段落</Button>
                                    {segments.length > 1 && <Button danger onClick={()=>{
                                        setSegments(segments.slice(0,-1))
                                    }}>减少最后一段</Button>}
                                </Space>
                            </>
                        )}
                        {props.finish !== true && (
                            <div style={{textAlign: "center", marginTop: 24}}>
                                <Button type={"primary"} onClick={() => {
                                    if (open === false) {
                                        setOpen(true)
                                    } else {
                                        const data = segments
                                        props.onAnswerM(data).then(() => {
                                            message.success('答案保存成功')
                                            setOpen(false)
                                        })
                                    }
                                }}>{open ? "提交答案" : "开始作答"}</Button>
                                <div style={{marginTop: 12, fontWeight: "bold", color: "red"}}>
                                    请务必在完成本题作答后，点击【提交答案】，否则答案可能不会保存
                                </div>
                            </div>
                        )}
                    </>
                )}
                </Card>
            )}

            {/* 验收题（独立卡片） */}
            {subType === 2 && (
                <Card title={<Title level={5}> 验收 </Title>} style={{marginTop: 24}}>
                    <div style={{marginBottom: 16}}>
                        <b>当前状态：</b>
                        {answerSheet?.acceptanceFinished ? '已完成验收' : (
                            answerSheet?.acceptanceRank ? `排队中，当前序号 ${answerSheet.acceptanceRank}` : '未排队'
                        )}
                        {(!answerSheet?.acceptanceFinished && answerSheet?.acceptanceRank) && (
                            <div style={{marginTop: 8}}>当前队列：{queueValue || answerSheet?.answer_m}</div>
                        )}
                    </div>
                    {/* 未排队时可选择队列 */}
                    {(!answerSheet?.acceptanceRank && !answerSheet?.acceptanceFinished) && (
                        <div style={{marginBottom: 12}}>
                            <Select
                                style={{minWidth: 240}}
                                placeholder={'选择验收队列'}
                                value={queueValue || undefined}
                                onChange={(v)=>setQueueValue(v)}
                                options={(props.problemInfo?.config?.review_queue||[]).map((q:string)=>({label:q,value:q}))}
                                disabled={props.finish === true}
                                allowClear
                            />
                        </div>
                    )}
                    {props.finish !== true && !answerSheet?.acceptanceFinished && (
                        <Space>
                            {/* 加入队列按钮：仅在未排队时显示 */}
                            {(!answerSheet?.acceptanceRank) && (
                                <Button type="primary" disabled={!queueValue} onClick={() => {
                                    if (!queueValue) return
                                    props.onAnswerM(queueValue).then(()=>{
                                        message.success('已加入队列')
                                        updateAnswerSheet()
                                    })
                                }}>加入队列</Button>
                            )}
                            {/* 取消排队与刷新：仅在已排队且未完成验收时显示 */}
                            {(!!answerSheet?.acceptanceRank) && (
                                <>
                                    <Button danger onClick={() => {
                                        props.onAnswerM('').then(()=>{
                                            message.success('已取消排队')
                                            setQueueValue('')
                                            updateAnswerSheet()
                                        })
                                    }}>取消排队</Button>
                                    <Button
                                        disabled={refreshCooldown>0}
                                        onClick={() => {
                                            if (refreshCooldown>0) return
                                            updateAnswerSheet().then(()=>{
                                                message.success('刷新成功')
                                                setRefreshCooldown(10)
                                            })
                                        }}
                                    >{refreshCooldown>0 ? `刷新(${refreshCooldown}s)` : '刷新'}</Button>
                                </>
                            )}
                        </Space>
                    )}
                    <Divider/>
                    <Alert type="info" message="进入队列后请耐心等待验收；可点击刷新更新序号" />
                </Card>
            )}
            {props.finish === true && (
                <Card title={<Title level={5}> 批阅与答案 </Title>} style={{marginTop: 24}}>
                    {isValueEmpty(answerSheet?.judgeLog) && (
                        <>
                            {isValueEmpty(answerSheet?.judgeLock) && (
                                <>未批阅</>
                            )}
                            {!isValueEmpty(answerSheet?.judgeLock) && (
                                <>正在批阅</>
                            )}
                        </>
                    )}
                    {answerSheet?.judgeLog && answerSheet.judgeLog.map((data: any, index: number) => {
                        const config = answerSheet?.judgeConfig[index];
                        return (
                            <>
                                <Card
                                    title={
                                        <div style={{fontSize: 16}}>
                                            【{data.jScore}/{data.score}】
                                            {data.name}
                                        </div>
                                    }
                                    size={"small"}
                                    bordered={false}
                                >
                                    {config && !isValueEmpty(config?.answer) && (
                                        <Alert
                                            message={
                                                <MarkdownText
                                                    id={`subjective-problem-answer-${index}`}
                                                    text={config?.answer}
                                                />
                                            }
                                            type="success"
                                        />
                                    )}
                                </Card>
                            </>
                        )
                    })}
                    {!isValueEmpty(answerSheet?.judgeComment) && (
                        <Card
                            title={
                                <span style={{fontSize: 16}}> 评阅备注 </span>
                            }
                            size={"small"}
                            bordered={false}
                        >
                            <Alert
                                message={
                                    <MarkdownText
                                        id={`subjective-problem-answer-comment`}
                                        text={answerSheet?.judgeComment}
                                    />
                                }
                                type="info"
                            />
                        </Card>
                    )}
                </Card>
            )}
        </>
    )
}

export default withRouter(Subjective)
