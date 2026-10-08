import React, { Component, Dispatch } from 'react';
import DeprecatedJavaExam from '../Exam/DeprecatedJavaExam';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { loginRedirect } from '../../Utils/authReturn';

class MExam extends Component<any, any> {
  componentDidMount() {
    if (!this.props.isLogin) {
      this.props.history.replace(loginRedirect(this.props.location));
    }
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
    if (!this.props.isLogin) {
      this.props.history.replace(loginRedirect(this.props.location));
    }
  }

  render() {
    return <DeprecatedJavaExam />;
  }
}

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(MExam)));
