import React from 'react';
import { useHistory } from 'react-router-dom';
import SubmissionList from '../../Component/submission/SubmissionList/SubmissionList';
import cApi from '../../Utils/API/c-api';
import { Button } from 'antd';
import { UrlPrefix } from '../../Config/constValue';

const CSubmissions = () => {
  const history = useHistory();
  return (
    <>
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <div style={{ textAlign: 'left', maxWidth: '1500px', margin: '0 auto' }}>
          <SubmissionList
            name={'BaseSubmission'}
            useForm={true}
            API={cApi.getSubmissionList}
            QuerySubmissionAPI={(submissionId: string) => {
              return cApi.getSubmissionInfo({ submissionId: submissionId });
            }}
            problemCodeRender={(text: any) => {
              let ps = text.split('-');
              return (
                <Button
                  type={'text'}
                  size={'small'}
                  onClick={() => {
                    history.push(UrlPrefix + '/problem/' + text);
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{ps[0]}</span>-<span>{ps[1]}</span>
                </Button>
              );
            }}
          />
        </div>
      </div>
    </>
  );
};

export default CSubmissions;
