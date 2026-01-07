const galleryImages = [
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"
];

const locations = [
  {
    id: "happy-coast",
    name: "欢乐海岸室内乐园",
    rating: 4.8,
    reviewCount: 1203,
    tags: ["室内空调", "适合2-6岁", "亲子餐厅"],
    categories: ["室内乐园", "儿童公园", "森林步道"],
    address: "南山区滨海大道2008号欢乐海岸购物中心L2-035",
    distance: "1.2km",
    travelTime: "驾车约5分钟",
    status: "营业中",
    hours: "10:00 - 22:00",
    phone: "0755-88886666",
    description:
      "配有自然感十足的游乐设施与亲子课程，提供更静谧的家庭互动氛围。",
    coordinates: {
      latitude: 22.52285,
      longitude: 113.94262,
    },
    coverImages: galleryImages,
    gallery: galleryImages.map((url, index) => ({
      id: `img-${index}`,
      url,
      title: "自然灵感",
    })),
  },
];

const city = {
  name: "深圳",
  latitude: 22.543096,
  longitude: 114.057865,
};

const filters = [
  { key: "indoor", label: "室内乐园" },
  { key: "kids", label: "儿童公园" },
  { key: "forest", label: "森林步道" },
  { key: "parent", label: "亲子餐厅" },
];

const getLocationById = (id) => locations.find((item) => item.id === id) || locations[0];

module.exports = {
  locations,
  getLocationById,
  city,
  filters,
};
