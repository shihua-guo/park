// pages/detail/detail.js
Page({
  data: {
    park: {}
  },

  onLoad(options) {
    // 从URL参数获取公园名称
    const parkName = options.name;
    
    // 本地硬编码数据（MVP版，直接复制到你的项目）
    const parks = [
      {
        name: "深圳湾公园儿童乐园",
        suitableAge: "3-6岁",
        facilities: "滑梯/草坪/洗手间",
        address: "深圳湾公园东门"
      },
      {
        name: "莲花山公园亲子区",
        suitableAge: "2-8岁",
        facilities: "树屋/小火车/草坪",
        address: "莲花山公园北门"
      },
      {
        name: "深圳人才公园",
        suitableAge: "3-8岁",
        facilities: "儿童乐园/草坪",
        address: "深圳人才公园南门"
      }
    ];

    // 根据名称匹配公园
    const park = parks.find(p => p.name === parkName);
    if (park) {
      this.setData({ park });
    } else {
      wx.showToast({ title: "公园信息未找到", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  goBack() {
    wx.navigateBack();
  }
});