import React from 'react';
import { TestCase } from '../../Type/IProblem';
import { useTranslation } from 'react-i18next';
import { Col, Row, Skeleton } from 'antd';
import CopyableCode from '../submission/CopyableCode';
import Title from 'antd/lib/typography/Title';

interface SampleTestCaseProps {
  testCase?: TestCase[];
}

const SampleTestCase = (props: SampleTestCaseProps) => {
  const { t } = useTranslation();
  return (
    <Skeleton active loading={props.testCase === undefined}>
      {props.testCase !== undefined &&
        props.testCase.map((value: TestCase, index: number) => {
          return (
            <React.Fragment key={index}>
              <Title level={4}> {t('Sample') + ' ' + (index + 1)} </Title>
              <Row align={'top'} style={{ fontSize: '16px' }}>
                <Col span={11}>
                  {t('Input')}:
                  <CopyableCode code={value.input} />
                </Col>
                <Col span={11} offset={1}>
                  {t('Output')}:
                  <CopyableCode code={value.output} />
                </Col>
              </Row>
            </React.Fragment>
          );
        })}
    </Skeleton>
  );
};

export default SampleTestCase;
