module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^antd/es/(.*)$': 'antd/lib/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|ico)$': '<rootDir>/config/jest/assetMock.cjs',
  },
  transform: { '^.+\\.[jt]sx?$': '<rootDir>/config/jest/babelTransform.js' },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/setupTests.ts'],
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    './src/Redux/Reducer/': { statements: 90, branches: 85, functions: 100, lines: 90 },
    './src/Utils/API/request.ts': { statements: 75, branches: 65, functions: 80, lines: 75 },
  },
};
