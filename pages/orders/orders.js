const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    statusList: [
      { label: '全部', value: '' },
      { label: '待处理', value: 2 },
      { label: '已确认', value: 1 },
      { label: '已完成', value: 3 },
      { label: '已取消', value: 4 }
    ],
    currentStatus: '',
    orders: [],
    isRefreshing: false
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()  // 添加 onShow 时刷新
  },

  onTapStatus(e) {
    const status = e.currentTarget.dataset.status
    console.log('切换状态：', status)  // 添加日志
    this.setData({
      currentStatus: status,
      orders: []
    }, () => {
      this.loadOrders()
    })
  },

  getStatusText(status) {
    switch (Number(status)) {
      case 1: return '已确认'
      case 2: return '待处理'
      case 3: return '已完成'
      case 4: return '已取消'
      default: return '未知状态'
    }
  },

  loadOrders() {
    const { currentStatus } = this.data
    console.log('开始加载订单数据，当前状态：', currentStatus)

    request({
      url: '/order/list',
      method: 'GET'
    }).then(res => {
      console.log('订单接口返回数据：', res)
      if (res.code === 200 && res.data) {
        let orders = Array.isArray(res.data) ? res.data : [res.data]

        orders = orders.map(order => {
          const processed = {
            ...order,
            createdTime: this.formatTime(order.createdTime),
            scheduledTime: this.formatTime(order.scheduledTime),
            completedTime: order.completedTime ? this.formatTime(order.completedTime) : '',
            orderAmount: order.orderAmount,
            orderStatusText: this.getStatusText(order.orderStatus)
          }
          return processed
        })

        if (currentStatus) {
          orders = orders.filter(order => Number(order.orderStatus) === currentStatus)
        }

        console.log('最终渲染的订单列表：', orders)
        this.setData({ orders })
      } else {
        console.log('接口返回异常：', res)
        this.setData({ orders: [] })
      }
    }).catch(err => {
      console.error('获取订单列表失败：', err)
      wx.showToast({
        title: '获取订单失败',
        icon: 'none'
      })
    })
  },

  onTapCancel(e) {
    const order = e.currentTarget.dataset.order
    console.log('要取消的订单：', order)  // 添加日志

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          request({
            url: `/order/cancelByOrderId/${order.orderId}`,
            method: 'PUT'
          }).then(res => {
            if (res.code === 200) {
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              })
              // 直接重新加载订单列表
              this.loadOrders()
            } else {
              throw new Error(res.msg || '取消失败')
            }
          }).catch(err => {
            console.error('取消订单失败：', err)
            wx.showToast({
              title: err.message || '取消失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  onTapDetail(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/orders/detail?id=${order.orderId}`
    })
  },

  refreshOrders() {
    this.setData({
      orders: []
    }, () => {
      this.loadOrders()
    })
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  onTapBack() {
    wx.navigateBack()
  },

  onTapService(e) {
    const order = e.currentTarget.dataset.order
    console.log('跳转售后服务，订单：', order)  // 添加日志

    wx.switchTab({
      url: '/pages/customer-service/customer-service'
    })
  }
}) 