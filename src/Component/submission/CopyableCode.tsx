import React from 'react';
import { useTranslation } from 'react-i18next';
import Paragraph from 'antd/lib/typography/Paragraph';

interface ICopyableCode {
  code: string;
}

const CopyableCode = (props: ICopyableCode) => {
  const { t } = useTranslation();
  return (
    <>
      <Paragraph style={{ fontSize: '14px' }}>
        <pre style={{ width: '100%', paddingRight: '25px' }}>{props.code}</pre>
      </Paragraph>
      <div style={{ position: 'absolute', right: '2%', top: '43px' }}>
        <Paragraph
          copyable={{
            tooltips: [t('Copy'), t('Copied')],
            text: props.code,
          }}
        />
      </div>
    </>
  );
};

export default CopyableCode;
