// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    
    if (isLoggedIn && userInfo && openid) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      this.globalData.openid = openid;
    } else {
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.openid = null;
      // 清除可能存在的无效登录信息
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('openid');
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null
  }
})
