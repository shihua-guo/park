// 图片URL缓存管理模块
class ImageCache {
  constructor() {
    // 使用Map存储：key为原始COS URL，value为临时签名URL
    this.cache = new Map()
    // 缓存过期时间：1.5小时（云函数返回的URL有效期是2小时，提前清理避免使用过期URL）
    this.expireTime = 1.5 * 60 * 60 * 1000 // 毫秒
    // 存储URL的过期时间戳
    this.expireMap = new Map()
  }

  /**
   * 获取单个图片的临时URL
   * @param {string} url - 原始COS URL
   * @returns {string|null} - 缓存的临时URL，如果不存在或已过期则返回null
   */
  get(url) {
    if (!url) return null
    
    const cachedUrl = this.cache.get(url)
    const expireTime = this.expireMap.get(url)
    
    // 检查是否存在且未过期
    if (cachedUrl && expireTime && Date.now() < expireTime) {
      console.log('[缓存命中]', url.substring(0, 50) + '...')
      return cachedUrl
    }
    
    // 过期则删除
    if (cachedUrl) {
      console.log('[缓存过期]', url.substring(0, 50) + '...')
      this.cache.delete(url)
      this.expireMap.delete(url)
    }
    
    return null
  }

  /**
   * 批量获取图片的临时URL
   * @param {string[]} urls - 原始COS URL数组
   * @returns {Object} - { cached: 缓存命中的URL数组, missing: 需要查询的URL数组, cacheMap: URL映射 }
   */
  getBatch(urls) {
    if (!urls || urls.length === 0) {
      return { cached: [], missing: [], cacheMap: {} }
    }

    const cached = []
    const missing = []
    const cacheMap = {}

    urls.forEach(url => {
      const cachedUrl = this.get(url)
      if (cachedUrl) {
        cached.push(url)
        cacheMap[url] = cachedUrl
      } else {
        missing.push(url)
      }
    })

    console.log(`[批量查询] 总数:${urls.length}, 命中:${cached.length}, 缺失:${missing.length}`)
    
    return { cached, missing, cacheMap }
  }

  /**
   * 设置单个图片的临时URL
   * @param {string} originalUrl - 原始COS URL
   * @param {string} tempUrl - 临时签名URL
   */
  set(originalUrl, tempUrl) {
    if (!originalUrl || !tempUrl) return
    
    this.cache.set(originalUrl, tempUrl)
    this.expireMap.set(originalUrl, Date.now() + this.expireTime)
    console.log('[缓存设置]', originalUrl.substring(0, 50) + '...')
  }

  /**
   * 批量设置图片的临时URL
   * @param {string[]} originalUrls - 原始COS URL数组
   * @param {string[]} tempUrls - 临时签名URL数组
   */
  setBatch(originalUrls, tempUrls) {
    if (!originalUrls || !tempUrls || originalUrls.length !== tempUrls.length) {
      console.warn('[批量设置失败] URL数组长度不匹配')
      return
    }

    originalUrls.forEach((originalUrl, index) => {
      this.set(originalUrl, tempUrls[index])
    })

    console.log(`[批量缓存] 已缓存 ${originalUrls.length} 个URL`)
  }

  /**
   * 清理所有过期缓存
   */
  clearExpired() {
    const now = Date.now()
    let count = 0

    this.expireMap.forEach((expireTime, url) => {
      if (now >= expireTime) {
        this.cache.delete(url)
        this.expireMap.delete(url)
        count++
      }
    })

    if (count > 0) {
      console.log(`[清理过期缓存] 已清理 ${count} 个过期URL`)
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.expireMap.clear()
    console.log(`[清空缓存] 已清空 ${size} 个URL`)
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    }
  }
}

// 创建全局单例
const imageCache = new ImageCache()

// 定时清理过期缓存（每10分钟）
setInterval(() => {
  imageCache.clearExpired()
}, 10 * 60 * 1000)

module.exports = imageCache
