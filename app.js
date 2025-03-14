// app.js
App({
  onLaunch() {
    // 启动时从storage恢复数据
    const token = wx.getStorageSync('token')
    const userId = wx.getStorageSync('userId')
    if (token && userId) {
      this.globalData.token = token
      this.globalData.userId = userId
      this.globalData.isLoggedIn = true
    }

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
    const userId = wx.getStorageSync('userId')
    const isLoggedIn = token && userId
    this.globalData.isLoggedIn = isLoggedIn
    return isLoggedIn
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
    baseUrl: 'http://localhost:8080',  // 确保这个地址正确
    token: '',
    userId: ''
  }
})
