import React, { Dispatch } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Button, Col, Row } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { UrlPrefix } from '../../Config/constValue';
import { UserState } from '../../Type/Iuser';
import useClientProblemPage from './useClientProblemPage';

export const CProblemInfo = (props: any) => {
  const { problemCode, showWorkspace, statement, details, recent } = useClientProblemPage(props);
  return (
    <div className="client-problem-page">
      <Row gutter={20}>
        <Col xs={24} lg={17}>
          {statement}
        </Col>
        <Col xs={24} lg={7}>
          {showWorkspace && (
            <Link
              to={`${UrlPrefix}/problem/${encodeURIComponent(problemCode)}/ide${props.location.search}`}
            >
              <Button type="primary" icon={<CodeOutlined />} block className="client-ide-entry">
                {props.t('answerIde.open')}
              </Button>
            </Link>
          )}
          {details}
          {props.username !== undefined && <div style={{ marginTop: 30 }}>{recent}</div>}
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  const State: UserState = state.UserReducer;
  return {
    username: State.userInfo?.username,
    isLogin: State.isLogin,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(CProblemInfo)));
