Page({
  data: {

  },

  onLoad: function (options) {

  },

  // 跳转到人工客服
  navigateToHumanService: function () {
    wx.navigateTo({
      url: '/pages/customer-service/customer-service',
    })
  },

  // 跳转到AI客服
  navigateToAIService: function () {
    wx.navigateTo({
      url: '/pages/ai-service/ai-service'
    })
  }
}) 