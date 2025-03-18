const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    formData: {
      userId: '',
      name: '',
      avatarUrl: '',
      phone: '',
      email: '',
      address: ''
    }
  },

  onLoad() {
    this.fetchUserInfo()
  },

  fetchUserInfo() {
    const userId = wx.getStorageSync('userId')
    if (!userId) return

    request({
      url: `/user/${userId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({
          formData: {
            userId: res.data.userId,
            name: res.data.name || '',
            avatarUrl: res.data.avatarUrl || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            address: res.data.address || ''
          }
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

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${field}`]: value
    })
  },

  onTapAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  uploadImage(filePath) {
    wx.showLoading({
      title: '上传中...'
    })

    wx.uploadFile({
      url: app.globalData.baseUrl + '/upload',
      filePath: filePath,
      name: 'file',
      header: {
        'token': wx.getStorageSync('token')
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          this.setData({
            'formData.avatarUrl': data.data
          })
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } else {
          throw new Error(data.msg || '上传失败')
        }
      },
      fail: (err) => {
        console.error('上传图片失败：', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  validateForm() {
    const { name, phone } = this.data.formData
    if (!name.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return false
    }
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return false
    }
    return true
  },

  onTapSave() {
    if (!this.validateForm()) return

    const { userId } = this.data.formData
    request({
      url: `/user/${userId}`,
      method: 'PUT',
      data: this.data.formData
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error(res.msg || '保存失败')
      }
    }).catch(err => {
      console.error('保存用户信息失败：', err)
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      })
    })
  },

  onTapBack() {
    wx.navigateBack()
  }
}) 