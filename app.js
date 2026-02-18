App({
  async onLaunch() {
    await this.ensureLogin()
  },

  async onShow() {
    await this.ensureLogin()
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

  globalData: {
    baseUrl: 'https://6255b761.r2.cpolar.top/api',
    token: '',
    user: null
  }
})
