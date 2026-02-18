function ensureAuthToken(callback) {
  const app = getApp()
  if (!app.globalData.token) {
    app.ensureLogin(function() {
      callback(app.globalData.token)
    })
  } else {
    callback(app.globalData.token)
  }
}

function request(options) {
  const app = getApp()
  const { url, method = 'GET', data, auth = true } = options

  console.log('[Request] 发起请求:', { url, method, auth })

  return new Promise(function(resolve, reject) {
    function makeRequest(token) {
      const fullUrl = `${app.globalData.baseUrl}${url}`
      
      console.log('========== [Request] 开始请求 ==========')
      console.log('[Request] 完整URL:', fullUrl)
      console.log('[Request] 请求方法:', method)
      console.log('[Request] 请求参数:', data || '无')
      console.log('[Request] Token状态:', token ? '已获取' : '无需token')
      console.log('[Request] 是否需要认证:', auth)
      console.log('==========================================')
      
      const requestOptions = {
        url: fullUrl,
        method: method,
        timeout: 30000,
        header: {
          'content-type': 'application/json',
          ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
        },
        success: function(res) {
          console.log('========== [Request] 响应成功 ✅ ==========')
          console.log('[Request] 请求URL:', fullUrl)
          console.log('[Request] 状态码:', res.statusCode)
          console.log('[Request] 响应数据:', res.data)
          console.log('==========================================')
          
          const body = res.data || {}
          if (res.statusCode >= 400) {
            console.error('[Request] HTTP错误:', res.statusCode)
            reject(new Error(body.message || `HTTP ${res.statusCode}`))
            return
          }
          if (typeof body.code !== 'number') {
            console.error('[Request] 响应格式错误:', body)
            reject(new Error('响应格式错误'))
            return
          }
          if (body.code !== 0) {
            console.error('[Request] 业务错误:', body.code, body.message)
            reject(new Error(body.message || '请求失败'))
            return
          }
          resolve(body.data)
        },
        fail: function(err) {
          console.error('========== [Request] 请求失败 ❌ ==========')
          console.error('[Request] 请求URL:', fullUrl)
          console.error('[Request] 请求方法:', method)
          console.error('[Request] 请求参数:', data || '无')
          console.error('[Request] 错误信息:', err)
          console.error('[Request] 错误详情:', JSON.stringify(err))
          console.error('==========================================')
          reject(err)
        }
      }
      
      if (data !== undefined && data !== null) {
        requestOptions.data = data
      }
      
      wx.request(requestOptions)
    }

    if (auth) {
      ensureAuthToken(makeRequest)
    } else {
      makeRequest('')
    }
  })
}

module.exports = {
  request
}
