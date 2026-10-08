import React, { useEffect } from 'react';
import DeprecatedJavaExam from '../Exam/DeprecatedJavaExam';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { loginRedirect } from '../../Utils/authReturn';

const MExam = (props: any) => {
  const { isLogin } = props;
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!isLogin) {
      history.replace(loginRedirect(location));
    }
  }, [isLogin, history, location]);

  return <DeprecatedJavaExam />;
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
  };
};

export default connect(mapStateToProps)(MExam);
