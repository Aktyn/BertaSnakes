module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  preset: 'ts-jest',
  projects: ['<rootDir>'],
  displayName: 'api',
  // testEnvironment: 'node',
  coverageDirectory: undefined,
  clearMocks: true,
  rootDir: './',
  modulePaths: ['node_modules', '<rootDir>/src', './src'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/out/'],
  moduleNameMapper: {
    '^src(.*)$': '<rootDir>/src$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/test-utils/**',
    '!node_modules/**',
  ]
};
