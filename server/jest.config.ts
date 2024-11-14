import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  preset: "@shelf/jest-mongodb",
  watchPathIgnorePatterns: ["globalConfig"],
  moduleNameMapper: {
    "^@noctaCrdt$": "<rootDir>/../@noctaCrdt/dist/Crdt.js",
    "^@noctaCrdt/(.*)$": "<rootDir>/../@noctaCrdt/dist/$1.js",
  },
  transformIgnorePatterns: ["node_modules/(?!@noctaCrdt)"],
};

export default config;
