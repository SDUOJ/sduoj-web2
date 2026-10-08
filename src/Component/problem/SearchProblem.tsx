import React from 'react';
import { Card, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import Search from 'antd/es/input/Search';
import { SearchOutlined } from '@ant-design/icons';

const SearchProblem = () => {
  const { t } = useTranslation();
  return (
    <>
      <Card
        title={
          <>
            <Space>
              <SearchOutlined />
              {`${t('searchProblem')} (${t('temporarilyClosed')})`}
            </Space>
          </>
        }
      >
        <Search
          placeholder={t('pleaseEnterTheTitle,ProblemId,SourceAndOtherInformation')}
          disabled={true}
          onSearch={(text: string) => {
            // search is temporarily closed
          }}
          enterButton
          allowClear
        />
      </Card>
    </>
  );
};

export default SearchProblem;
