const { getLocationById } = require('../../data/locations');

Page({
  data: {
    location: null,
    currentImage: 0,
  },

  onLoad(options) {
    const { id = 'happy-coast' } = options;
    const location = getLocationById(id);

    this.setData({
      location,
      currentImage: 0,
    });

    wx.setNavigationBarTitle({ title: location.name });
  },

  onHeroChange(event) {
    this.setData({ currentImage: event.detail.current || 0 });
  },

  handlePrevImage() {
    const total = this.data.location.coverImages.length;
    const nextIndex = (this.data.currentImage - 1 + total) % total;
    this.setData({ currentImage: nextIndex });
  },

  handleNextImage() {
    const total = this.data.location.coverImages.length;
    const nextIndex = (this.data.currentImage + 1) % total;
    this.setData({ currentImage: nextIndex });
  },

  goToGallery() {
    wx.navigateTo({
      url: `/pages/gallery/index?id=${this.data.location.id}`,
    });
  },

  handleCall() {
    wx.makePhoneCall({ phoneNumber: this.data.location.phone });
  },

  handleOpenMap() {
    wx.openLocation({
      latitude: this.data.location.coordinates.latitude,
      longitude: this.data.location.coordinates.longitude,
      name: this.data.location.name,
      address: this.data.location.address,
    });
  },

  handleNavigate() {
    this.handleOpenMap();
  },
});
