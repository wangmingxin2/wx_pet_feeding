const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    services: []
  },

  onLoad() {
    this.fetchServices()
  },

  onShow() {
    this.fetchServices()
  },

  fetchServices() {
    request({
      url: '/service/search?status=ACTIVE',
      method: 'POST'
    }).then(res => {
      if (res.code === 200) {
        console.log(res.data);
        this.setData({
          services: res.data
        })
      } else {
        throw new Error(res.msg || '获取服务列表失败')
      }
    }).catch(err => {
      console.error('获取服务列表失败：', err)
      wx.showToast({
        title: '获取服务列表失败',
        icon: 'none'
      })
    })
  },

  onTapService(e) {
    const service = e.currentTarget.dataset.service
    console.log('点击的服务：', service)
    wx.navigateTo({
      url: `/pages/order/create?serviceId=${service.serviceId}`
    })
  }
}) 