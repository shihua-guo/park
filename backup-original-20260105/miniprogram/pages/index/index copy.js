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
    this.loadParkData(); // 启用数据库加载
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
      
      // 2. 批量获取图片临时链接
      // const fileIDs = dbRes.data.map(park => park.icon);
      // console.log(`fileIDs:${fileIDs}`);
      // const tempRes = await this.getTempFileURLs(fileIDs);
      
      // 3. 处理数据并更新UI
      this.processParkData(dbRes.data);
    } catch (err) {
      console.error('数据加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ markers: this.getFallbackMarkers() });
    } finally {
      wx.hideLoading();
    }
  },

  // 批量获取临时链接（带缓存）
  /**
 * 批量获取云存储文件的临时访问链接
 * @param {string[]} fileIDs - 云存储文件ID数组，格式为cloud://开头的字符串
 * @returns {Promise<Array<{fileID: string, tempURL: string}>>} 包含文件ID和临时URL的对象数组
 * @throws {Error} 当云存储API调用失败时抛出错误
 */
async getTempFileURLs(fileIDs) {
    // 1. 过滤无效文件ID
    const validFileIDs = fileIDs.filter(id => 
      id && typeof id === 'string' && id.startsWith('cloud://')
    );
    console.log(`validFileIDs:${validFileIDs}`);
    // 2. 检查未缓存的文件
    const uncachedFiles = validFileIDs.filter(id => 
      !imageCache[id] || imageCache[id].expire < Date.now()
    );
  
    // 3. 批量获取临时链接
    if (uncachedFiles.length > 0) {
      try {
        const res = await wx.cloud.getTempFileURL({ 
          fileList: uncachedFiles 
        });
  
        // 4. 处理返回结果
        (res.fileList || []).forEach(file => {
          if (file?.fileID && file?.tempFileURL) {
            imageCache[file.fileID] = {
              url: file.tempFileURL,
              expire: Date.now() + 2 * 60 * 60 * 1000 // 2小时有效期
            };
            
          }
        });
      } catch (err) {
        console.error('获取临时链接失败:', err);
      }
    }
  
    // 5. 返回处理后的结果
    return validFileIDs.map(id => ({
      fileID: id,
      tempURL: imageCache[id]?.url || this.getDefaultIcon()
    }));
  },

  // 处理公园数据
  processParkData(parkList) {
    // const urlMap = tempURLs.reduce((map, item) => {
    //   map[item.fileID] = item.tempURL;
    //   return map;
    // }, {});

    const markers = parkList.map(park => ({
      id: park._id,
      latitude: park.latitude,
      longitude: park.longitude,
      title: park.name,
      callout: {
        content: park.name,
        display: "ALWAYS"
      },
      // iconPath: urlMap[park.icon] || this.getDefaultIcon(),
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

  // 点击marker跳转详情
  onMarkerTap(e) {
    const parkId = e.markerId;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${parkId}`
    });
  }
});
