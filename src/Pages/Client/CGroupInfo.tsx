import {withRouter} from "react-router-dom";
import {Card, Tabs, Tag} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import cApi from "Utils/API/c-api"
import Title from "antd/es/typography/Title";
import {isValueEmpty} from "../../Utils/empty";
import ContestList from "../../Component/contest/ContestList";
import QuitGroupBtn from "../../Component/group/QuitGroupBtn";
import JoinGroupBtn from "../../Component/group/JoinGroupBtn";
import {connect} from "react-redux";
import {CommonState} from "../../Redux/Action/common";
import GroupUserListCard from "../../Component/common/GroupUserListCard";
import ProblemSetList from "../../Component/problemSet/ProblemSetList";
import {useTranslation} from "react-i18next";
import MarkdownText from "../../Utils/MarkdownText";


const CGroupInfo = (props: any) => {
    const groupId = props.match.params.groupId;
    const [groupInfo, setGroupInfo] = useState<any>();
    const [activeKey, setActiveKey] = useState<string>("Announcement")
    const [psActiveKey, setPsActiveKey] = useState<string>()
    const [psSum, setPsSum] = useState<string>()
    const [psTabItems, setPsTabItems] = useState<any>()
    const {t} = useTranslation()


    useEffect(() => {
        const keyValueData_g = props.keyValueData["Group-C-activeKey-" + groupId]
        const keyValueData_ps = props.keyValueData[`Group-C-activeKey-${groupId}-ProblemSet`]

        cApi.getGroupInfo({groupId: groupId}).then((value: any) => {
            setGroupInfo(value)
        })
        const act = keyValueData_g
        if (act !== undefined)
            setActiveKey(act)

        cApi.getProblemSetLabelList({groupId: groupId}).then((res: any) => {
            const label = res.label;
            const score = res.score;
            const tb: any = []
            for (let x of label) {
                tb.push({
                    key: x,
                    label: x + `(${score[x]}${t("point")})`,
                    children: <ProblemSetList groupId={groupId} tag={x}/>
                })
            }
            if (label.length !== 0) setPsActiveKey(label[0])
            setPsTabItems(tb)
            setPsSum(res.sum);
        })

        const act2 = keyValueData_ps
        if (act2 !== undefined)
            setPsActiveKey(act2)

    }, [groupId])

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>

                    <div>
                        <Card
                            title={
                                <Title level={2}>{groupInfo?.title}
                                    <span style={{color: "grey"}}> (Group ID: {groupInfo?.groupId})</span>
                                </Title>
                            }
                            extra={
                                <div>
                                    {groupInfo?.status === 1 && (
                                        <Tag color={"green"}>{t("ApplicationInProgress")}</Tag>
                                    )}
                                    {groupInfo?.status === 2 && (
                                        <QuitGroupBtn groupId={groupInfo?.groupId} groupName={groupInfo?.title}/>
                                    )}
                                    {groupInfo?.status === 3 && (
                                        <Tag color={"orange"}>{t("ApplicationRejected")}</Tag>
                                    )}
                                    {(groupInfo?.status === 0 || groupInfo?.status === 3) && groupInfo?.openness !== 2 && (
                                        <JoinGroupBtn groupId={groupInfo?.groupId} groupName={groupInfo?.title}/>
                                    )}
                                    {groupInfo?.status === 0 && groupInfo?.openness === 2 && (
                                        <Tag color={"red"}>{t("private")}</Tag>
                                    )}
                                </div>
                            }
                            style={{marginTop: 25}}>

                            <Tabs activeKey={activeKey} onChange={(atk) => {
                                setActiveKey(atk)
                                props.setKeyValueData("Group-C-activeKey-" + groupId, atk)
                            }}>
                                <Tabs.TabPane tab={t("Announcement")} key="Announcement">
                                    <MarkdownText
                                        id={"AnnouncementMD"}
                                        text={isValueEmpty(groupInfo?.markdown) ? t("notAvailable") : groupInfo?.markdown}/>
                                </Tabs.TabPane>
                                {!isValueEmpty(psTabItems) && psTabItems.length !== 0 && (
                                    <Tabs.TabPane tab={`${t("problemSet")}(${psSum}${t("point")})`} key="practice">
                                        <Tabs activeKey={psActiveKey} onChange={(v: string) => {
                                            setPsActiveKey(v)
                                            props.setKeyValueData(`Group-C-activeKey-${groupId}-ProblemSet`, v)
                                        }}>
                                            {psTabItems.map((item: any) => {
                                                return (
                                                    <Tabs.TabPane tab={item.label} key={item.key}>
                                                        {item.children}
                                                    </Tabs.TabPane>
                                                )
                                            })}
                                        </Tabs>
                                    </Tabs.TabPane>
                                )}
                                <Tabs.TabPane tab={t("contest")} key="contest">
                                    <ContestList
                                        name={"GroupInfo-" + groupId + "-ContestList"}
                                        apiProp={{groupId: groupId}}
                                        useGroup={false}
                                    />
                                </Tabs.TabPane>
                                <Tabs.TabPane tab={t("user")} key={"member"}>
                                    {groupInfo !== undefined && (
                                        <GroupUserListCard members={groupInfo.members}/>
                                    )}
                                </Tabs.TabPane>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: CommonState = state.CommonReducer
    return {
        keyValueData: State.keyValueData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setKeyValueData: (key: string, value: any) => dispatch({
        type: "setKeyValue",
        key: key,
        value: value
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(CGroupInfo))
