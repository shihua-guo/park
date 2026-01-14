// index.js
const QQMapWX = require('../../utils/qqmap-wx-jssdk.js')
let qqmapsdk

Page({
  data: {
    // 地图配置
    longitude: 114.057868,
    latitude: 22.543099,
    scale: 14,

    // 当前城市
    currentCity: '深圳',

    // 分类数据
    categories: [
      { id: 'indoor', name: '室内乐园', icon: '🏠' },
      { id: 'park', name: '儿童公园', icon: '🌳' },
      { id: 'forest', name: '森林步道', icon: '🌲' },
      { id: 'farm', name: '农场体验', icon: '🌾' },
      { id: 'water', name: '水上乐园', icon: '💧' }
    ],
    currentCategory: 'indoor',

    // 地图标记点 - 从数据库加载
    markers: [],

    // 当前显示的地点（默认不显示）
    currentPlace: null,

    showCard: false
  },

  onLoad(options) {
    console.log('页面加载开始...')
    
    // 初始化腾讯地图SDK
    // 注意：需要先去腾讯位置服务申请key
    // qqmapsdk = new QQMapWX({
    //   key: 'YOUR-KEY-HERE'
    // })
    
    // 从数据库加载parks数据
    this.loadParkData()
  },

  // 加载公园数据
  async loadParkData() {
    wx.showLoading({ title: '加载中...' })

    try {
      console.log('开始从数据库读取parks集合...')
      
      // 从数据库获取公园数据
      const dbRes = await wx.cloud.database().collection('parks').get()
      
      console.log('数据库读取成功！')
      console.log('数据条数:', dbRes.data.length)
      console.log('parks数据:', dbRes.data)
      
      // 打印每个公园的信息
      dbRes.data.forEach((park, index) => {
        console.log(`公园${index + 1}:`, park)
      })
      
      // 处理并设置markers数据
      this.processParkData(dbRes.data)
      
    } catch (err) {
      console.error('数据加载失败:', err)
      wx.showToast({ 
        title: '加载失败', 
        icon: 'none' 
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 处理公园数据，转换为地图标记点
  processParkData(parkList) {
    const markers = parkList.map((park, index) => ({
      id: index + 1,  // 使用数字索引作为 markerId
      parkId: park._id || park.id,  // 保存原始数据库ID
      latitude: park.latitude,
      longitude: park.longitude,
      title: park.name,
      iconPath: '/images/icons/公园.png',  // 使用公园图标
      width: 40,
      height: 40,
      callout: {
        content: park.name,
        color: '#2094f3',
        fontSize: 12,
        borderRadius: 8,
        bgColor: '#ffffff',
        padding: 8,
        display: 'ALWAYS'
      }
    }))
    
    console.log('转换后的markers:', markers)
    this.setData({ markers })
  },

  onReady() {
    // 创建地图上下文
    this.mapCtx = wx.createMapContext('map')
  },

  // 点击地图空白处：隐藏底部卡片
  onMapTap(e) {
    // 部分机型上，点击 marker 可能会连带触发一次 map tap，这里做一次性忽略
    if (this._ignoreNextMapTap) {
      this._ignoreNextMapTap = false
      return
    }

    if (this.data.showCard) {
      this.setData({ showCard: false })
    }
  },

  hideCard() {
    this.setData({ showCard: false })
  },

  // 点击地图标记：弹出底部卡片（不直接跳转）
  async onMarkerTap(e) {
    const markerId = e.markerId || e.detail?.markerId
    if (!markerId) {
      wx.showToast({ title: '未找到标记ID', icon: 'none' })
      return
    }

    const marker = this.data.markers.find(m => m.id === markerId)
    if (!marker) {
      wx.showToast({ title: '未找到位置信息', icon: 'none' })
      return
    }

    // 避免 marker 点击后又触发一次 map tap 把卡片立刻关掉
    this._ignoreNextMapTap = true

    // 先用 marker 的基础信息占位，保证“点一下就弹出”
    const basePlace = {
      parkId: marker.parkId || marker.id,
      name: marker.title || '未知地点',
      rating: marker.rating || 0,
      image: marker.image || marker.iconPath || '',
      tags: marker.tags || [],
      address: marker.address || '',
      distance: '',
      latitude: marker.latitude,
      longitude: marker.longitude
    }

    this.setData({
      currentPlace: basePlace,
      showCard: true
    })

    // 有 parkId 就从数据库补全详情字段
    if (!marker.parkId) return

    try {
      const db = wx.cloud.database()
      const res = await db.collection('parks').doc(marker.parkId).get()
      const park = res?.data
      if (!park) return

      const place = {
        parkId: marker.parkId,
        name: park.name || basePlace.name,
        rating: park.rating || basePlace.rating,
        image: park.image || park.cover || park.icon || basePlace.image,
        tags: Array.isArray(park.tags) ? park.tags : (Array.isArray(park.sceneTags) ? park.sceneTags : basePlace.tags),
        address: park.address || park.location || basePlace.address,
        latitude: park.latitude ?? basePlace.latitude,
        longitude: park.longitude ?? basePlace.longitude
      }

      const distanceMeters = this.calcDistanceMeters(
        this.data.latitude,
        this.data.longitude,
        place.latitude,
        place.longitude
      )

      this.setData({
        currentPlace: {
          ...basePlace,
          ...place,
          distance: this.formatDistance(distanceMeters)
        }
      })
    } catch (err) {
      console.warn('补全地点信息失败（不影响弹出卡片）:', err)
    }
  },

  // 点击城市选择
  onCitySelect() {
    wx.showActionSheet({
      itemList: ['深圳', '广州', '北京', '上海'],
      success: (res) => {
        if (!res.cancel) {
          const cities = ['深圳', '广州', '北京', '上海']
          this.setData({
            currentCity: cities[res.tapIndex]
          })
        }
      }
    })
  },

  // 点击分类标签
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentCategory: id
    })
    
    // 根据分类筛选地点
    console.log('切换分类:', id)
  },

  // 点击筛选按钮
  onFilterTap() {
    wx.showToast({
      title: '筛选功能',
      icon: 'none'
    })
  },

  // 点击定位
  onLocationTap() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
        this.mapCtx.moveToLocation()
      },
      fail: () => {
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    })
  },

  // 点击卡片跳转到详情页
  onCardTap() {
    const place = this.data.currentPlace
    const id = place?.parkId
    if (!id) return

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  calcDistanceMeters(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number')) return NaN
    const R = 6371000
    const toRad = d => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  },

  formatDistance(meters) {
    if (!Number.isFinite(meters)) return ''
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  },

  // 点击导航按钮
  onNavigate(e) {
    const place = this.data.currentPlace
    if (!place) return

    wx.openLocation({
      latitude: place.latitude ?? this.data.latitude,
      longitude: place.longitude ?? this.data.longitude,
      name: place.name,
      address: place.address,
      scale: 18
    })
  }
})
