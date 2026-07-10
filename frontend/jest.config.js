/** @type {import('ts-jest').JestConfigWithTsJest} **/
// module.exports = {
//     testEnvironment: "node",
//     transform: {
//       "^.+.tsx?$": ["ts-jest",{}],
//     },
//     moduleDirectories: ['node_modules', 'src'],
//   };
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/src/components/test.tsx'],
};
