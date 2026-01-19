// photo-detail.js
Page({
  data: {
    placeId: null,
    placeName: '',
    currentIndex: 0,
    images: [],
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

    // 设置屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
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

      // 确保当前索引不超出范围
      let currentIndex = this.data.currentIndex
      if (currentIndex >= tempImages.length) {
        currentIndex = 0
      }

      this.setData({
        placeName: park.name || '公园图片',
        images: tempImages,
        currentIndex: currentIndex,
        loading: false
      })
      
    } catch (err) {
      console.error('加载公园图片失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  onUnload() {
    // 取消屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
  },

  // Swiper切换
  onSwiperChange(e) {
    this.setData({
      currentIndex: e.detail.current
    })
  },

  // 点击图片（可选：实现双击放大等功能）
  onImageTap() {
    // 这里可以添加双击放大等交互
  },

  // 保存图片到相册
  async onSaveImage() {
    const currentImage = this.data.images[this.data.currentIndex]
    if (!currentImage) return

    try {
      // 先下载图片
      const downloadRes = await wx.downloadFile({
        url: currentImage
      })

      if (downloadRes.statusCode === 200) {
        // 保存到相册
        await wx.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath
        })
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        throw new Error('下载失败')
      }
    } catch (err) {
      console.error('保存图片失败:', err)
      
      if (err.errMsg && err.errMsg.includes('auth')) {
        wx.showModal({
          title: '提示',
          content: '需要授权访问相册',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  },

  // 关闭页面
  onClose() {
    wx.navigateBack()
  }
})
