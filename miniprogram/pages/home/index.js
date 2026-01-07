const { locations, city, filters } = require('../../data/locations');

const formatMarkers = (items = []) =>
  items.map((item, index) => ({
    id: index,
    latitude: item.coordinates.latitude,
    longitude: item.coordinates.longitude,
    iconPath: '/images/marker-1.png',
    width: 28,
    height: 28,
    callout: {
      content: item.name,
      color: '#111111',
      fontSize: 12,
      borderRadius: 20,
      padding: 6,
      bgColor: '#ffffff',
      display: 'ALWAYS',
    },
  }));

Page({
  data: {
    city,
    filters,
    searchValue: '',
    activeFilter: filters[0]?.key || '',
    locations,
    markers: formatMarkers(locations),
    includePoints: locations.map((item) => ({
      latitude: item.coordinates.latitude,
      longitude: item.coordinates.longitude,
    })),
    currentIndex: 0,
    selectedLocationId: locations[0]?.id,
    selectedLocation: locations[0] || {},
  },

  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#f6f9ff',
    });
  },

  onMarkerTap(event) {
    const index = Number(event.markerId) || 0;
    this.setActiveLocation(index, { autoNavigate: false });
  },

  onSwiperChange(event) {
    const index = event.detail.current || 0;
    this.setActiveLocation(index, { autoNavigate: false });
  },

  setActiveLocation(index = 0, options = {}) {
    const safeIndex = Math.max(0, Math.min(index, this.data.locations.length - 1));
    const target = this.data.locations[safeIndex];

    this.setData({
      currentIndex: safeIndex,
      selectedLocationId: target.id,
      selectedLocation: target,
    });

    if (options.autoNavigate) {
      this.navigateToDetail(target.id);
    }
  },

  handleSelectFilter(event) {
    const { key } = event.currentTarget.dataset;
    this.setData({ activeFilter: key });
  },

  handleSearchInput(event) {
    this.setData({ searchValue: event.detail.value });
  },

  handleGuide(event) {
    event.stopPropagation?.();
    const { id } = event.currentTarget.dataset;
    const location = this.data.locations.find((item) => item.id === id) || this.data.selectedLocation;

    wx.openLocation({
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      name: location.name,
      address: location.address,
    });
  },

  handleNavigateToDetail(event) {
    const { id } = event.currentTarget.dataset;
    this.navigateToDetail(id);
  },

  navigateToDetail(id) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`,
    });
  },
});
