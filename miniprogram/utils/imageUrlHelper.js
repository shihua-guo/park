// 图片URL获取辅助函数
const imageCache = require('./imageCache.js')

/**
 * 获取单个图片的临时URL（带缓存）
 * @param {string} url - 原始COS URL
 * @returns {Promise<string>} - 临时签名URL
 */
async function getImageUrl(url) {
  if (!url) return ''

  // 1. 先尝试从缓存获取
  const cachedUrl = imageCache.get(url)
  if (cachedUrl) {
    return cachedUrl
  }

  // 2. 缓存未命中，调用云函数
  try {
    const res = await wx.cloud.callFunction({
      name: 'getCosUrl',
      data: { url: url, expired: 7200 }
    })

    if (res.result && res.result.success && res.result.url) {
      const tempUrl = res.result.url
      // 3. 存入缓存
      imageCache.set(url, tempUrl)
      return tempUrl
    } else {
      console.warn('[获取URL失败] 使用原始URL:', url)
      return url
    }
  } catch (err) {
    console.warn('[云函数调用失败] 使用原始URL:', err)
    return url
  }
}

/**
 * 批量获取图片的临时URL（带缓存）
 * @param {string[]} urls - 原始COS URL数组
 * @returns {Promise<string[]>} - 临时签名URL数组
 */
async function getImageUrls(urls) {
  if (!urls || urls.length === 0) return []

  // 过滤掉空URL
  const validUrls = urls.filter(Boolean)
  if (validUrls.length === 0) return []

  // 1. 批量检查缓存
  const { missing, cacheMap } = imageCache.getBatch(validUrls)

  // 2. 如果全部命中缓存，直接返回
  if (missing.length === 0) {
    return validUrls.map(url => cacheMap[url])
  }

  // 3. 查询缺失的URL
  try {
    const res = await wx.cloud.callFunction({
      name: 'getCosUrl',
      data: { urls: missing, expired: 7200 }
    })

    if (res.result && res.result.success && res.result.urls) {
      // 4. 将新获取的URL存入缓存
      imageCache.setBatch(missing, res.result.urls)

      // 5. 构建完整的URL映射（缓存 + 新查询）
      const urlMap = { ...cacheMap }
      missing.forEach((url, index) => {
        urlMap[url] = res.result.urls[index]
      })

      // 6. 按原始顺序返回
      return validUrls.map(url => urlMap[url] || url)
    } else {
      console.warn('[批量获取URL失败] 使用原始URL')
      // 对于失败的URL，合并缓存结果和原始URL
      return validUrls.map(url => cacheMap[url] || url)
    }
  } catch (err) {
    console.warn('[云函数批量调用失败] 使用原始URL:', err)
    // 对于失败的URL，合并缓存结果和原始URL
    return validUrls.map(url => cacheMap[url] || url)
  }
}

/**
 * 预加载图片URL到缓存（不返回结果，静默加载）
 * @param {string[]} urls - 原始COS URL数组
 */
async function preloadImageUrls(urls) {
  if (!urls || urls.length === 0) return

  const validUrls = urls.filter(Boolean)
  if (validUrls.length === 0) return

  // 检查哪些URL缺失
  const { missing } = imageCache.getBatch(validUrls)
  
  if (missing.length === 0) {
    console.log('[预加载] 全部URL已在缓存中')
    return
  }

  console.log(`[预加载] 开始预加载 ${missing.length} 个URL`)

  try {
    const res = await wx.cloud.callFunction({
      name: 'getCosUrl',
      data: { urls: missing, expired: 7200 }
    })

    if (res.result && res.result.success && res.result.urls) {
      imageCache.setBatch(missing, res.result.urls)
      console.log(`[预加载完成] 已缓存 ${missing.length} 个URL`)
    }
  } catch (err) {
    console.warn('[预加载失败]', err)
  }
}

module.exports = {
  getImageUrl,
  getImageUrls,
  preloadImageUrls,
  imageCache // 导出缓存实例，供外部使用
}
