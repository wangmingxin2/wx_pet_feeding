// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    serviceList: [],
    bannerList: [
      {
        id: 1,
        imageUrl: '/images/banner/banner1.jpg'
      },
      {
        id: 2,
        imageUrl: '/images/banner/banner2.jpg'
      },
      {
        id: 3,
        imageUrl: '/images/banner/banner3.jpg'
      }
    ],
    noticeText: "欢迎使用宠物喂养服务小程序！我们提供专业的宠物照护服务，让您的爱宠得到最好的照顾。",
    introText: "我们是一家专业的宠物服务平台，提供上门喂养、遛狗等多种服务。我们的服务人员都经过专业培训，确保您的宠物得到最好的照顾。无论您是出差、旅游还是临时有事，都可以放心地把爱宠交给我们。"
  },
  onLoad() {
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    console.log("登录状态" + isLoggedIn);

    this.setData({ isLoggedIn });
    if (!isLoggedIn) {
      this.showLoginPopup();
    }
  },

  showLoginPopup() {
    const loginComponent = this.selectComponent('#loginComponent');
    if (loginComponent) {
      loginComponent.showLogin();
    }
  },

  onLoginSuccess(e) {
    this.setData({
      isLoggedIn: true,
      'userInfo.avatarUrl': e.detail.avatarUrl,
      'userInfo.nickName': e.detail.nickName
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  onLoad: function () {
    // 页面加载时可以从服务器获取数据
    this.getHomeData()
  },
  getHomeData: function () {
    // TODO: 调用API获取首页数据
  },
  onCategoryTap: function (e) {
    const categoryId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/services/services?categoryId=${categoryId}`
    })
  },
  onServiceTap: function (e) {
    const serviceId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${serviceId}`
    })
  },
  navigateToServices() {
    wx.switchTab({
      url: '/pages/services/services'
    })
  },
  navigateToOrders() {
    wx.switchTab({
      url: '/pages/orders/orders'
    })
  },
  navigateToCatFeeding() {
    wx.navigateTo({
      url: '/pages/services/cat-feeding/index'
    })
  },
  navigateToDogFeeding() {
    wx.navigateTo({
      url: '/pages/services/dog-feeding/index'
    })
  },
  navigateToMembership() {
    wx.navigateTo({
      url: '/pages/membership/index'
    })
  },
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    })
  }
})
