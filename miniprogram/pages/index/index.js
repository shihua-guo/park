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
    
    // 地图标记点
    markers: [
      {
        id: 1,
        latitude: 22.543099,
        longitude: 114.057868,
        iconPath: '/images/marker-selected.png',
        width: 40,
        height: 40,
        callout: {
          content: '欢乐海岸室内乐园',
          color: '#2094f3',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#ffffff',
          padding: 8,
          display: 'ALWAYS'
        }
      },
      {
        id: 2,
        latitude: 22.553099,
        longitude: 114.067868,
        iconPath: '/images/marker-park.png',
        width: 35,
        height: 35,
        callout: {
          content: '深圳儿童公园',
          color: '#4CAF50',
          fontSize: 11,
          borderRadius: 6,
          bgColor: '#ffffff',
          padding: 6,
          display: 'BYCLICK'
        }
      },
      {
        id: 3,
        latitude: 22.533099,
        longitude: 114.047868,
        iconPath: '/images/marker-forest.png',
        width: 35,
        height: 35
      }
    ],
    
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
    // 初始化腾讯地图SDK
    // 注意：需要先去腾讯位置服务申请key
    // qqmapsdk = new QQMapWX({
    //   key: 'YOUR-KEY-HERE'
    // })
    
    // 读取parks集合
    this.loadParks()
    
    // 延迟显示卡片
    setTimeout(() => {
      this.setData({
        showCard: true
      })
    }, 500)
  },

  // 读取parks集合
  async loadParks() {
    try {
      console.log('开始读取parks集合...')
      
      const res = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getParks',
          limit: 100
        }
      })
      
      console.log('云函数调用结果:', res)
      
      if (res.result.success) {
        console.log('parks集合读取成功！')
        console.log('数据条数:', res.result.total)
        console.log('parks数据:', res.result.data)
        
        // 在控制台打印每个公园的信息
        res.result.data.forEach((park, index) => {
          console.log(`公园${index + 1}:`, park)
        })
      } else {
        console.error('读取失败:', res.result.errMsg)
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('调用云函数失败:', err)
      wx.showToast({
        title: '云函数调用失败',
        icon: 'none'
      })
    }
  },

  onReady() {
    // 创建地图上下文
    this.mapCtx = wx.createMapContext('map')
  },

  // 点击地图标记
  onMarkerTap(e) {
    const markerId = e.detail.markerId
    console.log('点击了标记:', markerId)
    
    // 根据markerId更新显示的地点信息
    // 这里可以从数据库或接口获取详细信息
    this.setData({
      showCard: true
    })
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
