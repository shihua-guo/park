// pages/index/index.js
Page({
  data: {
    longitude: null,  // 初始化为null，等待获取用户位置
    latitude: null,
    scale: 16,
    markers: [],      // 初始化为空数组，从数据库加载
    sceneTags: [],    // 场景标签数据
    ageGroups: [],    // 适龄段数据
    selectedTags: [],
    selectedAge: null,
    isFilterVisible: false
  },

  onLoad() {
    // 初始化云开发环境
    this.initCloud();
    // 获取用户位置
    this.getLocation();
    // 从数据库加载公园数据
    // this.loadParkData();
    this.setData({
      markers: this.getFallbackMarkers()
    });
  },

  // 初始化云开发环境
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-3gwx0tlt6a6bf5d2',  // 你的云环境ID
      traceUser: true
    });
  },

  // 从云数据库加载公园数据
  loadParkData() {
    wx.showLoading({
      title: '加载中...',
    });

    wx.cloud.database().collection('parks').get()
      .then(res => {
        console.log('公园数据获取成功:', res);
        this.processParkData(res.data);  // 处理数据
        wx.hideLoading();
      })
      .catch(err => {
        console.error('公园数据获取失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
        // 使用示例数据作为fallback
        this.setData({
          markers: this.getFallbackMarkers()
        });
      });
  },

  // 处理公园数据
  processParkData(parkList) {
    const markers = parkList.map(park => ({
      id: park._id,
      latitude: park.latitude,
      longitude: park.longitude,
      title: park.name,
      callout: {
        content: "aaa",
        display: "ALWAYS"
      },
      iconPath: park.icon,  // 使用云存储图片
      width: 40,
      height: 40
    }));

    this.setData({ markers });
  },

  // 获取云存储图片路径
  getCloudImagePath(imageName) {
    // return `cloud://cloud1-3gwx0tlt6a6bf5d2.636c-cloud1-3gwx0tlt6a6bf5d2-1391406291/park/point/${imageName}`;
    return "cloud://cloud1-3gwx0tlt6a6bf5d2.636c-cloud1-3gwx0tlt6a6bf5d2-1391406291/park/point/marker-1.png";
  },

  // 备用数据（当数据库访问失败时使用）
  getFallbackMarkers() {
    return [
      {
        id: 'fallback-1',
        latitude: 22.546756,
        longitude: 114.064538,
        title: "深圳湾公园",
        callout: {
          content: "草坪/滑梯",
          display: "ALWAYS"
        },
        iconPath: this.getCloudImagePath('marker-1.png'),
        width: 40,
        height: 40
      },
      {
        id: 'fallback-2',
        latitude: 22.5321,
        longitude: 114.0032,
        title: "莲花山公园",
        callout: {
          content: "树屋/沙池",
          display: "ALWAYS"
        },
        iconPath: this.getCloudImagePath('marker-2.png'),
        width: 40,
        height: 40
      }
    ];
  },

  // 获取用户当前位置
  getLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        console.log('位置获取成功:', res);
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
      },
      fail: (err) => {
        console.error('位置获取失败:', err);
        // 使用默认深圳坐标作为fallback
        this.setData({
          longitude: 114.064538,
          latitude: 22.546756
        });
      }
    });
  },

  // 切换筛选浮层
  toggleFilter() {
    this.setData({ isFilterVisible: !this.data.isFilterVisible });
  },

  // 切换场景标签
  toggleTag(e) {
    const id = e.currentTarget.dataset.id;
    const { selectedTags } = this.data;
    
    if (selectedTags.includes(id)) {
      this.setData({ 
        selectedTags: selectedTags.filter(t => t !== id) 
      });
    } else {
      this.setData({ 
        selectedTags: [...selectedTags, id] 
      });
    }
  },

  // 选择适龄段
  selectAge(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedAge: id });
  },

  // 关闭筛选
  closeFilter() {
    this.setData({ isFilterVisible: false });
  },

  // 刷新地图（重新获取位置 + 刷新数据）
  refreshMap() {
    this.getLocation();
    // 这里可以加刷新数据的逻辑（MVP暂不实现）
  },

  // 点击marker跳转详情
  onMarkerTap(e) {
    const parkId = e.markerId;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${parkId}`
    });
  }
});
