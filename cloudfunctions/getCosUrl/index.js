// 云函数：生成腾讯云COS临时访问URL
const cloud = require('wx-server-sdk')
const COS = require('cos-nodejs-sdk-v5')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// COS配置（密钥请通过云函数环境变量配置）
const SECRET_ID = process.env.COS_SECRET_ID
const SECRET_KEY = process.env.COS_SECRET_KEY
const REGION = process.env.COS_REGION || 'ap-guangzhou'
const BUCKET_NAME = process.env.COS_BUCKET_NAME || 'parks-1391406291'

const cos = new COS({
  SecretId: SECRET_ID,
  SecretKey: SECRET_KEY
})

/**
 * 从完整URL中提取对象Key
 * 例如: https://parks-1391406291.cos.ap-guangzhou.myqcloud.com/images/test.jpg
 * 提取为: images/test.jpg
 */
function extractKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return url
  
  // 如果不是http链接，直接返回（可能已经是Key）
  if (!url.startsWith('http')) return url
  
  try {
    // 提取域名后的路径部分
    const match = url.match(/\.myqcloud\.com\/(.+)/)
    if (match && match[1]) {
      return match[1]
    }
    // 如果匹配失败，返回原URL
    return url
  } catch (e) {
    console.error('提取Key失败:', e)
    return url
  }
}

/**
 * 生成预签名URL
 */
function generatePresignedUrl(objectKey, expired = 3600) {
  return new Promise((resolve, reject) => {
    try {
      const key = extractKeyFromUrl(objectKey)
      
      cos.getObjectUrl({
        Bucket: BUCKET_NAME,
        Region: REGION,
        Key: key,
        Sign: true,
        Expires: expired
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.Url)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 云函数入口
 * event 参数：
 * - url: 单个URL字符串
 * - urls: URL数组
 * - expired: 过期时间（秒），默认3600
 */
exports.main = async (event, context) => {
  const { url, urls, expired = 3600 } = event
  
  try {
    // 处理单个URL
    if (url) {
      const signedUrl = await generatePresignedUrl(url, expired)
      return {
        success: true,
        url: signedUrl
      }
    }
    
    // 处理多个URL
    if (urls && Array.isArray(urls)) {
      const signedUrls = await Promise.all(
        urls.map(u => generatePresignedUrl(u, expired))
      )
      return {
        success: true,
        urls: signedUrls
      }
    }
    
    return {
      success: false,
      error: '请提供 url 或 urls 参数'
    }
  } catch (error) {
    console.error('生成临时URL失败:', error)
    return {
      success: false,
      error: error.message || '生成失败'
    }
  }
}
