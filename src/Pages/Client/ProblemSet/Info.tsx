import {withTranslation} from "react-i18next";
import {Route, withRouter} from "react-router-dom";
import React, {Dispatch, Suspense, useEffect, useState} from "react";
import LoginCheck from "../../../Component/common/LoginCheck";

import {connect} from "react-redux";
import {ContestState} from "../../../Redux/Action/contest";
import {routerC_ProblemSet_M} from "../../../Config/router/routerC";
import Loading from "../../../Utils/Loading";
import {Card, Menu} from "antd";
import {UrlPrefix} from "../../../Config/constValue";
import MarkdownText from "../../../Utils/MarkdownText";

const ProblemSetInfo = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    const url = props.location.pathname


    let minWidth = 500

    const [pageWidth, setPageWidth] = useState<number>(document.querySelector('body')?.clientWidth as number)
    const [selectedKey, setSelectedKey] = useState<string>("")
    const [problemSetInfo, setProblemSetInfo] = useState<any>({
        markdownDescription: "### 这里是题单描述",
        gmtStart: 1663657370332,
        gmtEnd: 1663758370332,
        title: "题单标题"

    })


    useEffect(() => {
        menuData.map((value) => {
            if (url.match(value.re) !== null) setSelectedKey(value.name)
        })
    }, [url])

    const [timeState, setTimeState] = useState<string>("running")
    // TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd)


    const menuData = [
        {
            name: "Overview",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/overview",
            re: /\/problemSet\/.*\/overview/g
        },
        {
            name: "Problem",
            link: UrlPrefix + "/problemSet/" + problemSetId + "/problem/0/0",
            re: /\/problemSet\/.*\/problem\/.*/g
        },
        {name: "Rank", link: UrlPrefix + "/problemSet/" + problemSetId + "/rank", re: /\/problemSet\/.*\/rank/g},
    ]

    useEffect(() => {
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    },)
    const handleResize = (e: any) => {
        setPageWidth(e.target.innerWidth)
    }

    if (props.location.pathname.match(/\/problemSet\/.*\/rank/g) !== null) {
        minWidth = Math.max(500, (props.minWidth ?? 0) + 100)
    }
    return (
        <>
            <LoginCheck/>
            <div style={minWidth <= 1500 ? {textAlign: "center", margin: "0 auto"} : undefined}>
                <div style={minWidth <= 1500 ? {
                    textAlign: "left",
                    maxWidth: "1500px",
                    margin: "0 auto"
                } : {
                    textAlign: "left",
                    maxWidth: "1500px",
                    marginLeft: Math.max(0, (pageWidth as number - minWidth) / 2)
                }}>
                    {problemSetInfo !== undefined && (
                        <>
                            <Card style={{marginTop: 25}}>
                                <div className={"center"}>
                                    <span style={{fontWeight: "bold", fontSize: "1.75rem"}}>
                                        <span style={{paddingRight: 10}}>{problemSetInfo.title}</span>
                                    </span>
                                </div>
                                <div>
                                    <MarkdownText id={"contest-markdownDescription"}
                                                  text={problemSetInfo.markdownDescription}/>
                                </div>
                            </Card>
                        </>
                    )}
                    <Menu
                        mode="horizontal"
                        theme={"light"}
                        selectedKeys={[selectedKey]}
                    >
                        {menuData.map((value) => {
                            return (
                                <Menu.Item key={value.name} onClick={() => {
                                    setSelectedKey(value.name)
                                    props.history.push(value.link)
                                }}
                                >
                                    {props.t(value.name)}
                                </Menu.Item>
                            )
                        })}
                    </Menu>
                    <div style={{marginTop: 25}}>
                        <Suspense fallback={<Loading/>}>
                            {
                                routerC_ProblemSet_M.map((r) => {
                                    return (
                                        <Route key={r.id} path={r.path} exact={r.exact}
                                               component={r.component}/>
                                    )
                                })
                            }
                        </Suspense>
                    </div>
                </div>

            </div>
        </>
    )
}
const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        ContestInfo: State.contestInfo,
        minWidth: State.minWidth
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ProblemSetInfo)))
