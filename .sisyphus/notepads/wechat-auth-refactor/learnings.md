# 学习笔记

## 微信小程序用户信息获取机制变更

### 历史背景
- 2021年前：可以通过 `wx.getUserInfo` 自动获取用户真实昵称和头像
- 2021年后：微信修改隐私政策，`wx.getUserProfile` 需要用户授权，但也只返回"微信用户"和默认头像
- 2024-2026：官方推荐使用 `<button open-type="chooseAvatar">` 和 `<input type="nickname">` 让用户主动填写

### 当前最佳实践
1. 静默登录：`wx.login()` → 后端 `code2Session` → 获取 openid
2. 用户资料：由用户主动填写，不再依赖微信真实信息
3. 新用户默认昵称："微信用户"

### 项目决策
- 暂不支持头像上传（后续对接 OSS）
- 昵称无需额外校验（仅保留非空检查）
- 删除所有失效的 `wx.getUserProfile` 相关代码

## 代码模式

### 静默登录流程（保持不变）
```javascript
// app.js
async ensureLogin() {
  // 1. 检查本地缓存
  const token = wx.getStorageSync('token')
  if (token) return token
  
  // 2. 调用 wx.login 获取 code
  const loginRes = await wx.login()
  
  // 3. 发送 code 到后端
  const apiRes = await wx.request({
    url: `${baseUrl}/auth/login`,
    method: 'POST',
    data: { code: loginRes.code }
  })
  
  // 4. 保存 token 和用户信息
  wx.setStorageSync('token', apiRes.data.token)
  wx.setStorageSync('user', apiRes.data)
  
  return apiRes.data.token
}
```

### 修改昵称流程（保持不变）
```javascript
// pages/profile/profile.js
editNickname() {
  wx.showModal({
    title: '修改昵称',
    editable: true,
    success: async (res) => {
      if (!res.confirm) return
      
      const nickname = res.content.trim()
      if (!nickname) {
        wx.showToast({ title: '昵称不能为空', icon: 'none' })
        return
      }
      
      // 调用后端 API
      await api.updateNickname(nickname)
      
      // 更新本地缓存
      const app = getApp()
      app.globalData.user.nickname = nickname
      wx.setStorageSync('user', app.globalData.user)
      
      // 更新页面显示
      this.setData({ nickname })
    }
  })
}
```

## 注意事项
- 删除代码时要检查所有调用点（使用 grep 搜索）
- 修改菜单项时要同步修改 tapIndex 判断逻辑
- 测试时要清除缓存，模拟新用户场景
