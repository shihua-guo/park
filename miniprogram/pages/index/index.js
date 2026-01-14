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
    
    // 当前显示的地点
    currentPlace: {
      id: 1,
      name: '欢乐海岸室内乐园',
      rating: 4.8,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM-5cMKDvgQILvtAwmlzVtZ_BX3zyzirJFn_6mN0swZFjD8gSzoyvKDAEWRI8Lv497jDVD-u2qHen1XP0jabWOgyZs_G3-pJ_rNBb4I3KZS0C1ihqKokSRx1B4goBRqRIEeVoAnG3VOVYXg8WX1rA3Ic3a3tcsYc6CaWdhDEsJ3Ugg1q_o5Q6XH-YPVgMTJxHyfzWud2bsighX9IL65z_D_j6_lyAJp5oVUnO7RMQj8ucIZpJkqCE6S5VtOLWvQQFLkiG1CCUmOc8s',
      tags: ['室内空调', '适合 2-6岁'],
      address: '南山区滨海大道2008号',
      distance: '1.2km'
    },
    
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
    
    // 延迟显示卡片
    setTimeout(() => {
      this.setData({
        showCard: true
      })
    }, 500)
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

  // 点击地图（用于测试）
  onMapTap(e) {
    console.log('地图被点击了:', e)
  },

  // 点击地图标记
  onMarkerTap(e) {
    console.log('=== 标记点击事件触发 ===')
    console.log('事件对象:', e)
    console.log('e.markerId:', e.markerId)
    console.log('e.detail:', e.detail)
    
    const markerId = e.markerId || e.detail?.markerId
    console.log('解析后的 markerId:', markerId)
    console.log('当前所有 markers:', this.data.markers)
    
    if (!markerId) {
      console.warn('未找到 markerId')
      wx.showToast({
        title: '未找到标记ID',
        icon: 'none'
      })
      return
    }
    
    // 查找对应的marker
    const marker = this.data.markers.find(m => m.id === markerId)
    console.log('找到的 marker:', marker)
    
    if (marker && marker.parkId) {
      console.log('准备跳转到详情页，parkId:', marker.parkId)
      wx.navigateTo({
        url: `/pages/detail/detail?id=${marker.parkId}`,
        success: () => {
          console.log('跳转成功')
        },
        fail: (err) => {
          console.error('跳转失败:', err)
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          })
        }
      })
    } else {
      console.log('未找到对应的marker或parkId为空，显示卡片')
      this.setData({
        showCard: true
      })
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
    wx.navigateTo({
      url: `/pages/detail/detail?id=${this.data.currentPlace.id}`
    })
  },

  // 点击导航按钮
  onNavigate(e) {
    // 阻止事件冒泡，避免触发卡片点击
    const place = this.data.currentPlace
    wx.openLocation({
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      name: place.name,
      address: place.address,
      scale: 18
    })
  }
})
