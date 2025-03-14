import request from '../../utils/request'

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    loading: false
  },

  methods: {
    // 关闭弹窗
    onClose() {
      this.triggerEvent('close')
    },

    // 点击登录按钮
    onLogin() {
      if (this.data.loading) return

      this.setData({ loading: true })

      wx.login({
        success: (res) => {
          if (res.code) {
            // 直接把 code 发给后端，让后端处理获取 openId
            request({
              url: '/user/login',
              method: 'POST',
              data: {
                code: res.code
              }
            })
              .then(result => {
                if (result.code === 200) {
                  const userInfo = result.data
                  getApp().setLoginSuccess(userInfo)
                  this.triggerEvent('login-success', userInfo)

                  // 存储token和userId到全局
                  wx.setStorageSync('token', userInfo.token)
                  wx.setStorageSync('userId', userInfo.userId)

                  // 更新全局数据
                  getApp().globalData.token = userInfo.token
                  getApp().globalData.userId = userInfo.userId
                  getApp().globalData.isLoggedIn = true

                  wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                  })
                } else {
                  wx.showToast({
                    title: result.message || '登录失败',
                    icon: 'none'
                  })
                }
              })
              .catch(err => {
                console.error('登录失败：', err)
                wx.showToast({
                  title: '登录失败，请重试',
                  icon: 'none'
                })
              })
              .finally(() => {
                this.setData({ loading: false })
              })
          } else {
            this.setData({ loading: false })
            wx.showToast({
              title: '获取用户信息失败',
              icon: 'none'
            })
          }
        }
      })
    },

    // 点击用户协议
    onTapUserAgreement() {
      // 跳转到用户协议页面
      wx.navigateTo({
        url: '/pages/agreement/user-agreement'
      })
    },

    // 点击隐私政策
    onTapPrivacyPolicy() {
      // 跳转到隐私政策页面
      wx.navigateTo({
        url: '/pages/agreement/privacy-policy'
      })
    }
  }
})