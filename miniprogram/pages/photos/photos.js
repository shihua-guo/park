// photos.js
Page({
  data: {
    placeName: '',
    placeId: null,
    currentIndex: 0,
    images: [],
    leftImages: [],
    rightImages: [],
    loading: true
  },

  async onLoad(options) {
    const id = options.id
    const index = options.index || 0
    
    if (!id) {
      wx.showToast({ title: '缺少公园ID', icon: 'none' })
      return
    }
    
    this.setData({
      placeId: id,
      currentIndex: parseInt(index)
    })

    // 从数据库加载公园图片
    await this.loadParkImages(id)
  },

  // 从数据库加载公园图片
  async loadParkImages(parkId) {
    wx.showLoading({ title: '加载中...' })

    try {
      const db = wx.cloud.database()
      const res = await db.collection('park_20260119').doc(parkId).get()
      const park = res.data
      
      if (!park) {
        wx.showToast({ title: '未找到公园信息', icon: 'none' })
        return
      }

      console.log('公园数据:', park)

      // 获取所有图片URL（封面图 + 详情图）
      const allImages = [park.coverImg, ...(park.imgs || [])].filter(Boolean)
      
      if (allImages.length === 0) {
        wx.showToast({ title: '该公园暂无图片', icon: 'none' })
        this.setData({ loading: false })
        return
      }

      // 调用云函数获取临时URL
      let tempImages = []
      
      try {
        const urlRes = await wx.cloud.callFunction({
          name: 'getCosUrl',
          data: { urls: allImages, expired: 7200 }
        })
        
        if (urlRes.result && urlRes.result.success) {
          tempImages = urlRes.result.urls
        } else {
          console.warn('转换URL失败，使用原始URL')
          tempImages = allImages
        }
      } catch (err) {
        console.warn('获取图片临时URL失败，使用原URL:', err)
        tempImages = allImages
      }

      this.setData({
        placeName: park.name || '公园图片',
        images: tempImages,
        loading: false
      })

      // 分配图片到左右两列
      this.distributeImages()
      
    } catch (err) {
      console.error('加载公园图片失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  // 分配图片到左右列
  distributeImages() {
    const leftImages = []
    const rightImages = []

    this.data.images.forEach((url, index) => {
      const item = { url, originalIndex: index }
      if (index % 2 === 0) {
        leftImages.push(item)
      } else {
        rightImages.push(item)
      }
    })

    this.setData({
      leftImages,
      rightImages
    })
  },

  // 点击图片
  onPhotoTap(e) {
    const index = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `/pages/photo-detail/photo-detail?id=${this.data.placeId}&index=${index}`
    })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  },

  // 更多
  onMore() {
    wx.showActionSheet({
      itemList: ['保存全部图片', '分享']
    })
  }
})
