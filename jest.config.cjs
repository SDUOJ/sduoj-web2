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
  transformIgnorePatterns: ['/node_modules/(?!array-move/)'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/setupTests.ts'],
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    './src/Redux/Reducer/': { statements: 90, branches: 85, functions: 100, lines: 90 },
    './src/Utils/API/request.ts': { statements: 75, branches: 65, functions: 80, lines: 75 },
    // The AI management pages are the first migrated page domain with a
    // measured aggregate baseline. Keep a small buffer below the current
    // Node 24 coverage report so new tests can raise the floor deliberately.
    './src/Pages/Manage/AI/': { statements: 55, branches: 50, functions: 45, lines: 58 },
    // AutoLab has a smaller but stable component-test baseline; keep the gate
    // below the measured report while preventing coverage regressions.
    './src/Component/autolab/': { statements: 45, branches: 30, functions: 30, lines: 48 },
  },
};
