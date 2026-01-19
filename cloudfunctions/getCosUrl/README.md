# getCosUrl 云函数

## 功能说明
该云函数用于生成腾讯云COS（对象存储）的临时访问URL，使小程序能够访问存储在COS中的图片资源。

## 使用方法

### 1. 部署云函数

1. 在微信开发者工具中，右键点击 `cloudfunctions/getCosUrl` 文件夹
2. 选择"上传并部署：云端安装依赖（不上传node_modules）"
3. 等待部署完成

### 2. 调用方式

#### 单个URL转换
```javascript
const res = await wx.cloud.callFunction({
  name: 'getCosUrl',
  data: {
    url: 'https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/test.jpg',
    expired: 3600  // 可选，默认3600秒（1小时）
  }
})

console.log(res.result.url)  // 临时访问URL
```

#### 批量URL转换
```javascript
const res = await wx.cloud.callFunction({
  name: 'getCosUrl',
  data: {
    urls: [
      'https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/1.jpg',
      'https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/2.jpg'
    ],
    expired: 7200  // 可选，默认3600秒
  }
})

console.log(res.result.urls)  // 临时访问URL数组
```

## 参数说明

- `url` (String): 单个COS对象URL
- `urls` (Array): 多个COS对象URL数组
- `expired` (Number): 临时URL的有效期（秒），默认3600秒（1小时）

## 返回格式

### 成功
```javascript
{
  success: true,
  url: 'https://...'  // 单个URL时
  // 或
  urls: ['https://...', 'https://...']  // 多个URL时
}
```

### 失败
```javascript
{
  success: false,
  error: '错误信息'
}
```

## 注意事项

1. **安全性**: COS密钥存储在云函数中，不会暴露在前端
2. **有效期**: 临时URL有时效性，建议设置合理的过期时间
3. **并发**: 支持批量转换，减少云函数调用次数
4. **URL格式**: 支持完整的COS URL或对象Key
