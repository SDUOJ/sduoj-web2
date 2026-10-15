/** Build-time environment only: URL parameters and browser storage cannot enable dev features. */
export function developmentFeaturesEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.REACT_APP_DEPLOYMENT_ENV === 'test'
  );
}
