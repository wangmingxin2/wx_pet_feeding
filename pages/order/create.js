const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    service: {},
    pets: [],
    providers: [],
    selectedPet: null,
    selectedProvider: null,
    petIndex: 0,
    providerIndex: 0,
    timeArray: [],
    timeIndex: [0, 0, 0],
    selectedTime: '',
  },

  onLoad(options) {
    if (options.serviceId) {
      this.fetchServiceDetail(options.serviceId)
      this.fetchPets()
      this.fetchProviders()
      this.initTimeArray()
    }
  },

  fetchServiceDetail(serviceId) {
    request({
      url: `/service/${serviceId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({ service: res.data })
      }
    })
  },

  fetchPets() {
    const userId = wx.getStorageSync('userId')
    request({
      url: `/pet/listByUserId/${userId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({ pets: res.data })
      }
    })
  },

  fetchProviders() {
    request({
      url: '/serviceprovider/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        console.log('服务人员列表：', res.data)
        this.setData({ providers: res.data })
      }
    })
  },

  initTimeArray() {
    // 生成未来7天的日期选项
    const days = []
    const hours = []
    const minutes = []

    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push(`${date.getMonth() + 1}月${date.getDate()}日`)
    }

    for (let i = 9; i <= 21; i++) {
      hours.push(`${i}点`)
    }

    for (let i = 0; i < 60; i += 30) {
      minutes.push(`${i}分`)
    }

    this.setData({
      timeArray: [days, hours, minutes]
    })
  },

  onPetChange(e) {
    const index = e.detail.value
    this.setData({
      selectedPet: this.data.pets[index],
      petIndex: index
    })
  },

  onProviderChange(e) {
    const index = e.detail.value
    const selectedProvider = this.data.providers[index]
    console.log('选中的服务人员：', selectedProvider)
    this.setData({
      selectedProvider,
      providerIndex: index
    })
  },

  onTimeChange(e) {
    const { value } = e.detail
    const timeArray = this.data.timeArray
    const selectedTime = `${timeArray[0][value[0]]} ${timeArray[1][value[1]]}${timeArray[2][value[2]]}`

    this.setData({
      timeIndex: value,
      selectedTime
    })
  },

  onTimeColumnChange(e) {
    const { column, value } = e.detail
    const data = {
      timeIndex: [...this.data.timeIndex]
    }
    data.timeIndex[column] = value
    this.setData(data)
  },

  validateForm() {
    if (!this.data.selectedPet) {
      wx.showToast({
        title: '请选择宠物',
        icon: 'none'
      })
      return false
    }
    if (!this.data.selectedProvider) {
      wx.showToast({
        title: '请选择服务人员',
        icon: 'none'
      })
      return false
    }
    if (!this.data.selectedTime) {
      wx.showToast({
        title: '请选择预约时间',
        icon: 'none'
      })
      return false
    }
    return true
  },

  onTapSubmit() {
    if (!this.validateForm()) return

    const orderData = {
      userId: wx.getStorageSync('userId'),
      serviceId: this.data.service.serviceId,
      petId: this.data.selectedPet.petId,
      serviceProviderId: this.data.selectedProvider.serviceProviderId,
      orderAmount: this.data.service.price,
      orderStatus: '1',
      scheduledTime: this.formatScheduledTime()
    }

    console.log('提交的订单数据：', orderData)

    request({
      url: '/order',
      method: 'POST',
      data: orderData
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '预约成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        console.log(res);

        throw new Error(res.message || '预约失败')
      }
    }).catch(err => {
      wx.showToast({
        title: err.message || '预约失败',
        icon: 'none'
      })
    })
  },

  formatScheduledTime() {
    const now = new Date()
    const [dayIndex, hourIndex, minuteIndex] = this.data.timeIndex

    const date = new Date()
    date.setDate(date.getDate() + dayIndex)
    date.setHours(hourIndex + 9, minuteIndex * 30, 0, 0)

    return date.toISOString()
  },

  onTapBack() {
    wx.navigateBack()
  }
}) 