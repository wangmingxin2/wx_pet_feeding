const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.fetchUserInfo()
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.fetchUserInfo()
    }
  },

  fetchUserInfo() {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      return
    }

    request({
      url: `/user/${userId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        console.log('用户信息：', res.data)

        const userInfo = {
          avatarUrl: res.data.avatarUrl || '/images/default-avatar.png',
          name: res.data.name || '未设置昵称',
          userId: res.data.userId,
          membershipLevel: res.data.membershipLevel || '普通会员',
          balance: res.data.balance || '0.00',
          totalSpent: res.data.totalSpent || 0,
          discountRate: res.data.discountRate || 1,
          phone: res.data.phone ? res.data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
        }

        this.setData({
          userInfo: userInfo
        })
        console.log('处理后的用户信息：', userInfo)
      } else {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('获取用户信息失败：', err)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    })
  },

  onTapOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders'
    })
  },

  onTapAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    })
  },

  onTapSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  }
}) 