App({
  onLaunch(options) {
    this.ensureLogin(function() {
      this.handleScanQRCode(options)
    }.bind(this))
  },

  onShow(options) {
    this.ensureLogin(function() {
      this.handleScanQRCode(options)
    }.bind(this))
  },

  handleScanQRCode(options) {
    if (options && options.scene) {
      const scene = decodeURIComponent(options.scene)
      const parts = scene.split('_')
      if (parts.length === 2) {
        const roomId = parts[0]
        const roomCode = parts[1]
        wx.navigateTo({
          url: `/pages/room/room?roomId=${encodeURIComponent(roomId)}&roomCode=${encodeURIComponent(roomCode)}`
        })
      }
    }
  },

  ensureLogin(callback) {
    const token = wx.getStorageSync('token') || ''
    const user = wx.getStorageSync('user') || null
    if (token && user) {
      this.globalData.token = token
      this.globalData.user = user
      if (callback) callback()
      return
    }

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          console.error('wx.login 未返回 code')
          return
        }

        wx.request({
          url: `${this.globalData.baseUrl}/auth/login`,
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: {
            code: loginRes.code
          },
          success: (apiRes) => {
            const body = apiRes.data || {}
            if (body.code !== 0 || !body.data || !body.data.token) {
              console.error(body.message || '登录失败')
              return
            }

            const nextUser = {
              userId: body.data.userId,
              nickname: body.data.nickname,
              avatarUrl: body.data.avatarUrl
            }

            this.globalData.token = body.data.token
            this.globalData.user = nextUser
            wx.setStorageSync('token', body.data.token)
            wx.setStorageSync('user', nextUser)
            
            if (callback) callback()
          },
          fail: (err) => {
            console.error('登录请求失败:', err)
          }
        })
      },
      fail: (err) => {
        console.error('wx.login 失败:', err)
      }
    })
  },

  globalData: {
    baseUrl: 'https://724b7482.r2.cpolar.top/api',
    token: '',
    user: null
  }
})
