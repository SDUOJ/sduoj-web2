import { withTranslation } from 'react-i18next';
import { Form, InputNumber, Table } from 'antd';
import 'Assert/css/MContest.css';
import ItemSelectGroup from '../../group/Form/Item/ItemSelectGroup';
import React from 'react';
import TextArea from 'antd/es/input/TextArea';
import ItemSwitch01 from '../../common/Form/Item/ItemSwitch01';
import { contracts } from '../../../Config/validation/contracts';
import { constraintRules } from '../../../Config/validation/constraints';

const ContestMFormManagement = (props: any) => {
  return (
    <div style={{ width: 1100 }}>
      <Form.Item
        label={props.t('FrozenTimeMinutes')}
        name={['features', 'frozenTime']}
        initialValue={0}
        required
        tooltip={props.t('FrozenTimeTooltip')}
      >
        <InputNumber />
      </Form.Item>
      <Table
        className={'ContestMFormManagementTable'}
        title={() => {
          return props.t('ContestParams');
        }}
        columns={[
          { title: '', dataIndex: 'name' },
          {
            title: props.t('DisplayPeerSubmission'),
            render: (text: any, rows: any) => {
              return (
                <ItemSwitch01
                  InitValue={1}
                  name={['features', rows.type, 'displayPeerSubmission']}
                  ck={props.t('Show')}
                  unck={props.t('Hide')}
                />
              );
            },
          },
          {
            title: props.t('DisplayRank'),
            render: (text: any, rows: any) => {
              return (
                <ItemSwitch01
                  InitValue={1}
                  name={['features', rows.type, 'displayRank']}
                  ck={props.t('Show')}
                  unck={props.t('Hide')}
                />
              );
            },
          },
          {
            title: props.t('DisplayJudgeScore'),
            render: (text: any, rows: any) => {
              return (
                <ItemSwitch01
                  InitValue={1}
                  name={['features', rows.type, 'displayJudgeScore']}
                  ck={props.t('Show')}
                  unck={props.t('Hide')}
                />
              );
            },
          },
          {
            title: props.t('DisplayCheckpointResult'),
            render: (text: any, rows: any) => {
              return (
                <ItemSwitch01
                  InitValue={1}
                  name={['features', rows.type, 'displayCheckpointResult']}
                  ck={props.t('Show')}
                  unck={props.t('Hide')}
                />
              );
            },
          },
          {
            title: props.t('AllowToSubmit'),
            render: (text: any, rows: any) => {
              return (
                <ItemSwitch01
                  InitValue={1}
                  name={['features', rows.type, 'allowToSubmit']}
                  ck={props.t('Allow')}
                  unck={props.t('Disallow')}
                />
              );
            },
          },
        ]}
        dataSource={[
          { name: props.t('ContestRunning'), type: 'contestRunning' },
          { name: props.t('ContestEnd'), type: 'contestEnd' },
        ]}
        pagination={false}
        size={'small'}
      />
      <Form.Item
        name={'participants'}
        rules={constraintRules(contracts.contest.participants, (value) =>
          typeof value === 'string' ? value.split(/[\t\n, ]/).filter(Boolean) : value,
        )}
        label={
          <>
            {props.t('ParticipantsLabel')} &nbsp;
            <span style={{ color: 'grey', fontSize: 10 }}>{props.t('SplitUsernamesHint')}</span>
          </>
        }
      >
        <TextArea rows={6} />
      </Form.Item>
      <Form.Item
        name={'unofficialParticipants'}
        rules={constraintRules(contracts.contest.unofficialParticipants, (value) =>
          typeof value === 'string' ? value.split(/[\t\n, ]/).filter(Boolean) : value,
        )}
        label={
          <>
            {props.t('UnofficialParticipants')} &nbsp;
            <span style={{ color: 'grey', fontSize: 10 }}>{props.t('SplitUsernamesHint')}</span>
          </>
        }
      >
        <TextArea rows={6} />
      </Form.Item>
      <ItemSelectGroup
        name={'groupId'}
        label={props.t('ManagementGroup')}
        formName={'ContestForm'}
      />
      <ItemSelectGroup
        name={'participatingGroups'}
        label={props.t('ParticipatingGroups')}
        mode={'multiple'}
        constraint={contracts.contest.participatingGroups}
        tooltip={props.t('ParticipantsNoPasswordHint')}
        formName={'ContestForm'}
      />
    </div>
  );
};

export default withTranslation()(ContestMFormManagement);
