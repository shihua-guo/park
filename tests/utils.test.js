/**
 * 工具函数单元测试
 * 测试 locations.js 数据模块的功能
 */

describe('locations 数据模块测试', () => {
  let locationsModule;

  beforeAll(() => {
    // 重新导入模块
    jest.resetModules();
    locationsModule = require('../miniprogram/data/locations.js');
  });

  describe('locations 数据结构', () => {
    test('locations 应该是一个数组', () => {
      expect(Array.isArray(locationsModule.locations)).toBe(true);
    });

    test('每个 location 应该包含必需字段', () => {
      locationsModule.locations.forEach((location) => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('coordinates');
        expect(location).toHaveProperty('address');
      });
    });

    test('coordinates 应该包含 latitude 和 longitude', () => {
      locationsModule.locations.forEach((location) => {
        expect(location.coordinates).toHaveProperty('latitude');
        expect(location.coordinates).toHaveProperty('longitude');
        expect(typeof location.coordinates.latitude).toBe('number');
        expect(typeof location.coordinates.longitude).toBe('number');
      });
    });

    test('latitude 应该在有效范围内', () => {
      locationsModule.locations.forEach((location) => {
        expect(location.coordinates.latitude).toBeGreaterThanOrEqual(-90);
        expect(location.coordinates.latitude).toBeLessThanOrEqual(90);
      });
    });

    test('longitude 应该在有效范围内', () => {
      locationsModule.locations.forEach((location) => {
        expect(location.coordinates.longitude).toBeGreaterThanOrEqual(-180);
        expect(location.coordinates.longitude).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('city 数据结构', () => {
    test('city 应该包含必需字段', () => {
      expect(locationsModule.city).toHaveProperty('name');
      expect(locationsModule.city).toHaveProperty('latitude');
      expect(locationsModule.city).toHaveProperty('longitude');
    });

    test('city 坐标应该是有效数字', () => {
      expect(typeof locationsModule.city.latitude).toBe('number');
      expect(typeof locationsModule.city.longitude).toBe('number');
    });

    test('city 坐标应该在有效范围内', () => {
      expect(locationsModule.city.latitude).toBeGreaterThanOrEqual(-90);
      expect(locationsModule.city.latitude).toBeLessThanOrEqual(90);
      expect(locationsModule.city.longitude).toBeGreaterThanOrEqual(-180);
      expect(locationsModule.city.longitude).toBeLessThanOrEqual(180);
    });
  });

  describe('filters 数据结构', () => {
    test('filters 应该是一个数组', () => {
      expect(Array.isArray(locationsModule.filters)).toBe(true);
    });

    test('每个 filter 应该包含 key 和 label', () => {
      locationsModule.filters.forEach((filter) => {
        expect(filter).toHaveProperty('key');
        expect(filter).toHaveProperty('label');
        expect(typeof filter.key).toBe('string');
        expect(typeof filter.label).toBe('string');
      });
    });

    test('filter key 应该是唯一的', () => {
      const keys = locationsModule.filters.map((f) => f.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('getLocationById 函数', () => {
    test('应该根据ID返回对应的location', () => {
      const testId = locationsModule.locations[0].id;
      const location = locationsModule.getLocationById(testId);
      expect(location).toBe(locationsModule.locations[0]);
    });

    test('不存在的ID应该返回第一个location', () => {
      const location = locationsModule.getLocationById('non-existent-id');
      expect(location).toBe(locationsModule.locations[0]);
    });

    test('空ID应该返回第一个location', () => {
      const location = locationsModule.getLocationById('');
      expect(location).toBe(locationsModule.locations[0]);
    });

    test('null ID应该返回第一个location', () => {
      const location = locationsModule.getLocationById(null);
      expect(location).toBe(locationsModule.locations[0]);
    });

    test('undefined ID应该返回第一个location', () => {
      const location = locationsModule.getLocationById(undefined);
      expect(location).toBe(locationsModule.locations[0]);
    });
  });
});

describe('距离计算工具函数测试', () => {
  // Haversine公式计算两点间距离
  function calcDistanceMeters(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== 'number')) return NaN;
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  describe('calcDistanceMeters', () => {
    test('相同坐标距离应为0', () => {
      const distance = calcDistanceMeters(22.543099, 114.057868, 22.543099, 114.057868);
      expect(distance).toBe(0);
    });

    test('近距离计算应该准确', () => {
      const distance = calcDistanceMeters(22.543099, 114.057868, 22.543199, 114.057968);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(200); // 应该小于200米
    });

    test('远距离计算应该准确', () => {
      const distance = calcDistanceMeters(22.543099, 114.057868, 23.1291, 113.2644);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeGreaterThan(100000); // 应该大于100公里
    });

    test('跨赤道计算应该正确', () => {
      const distance = calcDistanceMeters(0, 114, 0, 115);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeGreaterThan(100000);
    });

    test('跨本初子午线计算应该正确', () => {
      const distance = calcDistanceMeters(22, -1, 22, 1);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calcDistanceMeters 边界条件', () => {
    test('null参数应该返回NaN', () => {
      expect(calcDistanceMeters(null, 114, 22, 114)).toBeNaN();
      expect(calcDistanceMeters(22, null, 22, 114)).toBeNaN();
      expect(calcDistanceMeters(22, 114, null, 114)).toBeNaN();
      expect(calcDistanceMeters(22, 114, 22, null)).toBeNaN();
    });

    test('undefined参数应该返回NaN', () => {
      expect(calcDistanceMeters(undefined, 114, 22, 114)).toBeNaN();
      expect(calcDistanceMeters(22, undefined, 22, 114)).toBeNaN();
    });

    test('字符串参数应该返回NaN', () => {
      expect(calcDistanceMeters('22', 114, 22, 114)).toBeNaN();
      expect(calcDistanceMeters(22, '114', 22, 114)).toBeNaN();
    });

    test('Infinity参数应该返回NaN', () => {
      expect(calcDistanceMeters(Infinity, 114, 22, 114)).toBeNaN();
      expect(calcDistanceMeters(22, Infinity, 22, 114)).toBeNaN();
    });

    test('NaN参数应该返回NaN', () => {
      expect(calcDistanceMeters(NaN, 114, 22, 114)).toBeNaN();
    });

    test('极大值应该正确处理', () => {
      const distance = calcDistanceMeters(90, 180, -90, -180);
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });
  });
});

describe('距离格式化工具函数测试', () => {
  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }

  describe('formatDistance', () => {
    test('小于1000米应该显示为米', () => {
      expect(formatDistance(100)).toBe('100m');
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    test('等于1000米应该显示为公里', () => {
      expect(formatDistance(1000)).toBe('1.0km');
    });

    test('大于1000米应该显示为公里', () => {
      expect(formatDistance(1500)).toBe('1.5km');
      expect(formatDistance(2000)).toBe('2.0km');
      expect(formatDistance(12345)).toBe('12.3km');
    });

    test('应该正确四舍五入到小数点后一位', () => {
      expect(formatDistance(1050)).toBe('1.1km');
      expect(formatDistance(1150)).toBe('1.2km');
      expect(formatDistance(1949)).toBe('1.9km');
    });

    test('0米应该显示为0m', () => {
      expect(formatDistance(0)).toBe('0m');
    });

    test('负数应该显示为米', () => {
      expect(formatDistance(-100)).toBe('-100m');
      expect(formatDistance(-500)).toBe('-500m');
    });
  });

  describe('formatDistance 边界条件', () => {
    test('NaN应该返回空字符串', () => {
      expect(formatDistance(NaN)).toBe('');
    });

    test('Infinity应该返回空字符串', () => {
      expect(formatDistance(Infinity)).toBe('');
    });

    test('-Infinity应该返回空字符串', () => {
      expect(formatDistance(-Infinity)).toBe('');
    });

    test('null应该返回空字符串', () => {
      expect(formatDistance(null)).toBe('');
    });

    test('undefined应该返回空字符串', () => {
      expect(formatDistance(undefined)).toBe('');
    });

    test('小数值应该正确处理', () => {
      expect(formatDistance(0.5)).toBe('0m');
      expect(formatDistance(0.9)).toBe('1m');
    });
  });
});

describe('数据验证工具函数测试', () => {
  describe('坐标验证', () => {
    function isValidLatitude(lat) {
      return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
    }

    function isValidLongitude(lng) {
      return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
    }

    test('有效纬度应该通过验证', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(22.543099)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
    });

    test('无效纬度应该验证失败', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(NaN)).toBe(false);
      expect(isValidLatitude(null)).toBe(false);
      expect(isValidLatitude(undefined)).toBe(false);
      expect(isValidLatitude('22')).toBe(false);
    });

    test('有效经度应该通过验证', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(114.057868)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
    });

    test('无效经度应该验证失败', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
      expect(isValidLongitude(NaN)).toBe(false);
      expect(isValidLongitude(null)).toBe(false);
      expect(isValidLongitude(undefined)).toBe(false);
      expect(isValidLongitude('114')).toBe(false);
    });
  });

  describe('URL验证', () => {
    function isValidUrl(url) {
      if (!url || typeof url !== 'string') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }

    test('有效URL应该通过验证', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    test('无效URL应该验证失败', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false); // 协议不支持
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });
  });

  describe('字符串处理', () => {
    function splitTags(tagsString) {
      if (!tagsString) return [];
      return tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    }

    test('应该正确分割标签字符串', () => {
      expect(splitTags('儿童,游乐,户外')).toEqual(['儿童', '游乐', '户外']);
      expect(splitTags('儿童,游乐,户外')).toEqual(['儿童', '游乐', '户外']);
    });

    test('应该处理空格', () => {
      expect(splitTags('儿童, 游乐 , 户外')).toEqual(['儿童', '游乐', '户外']);
    });

    test('应该过滤空标签', () => {
      expect(splitTags('儿童,,户外')).toEqual(['儿童', '户外']);
      expect(splitTags('儿童, ,户外')).toEqual(['儿童', '户外']);
    });

    test('空字符串应该返回空数组', () => {
      expect(splitTags('')).toEqual([]);
    });

    test('null应该返回空数组', () => {
      expect(splitTags(null)).toEqual([]);
    });

    test('undefined应该返回空数组', () => {
      expect(splitTags(undefined)).toEqual([]);
    });

    test('单个标签应该返回数组', () => {
      expect(splitTags('儿童')).toEqual(['儿童']);
    });
  });
});
