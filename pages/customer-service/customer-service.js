const app = getApp()
import request from '../../utils/request'

Page({
  data: {
    messages: [],
    inputMessage: '',
    userAvatar: 'http://60.204.157.137:9000/pet/1741678572733_1.jpeg',
    serviceAvatar: '/images/icons/kefu.png',
    lastMessageId: '',
    userId: '',  // 将从storage中获取
    socketOpen: false,
    savedMessages: [], // 用于保存消息历史
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    isLoading: false,  // 用于防止重复加载
    showLoginPopup: false  // 添加登录弹窗控制变量
  },

  onLoad: function () {
    // 从storage获取userId
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.setData({ userId: userId })
    }

    this.checkLogin()
    if (app.globalData.isLoggedIn) {
      // 先移除可能存在的旧监听器
      wx.closeSocket()
      wx.onSocketClose(() => {
        console.log('旧连接已关闭')
      })
      this.initPage()
    }
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
            // 修改心跳包格式
            const heartbeat = {
              toUserId: '999',  // 客服ID
              content: 'ping',
              type: 'heartbeat',
              userId: this.data.userId
            }
            wx.sendSocketMessage({
              data: JSON.stringify(heartbeat),
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
    // 在建立新连接前先设置好所有监听器
    this.setupSocketListeners()

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
      }
    })
  },

  setupSocketListeners: function () {
    const that = this

    // 先清除可能存在的旧监听器
    wx.closeSocket()

    // 重新设置所有监听器
    wx.onSocketOpen(function (res) {
      console.log('=== WebSocket连接已打开 ===')
      that.setData({ socketOpen: true })
    })

    wx.onSocketMessage(function (res) {
      console.log('收到服务器消息:', res.data)

      try {
        const message = JSON.parse(res.data)
        if (message.type === 'heartbeat' || message.content === 'pong') {
          console.log('收到心跳响应')
          return
        }
        let messageType;
        // 将 ID 转换为相同类型进行比较
        if (message.senderId === String(that.data.userId)) {
          messageType = 'send';
        }
        // 如果接收者是当前用户，显示在左边
        else if (message.recipientId === String(that.data.userId)) {
          messageType = 'receive';
        }
        // 其他情况显示在左边
        else {
          messageType = 'receive';
        }

        const newMessage = {
          id: message.id || Date.now(),
          type: messageType,
          content: message.content,
          time: that.formatTime(new Date(message.sentTime || Date.now())),
          senderId: message.senderId,
          recipientId: message.recipientId
        }

        that.setData({
          messages: [...that.data.messages, newMessage],
          savedMessages: [...that.data.messages, newMessage],
          lastMessageId: `msg-${newMessage.id}`
        })
      } catch (error) {
        console.error('消息处理出错：', error)
      }
    })

    wx.onSocketError(function (error) {
      console.error('WebSocket错误：', error)
      that.setData({ socketOpen: false })
    })

    wx.onSocketClose(function (res) {
      console.log('WebSocket连接关闭：', res)
      that.setData({ socketOpen: false })

      // 自动重连
      setTimeout(() => {
        if (!that.data.socketOpen) {
          console.log('准备重新连接...')
          that.connectSocket()
        }
      }, 3000)
    })
  },

  // 发送消息
  sendMessage: function () {
    if (!this.data.inputMessage.trim()) {
      return;
    }

    if (!this.data.socketOpen) {
      wx.showToast({
        title: '连接已断开，请重试',
        icon: 'none'
      });
      return;
    }

    const messageContent = this.data.inputMessage.trim();
    const timestamp = Date.now();

    const message = {
      toUserId: '999', // 客服ID
      content: messageContent,
      userId: this.data.userId,
      timestamp: timestamp,
      type: 'text'  // 可以添加消息类型
    };

    wx.sendSocketMessage({
      data: JSON.stringify(message),
      success: () => {
        // 先添加到本地消息列表
        const newMessage = {
          id: timestamp,
          type: 'send',
          content: messageContent,
          time: this.formatTime(new Date())
        };

        const updatedMessages = [...this.data.messages, newMessage];
        this.setData({
          messages: updatedMessages,
          savedMessages: updatedMessages,
          inputMessage: '',
          lastMessageId: `msg-${newMessage.id}`
        }, () => {
          // 滚动到最新消息
          wx.createSelectorQuery()
            .select('.message-list')
            .node()
            .exec((res) => {
              const scrollView = res[0].node;
              scrollView.scrollTo({
                top: scrollView.scrollHeight,
                behavior: 'smooth'
              });
            });
        });
      },
      fail: (error) => {
        console.error('发送消息失败：', error);
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        });
      }
    });
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
    const token = wx.getStorageSync('token')
    wx.request({
      url: 'http://localhost:8080/chat',
      method: 'GET',
      data: {
        userId1: that.data.userId,
        userId2: '999',
        page: page,
        size: size
      },
      header: {

        'Content-Type': 'application/json',

        'token': token || ''

      },
      success: function (res) {
        if (res.data.code === 200 && res.data.data.records) {
          // 将历史消息转换为正确的格式，并按时间升序排列
          const historyMessages = res.data.data.records
            .sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime)) // 按时间升序排序
            .map(msg => {
              let messageType;
              // 将 ID 转换为相同类型进行比较
              if (msg.senderId === String(that.data.userId)) {
                messageType = 'send';
              }
              // 如果接收者是当前用户，显示在左边
              else if (msg.recipientId === String(that.data.userId)) {
                messageType = 'receive';
              }
              // 其他情况显示在左边
              else {
                messageType = 'receive';
              }

              return {
                id: msg.id,
                type: messageType,
                content: msg.content,
                time: that.formatTime(new Date(msg.sentTime)),
                senderId: msg.senderId,
                recipientId: msg.recipientId
              }
            })

          console.log('处理后的历史消息：', historyMessages)

          // 更新消息列表
          that.setData({
            messages: historyMessages,
            savedMessages: historyMessages,
            currentPage: res.data.data.current,
            totalPages: res.data.data.pages,
            totalMessages: res.data.data.total
          })

          // 如果有消息，设置最后一条消息的ID用于滚动
          if (historyMessages.length > 0) {
            that.setData({
              lastMessageId: `msg-${historyMessages[historyMessages.length - 1].id}`
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
  },

  checkLogin() {
    if (!app.checkLoginStatus()) {
      this.setData({
        showLoginPopup: true
      })
    }
  },

  onLoginPopupClose() {
    this.setData({
      showLoginPopup: false
    })
  },

  onLoginSuccess() {
    this.setData({
      showLoginPopup: false,
      userId: wx.getStorageSync('userId')  // 更新userId
    })
    this.initPage()
  },

  initPage() {
    // 初始化页面数据
    this.loadHistoryMessages()
    this.connectSocket()
  }
})