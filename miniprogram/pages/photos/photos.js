// photos.js
Page({
  data: {
    placeName: '欢乐海岸室内乐园',
    placeId: 1,
    currentIndex: 0,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBvyAo1BW9Sh9SnDEbjaZw5_70hU_Y58Bgs6ArB0FmL6dBXclIrxrCLPQgqWsOd04_mmqTKP4lsL6oDrmL4iEy-NWG99rnZXuscGF45_m_fwdc1wxpKn6QaXwAJzG-nhon4Wl-4XXNJvhjgNYP-mOB_OVFtto18e_-9k23ymW2F_gGNjf2wYzctDAYbU1X7u-lKS88W1GaDjYGzGWtCPSi2cnOi3crBuwQ3X0O6vOPLrljG2MAPlZcdg61mn-4PA_lnsHzDfHgoSyvS',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEsneW5lmQRucNcO8vFBjWTB-83d-haf-KchYxCQ7e9KV1UxPRkoqfjen9-8jsnM6vZmcuI405I5pmvb4HvR8hmS9SFc5roIVtaItJ1G6DaQKWyRiChZX44B2FZFL93t_nrFEPOQ78sA4cSTzitYwbCVG8KRc8_QIQF7oBMLIaeItBnS8opX_JB8gh56HX-yM-lWLyPe6yDleC8w_UHS5Fgij2z0GjoZtFa2sURuflWJ4zGmyjjayx_cMh6dET-SpyNDE5ZWSebykO',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdjvisCLZb9hNd5e9XBvlXhK2YnoO6-_TOkcV5CPDOoOBVD4Vo4KjGASmXFVKAUwPtk7pACGJ-psRtGdGRif4LD9VG5pTP25iHSPrj8ZayfkzoslA_5U7aps0CQsWjA7O6BukaStqmWo23NbFOctvGJUeHzqwiI-3JcNAyB7kXcuveJaAqJBkAj1r0AcSmXxGEYo8gH0Naj3oAp-TwWukbIm9wDGxGM3kav0Z1ur-lSq_oM9K7elLCUh1PLX9un_wv4Oskw0Jv89fp',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAzjKI8O5v3AU1DEhrPzCHIbuSswIfmRlOc6hSDIcd3Fru0VY0l1rgxgePoUyZcP8pIMgkmX819Vull5UkMRWIXgTI446llVApxZae6AcaItxK79Ec7lVGgSyIV5siX8a3KYVCYDEPsjjBGqIDeMNX2ACVV5_bcQouMYqKV7Vj4TKS4GC7m-8MpdONKqNrGvF6pwy_XCd4npNQ9bP06HCrJRb5ZS6MnO6Cj9rz2ocdZ3fdR8UOCTmx1ZM9Tqhe663qMf1lCTN8GynT',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5-7rkLZvdDWBFO60jbtoN19BMY6zbi7AZYk0uVi4t__HB4e3ATP7veU_bzX5qi5XkayUusLEFoKWXaawKla87MtjdX1SyAOGQrVzuVotvvPLNad6U4gQ99hNwGKSuumVt7ZP4ScVHu7y7OTpenyy4B4VDQ2f5TzOGyWgRgEsKUINg2-4qxIawcFhnhu_XgS9ZhiHksJVamhkEfK_Bx0TFWTyqBu3KjU3X9Pu7Lnu-zzoiw518rgLTXkMjhUWOfsBY5OPWlyW9dy4W',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOD5w4qzUXlaD2wai4DyWqa9u4MXP_2XC1qWopjygjtF-u6ZGIHr4jrshjUhVXwFddYcNqfrAeQu-Gw5TOWLnXVN7dC8xK4-WqnXrTza0NeUVIsZGUUxgfdQxaOy3VS20mBA9hs8oV543VCHkCbzuti0-qy4HcCXS0lIo6TdYBzXPLnD0k4XTLEC5Ax-3jp4pZBSQQzxQGPM_uHPbfKzF8u6khd2BuR07URyG_UTUOqk8qvNJyniIWUOgJ4Mg5uDeqTGxjXHoCjF2y',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBh7ulaexdzoDjSjL7vwMjeyh5c-BBC_H_c6wZu6BfWyIuNL8HZWiH3zsiwUT6TK2zAHZdtOZw7F9R_ZB2BMdbNFtKQI5H_5yZ1GxgItDr8YOkYRKuiEkA8sWBdxxFxLJ_ADk2iheNmjAHt_zK1ViOuEsoD8Zs7ckyH57wdnG-SeKgk_8VmwsalYLt60631b7acL0utHMv_Z_7UvgQTHnZYmPJbYwrvHJ7hlog3BVkZf-UhE6U8yU_CcmezsVOFfjBlcHnEng1wNANx',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAFf6LotBilp8CNjOeOskba5Uc4HY4pg7-3uCABLp0cPHYwVen4BRYBJ8OIj_ZHzgEi03LEtyOT3ds9RzKeqqVS7yyJ46Ngd25i9PJPIuWlObSCtF4U_QVLBQcc6CCOf744EBgiJ5wthvUwUMFJIekaQyynafpPn6vNlw2p7qPp3rvLNsR3Lk3znO8_BpWVs-Ccaix7xrqYnKcUM5Zq1B4Lhmp2Ri1Bo8PfEUfrvDrL1HLkURy9zOh8jOFzDWyfrifXnf3k1MwHUlWl'
    ],
    leftImages: [],
    rightImages: []
  },

  onLoad(options) {
    const id = options.id
    const index = options.index || 0
    
    this.setData({
      placeId: id,
      currentIndex: parseInt(index)
    })

    // 分配图片到左右两列（简单的奇偶分配）
    this.distributeImages()
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
