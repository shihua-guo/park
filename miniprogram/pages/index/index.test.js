// pages/index/index.test.js
const { Page } = require('../__mocks__/wx');

// 模拟微信云开发API
const mockDatabase = {
  collection: jest.fn(() => ({
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: [] }))
    })),
    get: jest.fn(() => Promise.resolve({ data: [] }))
  }))
};

const mockCloud = {
  init: jest.fn(),
  database: jest.fn(() => mockDatabase)
};

const mockMapContext = {
  getRegion: jest.fn((callback) => {
    if (callback && callback.success) {
      callback.success({
        southwest: { latitude: 22.5, longitude: 114.0 },
        northeast: { latitude: 22.6, longitude: 114.1 }
      });
    }
  })
};

// 全局模拟微信API
global.wx = {
  cloud: mockCloud,
  createMapContext: jest.fn(() => mockMapContext),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showToast: jest.fn(),
  getLocation: jest.fn(),
  navigateTo: jest.fn(),
  showShareMenu: jest.fn()
};

// 导入被测试的页面
let indexPage;

beforeEach(() => {
  // 重置所有模拟
  jest.clearAllMocks();

  // 创建页面实例
  indexPage = Page({
    data: {
      longitude: null,
      latitude: null,
      scale: 16,
      markers: [],
      sceneTags: [],
      ageGroups: [],
      selectedTags: [],
      selectedAge: null,
      isFilterVisible: false
    },

    onLoad() {
      this.initCloud();
      this.getLocation();
      this.loadParkData();
    },

    onRegionChange(e) {
      if (e.type === 'end') {
        this.loadParksInView();
      }
    },

    async loadParksInView() {
      const mapCtx = wx.createMapContext('myMap', this);
      mapCtx.getRegion({
        success: async (res) => {
          const { southwest, northeast } = res;
          wx.showLoading({ title: '加载中...' });
          try {
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

    async loadParkData() {
      wx.showLoading({ title: '加载中...' });

      try {
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

    processParkData(parkList) {
      const markers = parkList.map((park, index) => ({
        id: index + 1,
        parkId: park._id || park.id,
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

    getDefaultIcon() {
      return '/images/icons/公园.png';
    },

    getCloudImagePath(imageName) {
      return "cloud://cloud1-3gwx0tlt6a6bf5d2.636c-cloud1-3gwx0tlt6a6bf5d2-1391406291/park/point/marker-1.png";
    },

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
          this.setData({
            longitude: 114.064538,
            latitude: 22.546756
          });
        }
      });
    },

    toggleFilter() {
      this.setData({ isFilterVisible: !this.data.isFilterVisible });
    },

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

    selectAge(e) {
      const id = e.currentTarget.dataset.id;
      this.setData({ selectedAge: id });
    },

    closeFilter() {
      this.setData({ isFilterVisible: false });
    },

    refreshMap() {
      this.getLocation();
    },

    onMarkerTap(e) {
      const markerId = e.markerId;

      const marker = this.data.markers.find(m => m.id === markerId);

      if (!marker) {
        console.error('未找到对应的marker，markerId:', markerId);
        wx.showToast({ title: '未找到位置信息', icon: 'none' });
        return;
      }

      wx.navigateTo({
        url: `/pages/detail/detail?id=${marker.parkId}`
      });
    }
  });

  // 模拟 setData 方法
  indexPage.setData = jest.fn((data) => {
    Object.keys(data).forEach(key => {
      indexPage.data[key] = data[key];
    });
  });
});

describe('Index Page Unit Tests', () => {
  describe('onLoad', () => {
    it('should call initCloud, getLocation and loadParkData on load', () => {
      const initCloudSpy = jest.spyOn(indexPage, 'initCloud');
      const getLocationSpy = jest.spyOn(indexPage, 'getLocation');
      const loadParkDataSpy = jest.spyOn(indexPage, 'loadParkData');

      indexPage.onLoad();

      expect(initCloudSpy).toHaveBeenCalled();
      expect(getLocationSpy).toHaveBeenCalled();
      expect(loadParkDataSpy).toHaveBeenCalled();
    });
  });

  describe('initCloud', () => {
    it('should initialize cloud with correct environment', () => {
      indexPage.initCloud();

      expect(wx.cloud.init).toHaveBeenCalledWith({
        env: 'cloud1-3gwx0tlt6a6bf5d2',
        traceUser: true
      });
    });

    it('should return early if wx.cloud is not available', () => {
      global.wx.cloud = null;
      const consoleSpy = jest.spyOn(console, 'error');

      indexPage.initCloud();

      expect(consoleSpy).toHaveBeenCalledWith('基础库版本过低，请升级');

      // 恢复 wx.cloud
      global.wx.cloud = mockCloud;
      consoleSpy.mockRestore();
    });
  });

  describe('getLocation', () => {
    it('should update longitude and latitude on success', () => {
      const mockLocation = { longitude: 114.05, latitude: 22.55 };
      wx.getLocation.mockImplementation(({ success }) => {
        success(mockLocation);
      });

      indexPage.getLocation();

      expect(wx.getLocation).toHaveBeenCalledWith({
        type: 'wgs84',
        success: expect.any(Function),
        fail: expect.any(Function)
      });

      // 手动调用 success 回调
      const getLocationCall = wx.getLocation.mock.calls[0][0];
      getLocationCall.success(mockLocation);

      expect(indexPage.setData).toHaveBeenCalledWith({
        longitude: mockLocation.longitude,
        latitude: mockLocation.latitude
      });
    });

    it('should use default coordinates on failure', () => {
      wx.getLocation.mockImplementation(({ fail }) => {
        fail(new Error('Location failed'));
      });

      indexPage.getLocation();

      const getLocationCall = wx.getLocation.mock.calls[0][0];
      getLocationCall.fail(new Error('Location failed'));

      expect(indexPage.setData).toHaveBeenCalledWith({
        longitude: 114.064538,
        latitude: 22.546756
      });
    });
  });

  describe('loadParkData', () => {
    it('should load park data and process it', async () => {
      const mockParkData = [
        { _id: 'park1', name: '深圳湾公园', latitude: 22.546756, longitude: 114.064538 },
        { id: 'park2', name: '莲花山公园', latitude: 22.5321, longitude: 114.0032 }
      ];

      mockDatabase.collection.mockReturnValue({
        get: jest.fn(() => Promise.resolve({ data: mockParkData }))
      });

      await indexPage.loadParkData();

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '加载中...' });
      expect(wx.cloud.database).toHaveBeenCalled();
      expect(wx.hideLoading).toHaveBeenCalled();
    });

    it('should use fallback markers on error', async () => {
      mockDatabase.collection.mockReturnValue({
        get: jest.fn(() => Promise.reject(new Error('Database error')))
      });

      const getFallbackMarkersSpy = jest.spyOn(indexPage, 'getFallbackMarkers');

      await indexPage.loadParkData();

      expect(wx.showToast).toHaveBeenCalledWith({ title: '加载失败', icon: 'none' });
      expect(getFallbackMarkersSpy).toHaveBeenCalled();
      expect(wx.hideLoading).toHaveBeenCalled();
    });
  });

  describe('processParkData', () => {
    it('should transform park data to markers', () => {
      const mockParks = [
        { _id: 'park1', name: '深圳湾公园', latitude: 22.546756, longitude: 114.064538 },
        { id: 'park2', name: '莲花山公园', latitude: 22.5321, longitude: 114.0032 }
      ];

      indexPage.processParkData(mockParks);

      expect(indexPage.setData).toHaveBeenCalled();
      const setDataCall = indexPage.setData.mock.calls[0][0];
      expect(setDataCall.markers).toHaveLength(2);
      expect(setDataCall.markers[0]).toMatchObject({
        id: 1,
        parkId: 'park1',
        title: '深圳湾公园',
        latitude: 22.546756,
        longitude: 114.064538
      });
    });

    it('should handle empty park list', () => {
      indexPage.processParkData([]);

      expect(indexPage.setData).toHaveBeenCalledWith({ markers: [] });
    });

    it('should set default icon and callout', () => {
      const mockParks = [{ _id: 'park1', name: '测试公园', latitude: 22.5, longitude: 114.0 }];

      indexPage.processParkData(mockParks);

      const setDataCall = indexPage.setData.mock.calls[0][0];
      expect(setDataCall.markers[0].iconPath).toBe('/images/icons/公园.png');
      expect(setDataCall.markers[0].callout).toEqual({
        content: '测试公园',
        display: 'ALWAYS'
      });
      expect(setDataCall.markers[0].width).toBe(40);
      expect(setDataCall.markers[0].height).toBe(40);
    });
  });

  describe('getDefaultIcon', () => {
    it('should return correct icon path', () => {
      expect(indexPage.getDefaultIcon()).toBe('/images/icons/公园.png');
    });
  });

  describe('getCloudImagePath', () => {
    it('should return cloud image path', () => {
      const result = indexPage.getCloudImagePath('test.png');
      expect(result).toContain('cloud://');
      expect(result).toContain('park/point');
    });
  });

  describe('getFallbackMarkers', () => {
    it('should return array with 2 fallback markers', () => {
      const markers = indexPage.getFallbackMarkers();

      expect(markers).toHaveLength(2);
      expect(markers[0]).toMatchObject({
        id: 'fallback-1',
        title: '深圳湾公园',
        latitude: 22.546756,
        longitude: 114.064538
      });
      expect(markers[1]).toMatchObject({
        id: 'fallback-2',
        title: '莲花山公园',
        latitude: 22.5321,
        longitude: 114.0032
      });
    });
  });

  describe('onRegionChange', () => {
    it('should load parks in view when region change ends', () => {
      const loadParksInViewSpy = jest.spyOn(indexPage, 'loadParksInView');

      indexPage.onRegionChange({ type: 'end' });

      expect(loadParksInViewSpy).toHaveBeenCalled();
    });

    it('should not load parks when region change is not end', () => {
      const loadParksInViewSpy = jest.spyOn(indexPage, 'loadParksInView');

      indexPage.onRegionChange({ type: 'start' });

      expect(loadParksInViewSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadParksInView', () => {
    it('should load parks within map region', async () => {
      await indexPage.loadParksInView();

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '加载中...' });
      expect(wx.createMapContext).toHaveBeenCalledWith('myMap', indexPage);
      expect(wx.hideLoading).toHaveBeenCalled();
    });

    it('should handle getRegion failure', async () => {
      mockMapContext.getRegion.mockImplementation(({ fail }) => {
        fail(new Error('Get region failed'));
      });

      await indexPage.loadParksInView();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('toggleFilter', () => {
    it('should toggle isFilterVisible from false to true', () => {
      indexPage.data.isFilterVisible = false;

      indexPage.toggleFilter();

      expect(indexPage.setData).toHaveBeenCalledWith({ isFilterVisible: true });
    });

    it('should toggle isFilterVisible from true to false', () => {
      indexPage.data.isFilterVisible = true;

      indexPage.toggleFilter();

      expect(indexPage.setData).toHaveBeenCalledWith({ isFilterVisible: false });
    });
  });

  describe('toggleTag', () => {
    it('should add tag to selectedTags if not selected', () => {
      indexPage.data.selectedTags = [];
      const mockEvent = { currentTarget: { dataset: { id: 'tag1' } } };

      indexPage.toggleTag(mockEvent);

      expect(indexPage.setData).toHaveBeenCalledWith({ selectedTags: ['tag1'] });
    });

    it('should remove tag from selectedTags if already selected', () => {
      indexPage.data.selectedTags = ['tag1', 'tag2'];
      const mockEvent = { currentTarget: { dataset: { id: 'tag1' } } };

      indexPage.toggleTag(mockEvent);

      expect(indexPage.setData).toHaveBeenCalledWith({ selectedTags: ['tag2'] });
    });

    it('should handle multiple tags', () => {
      indexPage.data.selectedTags = ['tag1'];
      const mockEvent = { currentTarget: { dataset: { id: 'tag3' } } };

      indexPage.toggleTag(mockEvent);

      expect(indexPage.setData).toHaveBeenCalledWith({ selectedTags: ['tag1', 'tag3'] });
    });
  });

  describe('selectAge', () => {
    it('should set selectedAge', () => {
      const mockEvent = { currentTarget: { dataset: { id: 'age1' } } };

      indexPage.selectAge(mockEvent);

      expect(indexPage.setData).toHaveBeenCalledWith({ selectedAge: 'age1' });
    });

    it('should update selectedAge when called multiple times', () => {
      const mockEvent1 = { currentTarget: { dataset: { id: 'age1' } } };
      const mockEvent2 = { currentTarget: { dataset: { id: 'age2' } } };

      indexPage.selectAge(mockEvent1);
      indexPage.selectAge(mockEvent2);

      expect(indexPage.setData).toHaveBeenCalledTimes(2);
      expect(indexPage.setData).toHaveBeenLastCalledWith({ selectedAge: 'age2' });
    });
  });

  describe('closeFilter', () => {
    it('should set isFilterVisible to false', () => {
      indexPage.data.isFilterVisible = true;

      indexPage.closeFilter();

      expect(indexPage.setData).toHaveBeenCalledWith({ isFilterVisible: false });
    });
  });

  describe('refreshMap', () => {
    it('should call getLocation', () => {
      const getLocationSpy = jest.spyOn(indexPage, 'getLocation');

      indexPage.refreshMap();

      expect(getLocationSpy).toHaveBeenCalled();
    });
  });

  describe('onMarkerTap', () => {
    beforeEach(() => {
      indexPage.data.markers = [
        { id: 1, parkId: 'park1', title: '深圳湾公园' },
        { id: 2, parkId: 'park2', title: '莲花山公园' }
      ];
    });

    it('should navigate to detail page when marker exists', () => {
      const mockEvent = { markerId: 1 };

      indexPage.onMarkerTap(mockEvent);

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=park1'
      });
    });

    it('should show toast when marker does not exist', () => {
      const mockEvent = { markerId: 99 };
      const consoleSpy = jest.spyOn(console, 'error');

      indexPage.onMarkerTap(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith('未找到对应的marker，markerId:', 99);
      expect(wx.showToast).toHaveBeenCalledWith({ title: '未找到位置信息', icon: 'none' });
      expect(wx.navigateTo).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle multiple markers correctly', () => {
      const mockEvent1 = { markerId: 2 };

      indexPage.onMarkerTap(mockEvent1);

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=park2'
      });
    });
  });
});
