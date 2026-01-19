# 分页查询优化说明

## 问题背景

微信小程序云数据库默认单次查询限制：
- 默认返回：**20条**
- 最大限制：**100条**（使用 `.limit(100)`）

如果地图可视区域内有超过20个公园，之前的代码只会显示前20个，其余的不会展示。

---

## 解决方案

使用 **分页循环查询**，每次查询20条，直到获取完所有数据。

### 核心逻辑

```javascript
const PAGE_SIZE = 20
let allParks = []
let hasMore = true
let page = 0

while (hasMore) {
  const skip = page * PAGE_SIZE
  
  const dbRes = await db.collection('park_20260119')
    .where(whereCondition)
    .skip(skip)           // 跳过前面已查询的数据
    .limit(PAGE_SIZE)     // 每次查询20条
    .get()
  
  if (dbRes.data.length > 0) {
    allParks = allParks.concat(dbRes.data)  // 合并数据
    page++
    
    // 如果返回数据少于20条，说明已经是最后一页
    if (dbRes.data.length < PAGE_SIZE) {
      hasMore = false
    }
  } else {
    hasMore = false  // 没有更多数据
  }
}
```

---

## 工作流程示例

假设地图区域内有 **65个公园**：

### 第1次查询
```javascript
.skip(0).limit(20)
// 返回：第1-20个公园
// allParks.length = 20
// hasMore = true（因为返回了20条，可能还有更多）
```

### 第2次查询
```javascript
.skip(20).limit(20)
// 返回：第21-40个公园
// allParks.length = 40
// hasMore = true
```

### 第3次查询
```javascript
.skip(40).limit(20)
// 返回：第41-60个公园
// allParks.length = 60
// hasMore = true
```

### 第4次查询
```javascript
.skip(60).limit(20)
// 返回：第61-65个公园（只有5条）
// allParks.length = 65
// hasMore = false（返回数据 < 20，说明是最后一页）
```

**结果**：总共查询4次，获取全部65个公园 ✅

---

## 控制台输出示例

```
开始从数据库读取parks集合...
查询范围（地图可视区域）: {
  northeast: { lat: 22.6046, lng: 114.0507 },
  southwest: { lat: 22.5385, lng: 114.0138 }
}
正在查询第 1 页，跳过 0 条...
第 1 页查询结果：20 条
正在查询第 2 页，跳过 20 条...
第 2 页查询结果：20 条
正在查询第 3 页，跳过 40 条...
第 3 页查询结果：20 条
正在查询第 4 页，跳过 60 条...
第 4 页查询结果：5 条
数据库读取成功！
总数据条数: 65
总共查询了 4 页
```

---

## 性能优化

### 1. 避免打印过多日志
当数据超过50条时，只打印前5条示例：

```javascript
if (allParks.length <= 50) {
  // 数据较少，逐条打印
  allParks.forEach((park, index) => {
    console.log(`公园${index + 1}:`, park)
  })
} else {
  // 数据较多，只打印前5条
  console.log('数据较多，不逐条打印。前5条示例:')
  allParks.slice(0, 5).forEach((park, index) => {
    console.log(`公园${index + 1}:`, park)
  })
}
```

### 2. 调整每页大小
根据实际情况，可以调整 `PAGE_SIZE`：

```javascript
const PAGE_SIZE = 20   // 当前设置：每页20条

// 其他选项：
// const PAGE_SIZE = 50   // 每页50条（减少请求次数）
// const PAGE_SIZE = 100  // 每页100条（最大限制，最少请求次数）
```

**建议**：
- 如果数据量大，使用较大的 `PAGE_SIZE`（如50或100）减少请求次数
- 如果担心单次请求时间过长，使用较小的 `PAGE_SIZE`（如20）

### 3. 显示加载进度
可以在加载时显示当前进度：

```javascript
wx.showLoading({ 
  title: `加载中... ${allParks.length}个` 
})
```

---

## 注意事项

### 1. 查询时间
- 每次查询都需要网络请求
- 如果数据量很大（如500个公园），需要查询25次（500 ÷ 20 = 25）
- 总查询时间 = 单次查询时间 × 查询次数

### 2. 数据库性能
- 确保 `latitude` 和 `longitude` 字段有索引
- 范围查询在有索引的情况下性能较好

### 3. 用户体验
- 显示 loading 状态
- 控制台输出查询进度
- 避免用户等待时间过长

### 4. 数据量限制
理论上没有限制，但实际建议：
- 单个地图区域内公园数量：< 200个
- 如果超过200个，考虑：
  - 增大 `PAGE_SIZE` 到100
  - 优化查询条件（缩小区域范围）
  - 添加其他筛选条件

---

## 对比

### ❌ 修改前（只查询20条）

```javascript
const dbRes = await query.get()
// 返回最多20条
// 如果有100个公园，只显示20个 ❌
```

### ✅ 修改后（分页查询全部）

```javascript
while (hasMore) {
  const dbRes = await query.skip(skip).limit(20).get()
  allParks = allParks.concat(dbRes.data)
  // ...
}
// 返回全部数据
// 如果有100个公园，全部显示 ✅
```

---

## 进一步优化建议

### 1. 并行查询（高级）
如果知道总数，可以并行查询多页：

```javascript
const total = 100  // 假设已知总数
const promises = []

for (let i = 0; i < Math.ceil(total / 20); i++) {
  promises.push(
    db.collection('park_20260119')
      .where(whereCondition)
      .skip(i * 20)
      .limit(20)
      .get()
  )
}

const results = await Promise.all(promises)
const allParks = results.flatMap(r => r.data)
```

**优势**：查询速度更快（并行）
**劣势**：需要先知道总数，或者估算

### 2. 虚拟滚动
如果数据量特别大（如1000+），考虑：
- 只渲染可见区域的标记点
- 使用虚拟滚动技术
- 按需加载数据

### 3. 缓存机制
- 缓存已查询过的区域数据
- 避免重复查询相同区域
- 使用 `wx.setStorageSync` 本地缓存

---

## 测试建议

### 测试场景1：少量数据（< 20个）
1. 缩放地图到只有10个公园的区域
2. 观察控制台：应该只查询1页
3. 所有10个公园都应该显示

### 测试场景2：中等数据（20-100个）
1. 缩放地图到有50个公园的区域
2. 观察控制台：应该查询3页（20+20+10）
3. 所有50个公园都应该显示

### 测试场景3：大量数据（> 100个）
1. 缩放地图到整个深圳市
2. 观察控制台：查询多页
3. 所有公园都应该显示
4. 注意加载时间是否可接受

---

## 总结

✅ **修改完成**：现在可以查询并显示地图区域内的**所有公园**，不受20条限制

✅ **自动分页**：使用 `while` 循环自动处理分页

✅ **日志优化**：数据较多时只打印摘要，避免控制台卡顿

✅ **性能可控**：可以通过调整 `PAGE_SIZE` 平衡请求次数和单次请求时间

✅ **用户体验**：显示 loading 状态，让用户知道数据正在加载
