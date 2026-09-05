import { Button, Col, Form, Image, Input, Row } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';
import CApi from 'Utils/API/c-api';
import { RedoOutlined } from '@ant-design/icons';

const ItemCaptcha = (props: any) => {
  const [image, setImage] = useState<string>();
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const setImgIdRef = useRef(props.setImgId);
  setImgIdRef.current = props.setImgId;

  const getCaptcha = useCallback(() => {
    const requestId = ++requestIdRef.current;
    CApi.getCaptcha()
      .then((data: any) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setImage(data.captcha);
        setImgIdRef.current(data.captchaId);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    getCaptcha();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [getCaptcha]);

  const content = (
    <Row>
      <Col span={14}>
        <Input
          onChange={(e) => {
            if (props.setCaptcha !== undefined) props.setCaptcha(e.target.value);
          }}
        />
      </Col>
      <Col offset={1} span={8}>
        <Image src={image} height={32} preview={false} />
      </Col>
      <Col span={1}>
        <Button
          htmlType="button"
          icon={<RedoOutlined />}
          onClick={() => {
            getCaptcha();
          }}
        />
      </Col>
    </Row>
  );

  if (props.setCaptcha !== undefined) return content;

  return (
    <Form.Item name="captcha" label={props.t('captcha')} rules={[{ required: true }]}>
      {content}
    </Form.Item>
  );
};

export default withTranslation()(ItemCaptcha);
