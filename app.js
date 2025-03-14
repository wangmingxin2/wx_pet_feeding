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
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo
      return true
    }
    return false
  },

  // 登录成功后调用
  setLoginSuccess(userInfo) {
    this.globalData.isLoggedIn = true
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', userInfo.token)
  },

  // 退出登录
  logout() {
    this.globalData.isLoggedIn = false
    this.globalData.userInfo = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    baseUrl: 'http://localhost:8080'  // 添加基础URL配置
  }
})
