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

  openProfileActions() {
    const itemList = ['修改昵称']
    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editNickname()
        }
      },
      fail: () => {
        return
      }
    })
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: this.data.nickname,
      success: (res) => {
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
        api.updateNickname(nextName).then(() => {
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
        }).catch((err) => {
          wx.showToast({
            title: err.message || '修改失败',
            icon: 'none'
          })
        })
      }
    })
  },

  fetchProfileStats() {
    console.log('[Profile] 开始获取个人统计数据')
    api.getHistoryRooms(1, 100).then((data) => {
      console.log('[Profile] API返回数据:', data)
      const rooms = data.rooms || []
      console.log('[Profile] 房间数量:', rooms.length)
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
      console.log('[Profile] 统计数据设置成功')
    }).catch((err) => {
      console.error('[Profile] 获取统计数据失败:', err)
      console.error('[Profile] 错误详情:', {
        message: err.message,
        stack: err.stack
      })
      
      wx.showToast({
        title: err.message || '个人数据加载失败',
        icon: 'none',
        duration: 3000
      })
    })
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
