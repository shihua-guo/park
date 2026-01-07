const { getLocationById } = require('../../data/locations');

Page({
  data: {
    location: null,
  },

  onLoad(options) {
    const { id = 'happy-coast' } = options;
    const location = getLocationById(id);
    this.setData({ location });
    wx.setNavigationBarTitle({ title: `${location.name} · 图片` });
  },

  handlePreview(event) {
    const { url } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/viewer/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(this.data.location.name)}`,
    });
  },
});
