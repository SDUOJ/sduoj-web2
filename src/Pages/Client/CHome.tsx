import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import Announcement from "../../Component/announcement/Announcement";
import {Col, Image, Row} from "antd";
import BK1 from "Assert/img/ban1news.jpg"
import SearchProblem from "../../Component/problem/SearchProblem";

class CHome extends Component<any, any> {

    render() {
        return (
            <>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <Image src={BK1}
                           preview={false}
                           style={{maxWidth: "1500px", boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)"}}/>
                    <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                        <Row style={{marginTop: "25px"}}>
                            <Col span={16}>
                                <Announcement/>
                            </Col>
                            <Col span={7} offset={1}>
                                <SearchProblem/>
                            </Col>
                        </Row>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CHome)