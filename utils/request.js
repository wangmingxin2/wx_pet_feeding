const app = getApp()

// 添加自动续期的方法
const refreshToken = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: app.globalData.baseUrl + '/user/login',
            method: 'POST',
            data: {
              code: res.code
            },
            success: (loginRes) => {
              if (loginRes.statusCode === 200 && loginRes.data.code === 200) {
                const userInfo = loginRes.data.data
                // 更新token和用户信息
                wx.setStorageSync('token', userInfo.token)
                wx.setStorageSync('userId', userInfo.userId)
                app.globalData.token = userInfo.token
                app.globalData.userId = userInfo.userId
                app.globalData.isLoggedIn = true
                resolve(userInfo.token)
              } else {
                reject(new Error('续期失败'))
              }
            },
            fail: reject
          })
        } else {
          reject(new Error('获取登录码失败'))
        }
      },
      fail: reject
    })
  })
}

const request = (options) => {
  return new Promise((resolve, reject) => {
    const makeRequest = (token) => {
      wx.request({
        url: app.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        success: (res) => {
          console.log('请求详情:', {
            url: options.url,
            method: options.method,
            token: token,
            statusCode: res.statusCode
          })

          if (res.statusCode === 200) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // token过期，尝试续期
            refreshToken()
              .then(newToken => {
                // 使用新token重试请求
                makeRequest(newToken)
              })
              .catch(error => {
                console.error('token续期失败：', error)
                wx.showToast({
                  title: '登录已过期，请重新登录',
                  icon: 'none'
                })
                // 清除登录信息
                wx.removeStorageSync('token')
                wx.removeStorageSync('userId')
                app.globalData.isLoggedIn = false
                app.globalData.token = ''
                app.globalData.userId = ''
                reject(new Error('登录已过期'))
              })
          } else {
            reject(res)
          }
        },
        fail: (err) => {
          console.error('请求失败:', err)
          reject(err)
        }
      })
    }

    // 开始请求，使用当前token
    const token = wx.getStorageSync('token')
    makeRequest(token)
  })
}

export default request 