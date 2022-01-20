import {Component} from "react";
import {withRouter} from "react-router-dom";
import Announcement from "../Component/announcement/Announcement";
import {Button, Card, Carousel, Col, Image, Row} from "antd";
import BK1 from "Assert/img/ban1news.jpg"
import SearchProblem from "../Component/problem/SearchProblem";

class CHome extends Component<any, any> {

    render() {
        return (
            <>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <Image src={BK1} preview={false} style={{maxHeight: "310px"}}/>
                    <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                        <Row style={{marginTop: "25px"}}>
                            <Col span={16}>
                                <Announcement/>
                            </Col>
                            <Col span={7} style={{marginLeft: "30px"}}>
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