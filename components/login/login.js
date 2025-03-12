Component({
  properties: {},
  data: {
    show: false,
    isLoading: false
  },
  methods: {
    showLogin() {
      this.setData({ show: true });
    },
    hideLogin() {
      this.setData({ show: false });
    },
    // 获取用户信息
    getUserProfile() {
      this.setData({ isLoading: true });
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          // 保存用户信息到全局数据
          getApp().globalData.userInfo = res.userInfo;
          // 保存登录状态
          wx.setStorageSync('isLoggedIn', true);
          wx.setStorageSync('userInfo', res.userInfo);
          // 获取openid
          this.getOpenId();
          this.hideLogin();
          // 触发登录成功事件
          this.triggerEvent('loginSuccess', res.userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败', err);
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        },
        complete: () => {
          this.setData({ isLoading: false });
        }
      });
    },
    // 获取openid
    getOpenId() {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 使用云函数获取openid
            wx.cloud.callFunction({
              name: 'login',
              data: {
                code: res.code
              },
              success: (res) => {
                if (res.result && res.result.openid) {
                  wx.setStorageSync('openid', res.result.openid);
                } else {
                  wx.showToast({
                    title: '获取openid失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                console.error('获取openid失败', err);
                wx.showToast({
                  title: '获取openid失败，请重试',
                  icon: 'none'
                });
                // 清除登录状态，引导用户重新登录
                wx.removeStorageSync('isLoggedIn');
                wx.removeStorageSync('userInfo');
                wx.removeStorageSync('openid');
                this.showLogin();
              }
            });
          } else {
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('wx.login失败', err);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  }
})