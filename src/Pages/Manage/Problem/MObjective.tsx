import React, { useEffect } from 'react';
import ObjectiveForm from '../../../Component/problem/ObjectiveForm';
import { UserState } from '../../../Type/Iuser';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Space } from 'antd';
import ProblemList from '../../../Component/problem/ProblemList';
import AutoImportObjective from '../../../Component/problem/AutoImportObjective';
import { loginRedirect } from '../../../Utils/authReturn';

const MObjective = (props: any) => {
  const { t } = useTranslation();
  const { isLogin } = props;
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!isLogin) {
      history.replace(loginRedirect(location));
    }
  }, [isLogin, history, location]);

  return (
    <>
      <Card
        size={'small'}
        bordered={true}
        title={t('ObjectiveProblemList')}
        extra={
          <Space>
            <ObjectiveForm isDataLoad={true} type={'create'} />
            <AutoImportObjective />
          </Space>
        }
      >
        <ProblemList type="objective" />
      </Card>
    </>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
  };
};

export default connect(mapStateToProps)(MObjective);
