import {Route, withRouter} from "react-router-dom";
import PSHeader from "./PSHeader";
import Loading from "../../Utils/Loading";
import {router_ProblemSet} from "../../Config/router/routerC";
import React, {Dispatch, Suspense, useEffect, useState} from "react";
import LoginCheck from "../common/LoginCheck";
import {ContestState} from "../../Redux/Action/contest";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";

const PSLayout = (props: any) => {
    const path = props.location.pathname
    let minWidth = 500

    const [pageWidth, setPageWidth] = useState<number>(document.querySelector('body')?.clientWidth as number)

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
                    <PSHeader/>
                    <Suspense fallback={<Loading/>}>
                        {router_ProblemSet.map(({id, path, exact, component}) => {
                            return (
                                <Route
                                    key={id} path={path} exact={exact}
                                    component={component}/>
                            )
                        })}
                    </Suspense>
                </div>
            </div>
        </>
    )
}
const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        minWidth: State.minWidth
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(PSLayout)))
