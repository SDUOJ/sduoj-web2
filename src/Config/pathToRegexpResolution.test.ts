import proLayoutPackage from '@ant-design/pro-layout/package.json';

it('keeps ProLayout on the audited path-to-regexp major', () => {
  const resolved =
    require.resolve('@ant-design/pro-layout/node_modules/path-to-regexp/package.json');
  const installed = require(resolved) as { version: string };
  expect(proLayoutPackage.dependencies['path-to-regexp']).toBe('8.2.0');
  expect(installed.version).toBe('8.4.0');
});
