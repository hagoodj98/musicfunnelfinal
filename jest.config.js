module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],
    setupFilesAfterEnv: ['./setupTests.js'],
    //Key: The transform property tells Jest to use babel-jest for all .js, .jsx, .ts, and .tsx files. This is what converts your ES module syntax (import, export) into something Jest’s runtime can execute.
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    testPathIgnorePatterns: ['/.next/', '/node_modules/'],
    moduleNameMapper: {
        "^@/(.*)$": "musicfunnel/app/$1", 
    },
 };