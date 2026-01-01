// pages/detail/detail.js
Page({
  data: {
    park: {},
    loading: true
  },

  onLoad(options) {
    // 从URL参数获取公园ID
    const parkId = options.id;

    if (!parkId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.loadParkDetail(parkId);
  },

  // 从云数据库加载公园详情
  async loadParkDetail(parkId) {
    wx.showLoading({ title: '加载中...' });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('parks').doc(parkId).get();

      if (res.data) {
        this.setData({
          park: res.data,
          loading: false
        });
      } else {
        wx.showToast({ title: '未找到公园信息', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error('加载公园详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      wx.hideLoading();
    }
  },

  // 导航到公园
  navigateToPark() {
    const { park } = this.data;

    wx.openLocation({
      latitude: park.latitude,
      longitude: park.longitude,
      name: park.name,
      address: park.address || park.name,
      scale: 18
    });
  },

  // 复制文本
  copyText(e) {
    const text = e.currentTarget.dataset.text;

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 返回地图
  goBack() {
    wx.navigateBack();
  }
});