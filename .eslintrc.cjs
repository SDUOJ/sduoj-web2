module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  env: { browser: true, es2022: true, jest: true, node: true },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: ['eslint:recommended', 'prettier'],
  settings: { react: { version: 'detect' } },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-eval': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-key': 'warn',
    'react/jsx-no-duplicate-props': 'error',
    // Table, form and dropdown APIs intentionally accept render callbacks. The
    // remaining component identities are stabilized at their call sites.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};
