import {Link, withRouter} from "react-router-dom";
import {Button, Card, Segmented, Space} from "antd";
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

const PSHeader = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    const path = props.location.pathname

    const onError = () => {
        props.history.replace(UrlPrefix + "/problemSetPublic/" + problemSetId)
    }

    const problemSetInfo = useProblemSetInfo(problemSetId, onError)


    const menuData = [
        {
            name: "总览",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/overview",
            re: /\/problemSet\/.*\/overview/g
        },
        {
            name: "题目",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/problem/0/0",
            re: /\/problemSet\/.*\/problem/g
        },
        {
            name: "评阅",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/review",
            re: /\/problemSet\/.*\/review/g
        },
        {
            name: "榜单",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/rank",
            re: /\/problemSet\/.*\/rank/g
        },
        {
            name: "提交列表",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/submission",
            re: /\/problemSet\/.*\/submission/g
        },
    ]

    const [nowKey, setNowKey] = useState<any>()

    const menuList: any = ["总览", "题目"]
    if (problemSetInfo?.isAdmin === true)
        menuList.push('评阅', "提交列表", "榜单")


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
                                <Button size={"small"} icon={<LeftOutlined/>}> 返回 </Button>
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
                    <Segmented
                        block
                        options={menuList}
                        value={nowKey}
                        onChange={(value) => {
                            menuData.map((item) => {
                                if (item.name === value)
                                    props.history.push(item.link)
                                return undefined
                            })
                        }}

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
