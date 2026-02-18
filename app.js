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
      console.log('[Auth] 发现缓存，验证有效性...')
      
      wx.request({
        url: `${this.globalData.baseUrl}/auth/profile`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        success: (res) => {
          const body = res.data || {}
          
          if (res.statusCode === 200 && body.code === 0 && body.data) {
            console.log('[Auth] Token有效，使用缓存')
            this.globalData.token = token
            this.globalData.user = {
              userId: body.data.userId,
              nickname: body.data.nickname,
              avatarUrl: body.data.avatarUrl
            }
            wx.setStorageSync('user', this.globalData.user)
            if (callback) callback()
          } else {
            console.log('[Auth] Token无效，清除缓存并重新登录')
            wx.removeStorageSync('token')
            wx.removeStorageSync('user')
            this.doLogin(callback)
          }
        },
        fail: (err) => {
          console.error('[Auth] 验证失败，清除缓存并重新登录:', err)
          wx.removeStorageSync('token')
          wx.removeStorageSync('user')
          this.doLogin(callback)
        }
      })
      return
    }
    
    console.log('[Auth] 无缓存，开始登录')
    this.doLogin(callback)
  },

  doLogin(callback) {
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
            
            console.log('[Auth] 登录成功:', nextUser)
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
    baseUrl: 'https://one.xhyovo.cn/api',
    token: '',
    user: null
  }
})
