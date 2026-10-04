export const getVditorResourceUrls = (
  publicUrl = process.env.PUBLIC_URL ?? '',
  revision = process.env.REACT_APP_VDITOR_REVISION ?? 'development',
) => {
  if (!/^(?:[a-f0-9]{64}|development)$/.test(revision)) {
    throw new Error('Invalid Vditor resource revision');
  }
  const cdn = `${publicUrl.replace(/\/+$/, '')}/vditor/${revision}`;
  return {
    cdn,
    emojiPath: `${cdn}/dist/images/emoji`,
    themePath: `${cdn}/dist/css/content-theme`,
  };
};
