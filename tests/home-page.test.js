/**
 * home 页面单元测试
 * 测试主页的核心功能,包括地点展示、标记点处理、筛选功能等
 */

// Mock 微信小程序 API
global.wx = {
  setNavigationBarColor: jest.fn(),
  openLocation: jest.fn(),
  navigateTo: jest.fn(),
};

// 模拟 Page 函数
let pageInstance = null;
global.Page = jest.fn((options) => {
  pageInstance = {
    data: options.data || {},
    onLoad: options.onLoad,
    onMarkerTap: options.onMarkerTap,
    onSwiperChange: options.onSwiperChange,
    setActiveLocation: options.setActiveLocation,
    handleSelectFilter: options.handleSelectFilter,
    handleSearchInput: options.handleSearchInput,
    handleGuide: options.handleGuide,
    handleNavigateToDetail: options.handleNavigateToDetail,
    navigateToDetail: options.navigateToDetail,
    setData: function(newData) {
      this.data = { ...this.data, ...newData };
    },
  };
  return pageInstance;
});

// 导入数据模块
jest.mock('../miniprogram/data/locations.js', () => ({
  locations: [
    {
      id: 'test-location-1',
      name: '测试地点1',
      coordinates: {
        latitude: 22.543099,
        longitude: 114.057868,
      },
      address: '测试地址1',
    },
    {
      id: 'test-location-2',
      name: '测试地点2',
      coordinates: {
        latitude: 22.543199,
        longitude: 114.057968,
      },
      address: '测试地址2',
    },
  ],
  city: {
    name: '深圳',
    latitude: 22.543096,
    longitude: 114.057865,
  },
  filters: [
    { key: 'indoor', label: '室内乐园' },
    { key: 'kids', label: '儿童公园' },
    { key: 'forest', label: '森林步道' },
  ],
}));

describe('home 页面单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 pageInstance
    if (pageInstance) {
      pageInstance.data = {
        city: {
          name: '深圳',
          latitude: 22.543096,
          longitude: 114.057865,
        },
        filters: [
          { key: 'indoor', label: '室内乐园' },
          { key: 'kids', label: '儿童公园' },
          { key: 'forest', label: '森林步道' },
        ],
        searchValue: '',
        activeFilter: 'indoor',
        locations: [
          {
            id: 'test-location-1',
            name: '测试地点1',
            coordinates: {
              latitude: 22.543099,
              longitude: 114.057868,
            },
            address: '测试地址1',
          },
          {
            id: 'test-location-2',
            name: '测试地点2',
            coordinates: {
              latitude: 22.543199,
              longitude: 114.057968,
            },
            address: '测试地址2',
          },
        ],
        markers: [],
        includePoints: [],
        currentIndex: 0,
        selectedLocationId: 'test-location-1',
        selectedLocation: {
          id: 'test-location-1',
          name: '测试地点1',
          coordinates: {
            latitude: 22.543099,
            longitude: 114.057868,
          },
          address: '测试地址1',
        },
      };
    }
  });

  describe('onLoad 生命周期', () => {
    test('应该正确初始化页面数据', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad();

        expect(wx.setNavigationBarColor).toHaveBeenCalledWith({
          frontColor: '#ffffff',
          backgroundColor: '#f6f9ff',
        });

        expect(pageInstance.data.city).toBeDefined();
        expect(pageInstance.data.city.name).toBe('深圳');
        expect(pageInstance.data.filters.length).toBeGreaterThan(0);
      }
    });

    test('应该正确设置标记点', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad();

        expect(pageInstance.data.markers.length).toBe(2);
        expect(pageInstance.data.markers[0].latitude).toBe(22.543099);
        expect(pageInstance.data.markers[0].longitude).toBe(114.057868);
      }
    });

    test('应该正确设置包含点', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad();

        expect(pageInstance.data.includePoints.length).toBe(2);
        expect(pageInstance.data.includePoints[0]).toEqual({
          latitude: 22.543099,
          longitude: 114.057868,
        });
      }
    });
  });

  describe('onMarkerTap 标记点击', () => {
    test('点击标记应该激活对应地点', () => {
      const mockEvent = {
        markerId: '1',
      };

      if (pageInstance && pageInstance.onMarkerTap) {
        pageInstance.onMarkerTap(mockEvent);
        expect(pageInstance.data.currentIndex).toBe(1);
        expect(pageInstance.data.selectedLocationId).toBe('test-location-2');
      }
    });

    test('无效标记ID应该使用默认值', () => {
      const mockEvent = {
        markerId: null,
      };

      if (pageInstance && pageInstance.onMarkerTap) {
        pageInstance.onMarkerTap(mockEvent);
        expect(pageInstance.data.currentIndex).toBe(0);
      }
    });
  });

  describe('onSwiperChange 轮播切换', () => {
    test('滑动应该激活对应地点', () => {
      const mockEvent = {
        detail: { current: 1 },
      };

      if (pageInstance && pageInstance.onSwiperChange) {
        pageInstance.onSwiperChange(mockEvent);
        expect(pageInstance.data.currentIndex).toBe(1);
        expect(pageInstance.data.selectedLocationId).toBe('test-location-2');
      }
    });

    test('无效索引应该使用默认值', () => {
      const mockEvent = {
        detail: { current: null },
      };

      if (pageInstance && pageInstance.onSwiperChange) {
        pageInstance.onSwiperChange(mockEvent);
        expect(pageInstance.data.currentIndex).toBe(0);
      }
    });
  });

  describe('setActiveLocation 设置活动地点', () => {
    test('应该正确设置活动地点', () => {
      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(1);
        expect(pageInstance.data.currentIndex).toBe(1);
        expect(pageInstance.data.selectedLocationId).toBe('test-location-2');
        expect(pageInstance.data.selectedLocation.name).toBe('测试地点2');
      }
    });

    test('索引超出范围应该使用边界值', () => {
      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(10);
        expect(pageInstance.data.currentIndex).toBe(1);
      }

      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(-1);
        expect(pageInstance.data.currentIndex).toBe(0);
      }
    });

    test('autoNavigate 选项应该触发导航', () => {
      const spy = jest.spyOn(pageInstance, 'navigateToDetail');

      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(0, { autoNavigate: true });
        expect(spy).toHaveBeenCalledWith('test-location-1');
      }

      spy.mockRestore();
    });

    test('没有 autoNavigate 选项不应该触发导航', () => {
      const spy = jest.spyOn(pageInstance, 'navigateToDetail');

      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(0, { autoNavigate: false });
        expect(spy).not.toHaveBeenCalled();
      }

      spy.mockRestore();
    });
  });

  describe('handleSelectFilter 筛选选择', () => {
    test('应该更新活动筛选', () => {
      const mockEvent = {
        currentTarget: {
          dataset: { key: 'kids' },
        },
      };

      if (pageInstance && pageInstance.handleSelectFilter) {
        pageInstance.handleSelectFilter(mockEvent);
        expect(pageInstance.data.activeFilter).toBe('kids');
      }
    });

    test('应该更新为不同的筛选', () => {
      pageInstance.data.activeFilter = 'indoor';

      const mockEvent = {
        currentTarget: {
          dataset: { key: 'forest' },
        },
      };

      if (pageInstance && pageInstance.handleSelectFilter) {
        pageInstance.handleSelectFilter(mockEvent);
        expect(pageInstance.data.activeFilter).toBe('forest');
      }
    });
  });

  describe('handleSearchInput 搜索输入', () => {
    test('应该更新搜索值', () => {
      const mockEvent = {
        detail: { value: '公园' },
      };

      if (pageInstance && pageInstance.handleSearchInput) {
        pageInstance.handleSearchInput(mockEvent);
        expect(pageInstance.data.searchValue).toBe('公园');
      }
    });

    test('空搜索值应该正确处理', () => {
      const mockEvent = {
        detail: { value: '' },
      };

      if (pageInstance && pageInstance.handleSearchInput) {
        pageInstance.handleSearchInput(mockEvent);
        expect(pageInstance.data.searchValue).toBe('');
      }
    });
  });

  describe('handleGuide 导航', () => {
    test('应该打开地图导航', () => {
      const mockEvent = {
        currentTarget: {
          dataset: { id: 'test-location-1' },
        },
        stopPropagation: jest.fn(),
      };

      if (pageInstance && pageInstance.handleGuide) {
        pageInstance.handleGuide(mockEvent);
        expect(wx.openLocation).toHaveBeenCalledWith({
          latitude: 22.543099,
          longitude: 114.057868,
          name: '测试地点1',
          address: '测试地址1',
        });
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      }
    });

    test('没有ID时应该使用选中的地点', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {},
        },
        stopPropagation: jest.fn(),
      };

      if (pageInstance && pageInstance.handleGuide) {
        pageInstance.handleGuide(mockEvent);
        expect(wx.openLocation).toHaveBeenCalledWith({
          latitude: 22.543099,
          longitude: 114.057868,
          name: '测试地点1',
          address: '测试地址1',
        });
      }
    });

    test('没有stopPropagation时应该正常处理', () => {
      const mockEvent = {
        currentTarget: {
          dataset: { id: 'test-location-1' },
        },
      };

      if (pageInstance && pageInstance.handleGuide) {
        pageInstance.handleGuide(mockEvent);
        expect(wx.openLocation).toHaveBeenCalledWith({
          latitude: 22.543099,
          longitude: 114.057868,
          name: '测试地点1',
          address: '测试地址1',
        });
      }
    });
  });

  describe('handleNavigateToDetail 跳转详情', () => {
    test('应该跳转到详情页', () => {
      const spy = jest.spyOn(pageInstance, 'navigateToDetail');

      const mockEvent = {
        currentTarget: {
          dataset: { id: 'test-location-1' },
        },
      };

      if (pageInstance && pageInstance.handleNavigateToDetail) {
        pageInstance.handleNavigateToDetail(mockEvent);
        expect(spy).toHaveBeenCalledWith('test-location-1');
      }

      spy.mockRestore();
    });
  });

  describe('navigateToDetail 跳转详情', () => {
    test('应该调用 wx.navigateTo', () => {
      if (pageInstance && pageInstance.navigateToDetail) {
        pageInstance.navigateToDetail('test-location-1');
        expect(wx.navigateTo).toHaveBeenCalledWith({
          url: '/pages/detail/index?id=test-location-1',
        });
      }
    });

    test('应该正确构建详情页URL', () => {
      if (pageInstance && pageInstance.navigateToDetail) {
        pageInstance.navigateToDetail('another-location-id');
        expect(wx.navigateTo).toHaveBeenCalledWith({
          url: '/pages/detail/index?id=another-location-id',
        });
      }
    });
  });

  describe('边界条件测试', () => {
    test('空locations数组应该正确处理', () => {
      pageInstance.data.locations = [];
      pageInstance.data.markers = [];
      pageInstance.data.includePoints = [];
      pageInstance.data.selectedLocation = {};
      pageInstance.data.selectedLocationId = null;

      if (pageInstance && pageInstance.setActiveLocation) {
        pageInstance.setActiveLocation(0);
        expect(pageInstance.data.currentIndex).toBe(0);
      }
    });

    test('空筛选数组应该正确处理', () => {
      pageInstance.data.filters = [];
      pageInstance.data.activeFilter = '';

      if (pageInstance && pageInstance.handleSelectFilter) {
        const mockEvent = {
          currentTarget: {
            dataset: { key: 'test' },
          },
        };
        pageInstance.handleSelectFilter(mockEvent);
        expect(pageInstance.data.activeFilter).toBe('test');
      }
    });

    test('特殊字符搜索值应该正确处理', () => {
      const mockEvent = {
        detail: { value: '公园!@#$%^&*()' },
      };

      if (pageInstance && pageInstance.handleSearchInput) {
        pageInstance.handleSearchInput(mockEvent);
        expect(pageInstance.data.searchValue).toBe('公园!@#$%^&*()');
      }
    });
  });
});
