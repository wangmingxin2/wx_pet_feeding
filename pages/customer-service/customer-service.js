const app = getApp()

Page({
  data: {
    messages: [],
    inputMessage: '',
    userAvatar: '/images/tabbar/profile.png',
    serviceAvatar: '/images/icons/kefu.png',
    lastMessageId: '',
    userId: '',
    socketOpen: false,
    savedMessages: [], // 用于保存消息历史
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    isLoading: false  // 用于防止重复加载
  },

  onLoad: function () {
    // 获取用户ID，这里使用一个临时ID，实际应该从用户系统获取
    const userId = '1'
    this.setData({ userId })
    // 获取历史消息
    this.loadHistoryMessages()
    this.connectSocket()
  },

  onShow: function () {
    // 页面显示时，恢复保存的消息
    if (this.data.savedMessages.length > 0) {
      this.setData({
        messages: this.data.savedMessages
      })
    }
    // 检查WebSocket连接状态并重新连接
    wx.getNetworkType({
      success: (result) => {
        if (result.networkType !== 'none') {
          // 检查WebSocket当前状态
          if (!this.data.socketOpen) {
            console.log('检测到WebSocket未连接，正在重新连接...')
            this.connectSocket()
          } else {
            // 发送心跳包检查连接是否真正有效
            wx.sendSocketMessage({
              data: 'ping',
              fail: () => {
                console.log('心跳包发送失败，重新建立连接')
                this.setData({ socketOpen: false })
                this.connectSocket()
              }
            })
          }
        } else {
          wx.showToast({
            title: '网络连接不可用',
            icon: 'none'
          })
        }
      }
    })
  },

  onHide: function () {
    // 页面隐藏时，保存当前消息列表
    this.setData({
      savedMessages: this.data.messages
    })
  },

  onUnload: function () {
    // 页面卸载时关闭WebSocket连接
    if (this.data.socketOpen) {
      wx.closeSocket()
    }
  },

  connectSocket: function () {
    const that = this
    // 连接WebSocket服务器
    wx.connectSocket({
      url: `ws://localhost:8080/websocket/${this.data.userId}`,
      success: function () {
        console.log('WebSocket连接成功')
      },
      fail: function (error) {
        console.error('WebSocket连接失败', error)
        wx.showToast({
          title: '连接失败，正在重试',
          icon: 'none'
        })
        // 3秒后重试连接
        setTimeout(() => {
          that.connectSocket()
        }, 3000)
      },
      // 开发环境下不校验合法域名
      complete: function () {
        // 使用微信小程序的调试API
        wx.setEnableDebug({
          enableDebug: true
        })
      }
    })

    // 监听WebSocket连接打开
    wx.onSocketOpen(function () {
      that.setData({ socketOpen: true })
      console.log('WebSocket连接已打开')
    })

    // 监听WebSocket接收到服务器的消息
    wx.onSocketMessage(function (res) {
      console.log('收到服务器消息：', res.data)
      try {
        const message = JSON.parse(res.data)
        // 将接收到的消息添加到消息列表
        that.addMessage({
          id: message.id || Date.now(),
          type: message.senderId === that.data.userId ? 'send' : 'receive',
          content: message.content,
          time: that.formatTime(new Date(message.sentTime || Date.now()))
        })
      } catch (error) {
        console.error('解析消息失败：', error)
      }
    })

    // 监听WebSocket错误
    wx.onSocketError(function (error) {
      console.error('WebSocket错误：', error)
      that.setData({ socketOpen: false })
      wx.showToast({
        title: '连接异常，请重试',
        icon: 'none'
      })
    })

    // 监听WebSocket连接关闭
    wx.onSocketClose(function () {
      console.log('WebSocket连接已关闭')
      that.setData({ socketOpen: false })
      // 自动重连
      setTimeout(() => {
        if (!that.data.socketOpen) {
          that.connectSocket()
        }
      }, 3000)
    })
  },

  // 发送消息
  sendMessage: function () {
    if (!this.data.inputMessage.trim()) {
      return
    }

    if (!this.data.socketOpen) {
      wx.showToast({
        title: '连接已断开，请重试',
        icon: 'none'
      })
      return
    }

    const message = {
      toUserId: '999',
      content: this.data.inputMessage,
      userId: this.data.userId,
      timestamp: Date.now()
    }

    // 发送消息到服务器
    wx.sendSocketMessage({
      data: JSON.stringify(message),
      success: () => {
        // 添加消息到列表
        this.addMessage({
          type: 'send',
          content: this.data.inputMessage,
          time: this.formatTime(new Date())
        })
        // 清空输入框
        this.setData({ inputMessage: '' })
      },
      fail: () => {
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 输入框内容变化事件
  onInputMessage: function (e) {
    this.setData({
      inputMessage: e.detail.value
    })
  },

  // 添加消息到列表
  addMessage: function (message) {
    const messages = [...this.data.messages, message]
    this.setData({
      messages,
      lastMessageId: `msg-${message.id}`,
      savedMessages: messages // 同时更新保存的消息
    })

    // 滚动到最新消息
    wx.createSelectorQuery()
      .select('.chat-container')
      .boundingClientRect(function (rect) {
        if (rect) {
          wx.pageScrollTo({
            scrollTop: rect.height,
            duration: 300
          })
        }
      })
      .exec()
  },

  // 格式化时间
  formatTime: function (date) {
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`
  },

  // 添加加载历史消息的方法
  loadHistoryMessages: function (page = 1, size = 5) {
    const that = this
    wx.request({
      url: 'http://localhost:8080/chat',
      method: 'GET',
      data: {
        userId1: that.data.userId,
        userId2: '999',
        page: page,
        size: size
      },
      success: function (res) {
        if (res.data.code === 200 && res.data.data.records) {
          // 将历史消息转换为正确的格式，并按时间倒序排列
          const historyMessages = res.data.data.records
            .sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime)) // 按时间升序排序
            .map(msg => ({
              id: msg.id,
              type: msg.senderId === that.data.userId ? 'send' : 'receive',
              content: msg.content,
              time: that.formatTime(new Date(msg.sentTime))
            }))

          // 更新消息列表
          that.setData({
            messages: historyMessages,
            savedMessages: historyMessages,
            currentPage: res.data.data.current,
            totalPages: res.data.data.pages,
            totalMessages: res.data.data.total
          })

          // 如果有消息，设置第一条消息的ID用于滚动
          if (historyMessages.length > 0) {
            that.setData({
              lastMessageId: `msg-${historyMessages[0].id}`
            })
          }
        } else {
          wx.showToast({
            title: '获取消息失败',
            icon: 'none'
          })
        }
      },
      fail: function (error) {
        console.error('获取历史消息失败：', error)
        wx.showToast({
          title: '获取历史消息失败',
          icon: 'none'
        })
      }
    })
  }
})