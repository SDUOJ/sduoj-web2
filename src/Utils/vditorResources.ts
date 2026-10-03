export const getVditorResourceUrls = (publicUrl = process.env.PUBLIC_URL ?? '') => {
  const cdn = `${publicUrl.replace(/\/+$/, '')}/vditor`;
  return {
    cdn,
    emojiPath: `${cdn}/dist/images/emoji`,
    themePath: `${cdn}/dist/css/content-theme`,
  };
};
