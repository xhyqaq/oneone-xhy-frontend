App({
  async onLaunch() {
    await this.ensureLogin()
    await this.syncUserProfileFromWechat().catch(() => {})
  },

  async onShow() {
    await this.syncUserProfileFromWechat().catch(() => {})
  },

  async ensureLogin() {
    const token = wx.getStorageSync('token') || ''
    const user = wx.getStorageSync('user') || null
    if (token && user) {
      this.globalData.token = token
      this.globalData.user = user
      return token
    }

    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })

    if (!loginRes.code) {
      throw new Error('wx.login 未返回 code')
    }

    const apiRes = await new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/auth/login`,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          code: loginRes.code
        },
        success: resolve,
        fail: reject
      })
    })

    const body = apiRes.data || {}
    if (body.code !== 0 || !body.data || !body.data.token) {
      throw new Error(body.message || '登录失败')
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
    return body.data.token
  },

  async syncUserProfileFromWechat() {
    if (this.globalData.profileSyncing) {
      return
    }

    const currentUser = this.globalData.user || wx.getStorageSync('user') || {}
    if (currentUser.avatarUrl && currentUser.nickname && currentUser.nickname !== '微信用户') {
      return
    }

    this.globalData.profileSyncing = true
    try {
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善头像和昵称',
          success: resolve,
          fail: reject
        })
      })

      const userInfo = profileRes.userInfo || {}
      if (!userInfo.nickName || !userInfo.avatarUrl) {
        return
      }

      await this.ensureLogin()
      const apiRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.globalData.baseUrl}/auth/profile`,
          method: 'PUT',
          header: {
            'content-type': 'application/json',
            Authorization: `Bearer ${this.globalData.token}`
          },
          data: {
            nickname: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          },
          success: resolve,
          fail: reject
        })
      })

      const body = apiRes.data || {}
      if (body.code !== 0) {
        throw new Error(body.message || '更新资料失败')
      }

      const nextUser = {
        ...(this.globalData.user || {}),
        nickname: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      }
      this.globalData.user = nextUser
      wx.setStorageSync('user', nextUser)
    } finally {
      this.globalData.profileSyncing = false
    }
  },

  globalData: {
    baseUrl: 'https://6255b761.r2.cpolar.top/api',
    token: '',
    user: null,
    profileSyncing: false
  }
})
