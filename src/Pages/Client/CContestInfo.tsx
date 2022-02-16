import {withTranslation} from "react-i18next";
import {Link, Route, withRouter} from "react-router-dom";
import ContestHeader from "../../Component/contest/ContestHeader";
import {Menu} from "antd";
import {routerC, routerC_Contest_M, routerC_M} from "../../Config/router/routerC";
import React, {Dispatch, Suspense, useState} from "react";
import Loading from "../../Utils/Loading";
import LoginCheck from "../../Component/common/LoginCheck";
import {ContestState} from "../../Redux/Action/contest";
import {connect} from "react-redux";
import {TimeRangeState} from "../../Utils/Time";


const CContestInfo = (props: any) => {
    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]
    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined

    return (
        <>
            <LoginCheck/>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <ContestHeader/>
                    {contestInfo !== undefined && timeState !== "wait" && (
                        <div style={{marginTop: 25}}>
                            <Suspense fallback={<Loading/>}>
                                {
                                    routerC_Contest_M.map((r) => {
                                        return (
                                            <Route key={r.id} path={r.path} exact={r.exact}
                                                   component={r.component}/>
                                        )
                                    })
                                }
                            </Suspense>
                        </div>
                    )}
                </div>

            </div>
        </>
    )
}
const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        ContestInfo: State.contestInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(CContestInfo)))