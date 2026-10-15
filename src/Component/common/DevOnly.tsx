import { ReactNode } from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { developmentFeaturesEnabled } from '../../Config/developmentFeatures';

export function DevBadge() {
  const { t } = useTranslation();
  if (!developmentFeaturesEnabled()) return null;
  return (
    <Tag
      color="purple"
      title={t('DevelopmentFeature')}
      style={{ marginInline: 6, fontSize: 10, lineHeight: '16px' }}
    >
      DEV
    </Tag>
  );
}

export default function DevOnly({ children }: { children: ReactNode }) {
  return developmentFeaturesEnabled() ? <>{children}</> : null;
}
