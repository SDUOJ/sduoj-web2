import { withTranslation } from "react-i18next";
import { Route, withRouter } from "react-router-dom";
import ContestHeader from "../../Component/contest/ContestHeader";
import { routerC_Contest_M } from "../../Config/router/routerC";
import React, { Dispatch, Suspense, useEffect, useState } from "react";
import Loading from "../../Utils/Loading";
import LoginCheck from "../../Component/common/LoginCheck";
import { ContestState } from "../../Redux/Action/contest";
import { connect } from "react-redux";
import { TimeRangeState } from "../../Utils/Time";
import ScreenshotComponent from "../../Component/screenrecord/screenrecord"; // Adjust the import path as needed
import { useSelector } from 'react-redux';
import * as string_decoder from "string_decoder";

const CContestInfo = (props: any) => {
    const contestId = props.match.params.contestId;
    const contestInfo = props.ContestInfo[contestId];
    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined;
    let minWidth = 500;

    const [pageWidth, setPageWidth] = useState<number>(document.querySelector('body')?.clientWidth as number);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleResize = (e: any) => {
        setPageWidth(e.target.innerWidth);
    };

    const userInfo = useSelector((state: any) => state.UserReducer?.userInfo);
    const token = generateToken(userInfo.userid);

    //test
    //const token = "20222";

    // Define the props for ScreenshotComponent
    const screenshotComponentProps = {
        bs_id: parseInt(contestId, 10),
        u_name: userInfo.username,
        u_id: parseInt(userInfo.userId, 10),
        //u_name: "小刚",
        //u_id: 20222,
        token: token,
    };

    if (props.location.pathname.match(/\/contest\/.*\/rank/g) !== null) {
        minWidth = Math.max(500, (props.minWidth ?? 0) + 100);
    }

    return (
        <>
            <LoginCheck jump={true} />
            <div style={minWidth <= 1500 ? { textAlign: "center", margin: "0 auto" } : undefined}>
                <div style={minWidth <= 1500 ? {
                    textAlign: "left",
                    maxWidth: "1500px",
                    margin: "0 auto"
                } : {
                    textAlign: "left",
                    maxWidth: "1500px",
                    marginLeft: Math.max(0, (pageWidth as number - minWidth) / 2)
                }}>
                    <ContestHeader />
                    {contestInfo !== undefined && timeState !== "wait" && (
                        <div style={{ marginTop: 25 }}>
                            <Suspense fallback={<Loading />}>
                                {
                                    routerC_Contest_M.map((r) => {
                                        return (
                                            <Route key={r.id} path={r.path} exact={r.exact}
                                                   component={r.component} />
                                        );
                                    })
                                }
                            </Suspense>
                        </div>
                    )}
                    {/* Include ScreenshotComponent with the defined props */}
                    <ScreenshotComponent {...screenshotComponentProps} />
                </div>
            </div>
        </>
    );
};

const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer;
    return {
        ContestInfo: State.contestInfo,
        minWidth: State.minWidth
    };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(CContestInfo)));

function generateToken(username: string) {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    return `${username}#${formattedDate}`;
}
