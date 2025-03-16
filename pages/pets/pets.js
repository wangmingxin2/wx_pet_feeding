const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    pets: []
  },

  onLoad() {
    this.fetchPetList()
  },

  onShow() {
    this.fetchPetList()
  },

  fetchPetList() {
    const userId = wx.getStorageSync('userId')
    if (!userId) return

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
      }
    }).catch(err => {
      console.error('获取宠物列表失败：', err)
      wx.showToast({
        title: '获取宠物列表失败',
        icon: 'none'
      })
    })
  },

  onTapAdd() {
    wx.navigateTo({
      url: '/pages/pets/edit-pet'
    })
  },

  onTapEdit(e) {
    const pet = e.currentTarget.dataset.pet
    wx.navigateTo({
      url: `/pages/pets/edit-pet?id=${pet.petId}`
    })
  },

  onTapDelete(e) {
    const pet = e.currentTarget.dataset.pet
    console.log('要删除的宠物信息：', pet)

    if (!pet || !pet.petId) {
      wx.showToast({
        title: '宠物ID不存在',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除${pet.name}吗？`,
      success: (res) => {
        if (res.confirm) {
          const petId = Number(pet.petId)

          request({
            url: `/pet/${petId}`,
            method: 'DELETE'
          }).then(res => {
            if (res.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.fetchPetList()
            } else {
              throw new Error(res.msg || '删除失败')
            }
          }).catch(err => {
            console.error('删除宠物失败：', err)
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  onTapPetDetail(e) {
    const pet = e.currentTarget.dataset.pet
    wx.navigateTo({
      url: `/pages/pets/detail?id=${pet.petId}`
    })
  },

  onTapBack() {
    wx.navigateBack({
      delta: 1
    })
  }
}) 