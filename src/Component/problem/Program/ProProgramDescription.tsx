import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {isValueEmpty} from "../../../Utils/empty";
import {Card, Menu} from "antd";
import {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import {RightOutlined} from "@ant-design/icons";

const ProProgramDescription = (props: any) => {
    const problemInfo = props.problemInfo
    const nDes = problemInfo?.problemDescriptionDTO

    const [selectedKeys, setSelectedKeys] = useState(!isValueEmpty(nDes) ? nDes.id : undefined)

    useEffect(() => {
        if (problemInfo !== undefined && problemInfo.problemDescriptionDTO !== null) {
            setSelectedKeys(problemInfo?.problemDescriptionDTO.id)
        }
    }, [problemInfo, setSelectedKeys])

    return (
        <>
            <Card
                title={"题目描述"}
                className={"zeroBodyPadding"}
            >
                <Menu
                    selectedKeys={selectedKeys}
                >
                    {problemInfo !== undefined && problemInfo.problemDescriptionListDTOList.map((value: any) => {
                        return (
                            <Menu.Item key={value.id} onClick={() => {
                                setSelectedKeys(value.id)
                                props.history.push(props.location.pathname + "?descriptionId=" + value.id)
                            }}>
                                <div>
                                    <div style={{float: "left"}}>
                                        {value.title} (ID : {value.id})
                                    </div>
                                    <div style={{float: "right"}}>
                                        {value.voteNum} <RightOutlined/>
                                    </div>
                                </div>
                            </Menu.Item>
                        )
                    })}
                </Menu>
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
)(withTranslation()(withRouter(ProProgramDescription)))