import {Button, Col, Form, Image, Input, Row, Space} from "antd";
import React, {useEffect, useState} from "react";
import {withTranslation} from "react-i18next";
import CApi from "Utils/API/c-api"
import {RedoOutlined} from "@ant-design/icons"

const ItemCaptcha = (props: any) => {

    const [image, setImage] = useState<string>()

    const getCaptcha = () => {
        CApi.getCaptcha().then((data: any) => {
            setImage(data.captcha)
            props.setImgId(data.captchaId)
        })
    }

    useEffect(() => {
        getCaptcha()
    }, [])

    return (
        <>
            <Form.Item
                name="captcha"
                label={props.t("captcha")}
                rules={[
                    {required: true},
                ]}
            >
                <Row>
                    <Col span={14}> <Input/> </Col>
                    <Col offset={1} span={8}>
                        <Image src={image} height={32}/>
                    </Col>
                    <Col span={1}>
                        <Button
                            icon={<RedoOutlined/>}
                            onClick={() => {
                                getCaptcha()
                            }}/>
                    </Col>
                </Row>
            </Form.Item>
        </>


    )
}

export default withTranslation()(ItemCaptcha)