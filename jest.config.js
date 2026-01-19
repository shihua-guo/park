/**
 * Jest 配置文件
 * 用于微信小程序项目的单元测试
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // 测试覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'miniprogram/**/*.js',
    '!miniprogram/**/*.test.js',
    '!miniprogram/**/*.spec.js',
    '!miniprogram/app.js',
    '!miniprogram/sitemap.js',
    '!miniprogram/envList.js',
    '!**/node_modules/**',
    '!**/backup-*/**'
  ],

  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/miniprogram/$1',
    '^@@/(.*)$': '<rootDir>/$1'
  },

  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backup-*/',
    '/example/'
  ],

  // 测试超时时间
  testTimeout: 10000,

  // 是否在测试失败时停止
  bail: false,

  // 详细输出
  verbose: true,

  // 测试结果输出格式
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true
      }
    }
  },

  // 是否清除模拟
  clearMocks: true,

  // 是否重置模拟
  resetMocks: true,

  // 是否恢复模拟
  restoreMocks: true
};
