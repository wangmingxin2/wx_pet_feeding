const app = getApp()

Page({
  data: {
    userInfo: null,
    rechargeAmount: '',
    actualAmount: '',
    bonusAmount: 0,
    rechargeOptions: [
      { value: 100, label: '100元', description: '基础充值', badge: '' },
      { value: 200, label: '200元', description: '赠送20元', badge: '推荐' },
      { value: 500, label: '500元', description: '赠送80元', badge: '超值' },
      { value: 1000, label: '1000元', description: '赠送200元', badge: '豪华' }
    ],
    selectedOption: null,
    customAmount: false,
    showPaymentModal: false,
    paymentMethod: 'wechat',
    loadingUser: true,
    loadingSubmit: false
  },

  onLoad: function () {
    // 检查登录状态
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      })
      return
    }

    // 获取用户信息
    this.getUserInfo()
  },

  getUserInfo: function () {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this.setData({ loadingUser: false })
      return
    }
    const token = wx.getStorageSync('token')
    wx.request({
      url: `http://localhost:8080/user/${userId}`,
      method: 'GET',
      header: {
        'token': token,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({
            userInfo: res.data.data,
            loadingUser: false
          })
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
          this.setData({ loadingUser: false })
        }
      },
      fail: (error) => {
        console.error('获取用户信息失败', error)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        this.setData({ loadingUser: false })
      }
    })
  },

  calculateActualAmount: function (amount) {
    if (!amount) return { actual: 0, bonus: 0 };

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return { actual: 0, bonus: 0 };

    let bonus = 0;
    if (value >= 1000) {
      bonus = value * 0.2;
    } else if (value >= 500) {
      bonus = value * 0.16;
    } else if (value >= 200) {
      bonus = value * 0.1;
    }

    return {
      actual: value + bonus,
      bonus: bonus
    };
  },

  selectRechargeOption: function (e) {
    const index = e.currentTarget.dataset.index
    const option = this.data.rechargeOptions[index]
    const amount = option.value;
    const { actual, bonus } = this.calculateActualAmount(amount);

    this.setData({
      selectedOption: option,
      rechargeAmount: amount.toString(),
      actualAmount: actual.toFixed(2),
      bonusAmount: bonus.toFixed(2),
      customAmount: false
    })
  },

  selectCustomAmount: function () {
    this.setData({
      selectedOption: null,
      customAmount: true,
      rechargeAmount: '',
      actualAmount: '',
      bonusAmount: 0
    })
  },

  inputAmountChange: function (e) {
    let value = e.detail.value.trim()

    // 只允许输入数字和小数点
    value = value.replace(/[^\d.]/g, '')

    // 确保只有一个小数点
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }

    // 限制小数点后两位
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
    }

    // 计算实际到账金额
    const { actual, bonus } = this.calculateActualAmount(value);

    this.setData({
      rechargeAmount: value,
      actualAmount: actual.toFixed(2),
      bonusAmount: bonus.toFixed(2)
    })
  },

  showPayment: function () {
    if (!this.data.rechargeAmount) {
      wx.showToast({
        title: '请输入充值金额',
        icon: 'none'
      })
      return
    }

    const amount = parseFloat(this.data.rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      })
      return
    }

    this.setData({
      showPaymentModal: true
    })
  },

  closePayment: function () {
    this.setData({
      showPaymentModal: false
    })
  },

  selectPaymentMethod: function (e) {
    this.setData({
      paymentMethod: e.currentTarget.dataset.method
    })
  },

  confirmRecharge: function () {
    // 获取充值金额
    const amount = parseFloat(this.data.rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      })
      return
    }

    // 显示加载状态
    this.setData({ loadingSubmit: true })

    // 计算赠送金额
    const bonusAmount = parseFloat(this.data.bonusAmount);
    const totalAmount = amount + bonusAmount;

    // 更新用户余额
    const userId = this.data.userInfo.userId
    const newBalance = this.data.userInfo.balance + totalAmount;
    const token = wx.getStorageSync('token');

    wx.request({
      url: `http://localhost:8080/user/${userId}`,
      method: 'PUT',
      header: {
        'token': token,
        'Content-Type': 'application/json'
      },
      data: {
        ...this.data.userInfo,
        balance: newBalance
      },
      success: (res) => {
        this.setData({
          loadingSubmit: false,
          showPaymentModal: false
        })

        if (res.data && res.data.code === 200) {
          // 模拟支付成功动画
          wx.showLoading({
            title: '支付处理中',
          })

          setTimeout(() => {
            wx.hideLoading()
            wx.showModal({
              title: '充值成功',
              content: `您已成功充值${amount}元，赠送${bonusAmount.toFixed(2)}元，余额更新为${newBalance.toFixed(2)}元`,
              showCancel: false,
              success: () => {
                // 刷新用户信息
                this.getUserInfo()
              }
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.data?.message || '充值失败',
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        console.error('充值失败', error)
        this.setData({ loadingSubmit: false })
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 添加返回按钮功能
  navigateBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }
}) 