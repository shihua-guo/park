# 图片页面完善说明

## 修改概览

完善了两个图片相关页面，使其能够从数据库加载真实数据并正确显示图片。

---

## 1. 图片列表页 (photos.js)

### 功能说明
- 以瀑布流形式展示公园的所有图片
- 图片分为左右两列，奇数索引在左，偶数索引在右
- 点击图片可以进入全屏查看模式

### 数据加载流程

#### onLoad - 获取参数
```javascript
onLoad(options) {
  const id = options.id        // 公园ID
  const index = options.index  // 当前图片索引（可选）
  
  await this.loadParkImages(id)
}
```

#### loadParkImages - 加载图片
```javascript
async loadParkImages(parkId) {
  // 1. 从数据库获取公园数据
  const res = await db.collection('park_20260119').doc(parkId).get()
  const park = res.data
  
  // 2. 提取图片URL（封面图 + 详情图）
  const allImages = [park.coverImg, ...park.imgs].filter(Boolean)
  
  // 3. 调用云函数转换为临时URL
  const urlRes = await wx.cloud.callFunction({
    name: 'getCosUrl',
    data: { urls: allImages, expired: 7200 }
  })
  
  // 4. 更新数据并分配到左右两列
  this.setData({
    placeName: park.name,
    images: tempImages
  })
  
  this.distributeImages()  // 分配图片到左右列
}
```

#### distributeImages - 分配图片到瀑布流
```javascript
distributeImages() {
  const leftImages = []   // 左列（索引 0, 2, 4...）
  const rightImages = []  // 右列（索引 1, 3, 5...）
  
  this.data.images.forEach((url, index) => {
    const item = { url, originalIndex: index }
    if (index % 2 === 0) {
      leftImages.push(item)
    } else {
      rightImages.push(item)
    }
  })
  
  this.setData({ leftImages, rightImages })
}
```

### UI状态

#### 加载状态
```xml
<view wx:if="{{loading}}">
  加载中...
</view>
```

#### 空状态
```xml
<view wx:elif="{{images.length === 0}}">
  暂无图片
</view>
```

#### 正常显示
```xml
<view wx:else>
  <!-- 瀑布流图片 -->
</view>
```

### 交互功能

| 功能 | 方法 | 说明 |
|------|------|------|
| 点击图片 | `onPhotoTap` | 跳转到全屏查看页 |
| 返回 | `onBack` | 返回上一页 |
| 更多选项 | `onMore` | 显示操作菜单 |

---

## 2. 图片详情页 (photo-detail.js)

### 功能说明
- 全屏显示图片
- 支持左右滑动切换
- 显示当前图片索引
- 支持保存图片到相册
- 长按图片显示系统菜单

### 数据加载流程

与图片列表页类似，也是从数据库加载数据并转换URL：

```javascript
async loadParkImages(parkId) {
  // 1. 获取公园数据
  const park = await db.collection('park_20260119').doc(parkId).get()
  
  // 2. 提取图片URL
  const allImages = [park.coverImg, ...park.imgs].filter(Boolean)
  
  // 3. 转换为临时URL
  const tempImages = await getCosUrl(allImages)
  
  // 4. 确保索引不超出范围
  let currentIndex = this.data.currentIndex
  if (currentIndex >= tempImages.length) {
    currentIndex = 0
  }
  
  this.setData({
    images: tempImages,
    currentIndex: currentIndex
  })
}
```

### 特殊功能

#### 屏幕常亮
```javascript
onLoad() {
  // 进入页面时开启屏幕常亮
  wx.setKeepScreenOn({ keepScreenOn: true })
}

onUnload() {
  // 离开页面时关闭屏幕常亮
  wx.setKeepScreenOn({ keepScreenOn: false })
}
```

#### 保存图片
```javascript
async onSaveImage() {
  const currentImage = this.data.images[this.data.currentIndex]
  
  // 1. 下载图片
  const downloadRes = await wx.downloadFile({
    url: currentImage
  })
  
  // 2. 保存到相册
  await wx.saveImageToPhotosAlbum({
    filePath: downloadRes.tempFilePath
  })
  
  wx.showToast({ title: '保存成功' })
}
```

**注意**：需要用户授权相册权限

### 交互功能

| 功能 | 方法 | 说明 |
|------|------|------|
| 左右滑动 | `onSwiperChange` | 切换图片 |
| 点击关闭 | `onClose` | 返回上一页 |
| 点击保存 | `onSaveImage` | 保存当前图片 |
| 长按图片 | 系统功能 | 显示保存/转发菜单 |

---

## 数据流转

### 从详情页到图片列表页
```javascript
// detail.js
onImageTap() {
  wx.navigateTo({
    url: `/pages/photos/photos?id=${parkId}&index=${currentIndex}`
  })
}
```

### 从图片列表页到图片详情页
```javascript
// photos.js
onPhotoTap(e) {
  const index = e.currentTarget.dataset.index
  wx.navigateTo({
    url: `/pages/photo-detail/photo-detail?id=${this.data.placeId}&index=${index}`
  })
}
```

---

## 数据格式

### 公园数据结构
```javascript
{
  _id: "park123",
  name: "演艺公园",
  coverImg: "https://parks-xxx.cos.xxx.com/images/xxx_0.jpg",
  imgs: [
    "https://parks-xxx.cos.xxx.com/images/xxx_1.jpg",
    "https://parks-xxx.cos.xxx.com/images/xxx_2.jpg",
    "https://parks-xxx.cos.xxx.com/images/xxx_3.jpg"
  ]
}
```

### 图片URL处理
```javascript
// 原始URL（需要签名）
"https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/xxx.jpg"

// 临时URL（云函数生成，有效期2小时）
"https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/xxx.jpg?sign=..."
```

---

## UI布局

### 图片列表页 (photos)
```
┌──────────────────────────┐
│  ‹  公园名称         ⋯  │  ← 导航栏
├──────────────────────────┤
│  ┌────┐  ┌────┐         │
│  │图1 │  │图2 │         │  ← 左列、右列
│  └────┘  └────┘         │
│  ┌────┐  ┌────┐         │
│  │图3 │  │图4 │         │
│  └────┘  └────┘         │
│                          │
│  ─ 已显示全部X张图片 ─  │  ← 底部提示
└──────────────────────────┘
```

### 图片详情页 (photo-detail)
```
┌──────────────────────────┐
│      ─────── (指示条)     │
│                    ✕     │  ← 关闭按钮
│                          │
│                          │
│       [全屏图片]         │  ← Swiper滑动
│                          │
│                          │
│                          │
│        1 / 5             │  ← 图片计数
│                    ⬇     │  ← 保存按钮
└──────────────────────────┘
```

---

## 错误处理

### 1. 数据库查询失败
```javascript
catch (err) {
  console.error('加载公园图片失败:', err)
  wx.showToast({ title: '加载失败', icon: 'none' })
}
```

### 2. 云函数调用失败
```javascript
catch (err) {
  console.warn('获取图片临时URL失败，使用原URL:', err)
  tempImages = allImages  // 使用原始URL作为备用
}
```

### 3. 保存图片失败
```javascript
catch (err) {
  if (err.errMsg.includes('auth')) {
    // 需要授权相册权限
    wx.showModal({
      title: '提示',
      content: '需要授权访问相册',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting()  // 打开设置页
        }
      }
    })
  }
}
```

---

## 性能优化

### 1. 图片懒加载
```xml
<image lazy-load="{{true}}" />
```

### 2. 分列渲染
- 瀑布流分为左右两列
- 分别渲染，避免长列表性能问题

### 3. 图片模式
```xml
<!-- 列表页：宽度固定，高度自适应 -->
<image mode="widthFix" />

<!-- 详情页：适应容器，保持比例 -->
<image mode="aspectFit" />
```

### 4. 临时URL缓存
- 有效期设置为2小时（7200秒）
- 减少云函数调用次数

---

## 测试场景

### 场景1：正常加载
1. 从详情页点击图片
2. 进入图片列表页
3. 看到所有图片以瀑布流展示
4. 点击某张图片
5. 进入全屏查看模式
6. 左右滑动切换图片

### 场景2：无图片
1. 访问没有图片的公园
2. 显示"暂无图片"提示

### 场景3：保存图片
1. 在全屏模式下点击保存按钮
2. 首次使用需要授权相册权限
3. 图片保存到手机相册
4. 显示"保存成功"提示

### 场景4：云函数失败
1. 云函数未部署或调用失败
2. 自动使用原始URL作为备用
3. 可能无法显示图片（403错误）

---

## 注意事项

1. **必须传递公园ID**
   - 两个页面都需要 `id` 参数
   - 如果缺少会显示错误提示

2. **图片URL转换**
   - 需要云函数 `getCosUrl` 已部署
   - 转换失败会使用原始URL（可能403）

3. **索引范围检查**
   - 确保 `currentIndex` 不超出数组长度
   - 避免显示空白图片

4. **相册权限**
   - 保存图片需要用户授权
   - 处理授权拒绝的情况

5. **屏幕常亮**
   - 只在详情页开启
   - 离开页面时记得关闭

---

## 后续优化

1. **添加分享功能**
   - 分享单张图片
   - 分享公园信息

2. **图片缩放**
   - 双击放大
   - 捏合手势缩放

3. **批量保存**
   - 保存所有图片到相册

4. **添加滤镜**
   - 美化图片效果

5. **优化加载**
   - 预加载前后几张图片
   - 显示加载进度条

---

## 总结

✅ **完成的功能**：
- 从数据库加载图片数据
- 使用云函数转换COS URL
- 瀑布流图片列表展示
- 全屏图片浏览和切换
- 保存图片到相册
- 完善的加载和空状态
- 错误处理和降级方案

✅ **用户体验**：
- 流畅的页面切换
- 清晰的图片展示
- 友好的错误提示
- 便捷的保存功能

✅ **性能优化**：
- 图片懒加载
- 分列渲染
- URL缓存
- 屏幕常亮
