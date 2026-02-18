const api = require('../../utils/api')

Page({
  data: {
    topInset: 28,
    nickname: '微信用户',
    userId: '',
    avatarUrl: '',
    avatarText: '微',
    totalScore: '+0.00',
    totalRounds: 0,
    winRate: '0%',
    totalWin: '+0.00',
    totalLoss: '-0.00',
    winCount: 0,
    loseCount: 0,
    winPercent: 50,
    losePercent: 50
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8
    })
  },

  onShow() {
    this.syncUserBasic()
    this.fetchProfileStats()
  },

  syncUserBasic() {
    const app = getApp()
    const user = app.globalData.user || wx.getStorageSync('user') || {}
    const nickname = user.nickname || '微信用户'
    const userId = user.userId || ''
    const avatarUrl = user.avatarUrl || ''
    this.setData({
      nickname,
      userId,
      avatarUrl,
      avatarText: nickname.slice(0, 1)
    })
  },

  async openProfileActions() {
    const itemList = ['同步微信头像昵称', '修改昵称']
    try {
      const res = await new Promise((resolve, reject) => {
        wx.showActionSheet({
          itemList,
          success: resolve,
          fail: reject
        })
      })

      if (res.tapIndex === 0) {
        await getApp().syncUserProfileFromWechat()
        this.syncUserBasic()
        return
      }

      if (res.tapIndex === 1) {
        this.editNickname()
      }
    } catch (err) {
      return
    }
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: this.data.nickname,
      success: async (res) => {
        if (!res.confirm) {
          return
        }
        const nextName = (res.content || '').trim()
        if (!nextName) {
          wx.showToast({
            title: '昵称不能为空',
            icon: 'none'
          })
          return
        }
        try {
          await api.updateNickname(nextName)
          const app = getApp()
          const nextUser = {
            ...(app.globalData.user || {}),
            nickname: nextName
          }
          app.globalData.user = nextUser
          wx.setStorageSync('user', nextUser)
          this.setData({
            nickname: nextName,
            avatarText: nextName.slice(0, 1)
          })
        } catch (err) {
          wx.showToast({
            title: err.message || '修改失败',
            icon: 'none'
          })
        }
      }
    })
  },

  async fetchProfileStats() {
    try {
      const data = await api.getHistoryRooms(1, 100)
      const rooms = data.rooms || []
      const totalRounds = rooms.reduce((sum, item) => sum + Number(item.transactionCount || 0), 0)
      const totalWinNum = rooms.filter((item) => Number(item.myBalance) > 0).reduce((sum, item) => sum + Number(item.myBalance || 0), 0)
      const totalLossAbs = rooms.filter((item) => Number(item.myBalance) < 0).reduce((sum, item) => sum + Math.abs(Number(item.myBalance || 0)), 0)
      const net = totalWinNum - totalLossAbs
      const winCount = rooms.filter((item) => Number(item.myBalance) > 0).length
      const loseCount = rooms.filter((item) => Number(item.myBalance) < 0).length
      const played = winCount + loseCount
      const winPercent = played > 0 ? Math.round((winCount / played) * 100) : 50

      this.setData({
        totalRounds,
        winRate: `${winPercent}%`,
        totalScore: `${net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}`,
        totalWin: `+${totalWinNum.toFixed(2)}`,
        totalLoss: `-${totalLossAbs.toFixed(2)}`,
        winCount,
        loseCount,
        winPercent,
        losePercent: 100 - winPercent
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '个人数据加载失败',
        icon: 'none'
      })
    }
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  goHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  goManual() {
    wx.navigateTo({
      url: '/pages/manual/manual'
    })
  }
})
