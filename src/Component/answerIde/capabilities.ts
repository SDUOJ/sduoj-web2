/** Enable only after the corresponding server feature has been deployed and verified. */
export function ideCapabilities() {
  return {
    cloudCode: process.env.REACT_APP_IDE_CLOUD_CODE === 'true',
    run: process.env.REACT_APP_IDE_RUN === 'true',
  };
}
