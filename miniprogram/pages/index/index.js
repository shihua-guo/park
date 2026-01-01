// pages/index/index.js
const imageCache = {};

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
    this.initCloud();
    this.getLocation();
    this.loadParkData(); // 首次加载全部数据
  },
  // 监听地图视图变化（移动/缩放）
  onRegionChange(e) {
    if (e.type === 'end') {
      this.loadParksInView();
    }
  },
  // 加载视图范围内的公园点
  async loadParksInView() {
    const mapCtx = wx.createMapContext('myMap', this);
    // 获取当前地图视图范围
    mapCtx.getRegion({
      success: async (res) => {
        // res 包含 southwest/northeast 经纬度
        const { southwest, northeast } = res;
        wx.showLoading({ title: '加载中...' });
        try {
          // 查询数据库，筛选范围内点
          const db = wx.cloud.database();
          const parksRes = await db.collection('parks')
            .where({
              latitude: db.command.gte(southwest.latitude).lte(northeast.latitude),
              longitude: db.command.gte(southwest.longitude).lte(northeast.longitude)
            })
            .get();
          this.processParkData(parksRes.data);
        } catch (err) {
          console.error('视图范围数据加载失败:', err);
          wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      },
      fail: (err) => {
        console.error('获取地图范围失败:', err);
      }
    });
  },

  // 初始化云开发环境
  initCloud() {
    if (!wx.cloud) {
      console.error('基础库版本过低，请升级');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-3gwx0tlt6a6bf5d2',
      traceUser: true
    });
  },

  // 加载公园数据（含图片处理）
  async loadParkData() {
    wx.showLoading({ title: '加载中...' });

    try {
      // 1. 从数据库获取公园数据
      const dbRes = await wx.cloud.database().collection('parks').get();
      
      this.processParkData(dbRes.data);
    } catch (err) {
      console.error('数据加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ markers: this.getFallbackMarkers() });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理公园数据
  processParkData(parkList) {
    const markers = parkList.map((park, index) => ({
      id: index + 1,  // 使用数字索引作为 markerId
      parkId: park._id || park.id,  // 保存原始数据库ID
      latitude: park.latitude,
      longitude: park.longitude,
      title: park.name,
      callout: {
        content: park.name,
        display: "ALWAYS"
      },
      iconPath: this.getDefaultIcon(),
      width: 40,
      height: 40
    }));
    this.setData({ markers });
  },

  // 获取默认图标（备用）
  getDefaultIcon() {
    return '/images/icons/公园.png';
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

  // 点击marker跳转详情页
  onMarkerTap(e) {
    const markerId = e.markerId;

    // 使用数字ID匹配
    const marker = this.data.markers.find(m => m.id === markerId);

    if (!marker) {
      console.error('未找到对应的marker，markerId:', markerId);
      wx.showToast({ title: '未找到位置信息', icon: 'none' });
      return;
    }

    // 跳转到详情页，传递 parkId
    wx.navigateTo({
      url: `/pages/detail/detail?id=${marker.parkId}`
    });
  }
});
