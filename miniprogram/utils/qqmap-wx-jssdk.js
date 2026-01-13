/**
 * 腾讯地图微信小程序JavaScript SDK
 * 
 * 使用说明：
 * 1. 前往腾讯位置服务官网申请开发者密钥（key）：https://lbs.qq.com/
 * 2. 在小程序管理后台设置服务器域名，添加：https://apis.map.qq.com
 * 3. 在使用时初始化SDK：
 * 
 * const QQMapWX = require('../../utils/qqmap-wx-jssdk.js')
 * const qqmapsdk = new QQMapWX({
 *   key: 'YOUR-KEY-HERE'
 * })
 * 
 * 4. 下载完整SDK文件：
 *    https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/jsSdkOverview
 */

// 这是一个占位文件，请下载完整的腾讯地图SDK替换此文件
function QQMapWX(options) {
  this.key = options.key
  
  console.warn('请下载完整的腾讯地图SDK文件并替换此文件')
  console.warn('下载地址：https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/jsSdkOverview')
}

QQMapWX.prototype.search = function(options) {
  console.warn('腾讯地图SDK未正确配置')
}

QQMapWX.prototype.reverseGeocoder = function(options) {
  console.warn('腾讯地图SDK未正确配置')
}

QQMapWX.prototype.geocoder = function(options) {
  console.warn('腾讯地图SDK未正确配置')
}

QQMapWX.prototype.getSuggestion = function(options) {
  console.warn('腾讯地图SDK未正确配置')
}

module.exports = QQMapWX
