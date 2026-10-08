import React from 'react';
import { useTranslation } from 'react-i18next';
import ItemSwitch from '../../common/Form/Item/ItemSwitch';

const UserFormAdditional = () => {
  const { t } = useTranslation();
  return (
    <>
      <ItemSwitch name={['features', 'banThirdParty']} label={t('Dis3pLogin')} />
      <ItemSwitch name={['features', 'banEmailUpdate']} label={t('DisEmailUpd')} />
      <ItemSwitch name={['features', 'banInfoUpdate']} label={t('DisInfoUpd')} />
    </>
  );
};

export default UserFormAdditional;
