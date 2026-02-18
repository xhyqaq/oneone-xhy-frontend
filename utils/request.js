async function ensureAuthToken() {
  const app = getApp()
  if (!app.globalData.token) {
    await app.ensureLogin()
  }
  return app.globalData.token
}

function request(options) {
  const app = getApp()
  const { url, method = 'GET', data, auth = true } = options

  return new Promise(async (resolve, reject) => {
    try {
      const token = auth ? await ensureAuthToken() : ''
      wx.request({
        url: `${app.globalData.baseUrl}${url}`,
        method,
        data,
        header: {
          'content-type': 'application/json',
          ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
        },
        success: (res) => {
          const body = res.data || {}
          if (res.statusCode >= 400) {
            reject(new Error(body.message || `HTTP ${res.statusCode}`))
            return
          }
          if (typeof body.code !== 'number') {
            reject(new Error('响应格式错误'))
            return
          }
          if (body.code !== 0) {
            reject(new Error(body.message || '请求失败'))
            return
          }
          resolve(body.data)
        },
        fail: reject
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = {
  request
}
