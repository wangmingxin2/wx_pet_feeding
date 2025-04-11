const app = getApp()

Page({
  data: {
    messages: [],
    inputValue: '',
    scrollTop: 0,
    lastMessageId: '',
    userId: '18', // 默认用户ID，实际应用中应从登录信息获取
    isLoading: false,
    userAvatar: '/images/default-avatar.png',
    aiAvatar: '/images/icons/ai-cs.png'
  },

  onLoad: function () {
    // 获取用户ID
    const userId = wx.getStorageSync('userId') || this.data.userId
    if (userId) {
      this.setData({ userId })
    }

    // 从服务器获取用户头像
    this.getUserAvatar()

    // 获取历史记录
    this.getHistoryMessages()
  },

  // 获取用户头像
  getUserAvatar: function () {
    // 从用户信息接口获取头像
    wx.request({
      url: `http://localhost:8080/user/${this.data.userId}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data && res.data.data.avatarUrl) {
          // 直接使用用户的头像
          this.setData({
            userAvatar: res.data.data.avatarUrl
          })
        }
      },
      fail: (error) => {
        console.error('获取用户信息失败', error)
      }
    })
  },

  // 获取历史聊天记录
  getHistoryMessages: function () {
    wx.showLoading({
      title: '加载中...',
    })

    wx.request({
      url: `http://localhost:8080/ai/history?userId=${this.data.userId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const historyMessages = res.data.data.map(item => {
            // 将服务器返回的消息格式转换为本地格式
            return {
              id: new Date(item.timestamp).getTime(),
              type: item.role === 'user' ? 'user' : 'ai',
              content: item.content,
              time: this.formatTimeFromTimestamp(item.timestamp)
            }
          })

          this.setData({
            messages: historyMessages,
            lastMessageId: historyMessages.length > 0 ? `msg-${historyMessages[historyMessages.length - 1].id}` : ''
          })
        }
      },
      fail: (error) => {
        wx.showToast({
          title: '获取历史记录失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 从时间戳格式化时间
  formatTimeFromTimestamp: function (timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp.replace(/-/g, '/'));
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  // 输入框内容变化
  onInputMessage: function (e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 发送消息
  sendMessage: function () {
    if (!this.data.inputValue.trim()) return;
    if (this.data.isLoading) return;

    const message = this.data.inputValue.trim();
    this.setData({
      inputValue: '',
      isLoading: true
    });

    // 添加用户消息到列表
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      time: this.formatTime(new Date())
    };
    this.addMessage(userMessage);

    // 添加思考中的消息
    const thinkingId = Date.now() + 1;
    const thinkingMessage = {
      id: thinkingId,
      type: 'ai',
      content: '',
      time: this.formatTime(new Date()),
      isThinking: true
    };
    this.addMessage(thinkingMessage);

    // 调用AI接口
    wx.request({
      url: 'http://localhost:8080/ai/chat',
      method: 'POST',
      data: {
        prompt: message,
        userId: this.data.userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 移除思考中的消息，添加AI回复
          const aiMessage = {
            id: thinkingId,
            type: 'ai',
            content: res.data.data.response,
            time: this.formatTime(new Date()),
            isThinking: false
          };
          // 替换思考中的消息
          this.replaceThinkingMessage(thinkingId, aiMessage);
        } else {
          // 请求失败，更新思考中消息为错误消息
          this.replaceThinkingMessage(thinkingId, {
            id: thinkingId,
            type: 'ai',
            content: '抱歉，我遇到了问题，请稍后再试。',
            time: this.formatTime(new Date()),
            isThinking: false
          });

          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        // 请求失败，更新思考中消息为错误消息
        this.replaceThinkingMessage(thinkingId, {
          id: thinkingId,
          type: 'ai',
          content: '网络连接失败，请检查网络后重试。',
          time: this.formatTime(new Date()),
          isThinking: false
        });

        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 替换思考中的消息
  replaceThinkingMessage: function (thinkingId, newMessage) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === thinkingId) {
        return newMessage;
      }
      return msg;
    });

    this.setData({
      messages: messages,
      lastMessageId: `msg-${newMessage.id}`
    });
  },

  // 添加消息到列表
  addMessage: function (message) {
    const messages = this.data.messages;
    messages.push(message);
    this.setData({
      messages,
      lastMessageId: `msg-${message.id}`
    });
  },

  // 清空聊天记录
  clearChat: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清空聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...',
          });

          // 调用清空聊天记录接口
          wx.request({
            url: `http://localhost:8080/ai/clear?userId=${this.data.userId}`,
            method: 'DELETE',
            success: (res) => {
              if (res.data.code === 200) {
                this.setData({
                  messages: [],
                  lastMessageId: ''
                });

                wx.showToast({
                  title: '聊天记录已清空',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: res.data.message || '清空失败',
                  icon: 'none'
                });
              }
            },
            fail: (error) => {
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },

  // 返回上一页
  onTapBack: function () {
    wx.navigateBack();
  },

  // 格式化时间
  formatTime: function (date) {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  // 滚动到底部
  scrollToBottom: function () {
    wx.createSelectorQuery()
      .select('.message-list')
      .boundingClientRect((rect) => {
        this.setData({
          scrollTop: rect.height
        });
      })
      .exec();
  },

  // 简单的AI回复逻辑
  getAIResponse: function (userMessage) {
    const responses = {
      '你好': '您好！很高兴为您服务。',
      '再见': '再见！如果还有问题随时问我。',
      '谢谢': '不客气！还有什么可以帮您的吗？',
      '价格': '我们的产品价格非常实惠，具体可以查看商品详情页。',
      '配送': '我们支持全国配送，一般3-5天送达。',
      '退款': '支持7天无理由退款，具体可以查看退款政策。'
    };

    for (let key in responses) {
      if (userMessage.includes(key)) {
        return responses[key];
      }
    }

    return '抱歉，我可能没有理解您的问题。请您换个方式描述，或者直接联系人工客服。';
  }
}); 