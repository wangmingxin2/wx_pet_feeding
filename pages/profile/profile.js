const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    userInfo: {},
    pets: []
  },

  onLoad() {
    this.fetchUserInfo()
    this.fetchPetList()
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.fetchUserInfo()
      this.fetchPetList()
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

  fetchPetList() {
    const userId = wx.getStorageSync('userId')
    if (!userId) return

    console.log('开始获取宠物列表，userId:', userId)

    request({
      url: `/pet/listByUserId/${userId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({
          pets: res.data.map(pet => ({
            ...pet,
            weight: pet.weight ? Number(pet.weight).toFixed(1) : '0.0'
          }))
        })
        console.log('宠物列表获取成功：', res.data)
      } else {
        console.error('获取宠物列表失败，返回码：', res.code, '错误信息：', res.msg)
        wx.showToast({
          title: res.msg || '获取宠物列表失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('获取宠物列表失败：', {
        error: err,
        response: err.data,
        statusCode: err.statusCode,
        url: `/pet/listByUserId/${userId}`
      })
      wx.showToast({
        title: '获取宠物列表失败，请稍后重试',
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
      url: '/pages/profile/edit-info'
    })
  },

  onTapSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  onTapViewAllPets() {
    console.log('onTapViewAllPets');
    wx.navigateTo({
      url: '/pages/pets/pets'
    })
  },

  onTapPetDetail(e) {
    const pet = e.currentTarget.dataset.pet
    wx.navigateTo({
      url: `/pages/pets/detail?id=${pet.id}`
    })
  }
}) 