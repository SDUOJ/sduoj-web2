import {Link, withRouter} from "react-router-dom";
import {Button, Card, Tabs} from "antd";
import {isValueEmpty} from "../../Utils/empty";
import MarkdownText from "../../Utils/MarkdownText";
import React, {Dispatch, useEffect, useState} from "react";
import useProblemSetInfo from "./API/getProblemSetInfo";
import {UrlPrefix} from "../../Config/constValue";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {UserState} from "../../Type/Iuser";
import PSTakePicture from "./PSTakePicture";
import {LeftOutlined} from "@ant-design/icons";
import "../../Assert/css/problemSetHeader.css";

const PSHeader = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    const path = props.location.pathname

    const onError = () => {
        props.history.replace(UrlPrefix + "/problemSetPublic/" + problemSetId)
    }

    const problemSetInfo = useProblemSetInfo(problemSetId, onError)


    const menuData = [
        {
            name: props.t("Overview"),
            link: UrlPrefix + "/problemSet/" + problemSetId + "/overview",
            re: /\/problemSet\/.*\/overview/g
        },
        {
            name: props.t("Problem"),
            link: UrlPrefix + "/problemSet/" + problemSetId + "/problem/0/0",
            re: /\/problemSet\/.*\/problem/g
        },
        {
            name: props.t("Review"),
            link: UrlPrefix + "/problemSet/" + problemSetId + "/review",
            re: /\/problemSet\/.*\/review/g
        },
        {
            name: props.t("Rank"),
            link: UrlPrefix + "/problemSet/" + problemSetId + "/rank",
            re: /\/problemSet\/.*\/rank/g
        },
        {
            name: props.t("SubmissionList"),
            link: UrlPrefix + "/problemSet/" + problemSetId + "/submission",
            re: /\/problemSet\/.*\/submission/g
        },
    ]

    const [nowKey, setNowKey] = useState<any>()

    const menuList: any = [props.t("Overview"), props.t("Problem")]
    if (problemSetInfo?.isAdmin === true)
        menuList.push(props.t("Review"), props.t("SubmissionList"), props.t("Rank"))


    useEffect(() => {
        if (path.match(/\/problemSet\/[0-9]*\/?$/g) !== null) {
            props.history.replace(menuData[0].link)
        }
        menuData.map((value) => {
            if (path.match(value.re) !== null) setNowKey(value.name)
            return undefined
        })
    }, [path])


    return (
        <>
            {problemSetInfo !== undefined && (
                <>
                    <Card
                        style={{marginTop: 25}}
                        extra={
                            <div style={{marginTop: 12}}>
                                {/*<PSTakePicture/>*/}
                            </div>
                        }
                        title={<>
                            <Link to={UrlPrefix + `/group/${problemSetInfo.groupId}`}>
                                <Button size={"small"} icon={<LeftOutlined/>}> {props.t("Return")} </Button>
                            </Link>
                        </>}
                    >
                        {problemSetInfo.config.useSameSE === 1 && (
                            <>
                                <div style={{textAlign: "center"}}>
                                    <span style={{fontWeight: "bold", fontSize: "1.45rem"}}>
                                        <span style={{paddingRight: 10}}>{problemSetInfo.name}</span>
                                    </span>
                                </div>
                            </>
                        )}
                        {!isValueEmpty(problemSetInfo.description)
                            && !isValueEmpty(problemSetInfo.description.trim()) && (
                                <MarkdownText id={"problemSet-markdownDescription"}
                                              text={problemSetInfo.description.trim()}/>
                            )}
                    </Card>
                    <Tabs
                        className={'ps-header-tabs'}
                        activeKey={nowKey}
                        onChange={(activeKey) => {
                            menuData.forEach(item => {
                                if (item.name === activeKey) props.history.push(item.link)
                            })
                        }}
                        items={menuData
                            .filter(m => menuList.includes(m.name))
                            .map(m => ({
                                key: m.name,
                                label: m.name
                            }))}
                        animated
                        destroyOnHidden={false}
                    />
                </>
            )}
        </>
    )
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        roles: UState.userInfo?.roles,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(PSHeader)
))
