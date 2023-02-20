import React, {Dispatch} from "react";
import ProTag from "./ProTag";
import {Card, Col, Row} from "antd";
import {connect, useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


const ProTagGroup = (props: any) => {

    const eid = props.match.params.eid
    const gid = props.gid

    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[`${eid}_${gid}`]
    })

    return (
        <>
            <Card
                bordered={false}
                title={problemList?.title}
                className={"ProTagGroup"}
            >
                <Row gutter={[0, 16]}>
                    {
                        problemList?.proList.map((v:any) => {
                            return (
                                <Col span={3}>
                                    <ProTag gid={gid} pid={v.index}/>
                                </Col>
                            )
                        })
                    }
                </Row>
            </Card>
        </>
    )

}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ProTagGroup)
    ))
