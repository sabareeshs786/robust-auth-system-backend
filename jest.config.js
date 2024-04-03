module.exports = {
    setupFilesAfterEnv: ['./setupTests.js'],
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
    moduleFileExtensions: ['js', 'json', 'node'],
    // testMatch: ['<rootDir>/test/*.test.js'],
    verbose: true,
    forceExit: true
};