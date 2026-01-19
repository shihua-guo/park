Page({
  data: {
    imageUrl: '',
    title: '图片预览',
  },

  onLoad(options) {
    const imageUrl = decodeURIComponent(options.url || '');
    const title = decodeURIComponent(options.title || '图片预览');
    this.setData({ imageUrl, title });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000',
    });
  },

  handleClose(event) {
    event && event.stopPropagation?.();
    wx.navigateBack({ delta: 1 });
  },
});
