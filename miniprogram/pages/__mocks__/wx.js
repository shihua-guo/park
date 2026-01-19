// miniprogram/pages/__mocks__/wx.js
// 微信API的模拟实现

const Page = (pageConfig) => {
  const page = {
    ...pageConfig,
    data: pageConfig.data || {},
    onLoad: pageConfig.onLoad || function() {},
    onReady: pageConfig.onReady || function() {},
    onShow: pageConfig.onShow || function() {},
    onHide: pageConfig.onHide || function() {},
    onUnload: pageConfig.onUnload || function() {},
    setData: function(data, callback) {
      Object.assign(this.data, data);
      if (callback) callback();
    }
  };
  return page;
};

const Component = (componentConfig) => {
  const component = {
    ...componentConfig,
    data: componentConfig.data || {},
    properties: componentConfig.properties || {},
    behaviors: componentConfig.behaviors || [],
    created: componentConfig.created || function() {},
    attached: componentConfig.attached || function() {},
    ready: componentConfig.ready || function() {},
    moved: componentConfig.moved || function() {},
    detached: componentConfig.detached || function() {},
    setData: function(data, callback) {
      Object.assign(this.data, data);
      if (callback) callback();
    }
  };
  return component;
};

const App = (appConfig) => {
  return {
    ...appConfig,
    globalData: appConfig.globalData || {},
    onLaunch: appConfig.onLaunch || function() {},
    onShow: appConfig.onShow || function() {},
    onHide: appConfig.onHide || function() {}
  };
};

module.exports = { Page, Component, App };
