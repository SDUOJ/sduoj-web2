import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import cApi from '../../Utils/API/c-api';
import { Button, Card, Col, Row, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import AntdTimer from '../../Utils/AntdTimer';
import { isValueEmpty } from '../../Utils/empty';
import ContestList from '../../Component/contest/ContestList';
import { UrlPrefix } from '../../Config/constValue';
import { useTranslation } from 'react-i18next';

const CContest = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const activeRef = useRef(false);
  const [upComing, setUpComing] = useState<any>(undefined);

  const getUpComing = useCallback(() => {
    cApi
      .getUpcomingContest({ groupId: undefined })
      .then((res: any) => {
        if (activeRef.current) setUpComing(res);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    activeRef.current = true;
    getUpComing();
    return () => {
      activeRef.current = false;
    };
  }, [getUpComing]);

  return (
    <>
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <div style={{ textAlign: 'left', maxWidth: '1500px', margin: '0 auto' }}>
          <Row gutter={20}>
            <Col xs={24} lg={17}>
              <ContestList />
            </Col>
            <Col xs={24} lg={7}>
              {!isValueEmpty(upComing) && (
                <Card title={t('ComingSoon')} className={'smallBodyPadding bodyCenter'}>
                  <div>
                    <Button
                      type={'link'}
                      size={'large'}
                      onClick={() => {
                        history.push(UrlPrefix + '/contest/' + upComing.contestId);
                      }}
                    >
                      {upComing.contestTitle}
                    </Button>
                  </div>
                  <div>
                    <Space>
                      <ClockCircleOutlined />
                      <AntdTimer
                        className={'contestTimer'}
                        value={parseInt(upComing.gmtStart)}
                        format={t('TimeFormat')}
                        onFinish={getUpComing}
                      />
                    </Space>
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
};

export default CContest;
