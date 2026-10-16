import React, { Dispatch, useState } from 'react';
import { Button, Popconfirm } from 'antd';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import eApi from 'Utils/API/e-api';
import { flushExamAnswers } from '../../Redux/Action/exam';
import { UrlPrefix } from '../../Config/constValue';

const ExamOver = (props: any) => {
  const [disabled, setDisabled] = useState<boolean>(false);
  const dispatch = useDispatch();

  return (
    <>
      <Popconfirm
        okType={'primary'}
        title={props.t('SubmitExamConfirm')}
        onConfirm={() => {
          setDisabled(true);
          const urls = props.location.pathname.split('/');
          const eid = urls[urls.length - 3];
          dispatch({ type: 'setExamAnswerSubmitting', submitting: true });
          Promise.resolve(dispatch(flushExamAnswers(eid) as any))
            .then(() => eApi.ExamOver({ examId: eid }))
            .then(() => {
              dispatch({
                type: 'setExamInfo',
                key: eid,
                data: undefined,
              });
              props.history.push(UrlPrefix + '/exam/finish');
            })
            .catch(() => {
              dispatch({ type: 'setExamAnswerSubmitting', submitting: false });
              setDisabled(false);
            });
        }}
        okText={props.t('ConfirmSubmitPaper')}
        cancelText={props.t('Cancel')}
        disabled={disabled}
      >
        <Button danger style={{ marginRight: '30px' }} type={'primary'} disabled={disabled}>
          {props.t('SubmitPaper')}
        </Button>
      </Popconfirm>
    </>
  );
};

const mapStateToProps = (state: any) => {
  return {};
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(ExamOver)));
