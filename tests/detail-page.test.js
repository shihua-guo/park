/**
 * detail 页面单元测试
 * 测试公园详情页的核心功能,包括数据加载、图片处理、标签解析等
 */

// Mock 微信小程序 API
global.wx = {
  cloud: {
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: {} })),
        })),
      })),
    })),
    callFunction: jest.fn(() => Promise.resolve({ result: { success: true, urls: [] } })),
  },
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showToast: jest.fn(),
  navigateBack: jest.fn(),
  navigateTo: jest.fn(),
  openLocation: jest.fn(),
  makePhoneCall: jest.fn(),
  showActionSheet: jest.fn(),
  showShareMenu: jest.fn(),
};

// 模拟 Page 函数
let pageInstance = null;
global.Page = jest.fn((options) => {
  pageInstance = {
    data: options.data || {},
    onLoad: options.onLoad,
    loadParkDetail: options.loadParkDetail,
    onSwiperChange: options.onSwiperChange,
    onImageTap: options.onImageTap,
    onPrevImage: options.onPrevImage,
    onNextImage: options.onNextImage,
    onBack: options.onBack,
    onShare: options.onShare,
    onMore: options.onMore,
    onAddressTap: options.onAddressTap,
    onCallTap: options.onCallTap,
    onExpandDescription: options.onExpandDescription,
    onFavorite: options.onFavorite,
    onReview: options.onReview,
    onNavigate: options.onNavigate,
    onShareAppMessage: options.onShareAppMessage,
    setData: function(newData) {
      this.data = { ...this.data, ...newData };
    },
    getTagIcon: options.getTagIcon,
    generateDescription: options.generateDescription,
    parseFacilities: options.parseFacilities,
  };
  return pageInstance;
});

// 导入页面代码
const detailPage = require('../miniprogram/pages/detail/detail.js');

describe('detail 页面单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 pageInstance
    if (pageInstance) {
      pageInstance.data = {
        placeInfo: null,
        images: [],
        currentImageIndex: 0,
        isFavorite: false,
        loading: true,
      };
    }
  });

  describe('onLoad 生命周期', () => {
    test('应该正确初始化页面数据', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad({ id: 'test-park-id' });

        expect(pageInstance.data.placeInfo).toBe(null);
        expect(pageInstance.data.images).toEqual([]);
        expect(pageInstance.data.isFavorite).toBe(false);
        expect(pageInstance.data.loading).toBe(true);
      }
    });

    test('缺少公园ID时应该显示错误提示', () => {
      if (pageInstance && pageInstance.onLoad) {
        pageInstance.onLoad({});
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '缺少公园ID',
          icon: 'none',
        });
      }
    });

    test('应该调用 loadParkDetail 加载数据', () => {
      if (pageInstance && pageInstance.onLoad) {
        const spy = jest.spyOn(pageInstance, 'loadParkDetail');
        pageInstance.onLoad({ id: 'test-park-id' });
        expect(spy).toHaveBeenCalledWith('test-park-id');
        spy.mockRestore();
      }
    });
  });

  describe('loadParkDetail 数据加载', () => {
    test('应该正确加载公园详情', async () => {
      const mockPark = {
        _id: 'park1',
        name: '测试公园',
        latitude: 22.54,
        longitude: 114.06,
        coverImg: 'https://example.com/cover.jpg',
        imgs: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        address: '测试地址',
        type: '综合公园',
        tags: '儿童游乐,运动健身',
        openTime: '06:00-22:00',
        phone: '0755-12345678',
        rating: 4.5,
        isOpen: '1',
        hectare: '10.5',
        managementunit: '深圳市园林局',
      };

      wx.cloud.database().collection().doc().get.mockResolvedValueOnce({
        data: mockPark,
      });

      wx.cloud.callFunction.mockResolvedValueOnce({
        result: {
          success: true,
          urls: [
            'https://temp-url1.com',
            'https://temp-url2.com',
            'https://temp-url3.com',
          ],
        },
      });

      if (pageInstance && pageInstance.loadParkDetail) {
        await pageInstance.loadParkDetail('park1');

        expect(wx.showLoading).toHaveBeenCalledWith({ title: '加载中...' });
        expect(pageInstance.data.placeInfo).toBeDefined();
        expect(pageInstance.data.placeInfo.name).toBe('测试公园');
        expect(pageInstance.data.loading).toBe(false);
      }
    });

    test('未找到公园时应该显示错误提示', async () => {
      wx.cloud.database().collection().doc().get.mockResolvedValueOnce({
        data: null,
      });

      if (pageInstance && pageInstance.loadParkDetail) {
        await pageInstance.loadParkDetail('invalid-park-id');
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '未找到公园信息',
          icon: 'none',
        });
      }
    });

    test('加载失败时应该显示错误提示', async () => {
      wx.cloud.database().collection().doc().get.mockRejectedValueOnce(
        new Error('Database error')
      );

      if (pageInstance && pageInstance.loadParkDetail) {
        await pageInstance.loadParkDetail('park1');
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '加载失败',
          icon: 'none',
        });
      }
    });
  });

  describe('getTagIcon 标签图标', () => {
    test('应该正确返回标签图标', () => {
      if (pageInstance && pageInstance.getTagIcon) {
        expect(pageInstance.getTagIcon('帐篷区')).toBe('⛺');
        expect(pageInstance.getTagIcon('滨海休闲')).toBe('🌊');
        expect(pageInstance.getTagIcon('儿童游乐')).toBe('🎠');
        expect(pageInstance.getTagIcon('运动健身')).toBe('⚽');
        expect(pageInstance.getTagIcon('观景')).toBe('🌄');
      }
    });

    test('模糊匹配应该返回对应图标', () => {
      if (pageInstance && pageInstance.getTagIcon) {
        expect(pageInstance.getTagIcon('有帐篷区')).toBe('⛺');
        expect(pageInstance.getTagIcon('滨海休闲区')).toBe('🌊');
        expect(pageInstance.getTagIcon('儿童游乐设施')).toBe('🎠');
      }
    });

    test('未匹配的标签应该返回默认图标', () => {
      if (pageInstance && pageInstance.getTagIcon) {
        expect(pageInstance.getTagIcon('未知标签')).toBe('🏞️');
        expect(pageInstance.getTagIcon('')).toBe('🏞️');
      }
    });
  });

  describe('generateDescription 描述生成', () => {
    test('应该生成完整的公园描述', () => {
      const mockPark = {
        name: '深圳中心公园',
        type: '综合公园',
        hectare: '50.5',
        managementunit: '深圳市园林局',
        tags: '儿童游乐,运动健身,休闲',
        openTime: '06:00-22:00',
      };

      if (pageInstance && pageInstance.generateDescription) {
        const desc = pageInstance.generateDescription(mockPark);
        expect(desc).toContain('深圳中心公园');
        expect(desc).toContain('综合公园');
        expect(desc).toContain('50.50');
        expect(desc).toContain('深圳市园林局');
        expect(desc).toContain('儿童游乐,运动健身,休闲');
        expect(desc).toContain('06:00-22:00');
      }
    });

    test('缺少部分字段应该仍能生成描述', () => {
      const mockPark = {
        name: '深圳湾公园',
        type: '海滨公园',
      };

      if (pageInstance && pageInstance.generateDescription) {
        const desc = pageInstance.generateDescription(mockPark);
        expect(desc).toContain('深圳湾公园');
        expect(desc).toContain('海滨公园');
      }
    });

    test('hectare 应该格式化为两位小数', () => {
      const mockPark = {
        name: '测试公园',
        type: '公园',
        hectare: '10.555',
      };

      if (pageInstance && pageInstance.generateDescription) {
        const desc = pageInstance.generateDescription(mockPark);
        expect(desc).toContain('10.56');
      }
    });
  });

  describe('parseFacilities 设施解析', () => {
    test('应该根据标签解析设施', () => {
      const mockPark = {
        tags: '停车,WIFI,母婴室,餐厅,卫生间',
      };

      if (pageInstance && pageInstance.parseFacilities) {
        const facilities = pageInstance.parseFacilities(mockPark);
        expect(facilities.length).toBe(5);
        expect(facilities[0]).toEqual({ icon: '🅿️', name: '停车场' });
        expect(facilities[1]).toEqual({ icon: '📶', name: 'WIFI' });
      }
    });

    test('英文标签也应该能识别', () => {
      const mockPark = {
        tags: 'parking,network,children',
      };

      if (pageInstance && pageInstance.parseFacilities) {
        const facilities = pageInstance.parseFacilities(mockPark);
        expect(facilities.some(f => f.name === '停车场')).toBe(true);
        expect(facilities.some(f => f.name === 'WIFI')).toBe(true);
      }
    });

    test('没有匹配标签应该返回默认设施', () => {
      const mockPark = {
        tags: '未知标签,测试',
      };

      if (pageInstance && pageInstance.parseFacilities) {
        const facilities = pageInstance.parseFacilities(mockPark);
        expect(facilities.length).toBe(1);
        expect(facilities[0]).toEqual({ icon: '🚻', name: '卫生间' });
      }
    });

    test('没有标签字段应该返回默认设施', () => {
      const mockPark = {};

      if (pageInstance && pageInstance.parseFacilities) {
        const facilities = pageInstance.parseFacilities(mockPark);
        expect(facilities.length).toBe(1);
        expect(facilities[0]).toEqual({ icon: '🚻', name: '卫生间' });
      }
    });
  });

  describe('onSwiperChange 轮播切换', () => {
    test('应该更新当前图片索引', () => {
      const mockEvent = {
        detail: { current: 2 },
      };

      if (pageInstance && pageInstance.onSwiperChange) {
        pageInstance.onSwiperChange(mockEvent);
        expect(pageInstance.data.currentImageIndex).toBe(2);
      }
    });
  });

  describe('onPrevImage 上一张图片', () => {
    test('应该切换到上一张图片', () => {
      pageInstance.data.currentImageIndex = 2;
      pageInstance.data.images = ['img1', 'img2', 'img3'];

      if (pageInstance && pageInstance.onPrevImage) {
        pageInstance.onPrevImage();
        expect(pageInstance.data.currentImageIndex).toBe(1);
      }
    });

    test('在第一张时应该切换到最后一张', () => {
      pageInstance.data.currentImageIndex = 0;
      pageInstance.data.images = ['img1', 'img2', 'img3'];

      if (pageInstance && pageInstance.onPrevImage) {
        pageInstance.onPrevImage();
        expect(pageInstance.data.currentImageIndex).toBe(2);
      }
    });
  });

  describe('onNextImage 下一张图片', () => {
    test('应该切换到下一张图片', () => {
      pageInstance.data.currentImageIndex = 1;
      pageInstance.data.images = ['img1', 'img2', 'img3'];

      if (pageInstance && pageInstance.onNextImage) {
        pageInstance.onNextImage();
        expect(pageInstance.data.currentImageIndex).toBe(2);
      }
    });

    test('在最后一张时应该切换到第一张', () => {
      pageInstance.data.currentImageIndex = 2;
      pageInstance.data.images = ['img1', 'img2', 'img3'];

      if (pageInstance && pageInstance.onNextImage) {
        pageInstance.onNextImage();
        expect(pageInstance.data.currentImageIndex).toBe(0);
      }
    });
  });

  describe('onBack 返回', () => {
    test('应该调用 navigateBack', () => {
      if (pageInstance && pageInstance.onBack) {
        pageInstance.onBack();
        expect(wx.navigateBack).toHaveBeenCalled();
      }
    });
  });

  describe('onShare 分享', () => {
    test('应该显示分享菜单', () => {
      if (pageInstance && pageInstance.onShare) {
        pageInstance.onShare();
        expect(wx.showShareMenu).toHaveBeenCalledWith({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline'],
        });
      }
    });
  });

  describe('onMore 更多', () => {
    test('应该显示操作菜单', () => {
      if (pageInstance && pageInstance.onMore) {
        pageInstance.onMore();
        expect(wx.showActionSheet).toHaveBeenCalledWith({
          itemList: ['举报', '复制链接'],
        });
      }
    });
  });

  describe('onAddressTap 地址点击', () => {
    test('应该打开地图导航', () => {
      pageInstance.data.placeInfo = {
        name: '测试公园',
        address: '测试地址',
        latitude: 22.54,
        longitude: 114.06,
      };

      if (pageInstance && pageInstance.onAddressTap) {
        pageInstance.onAddressTap();
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
      pageInstance.data.placeInfo = null;

      if (pageInstance && pageInstance.onAddressTap) {
        pageInstance.onAddressTap();
        expect(wx.openLocation).not.toHaveBeenCalled();
      }
    });
  });

  describe('onCallTap 电话点击', () => {
    test('应该拨打电话', () => {
      pageInstance.data.placeInfo = {
        phone: '0755-12345678',
      };

      if (pageInstance && pageInstance.onCallTap) {
        pageInstance.onCallTap();
        expect(wx.makePhoneCall).toHaveBeenCalledWith({
          phoneNumber: '0755-12345678',
        });
      }
    });

    test('没有电话号码应该显示提示', () => {
      pageInstance.data.placeInfo = {
        phone: '',
      };

      if (pageInstance && pageInstance.onCallTap) {
        pageInstance.onCallTap();
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '暂无联系电话',
          icon: 'none',
        });
      }
    });
  });

  describe('onFavorite 收藏', () => {
    test('应该切换收藏状态', () => {
      pageInstance.data.isFavorite = false;

      if (pageInstance && pageInstance.onFavorite) {
        pageInstance.onFavorite();
        expect(pageInstance.data.isFavorite).toBe(true);
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '已收藏',
          icon: 'none',
        });
      }
    });

    test('取消收藏应该显示相应提示', () => {
      pageInstance.data.isFavorite = true;

      if (pageInstance && pageInstance.onFavorite) {
        pageInstance.onFavorite();
        expect(pageInstance.data.isFavorite).toBe(false);
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '已取消收藏',
          icon: 'none',
        });
      }
    });
  });

  describe('onReview 写评价', () => {
    test('应该显示功能提示', () => {
      if (pageInstance && pageInstance.onReview) {
        pageInstance.onReview();
        expect(wx.showToast).toHaveBeenCalledWith({
          title: '写评价功能',
          icon: 'none',
        });
      }
    });
  });

  describe('onNavigate 导航', () => {
    test('应该打开地图导航', () => {
      pageInstance.data.placeInfo = {
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
  });

  describe('onShareAppMessage 分享到好友', () => {
    test('应该返回正确的分享信息', () => {
      pageInstance.data.placeInfo = {
        id: 'park1',
        name: '测试公园',
      };
      pageInstance.data.images = ['https://example.com/cover.jpg'];

      if (pageInstance && pageInstance.onShareAppMessage) {
        const shareInfo = pageInstance.onShareAppMessage();
        expect(shareInfo.title).toBe('测试公园');
        expect(shareInfo.path).toBe('/pages/detail/detail?id=park1');
        expect(shareInfo.imageUrl).toBe('https://example.com/cover.jpg');
      }
    });

    test('没有图片时不应该返回imageUrl', () => {
      pageInstance.data.placeInfo = {
        id: 'park1',
        name: '测试公园',
      };
      pageInstance.data.images = [];

      if (pageInstance && pageInstance.onShareAppMessage) {
        const shareInfo = pageInstance.onShareAppMessage();
        expect(shareInfo.imageUrl).toBe('');
      }
    });
  });
});
