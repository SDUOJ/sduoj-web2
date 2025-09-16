import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import {Col, Image, Row} from "antd";
import BK1 from "Assert/img/ban1news.jpg"
import UpcomingListHome from "../../Component/problemSet/UpcomingListHome";
import Announcement from "../../Component/announcement/Announcement";

class CHome extends Component<any, any> {

    render() {
        return (
            <>
                <div style={{textAlign: "center", margin: "0 auto"}}>
              <Image src={BK1}
                           preview={false}
                  loading="lazy"
                           style={{maxWidth: "1500px", boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)"}}/>
                    <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                        <Row style={{marginTop: "25px"}} gutter={[16, 16]} align="stretch">
                            <Col xs={24} lg={14} style={{display: 'flex'}}>
                                <div style={{width: '100%', height: '100%'}}>
                                    <Announcement/>
                                </div>
                            </Col>
                            <Col xs={24} lg={10} style={{display: 'flex'}}>
                                <div style={{width: '100%', height: '100%'}}>
                                    <UpcomingListHome/>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CHome)