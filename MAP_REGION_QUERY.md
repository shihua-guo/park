# 地图可视区域查询优化

## 修改说明

原先的实现是根据地图中心点和缩放级别计算一个大概的范围（±0.5度等），这种方式不够精确。

现在改为**使用地图实际可视区域的四个角点坐标**进行查询，更加准确。

---

## 实现原理

### 1. 获取地图可视区域

微信小程序地图API `mapCtx.getRegion()` 返回的数据格式：

```javascript
{
  northeast: {
    latitude: 22.604630069069085,   // 东北角纬度
    longitude: 114.05073337736906   // 东北角经度
  },
  southwest: {
    latitude: 22.538534210457737,   // 西南角纬度
    longitude: 114.01382827418058   // 西南角经度
  }
}
```

### 2. 数据库范围查询

使用这两个角点坐标构建查询条件：

```javascript
query = query.where({
  latitude: _.and(
    _.gte(southwest.latitude),   // 纬度 >= 西南角纬度
    _.lte(northeast.latitude)     // 纬度 <= 东北角纬度
  ),
  longitude: _.and(
    _.gte(southwest.longitude),   // 经度 >= 西南角经度
    _.lte(northeast.longitude)    // 经度 <= 东北角经度
  )
})
```

这样查询出来的公园，都在地图当前可视范围内。

---

## 代码流程

### 1. 页面加载 (onLoad)

```javascript
onLoad() {
  // 首次加载时不传region，加载所有数据（或不查询）
  this.loadParkData(null)
}
```

### 2. 地图准备完成 (onReady)

```javascript
onReady() {
  this.mapCtx = wx.createMapContext('map')
  
  // 延迟500ms获取初始地图区域
  setTimeout(() => {
    this.mapCtx.getRegion({
      success: (res) => {
        if (res.northeast && res.southwest) {
          // 使用实际区域查询
          this.loadParkData({
            northeast: res.northeast,
            southwest: res.southwest
          })
        }
      }
    })
  }, 500)
}
```

**为什么要延迟500ms？**
- 确保地图组件完全加载
- 避免地图API调用失败

### 3. 地图区域变化 (onRegionChange)

```javascript
onRegionChange(e) {
  if (e.type === 'end' && e.causedBy) {
    // 用户拖动或缩放结束
    this.mapCtx.getRegion({
      success: (res) => {
        if (res.northeast && res.southwest) {
          // 使用新的可视区域重新查询
          this.loadParkData({
            northeast: res.northeast,
            southwest: res.southwest
          })
        }
      }
    })
  }
}
```

### 4. 数据加载 (loadParkData)

```javascript
async loadParkData(region) {
  const db = wx.cloud.database()
  const _ = db.command
  let query = db.collection('park_20260119')
  
  if (region && region.northeast && region.southwest) {
    // 使用实际的地图可视区域边界
    const { northeast, southwest } = region
    
    query = query.where({
      latitude: _.and(
        _.gte(southwest.latitude),
        _.lte(northeast.latitude)
      ),
      longitude: _.and(
        _.gte(southwest.longitude),
        _.lte(northeast.longitude)
      )
    })
  }
  
  const dbRes = await query.get()
  await this.processParkData(dbRes.data)
}
```

---

## 优势对比

### ❌ 旧方案：中心点 + 固定范围

```javascript
// 问题：
// 1. 范围是估算的，不是实际可视区域
// 2. 不同缩放级别需要硬编码范围值
// 3. 可能查询到屏幕外的数据
query.where({
  latitude: _.and(
    _.gte(centerLat - 0.5),
    _.lte(centerLat + 0.5)
  ),
  longitude: _.and(
    _.gte(centerLng - 0.5),
    _.lte(centerLng + 0.5)
  )
})
```

### ✅ 新方案：实际可视区域边界

```javascript
// 优势：
// 1. 使用地图真实的可视区域
// 2. 自动适应所有缩放级别
// 3. 精确查询，不多不少
query.where({
  latitude: _.and(
    _.gte(southwest.latitude),
    _.lte(northeast.latitude)
  ),
  longitude: _.and(
    _.gte(southwest.longitude),
    _.lte(northeast.longitude)
  )
})
```

---

## 示例场景

### 场景1：初始加载
1. 页面打开，地图显示深圳市中心
2. `onReady` 触发，500ms后获取地图区域
3. 查询该区域内的公园（约10-50个）
4. 在地图上显示标记点

### 场景2：用户拖动地图
1. 用户将地图拖动到另一个区域
2. `onRegionChange` 触发（type: 'end'）
3. 获取新的可视区域边界
4. 重新查询新区域内的公园
5. 更新地图标记点

### 场景3：用户缩放地图
1. 用户放大地图查看细节
2. `onRegionChange` 触发（type: 'end'）
3. 获取缩小后的可视区域
4. 查询更小范围内的公园（数量更少，更精确）
5. 更新地图标记点

---

## 性能优化

### 1. 避免频繁查询
- 只在拖动/缩放**结束**时查询（`e.type === 'end'`）
- 不在拖动过程中查询

### 2. 数据库索引
确保数据库字段有索引：
```javascript
// 建议在云开发控制台创建索引
{
  "latitude": 1,
  "longitude": 1
}
```

### 3. 限制返回数量
如果数据量很大，可以添加 `limit()`：
```javascript
const dbRes = await query.limit(100).get()
```

---

## 控制台日志示例

```
初始地图区域: {
  northeast: { latitude: 22.6046, longitude: 114.0507 },
  southwest: { latitude: 22.5385, longitude: 114.0138 }
}

查询范围（地图可视区域）: {
  northeast: { lat: 22.6046, lng: 114.0507 },
  southwest: { lat: 22.5385, lng: 114.0138 }
}

数据库读取成功！
数据条数: 15
```

---

## 注意事项

1. **数据库查询限制**
   - 单次查询最多返回100条（可配置）
   - 如果区域内公园超过100个，需要分页

2. **地图加载时机**
   - `onReady` 中延迟500ms确保地图完全加载
   - 避免过早调用 `getRegion()` 导致失败

3. **首次加载**
   - 首次 `onLoad` 时传 `null`，不做查询或加载全部
   - 等待 `onReady` 后获取实际区域再查询

4. **边界情况**
   - 如果 `getRegion()` 失败，不会崩溃
   - 会在控制台显示警告信息

---

## 后续优化方向

1. **添加防抖**
   - 避免用户快速拖动时频繁查询
   - 使用 `setTimeout` 延迟300ms执行

2. **缓存机制**
   - 记录已查询过的区域
   - 避免重复查询相同区域

3. **预加载**
   - 预加载周边区域的数据
   - 提升用户体验

4. **显示查询状态**
   - 在地图上显示加载动画
   - 提示用户数据正在加载
