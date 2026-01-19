/**
 * index 页面单元测试
 * 测试地图主页的核心功能,包括数据加载、标记点处理、距离计算等
 */

// Mock 微信小程序 API
global.wx = {
  cloud: {
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [] })),
          })),
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: {} })),
        })),
      })),
      command: {
        and: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
      },
    })),
    callFunction: jest.fn(() => Promise.resolve({ result: { success: true, urls: [] } })),
  },
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showToast: jest.fn(),
  createMapContext: jest.fn(() => ({
    getRegion: jest.fn(),
    moveToLocation: jest.fn(),
  })),
  getLocation: jest.fn(),
  openLocation: jest.fn(),
  navigateTo: jest.fn(),
  showActionSheet: jest.fn(),
};

// 模拟 Page 函数
let pageInstance = null;
global.Page = jest.fn((options) => {
  pageInstance = {
    data: options.data || {},
    onLoad: options.onLoad,
    onReady: options.onReady,
    setData: function(newData) {
      this.data = { ...this.data, ...newData };
    },
    loadParkData: options.loadParkData,
    processParkData: options.processParkData,
    onRegionChange: options.onRegionChange,
    onMapTap: options.onMapTap,
    onMarkerTap: options.onMarkerTap,
    onCitySelect: options.onCitySelect,
    onCategoryTap: options.onCategoryTap,
    onLocationTap: options.onLocationTap,
    onCardTap: options.onCardTap,
    calcDistanceMeters: options.calcDistanceMeters,
    formatDistance: options.formatDistance,
    onNavigate: options.onNavigate,
  };
  return pageInstance;
});

// 导入页面代码
const indexPage = require('../miniprogram/pages/index/index.js');

describe('index 页面单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 pageInstance
    if (pageInstance) {
      pageInstance.data = {
        longitude: 114.057868,
        latitude: 22.543099,
        scale: 14,
        currentCity: '深圳',
        categories: [
          { id: 'indoor', name: '室内乐园', icon: '🏠' },
          { id: 'park', name: '儿童公园', icon: '🌳' },
        ],
        currentCategory: 'indoor',
        markers: [],
        currentPlace: null,
        showCard: false,
        currentRegion: null,
      };
    }
  });

  describe('onLoad 生命周期', () => {
    test('应该正确初始化页面数据', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad();

        expect(pageInstance.data.longitude).toBe(114.057868);
        expect(pageInstance.data.latitude).toBe(22.543099);
        expect(pageInstance.data.currentCity).toBe('深圳');
        expect(pageInstance.data.markers).toEqual([]);
      }
    });

    test('应该正确初始化分类数据', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad();

        expect(pageInstance.data.categories.length).toBeGreaterThan(0);
        expect(pageInstance.data.categories[0].id).toBe('indoor');
        expect(pageInstance.data.categories[0].name).toBe('室内乐园');
      }
    });
  });

  describe('loadParkData 数据加载', () => {
    test('未提供区域信息时应该跳过查询', async () => {
      if (pageInstance && pageInstance.loadParkData) {
        await pageInstance.loadParkData(null);
        expect(wx.cloud.database).not.toHaveBeenCalled();
      }
    });

    test('区域信息缺少边界时应该跳过查询', async () => {
      if (pageInstance && pageInstance.loadParkData) {
        await pageInstance.loadParkData({ northeast: null });
        expect(wx.cloud.database).not.toHaveBeenCalled();
      }
    });

    test('应该正确加载公园数据', async () => {
      const mockRegion = {
        northeast: { latitude: 22.55, longitude: 114.07 },
        southwest: { latitude: 22.53, longitude: 114.05 },
      };

      const mockParks = [
        {
          _id: 'park1',
          name: '测试公园',
          latitude: 22.54,
          longitude: 114.06,
          coverImg: 'https://example.com/cover.jpg',
          address: '测试地址',
          type: 'indoor',
          tags: '室内,空调',
        },
      ];

      wx.cloud.database().collection().where().skip().limit.mockResolvedValueOnce({
        data: mockParks,
      });

      if (pageInstance && pageInstance.loadParkData) {
        await pageInstance.loadParkData(mockRegion);
        expect(wx.showLoading).toHaveBeenCalledWith({ title: '加载中...' });
        expect(wx.hideLoading).toHaveBeenCalled();
      }
    });

    test('数据加载失败时应该显示错误提示', async () => {
      const mockRegion = {
        northeast: { latitude: 22.55, longitude: 114.07 },
        southwest: { latitude: 22.53, longitude: 114.05 },
      };

      wx.cloud.database().collection().where().skip().limit.mockRejectedValueOnce(
        new Error('Database error')
      );

      if (pageInstance && pageInstance.loadParkData) {
        await pageInstance.loadParkData(mockRegion);
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '加载失败',
          icon: 'none',
        });
      }
    });
  });

  describe('processParkData 数据处理', () => {
    test('空数据应该清空标记点', async () => {
      if (pageInstance && pageInstance.processParkData) {
        await pageInstance.processParkData([]);
        expect(pageInstance.data.markers).toEqual([]);
      }
    });

    test('应该正确转换为地图标记点', async () => {
      const mockParks = [
        {
          _id: 'park1',
          name: '测试公园1',
          latitude: 22.54,
          longitude: 114.06,
          coverImg: 'https://example.com/cover1.jpg',
          address: '测试地址1',
          type: 'indoor',
          tags: '室内,空调',
        },
        {
          _id: 'park2',
          name: '测试公园2',
          latitude: 22.55,
          longitude: 114.07,
          coverImg: 'https://example.com/cover2.jpg',
          address: '测试地址2',
          type: 'park',
          tags: '公园,户外',
        },
      ];

      if (pageInstance && pageInstance.processParkData) {
        await pageInstance.processParkData(mockParks);

        expect(pageInstance.data.markers.length).toBe(2);
        expect(pageInstance.data.markers[0].name).toBe('测试公园1');
        expect(pageInstance.data.markers[1].name).toBe('测试公园2');
      }
    });

    test('标记点应该包含必要的字段', async () => {
      const mockParks = [
        {
          _id: 'park1',
          name: '测试公园',
          latitude: 22.54,
          longitude: 114.06,
          address: '测试地址',
          type: 'indoor',
        },
      ];

      if (pageInstance && pageInstance.processParkData) {
        await pageInstance.processParkData(mockParks);

        const marker = pageInstance.data.markers[0];
        expect(marker.id).toBeDefined();
        expect(marker.latitude).toBe(22.54);
        expect(marker.longitude).toBe(114.06);
        expect(marker.title).toBe('测试公园');
        expect(marker.callout).toBeDefined();
      }
    });
  });

  describe('calcDistanceMeters 距离计算', () => {
    test('应该正确计算两点间距离', () => {
      if (pageInstance && pageInstance.calcDistanceMeters) {
        const distance = pageInstance.calcDistanceMeters(
          22.543099,
          114.057868,
          22.543199,
          114.057968
        );
        expect(typeof distance).toBe('number');
        expect(distance).toBeGreaterThan(0);
      }
    });

    test('相同坐标距离应为0', () => {
      if (pageInstance && pageInstance.calcDistanceMeters) {
        const distance = pageInstance.calcDistanceMeters(
          22.543099,
          114.057868,
          22.543099,
          114.057868
        );
        expect(distance).toBe(0);
      }
    });

    test('无效参数应该返回NaN', () => {
      if (pageInstance && pageInstance.calcDistanceMeters) {
        expect(pageInstance.calcDistanceMeters(null, 114, 22, 114)).toBe(NaN);
        expect(pageInstance.calcDistanceMeters(22, 'invalid', 22, 114)).toBe(NaN);
        expect(pageInstance.calcDistanceMeters(22, 114, undefined, 114)).toBe(NaN);
      }
    });
  });

  describe('formatDistance 距离格式化', () => {
    test('小于1公里应该显示为米', () => {
      if (pageInstance && pageInstance.formatDistance) {
        expect(pageInstance.formatDistance(500)).toBe('500m');
        expect(pageInstance.formatDistance(999)).toBe('999m');
        expect(pageInstance.formatDistance(100)).toBe('100m');
      }
    });

    test('大于等于1公里应该显示为公里', () => {
      if (pageInstance && pageInstance.formatDistance) {
        expect(pageInstance.formatDistance(1000)).toBe('1.0km');
        expect(pageInstance.formatDistance(1500)).toBe('1.5km');
        expect(pageInstance.formatDistance(20000)).toBe('20.0km');
      }
    });

    test('无效值应该返回空字符串', () => {
      if (pageInstance && pageInstance.formatDistance) {
        expect(pageInstance.formatDistance(NaN)).toBe('');
        expect(pageInstance.formatDistance(Infinity)).toBe('');
        expect(pageInstance.formatDistance(null)).toBe('');
      });
    });
  });

  describe('onRegionChange 地图区域变化', () => {
    test('地图拖动结束应该触发数据加载', () => {
      const mockEvent = {
        type: 'end',
        causedBy: 'drag',
      };

      const mockRegion = {
        northeast: { latitude: 22.55, longitude: 114.07 },
        southwest: { latitude: 22.53, longitude: 114.05 },
      };

      if (pageInstance && pageInstance.onRegionChange) {
        pageInstance.mapCtx = {
          getRegion: jest.fn((callback) => {
            callback.success(mockRegion);
          }),
        };

        pageInstance.onRegionChange(mockEvent);
        expect(pageInstance.mapCtx.getRegion).toHaveBeenCalled();
      }
    });

    test('非结束事件不应该触发数据加载', () => {
      const mockEvent = {
        type: 'begin',
        causedBy: 'drag',
      };

      if (pageInstance && pageInstance.onRegionChange) {
        pageInstance.mapCtx = {
          getRegion: jest.fn(),
        };

        pageInstance.onRegionChange(mockEvent);
        expect(pageInstance.mapCtx.getRegion).not.toHaveBeenCalled();
      }
    });
  });

  describe('onMarkerTap 标记点击', () => {
    test('点击标记应该显示底部卡片', () => {
      pageInstance.data.markers = [
        {
          id: 1,
          title: '测试公园',
          latitude: 22.54,
          longitude: 114.06,
        },
      ];

      const mockEvent = {
        markerId: 1,
      };

      if (pageInstance && pageInstance.onMarkerTap) {
        pageInstance.onMarkerTap(mockEvent);
        expect(pageInstance.data.showCard).toBe(true);
        expect(pageInstance.data.currentPlace).toBeDefined();
      }
    });

    test('无效标记ID应该显示错误提示', () => {
      const mockEvent = {
        markerId: null,
      };

      if (pageInstance && pageInstance.onMarkerTap) {
        pageInstance.onMarkerTap(mockEvent);
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '未找到标记ID',
          icon: 'none',
        });
      }
    });

    test('未找到标记应该显示错误提示', () => {
      const mockEvent = {
        markerId: 999,
      };

      if (pageInstance && pageInstance.onMarkerTap) {
        pageInstance.onMarkerTap(mockEvent);
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '未找到位置信息',
          icon: 'none',
        });
      }
    });
  });

  describe('onMapTap 地图点击', () => {
    test('点击地图应该隐藏卡片', () => {
      pageInstance.data.showCard = true;

      const mockEvent = {};

      if (pageInstance && pageInstance.onMapTap) {
        pageInstance.onMapTap(mockEvent);
        expect(pageInstance.data.showCard).toBe(false);
      }
    });

    test('忽略标记应该阻止隐藏卡片', () => {
      pageInstance.data.showCard = true;
      pageInstance._ignoreNextMapTap = true;

      const mockEvent = {};

      if (pageInstance && pageInstance.onMapTap) {
        pageInstance.onMapTap(mockEvent);
        expect(pageInstance.data.showCard).toBe(true);
        expect(pageInstance._ignoreNextMapTap).toBe(false);
      }
    });
  });

  describe('onCitySelect 城市选择', () => {
    test('选择城市应该更新当前城市', () => {
      if (pageInstance && pageInstance.onCitySelect) {
        wx.showActionSheet.mockImplementationOnce(({ success }) => {
          success({ tapIndex: 1, cancel: false });
        });

        pageInstance.onCitySelect();
        expect(pageInstance.data.currentCity).toBe('广州');
      }
    });

    test('取消选择不应该更新城市', () => {
      const originalCity = pageInstance.data.currentCity;

      if (pageInstance && pageInstance.onCitySelect) {
        wx.showActionSheet.mockImplementationOnce(({ success }) => {
          success({ tapIndex: 1, cancel: true });
        });

        pageInstance.onCitySelect();
        expect(pageInstance.data.currentCity).toBe(originalCity);
      }
    });
  });

  describe('onCategoryTap 分类切换', () => {
    test('切换分类应该更新当前分类', () => {
      const mockEvent = {
        currentTarget: {
          dataset: { id: 'park' },
        },
      };

      if (pageInstance && pageInstance.onCategoryTap) {
        pageInstance.onCategoryTap(mockEvent);
        expect(pageInstance.data.currentCategory).toBe('park');
      }
    });
  });

  describe('onCardTap 卡片点击', () => {
    test('点击卡片应该跳转到详情页', () => {
      pageInstance.data.currentPlace = {
        parkId: 'test-park-id',
        name: '测试公园',
      };

      if (pageInstance && pageInstance.onCardTap) {
        pageInstance.onCardTap();
        expect(wx.navigateTo).toHaveBeenCalledWith({
          url: '/pages/detail/detail?id=test-park-id',
        });
      }
    });

    test('没有parkId时不应该跳转', () => {
      pageInstance.data.currentPlace = {
        name: '测试公园',
      };

      if (pageInstance && pageInstance.onCardTap) {
        pageInstance.onCardTap();
        expect(wx.navigateTo).not.toHaveBeenCalled();
      }
    });
  });

  describe('onNavigate 导航', () => {
    test('点击导航应该打开地图导航', () => {
      pageInstance.data.currentPlace = {
        name: '测试公园',
        address: '测试地址',
        latitude: 22.54,
        longitude: 114.06,
      };

      if (pageInstance && pageInstance.onNavigate) {
        pageInstance.onNavigate();
        expect(wx.openLocation).toHaveBeenCalledWith({
          latitude: 22.54,
          longitude: 114.06,
          name: '测试公园',
          address: '测试地址',
          scale: 18,
        });
      }
    });

    test('没有地点信息时不应该导航', () => {
      pageInstance.data.currentPlace = null;

      if (pageInstance && pageInstance.onNavigate) {
        pageInstance.onNavigate();
        expect(wx.openLocation).not.toHaveBeenCalled();
      }
    });
  });
});
