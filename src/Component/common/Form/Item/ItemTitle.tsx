import { useTranslation } from 'react-i18next';
import ItemText, { ItemTextProps } from './ItemText';

const ItemTitle = ({ name = 'title', label, ...props }: ItemTextProps) => {
  const { t } = useTranslation();
  return <ItemText {...props} name={name} label={label ?? t('title')} />;
};

export default ItemTitle;
