module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],
    setupFilesAfterEnv: ['./setupTests.js'],
    testPathIgnorePatterns: ['/.next/', '/node_modules/'],
    moduleNameMapper: {
        "^@/(.*)$": "musicfunnel/app/$1", 
    },
 };