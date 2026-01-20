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

    showCard: false,

    // 当前地图可视区域
    currentRegion: null
  },

  // 本地缓存：已加载的公园数据（用于优化性能）
  parkCache: new Map(), // key: parkId, value: park data
  
  // 防抖定时器
  loadDataTimer: null,

  onLoad(options) {
    console.log('页面加载开始...')
    
    // 初始化腾讯地图SDK
    // 注意：需要先去腾讯位置服务申请key
    // qqmapsdk = new QQMapWX({
    //   key: 'YOUR-KEY-HERE'
    // })
    
    // 不在这里加载数据，等待地图准备完成后再加载
    console.log('等待地图加载完成...')
  },

  // 加载公园数据（根据地图范围）- 优化版：本地缓存+增量加载
  async loadParkData(region) {
    // 如果没有提供区域信息，不进行查询
    if (!region || !region.northeast || !region.southwest) {
      console.warn('未提供地图区域信息，跳过数据查询')
      return
    }

    try {
      console.log('开始加载公园数据...')
      
      const db = wx.cloud.database()
      const _ = db.command
      
      // 使用实际的地图可视区域边界
      const { northeast, southwest } = region
      
      console.log('查询范围（地图可视区域）:', {
        northeast: { lat: northeast.latitude, lng: northeast.longitude },
        southwest: { lat: southwest.latitude, lng: southwest.longitude }
      })
      
      // 第一步：从本地缓存中筛选出在可视范围内的公园
      const cachedParks = []
      const cachedIds = []
      
      this.parkCache.forEach((park, parkId) => {
        // 检查公园是否在当前可视范围内
        if (
          park.latitude >= southwest.latitude &&
          park.latitude <= northeast.latitude &&
          park.longitude >= southwest.longitude &&
          park.longitude <= northeast.longitude
        ) {
          cachedParks.push(park)
          cachedIds.push(parkId)
        }
      })
      
      console.log(`从缓存中找到 ${cachedParks.length} 个在可视范围内的公园`)
      
      // 第二步：查询数据库中不在缓存里的新数据
      // 构建范围查询条件：经纬度在西南角和东北角之间，且不在已缓存的ID列表中
      const whereCondition = {
        latitude: _.and(
          _.gte(southwest.latitude),
          _.lte(northeast.latitude)
        ),
        longitude: _.and(
          _.gte(southwest.longitude),
          _.lte(northeast.longitude)
        )
      }
      
      // 如果有缓存的ID，排除这些ID
      if (cachedIds.length > 0) {
        whereCondition._id = _.nin(cachedIds)
      }
      
      // 分页查询新数据
      const PAGE_SIZE = 20
      let newParks = []
      let hasMore = true
      let page = 0
      
      wx.showLoading({ title: '加载中...' })
      
      while (hasMore) {
        const skip = page * PAGE_SIZE
        
        const dbRes = await db.collection('park_20260119')
          .where(whereCondition)
          .skip(skip)
          .limit(PAGE_SIZE)
          .get()
        
        if (dbRes.data.length > 0) {
          newParks = newParks.concat(dbRes.data)
          
          // 将新数据加入缓存
          dbRes.data.forEach(park => {
            this.parkCache.set(park._id, park)
          })
          
          page++
          
          if (dbRes.data.length < PAGE_SIZE) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }
      
      console.log(`从数据库查询到 ${newParks.length} 个新公园`)
      console.log(`缓存总数: ${this.parkCache.size} 个公园`)
      
      // 合并缓存数据和新数据
      const allParks = [...cachedParks, ...newParks]
      
      console.log(`最终显示 ${allParks.length} 个公园标记`)
      
      // 处理并设置markers数据
      await this.processParkData(allParks)
      
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
  async processParkData(parkList) {
    // 如果没有数据，清空标记点
    if (!parkList || parkList.length === 0) {
      console.log('没有公园数据')
      this.setData({ markers: [] })
      return
    }
    
    // 批量获取封面图的临时URL
    const coverImgs = parkList.map(p => p.coverImg).filter(Boolean)
    let tempUrls = {}
    
    if (coverImgs.length > 0) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'getCosUrl',
          data: { urls: coverImgs, expired: 7200 }
        })
        
        if (res.result && res.result.success) {
          // 建立原URL到临时URL的映射
          coverImgs.forEach((url, index) => {
            tempUrls[url] = res.result.urls[index]
          })
          console.log('成功获取临时URL')
        }
      } catch (err) {
        console.warn('获取封面图临时URL失败，将使用原始URL:', err)
        // 如果云函数调用失败，使用原始URL作为备用
        coverImgs.forEach(url => {
          tempUrls[url] = url
        })
      }
    }
    
    const markers = parkList.map((park, index) => ({
      id: index + 1,  // 使用数字索引作为 markerId
      parkId: park._id || park.id,  // 保存原始数据库ID
      latitude: park.latitude,
      longitude: park.longitude,
      title: park.name,
      iconPath: '/images/icons/公园.png',  // 使用公园图标
      width: 40,
      height: 40,
      // 保存更多信息用于底部卡片显示
      coverImg: park.coverImg,
      tempCoverImg: tempUrls[park.coverImg] || park.coverImg,
      address: park.address,
      type: park.type,
      tags: park.tags ? park.tags.split(',') : [],
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
    
    // 地图加载完成后，获取初始可视区域并加载数据
    setTimeout(() => {
      this.mapCtx.getRegion({
        success: (res) => {
          console.log('初始地图区域:', res)
          if (res.northeast && res.southwest) {
            this.loadParkData({
              northeast: res.northeast,
              southwest: res.southwest
            })
          }
        },
        fail: (err) => {
          console.warn('获取初始地图区域失败:', err)
        }
      })
    }, 500) // 延迟500ms确保地图完全加载
  },

  // 地图区域变化事件 - 优化版：防抖处理
  onRegionChange(e) {
    // 只处理拖动或缩放结束的事件
    if (e.type === 'end' && e.causedBy) {
      console.log('地图区域变化:', e)
      
      // 清除之前的定时器（防抖）
      if (this.loadDataTimer) {
        clearTimeout(this.loadDataTimer)
      }
      
      // 延迟400ms后再加载数据，避免频繁触发
      this.loadDataTimer = setTimeout(() => {
        // 获取当前地图的可视区域边界
        this.mapCtx.getRegion({
          success: (res) => {
            console.log('当前地图区域:', res)
            
            if (res.northeast && res.southwest) {
              // 使用实际的地图边界查询
              const region = {
                northeast: res.northeast,
                southwest: res.southwest
              }
              
              this.setData({ currentRegion: region })
              this.loadParkData(region)
            } else {
              console.warn('地图区域数据格式异常:', res)
            }
          },
          fail: (err) => {
            console.warn('获取地图区域失败:', err)
          }
        })
      }, 400) // 400ms防抖延迟
    }
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

    // 先用 marker 的基础信息占位，保证"点一下就弹出"
    const basePlace = {
      parkId: marker.parkId || marker.id,
      name: marker.title || '未知地点',
      rating: marker.rating || 0,
      image: marker.tempCoverImg || marker.coverImg || marker.iconPath || '',
      tags: marker.tags || [],
      address: marker.address || '',
      distance: '',
      latitude: marker.latitude,
      longitude: marker.longitude,
      type: marker.type || ''
    }

    this.setData({
      currentPlace: basePlace,
      showCard: true
    })

    // 有 parkId 就从数据库补全详情字段
    if (!marker.parkId) return

    try {
      const db = wx.cloud.database()
      const res = await db.collection('park_20260119').doc(marker.parkId).get()
      const park = res?.data
      if (!park) return

      // 获取封面图临时URL
      let tempCoverImg = park.coverImg
      if (park.coverImg) {
        try {
          const urlRes = await wx.cloud.callFunction({
            name: 'getCosUrl',
            data: { url: park.coverImg, expired: 7200 }
          })
          if (urlRes.result && urlRes.result.success) {
            tempCoverImg = urlRes.result.url
          }
        } catch (err) {
          console.warn('获取封面图临时URL失败，使用原始URL:', err)
          // 使用原始URL作为备用
          tempCoverImg = park.coverImg
        }
      }

      const place = {
        parkId: marker.parkId,
        name: park.name || basePlace.name,
        rating: park.rating || basePlace.rating,
        image: tempCoverImg,
        tags: park.tags ? park.tags.split(',') : basePlace.tags,
        address: park.address || park.location || basePlace.address,
        latitude: park.latitude ?? basePlace.latitude,
        longitude: park.longitude ?? basePlace.longitude,
        type: park.type || basePlace.type,
        phone: park.phone || '',
        openTime: park.openTime || '',
        hectare: park.hectare || ''
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
