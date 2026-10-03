import { withTranslation } from 'react-i18next';
import { Button, Form, Select } from 'antd';
import { PREDEFINED_CHECKERS, SPJ_Code, SPJ_Config } from '../../../../Config/constValue';
import React, { Dispatch, useEffect, useState } from 'react';
import CodeEditor from '../../../common/CodeEditor';
import { ManageState } from '../../../../Type/IManage';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { isValueEmpty } from '../../../../Utils/empty';

const BodyChecker = (props: any) => {
  const { initData, onChange } = props;
  const [selectValue, setSelectValue] = useState<string>('lcmp.cpp');
  const [source, setSource] = useState<string>('');
  const [spj, setSpj] = useState<string>('');

  useEffect(() => {
    if (selectValue === '@') {
      onChange({
        source: source,
        spj: spj,
      });
    } else {
      setSource('');
      setSpj('');
      onChange({
        source: selectValue,
        spj: null,
      });
    }
  }, [onChange, selectValue, source, spj]);

  useEffect(() => {
    if (initData !== undefined && initData['ProblemInfo'] !== undefined) {
      const problemInfo = initData['ProblemInfo'];
      if (!isValueEmpty(problemInfo.checkerConfig?.spj)) {
        setSelectValue('@');
        setSource(problemInfo.checkerConfig.source);
        setSpj(problemInfo.checkerConfig.spj);
      } else if (!isValueEmpty(problemInfo.checkerConfig?.source)) {
        setSelectValue(problemInfo.checkerConfig.source);
      } else {
        setSelectValue('');
      }
    }
  }, [initData]);

  return (
    <>
      <Select value={selectValue} onChange={setSelectValue}>
        <Select.Option value={'@'}> 自定义 </Select.Option>
        {PREDEFINED_CHECKERS.map(({ name, description }) => {
          return (
            <Select.Option key={name} value={name}>
              {name + ' - ' + description}
            </Select.Option>
          );
        })}
      </Select>
      {selectValue === '@' && (
        <div className={'ProblemAddChecker'} style={{ paddingTop: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <Button
              type={'primary'}
              ghost
              size={'small'}
              onClick={() => {
                setSource(SPJ_Code);
                setSpj(SPJ_Config);
              }}
            >
              使用C++预设
            </Button>
          </div>
          <Form.Item label={'代码'} required>
            <CodeEditor lang={'cpp'} value={source} onChange={setSource} />
          </Form.Item>
          <Form.Item label={'配置'} required>
            <CodeEditor lang={'cpp'} value={spj} onChange={setSpj} />
          </Form.Item>
        </div>
      )}
    </>
  );
};
const mapStateToProps = (state: any) => {
  const MState: ManageState = state.ManageReducer;
  return {
    initData: MState.manageInitData,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(BodyChecker)));
