module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/out'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/out/__mocks__/vscode.js',
    '^pdfjs-dist/build/pdf\\.mjs$': '<rootDir>/out/__mocks__/pdfjs-dist-build-pdf.js'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  verbose: true
};
