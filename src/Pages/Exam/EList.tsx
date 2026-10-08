import React from 'react';
import { withRouter } from 'react-router';
import ExamList from '../../Component/exam/ExamList';
import LoginCheck from '../../Component/common/LoginCheck';

const EList = () => {
  return (
    <>
      <LoginCheck />
      <ExamList />
    </>
  );
};

export default withRouter(EList);
