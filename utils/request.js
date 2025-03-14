const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    wx.request({
      ...options,
      url: `${app.globalData.baseUrl}${options.url}`,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (res.data.code === 401) {
          // token 过期或无效
          app.logout()
          // 显示登录弹窗
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          if (currentPage && currentPage.setData) {
            currentPage.setData({
              showLoginPopup: true
            })
          }
          reject(res.data)
        } else {
          resolve(res.data)
        }
      },
      fail: reject
    })
  })
}

export default request 