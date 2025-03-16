const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    isEdit: false,
    petId: null,
    formData: {
      name: '',
      type: '',
      breed: '',
      age: '',
      weight: '',
      imageUrl: ''
    },
    petTypes: ['Cat', 'Dog', 'Other'],
    typeIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        petId: options.id
      })
      this.fetchPetDetail(options.id)
    }
  },

  fetchPetDetail(id) {
    request({
      url: `/pet/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({
          formData: res.data,
          typeIndex: this.data.petTypes.indexOf(res.data.type)
        })
      }
    }).catch(err => {
      console.error('获取宠物详情失败：', err)
      wx.showToast({
        title: '获取宠物详情失败',
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

  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.type': this.data.petTypes[index],
      typeIndex: index
    })
  },

  onTapImage() {
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
            'formData.imageUrl': data.data
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
    const { name, type, breed, age, weight } = this.data.formData
    if (!name) {
      wx.showToast({
        title: '请输入宠物名称',
        icon: 'none'
      })
      return false
    }
    if (!type) {
      wx.showToast({
        title: '请选择宠物类型',
        icon: 'none'
      })
      return false
    }
    if (!breed) {
      wx.showToast({
        title: '请输入宠物品种',
        icon: 'none'
      })
      return false
    }
    if (!age) {
      wx.showToast({
        title: '请输入宠物年龄',
        icon: 'none'
      })
      return false
    }
    if (!weight) {
      wx.showToast({
        title: '请输入宠物体重',
        icon: 'none'
      })
      return false
    }
    return true
  },

  onTapSave() {
    if (!this.validateForm()) return

    const userId = wx.getStorageSync('userId')
    const data = {
      ...this.data.formData,
      userId
    }

    const isEdit = this.data.isEdit
    const requestConfig = {
      url: isEdit ? `/pet/${this.data.petId}` : '/pet',
      method: isEdit ? 'PUT' : 'POST',
      data
    }

    request(requestConfig).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: `${isEdit ? '编辑' : '新增'}成功`,
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error(res.msg || `${isEdit ? '编辑' : '新增'}失败`)
      }
    }).catch(err => {
      console.error(`${isEdit ? '编辑' : '新增'}宠物失败：`, err)
      wx.showToast({
        title: err.message || `${isEdit ? '编辑' : '新增'}失败`,
        icon: 'none'
      })
    })
  },

  onTapBack() {
    wx.navigateBack()
  }
}) 