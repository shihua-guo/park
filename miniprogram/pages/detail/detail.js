// detail.js
Page({
  data: {
    placeInfo: null,
    images: [],
    currentImageIndex: 0,
    isFavorite: false,
    loading: true
  },

  async onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '缺少公园ID', icon: 'none' })
      return
    }
    
    // 根据id加载地点详情
    console.log('加载地点详情:', id)
    await this.loadParkDetail(id)
  },

  // 从数据库加载公园详情
  async loadParkDetail(parkId) {
    wx.showLoading({ title: '加载中...' })

    try {
      const db = wx.cloud.database()
      const res = await db.collection('park_20260119').doc(parkId).get()
      const park = res.data
      
      if (!park) {
        wx.showToast({ title: '未找到公园信息', icon: 'none' })
        return
      }

      console.log('公园详情数据:', park)

      // 获取所有图片的临时URL
      const allImages = [park.coverImg, ...(park.imgs || [])].filter(Boolean)
      let tempImages = []
      
      if (allImages.length > 0) {
        try {
          const urlRes = await wx.cloud.callFunction({
            name: 'getCosUrl',
            data: { urls: allImages, expired: 7200 }
          })
          
          if (urlRes.result && urlRes.result.success) {
            tempImages = urlRes.result.urls
          } else {
            // 如果转换失败，使用原图片
            console.warn('转换URL失败，使用原始URL')
            tempImages = allImages
          }
        } catch (err) {
          console.warn('获取图片临时URL失败，使用原URL:', err)
          tempImages = allImages
        }
      }

      // 处理标签
      const tags = park.tags ? park.tags.split(',').map(tag => ({
        icon: this.getTagIcon(tag),
        text: tag
      })) : []

      // 构建显示数据
      const placeInfo = {
        id: parkId,
        name: park.name || '未知公园',
        rating: park.rating || 0,
        reviewCount: park.reviewCount || '0',
        tags: tags,
        address: park.address || '',
        distance: '',
        driveTime: '',
        status: park.isOpen === '1' ? '开放中' : '暂停开放',
        hours: park.openTime || '未知',
        hoursNote: '',
        phone: park.phone || '',
        description: this.generateDescription(park),
        facilities: this.parseFacilities(park),
        latitude: park.latitude,
        longitude: park.longitude,
        type: park.type || '',
        hectare: park.hectare || '',
        managementunit: park.managementunit || '',
        department: park.department || '',
        url: park.url || ''
      }

      this.setData({
        placeInfo,
        images: tempImages,
        loading: false
      })
    } catch (err) {
      console.error('加载公园详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 根据标签获取图标
  getTagIcon(tag) {
    const iconMap = {
      '帐篷区': '⛺',
      '滨海休闲': '🌊',
      '儿童游乐': '🎠',
      '运动健身': '⚽',
      '观景': '🌄',
      '休闲': '☕',
      '文化': '📚',
      '自然': '🌿'
    }
    
    // 模糊匹配
    for (const key in iconMap) {
      if (tag.includes(key)) {
        return iconMap[key]
      }
    }
    return '🏞️'
  },

  // 生成描述文本
  generateDescription(park) {
    let desc = `${park.name}是一个${park.type || '公园'}`
    
    if (park.hectare) {
      desc += `，占地面积约${parseFloat(park.hectare).toFixed(2)}公顷`
    }
    
    if (park.managementunit) {
      desc += `。由${park.managementunit}负责管理`
    }
    
    if (park.tags) {
      desc += `，特色包括：${park.tags}`
    }
    
    if (park.openTime) {
      desc += `。开放时间：${park.openTime}`
    }
    
    return desc + '。'
  },

  // 解析设施信息
  parseFacilities(park) {
    const facilities = []
    
    // 根据标签推断设施
    if (park.tags) {
      const tags = park.tags.toLowerCase()
      
      if (tags.includes('停车') || tags.includes('parking')) {
        facilities.push({ icon: '🅿️', name: '停车场' })
      }
      if (tags.includes('wifi') || tags.includes('网络')) {
        facilities.push({ icon: '📶', name: 'WIFI' })
      }
      if (tags.includes('母婴') || tags.includes('儿童')) {
        facilities.push({ icon: '👶', name: '母婴室' })
      }
      if (tags.includes('餐厅') || tags.includes('饮食')) {
        facilities.push({ icon: '🍽️', name: '餐厅' })
      }
      if (tags.includes('卫生间') || tags.includes('洗手间')) {
        facilities.push({ icon: '🚻', name: '卫生间' })
      }
    }
    
    // 默认设施
    if (facilities.length === 0) {
      facilities.push({ icon: '🚻', name: '卫生间' })
    }
    
    return facilities
  },

  // 轮播图切换
  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  // 点击图片跳转到图片列表
  onImageTap() {
    wx.navigateTo({
      url: `/pages/photos/photos?id=${this.data.placeInfo.id}&index=${this.data.currentImageIndex}`
    })
  },

  // 上一张
  onPrevImage() {
    const current = this.data.currentImageIndex
    const total = this.data.images.length
    const newIndex = current === 0 ? total - 1 : current - 1
    this.setData({
      currentImageIndex: newIndex
    })
  },

  // 下一张
  onNextImage() {
    const current = this.data.currentImageIndex
    const total = this.data.images.length
    const newIndex = current === total - 1 ? 0 : current + 1
    this.setData({
      currentImageIndex: newIndex
    })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 更多
  onMore() {
    wx.showActionSheet({
      itemList: ['举报', '复制链接']
    })
  },

  // 点击地址
  onAddressTap() {
    const info = this.data.placeInfo
    if (!info) return
    
    wx.openLocation({
      latitude: info.latitude || 22.543099,
      longitude: info.longitude || 114.057868,
      name: info.name,
      address: info.address,
      scale: 18
    })
  },

  // 拨打电话
  onCallTap() {
    const phone = this.data.placeInfo?.phone
    if (!phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' })
      return
    }
    
    wx.makePhoneCall({
      phoneNumber: phone
    })
  },

  // 展开描述
  onExpandDescription() {
    wx.showToast({
      title: '展开全文',
      icon: 'none'
    })
  },

  // 收藏
  onFavorite() {
    this.setData({
      isFavorite: !this.data.isFavorite
    })
    wx.showToast({
      title: this.data.isFavorite ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  // 写评价
  onReview() {
    wx.showToast({
      title: '写评价功能',
      icon: 'none'
    })
  },

  // 导航
  onNavigate() {
    const info = this.data.placeInfo
    if (!info) return
    
    wx.openLocation({
      latitude: info.latitude || 22.543099,
      longitude: info.longitude || 114.057868,
      name: info.name,
      address: info.address,
      scale: 18
    })
  },

  // 分享到好友
  onShareAppMessage() {
    const placeInfo = this.data.placeInfo
    const images = this.data.images
    
    return {
      title: placeInfo?.name || '公园推荐',
      path: `/pages/detail/detail?id=${placeInfo?.id}`,
      imageUrl: images.length > 0 ? images[0] : ''
    }
  }
})
