// detail.js
Page({
  data: {
    placeInfo: {
      id: 1,
      name: '欢乐海岸室内乐园',
      rating: 4.8,
      reviewCount: '1,203',
      tags: [
        { icon: '❄️', text: '室内空调' },
        { icon: '👶', text: '适合 2-6岁' },
        { icon: '🍽️', text: '亲子餐厅' }
      ],
      address: '南山区滨海大道2008号欢乐海岸购物中心 L2-035',
      distance: '1.2km',
      driveTime: '5分钟',
      status: '营业中',
      hours: '10:00 - 22:00',
      hoursNote: '周末及节假日照常开放',
      phone: '0755-8888 6666',
      description: '这是一个专为学龄前儿童打造的梦幻乐园，整体设计采用柔和的马卡龙色系，视觉舒适，保护宝宝视力。乐园内设有超大的海洋球池、全软包攀爬架、原木沙池以及模拟超市厨房等角色扮演区域。\n\n此外，乐园还配备了专业的亲子餐厅和母婴室，设施齐全，非常适合周末遛娃。所有游乐设施每天定时消毒，确保孩子们玩得开心又安心。',
      facilities: [
        { icon: '📶', name: 'WIFI' },
        { icon: '🅿️', name: '停车场' },
        { icon: '👶', name: '母婴室' },
        { icon: '🍽️', name: '餐厅' }
      ]
    },
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDM-5cMKDvgQILvtAwmlzVtZ_BX3zyzirJFn_6mN0swZFjD8gSzoyvKDAEWRI8Lv497jDVD-u2qHen1XP0jabWOgyZs_G3-pJ_rNBb4I3KZS0C1ihqKokSRx1B4goBRqRIEeVoAnG3VOVYXg8WX1rA3Ic3a3tcsYc6CaWdhDEsJ3Ugg1q_o5Q6XH-YPVgMTJxHyfzWud2bsighX9IL65z_D_j6_lyAJp5oVUnO7RMQj8ucIZpJkqCE6S5VtOLWvQQFLkiG1CCUmOc8s',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBvyAo1BW9Sh9SnDEbjaZw5_70hU_Y58Bgs6ArB0FmL6dBXclIrxrCLPQgqWsOd04_mmqTKP4lsL6oDrmL4iEy-NWG99rnZXuscGF45_m_fwdc1wxpKn6QaXwAJzG-nhon4Wl-4XXNJvhjgNYP-mOB_OVFtto18e_-9k23ymW2F_gGNjf2wYzctDAYbU1X7u-lKS88W1GaDjYGzGWtCPSi2cnOi3crBuwQ3X0O6vOPLrljG2MAPlZcdg61mn-4PA_lnsHzDfHgoSyvS',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEsneW5lmQRucNcO8vFBjWTB-83d-haf-KchYxCQ7e9KV1UxPRkoqfjen9-8jsnM6vZmcuI405I5pmvb4HvR8hmS9SFc5roIVtaItJ1G6DaQKWyRiChZX44B2FZFL93t_nrFEPOQ78sA4cSTzitYwbCVG8KRc8_QIQF7oBMLIaeItBnS8opX_JB8gh56HX-yM-lWLyPe6yDleC8w_UHS5Fgij2z0GjoZtFa2sURuflWJ4zGmyjjayx_cMh6dET-SpyNDE5ZWSebykO',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdjvisCLZb9hNd5e9XBvlXhK2YnoO6-_TOkcV5CPDOoOBVD4Vo4KjGASmXFVKAUwPtk7pACGJ-psRtGdGRif4LD9VG5pTP25iHSPrj8ZayfkzoslA_5U7aps0CQsWjA7O6BukaStqmWo23NbFOctvGJUeHzqwiI-3JcNAyB7kXcuveJaAqJBkAj1r0AcSmXxGEYo8gH0Naj3oAp-TwWukbIm9wDGxGM3kav0Z1ur-lSq_oM9K7elLCUh1PLX9un_wv4Oskw0Jv89fp',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAzjKI8O5v3AU1DEhrPzCHIbuSswIfmRlOc6hSDIcd3Fru0VY0l1rgxgePoUyZcP8pIMgkmX819Vull5UkMRWIXgTI446llVApxZae6AcaItxK79Ec7lVGgSyIV5siX8a3KYVCYDEPsjjBGqIDeMNX2ACVV5_bcQouMYqKV7Vj4TKS4GC7m-8MpdONKqNrGvF6pwy_XCd4npNQ9bP06HCrJRb5ZS6MnO6Cj9rz2ocdZ3fdR8UOCTmx1ZM9Tqhe663qMf1lCTN8GynT',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5-7rkLZvdDWBFO60jbtoN19BMY6zbi7AZYk0uVi4t__HB4e3ATP7veU_bzX5qi5XkayUusLEFoKWXaawKla87MtjdX1SyAOGQrVzuVotvvPLNad6U4gQ99hNwGKSuumVt7ZP4ScVHu7y7OTpenyy4B4VDQ2f5TzOGyWgRgEsKUINg2-4qxIawcFhnhu_XgS9ZhiHksJVamhkEfK_Bx0TFWTyqBu3KjU3X9Pu7Lnu-zzoiw518rgLTXkMjhUWOfsBY5OPWlyW9dy4W',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOD5w4qzUXlaD2wai4DyWqa9u4MXP_2XC1qWopjygjtF-u6ZGIHr4jrshjUhVXwFddYcNqfrAeQu-Gw5TOWLnXVN7dC8xK4-WqnXrTza0NeUVIsZGUUxgfdQxaOy3VS20mBA9hs8oV543VCHkCbzuti0-qy4HcCXS0lIo6TdYBzXPLnD0k4XTLEC5Ax-3jp4pZBSQQzxQGPM_uHPbfKzF8u6khd2BuR07URyG_UTUOqk8qvNJyniIWUOgJ4Mg5uDeqTGxjXHoCjF2y',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBh7ulaexdzoDjSjL7vwMjeyh5c-BBC_H_c6wZu6BfWyIuNL8HZWiH3zsiwUT6TK2zAHZdtOZw7F9R_ZB2BMdbNFtKQI5H_5yZ1GxgItDr8YOkYRKuiEkA8sWBdxxFxLJ_ADk2iheNmjAHt_zK1ViOuEsoD8Zs7ckyH57wdnG-SeKgk_8VmwsalYLt60631b7acL0utHMv_Z_7UvgQTHnZYmPJbYwrvHJ7hlog3BVkZf-UhE6U8yU_CcmezsVOFfjBlcHnEng1wNANx'
    ],
    currentImageIndex: 0,
    isFavorite: false
  },

  onLoad(options) {
    const id = options.id
    // 根据id加载地点详情
    console.log('加载地点详情:', id)
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
    wx.openLocation({
      latitude: 22.543099,
      longitude: 114.057868,
      name: info.name,
      address: info.address,
      scale: 18
    })
  },

  // 拨打电话
  onCallTap() {
    wx.makePhoneCall({
      phoneNumber: this.data.placeInfo.phone
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
    wx.openLocation({
      latitude: 22.543099,
      longitude: 114.057868,
      name: info.name,
      address: info.address,
      scale: 18
    })
  },

  // 分享到好友
  onShareAppMessage() {
    return {
      title: this.data.placeInfo.name,
      path: `/pages/detail/detail?id=${this.data.placeInfo.id}`,
      imageUrl: this.data.images[0]
    }
  }
})
