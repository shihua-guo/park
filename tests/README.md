# 测试报告

## 概述
本文档说明了为微信小程序项目生成的单元测试。

## 测试文件

### 1. index-page.test.js
测试地图主页的核心功能：
- 生命周期测试
- 数据加载与处理
- 距离计算
- 地图交互
- 标记点处理
- 分类筛选

### 2. detail-page.test.js
测试公园详情页的核心功能：
- 详情数据加载
- 图片处理
- 标签图标映射
- 描述生成
- 设施解析
- 用户交互（导航、电话、收藏等）

### 3. home-page.test.js
测试主页的核心功能：
- 数据初始化
- 标记点处理
- 筛选功能
- 搜索功能
- 导航跳转

### 4. utils.test.js
测试工具函数：
- 数据结构验证
- 距离计算
- 距离格式化
- 坐标验证
- URL验证
- 字符串处理

## 运行测试

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm test
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 监视模式运行测试
```bash
npm run test:watch
```

### CI环境运行测试
```bash
npm run test:ci
```

## 测试覆盖范围

### 页面级别测试
- ✅ index 页面 (地图主页)
- ✅ detail 页面 (详情页)
- ✅ home 页面 (主页)

### 工具函数测试
- ✅ 距离计算 (Haversine公式)
- ✅ 距离格式化
- ✅ 数据验证
- ✅ 字符串处理

### 覆盖率目标
- 分支覆盖率: 60%
- 函数覆盖率: 60%
- 行覆盖率: 60%
- 语句覆盖率: 60%

## 测试策略

### Mock策略
- 完全模拟微信小程序 API (wx.*)
- 模拟云开发 API (wx.cloud.*)
- 模拟 Page 和 App 生命周期

### 测试类型
- 单元测试: 测试独立函数和方法
- 集成测试: 测试页面组件和交互
- 边界测试: 测试极端情况和异常输入
- 错误处理测试: 测试错误场景

## 测试结果示例

```
 PASS  tests/index-page.test.js
 PASS  tests/detail-page.test.js
 PASS  tests/home-page.test.js
 PASS  tests/utils.test.js

Test Suites: 4 passed, 4 total
Tests:       80+ passed, 80+ total
Snapshots:   0 total
Time:        X.XX s
Coverage:    XX.X% (approximate)
```

## 注意事项

1. **微信小程序API模拟**: 测试使用全局 mock 对象模拟微信 API，确保在 Node.js 环境中可以运行

2. **异步测试**: 使用 async/await 处理异步操作，如数据库查询和云函数调用

3. **边界条件**: 特别注意测试以下边界情况：
   - 空数据
   - null/undefined 参数
   - 无效坐标
   - 网络错误

4. **覆盖率**: 当前设置为 60%，可以根据实际需求调整

## 持续集成

测试已配置为可在 CI 环境中运行：
- 生成 JUnit 格式的测试报告
- 生成 HTML 格式的覆盖率报告
- 覆盖率不达标时测试失败

## 扩展测试

如需添加更多测试，可以：
1. 在 tests/ 目录下创建新的测试文件
2. 遵循命名规范 `*.test.js`
3. 使用 Jest 的 describe 和 test 组织测试用例
4. 确保所有外部依赖都被正确 mock

## 故障排查

### 问题: 找不到模块
**解决方案**: 确保已安装所有依赖 `npm install`

### 问题: 测试超时
**解决方案**: 增加 jest.config.js 中的 testTimeout 值

### 问题: Mock 不生效
**解决方案**: 检查全局 wx 对象是否在每个测试文件中正确设置

## 参考资源

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [微信小程序测试指南](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/trap.html)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
