const api = require('../../utils/api')

function amountClass(value) {
  return Number(value || 0) >= 0 ? 'positive' : 'negative'
}

function amountText(value) {
  const num = Number(value || 0)
  const sign = num >= 0 ? '+' : '-'
  return `${sign}${Math.abs(num).toFixed(2)}`
}

function formatLocal(iso) {
  if (!iso) {
    return '--'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

function durationText(createdAt, endedAt) {
  const start = new Date(createdAt)
  const end = new Date(endedAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '--'
  }
  const min = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}小时${m}分`
}

Page({
  data: {
    topInset: 28,
    rooms: [],
    totalProfit: '+0.00',
    totalLoss: '-0.00',
    netProfit: '0.00'
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8
    })
  },

  onShow() {
    this.fetchHistoryRooms()
  },

  fetchHistoryRooms() {
    console.log('[历史记录] 开始获取历史房间列表')
    
    // 检查登录状态
    const app = getApp()
    console.log('[历史记录] 当前用户:', app.globalData.user)
    console.log('[历史记录] 当前token:', app.globalData.token ? '已有token' : '无token')
    
    api.getHistoryRooms(1, 30).then(function(data) {
      console.log('[历史记录] API返回数据:', data)
      
      const rawRooms = data.rooms || []
      console.log('[历史记录] 房间数量:', rawRooms.length)
      
      if (rawRooms.length === 0) {
        console.log('[历史记录] 没有历史房间')
        wx.showToast({
          title: '暂无历史记录',
          icon: 'none'
        })
      }
      
      const rooms = rawRooms.map((item) => ({
        roomId: item.roomId,
        id: item.roomCode,
        members: item.memberCount,
        date: formatLocal(item.createdAt),
        duration: durationText(item.createdAt, item.endedAt),
        rounds: item.transactionCount,
        amount: amountText(item.myBalance),
        cls: amountClass(item.myBalance)
      }))

      const profit = rawRooms
        .filter((item) => Number(item.myBalance) > 0)
        .reduce((sum, item) => sum + Number(item.myBalance || 0), 0)
      const lossAbs = rawRooms
        .filter((item) => Number(item.myBalance) < 0)
        .reduce((sum, item) => sum + Math.abs(Number(item.myBalance || 0)), 0)
      const net = profit - lossAbs

      this.setData({
        rooms,
        totalProfit: `+${profit.toFixed(2)}`,
        totalLoss: `-${lossAbs.toFixed(2)}`,
        netProfit: `${net.toFixed(2)}`
      })
      console.log('[历史记录] 数据设置成功')
    }.bind(this)).catch(function(err) {
      console.error('[历史记录] 获取失败:', err)
      console.error('[历史记录] 错误详情:', {
        message: err.message,
        stack: err.stack
      })
      
      wx.showToast({
        title: err.message || '历史记录加载失败',
        icon: 'none',
        duration: 3000
      })
      this.setData({
        rooms: []
      })
    }.bind(this))
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    })
  },

  goRoomDetail(e) {
    const roomId = e.currentTarget.dataset.roomId
    const roomCode = e.currentTarget.dataset.roomCode
    if (!roomId) {
      return
    }
    wx.navigateTo({
      url: `/pages/room/room?roomId=${encodeURIComponent(roomId)}&roomCode=${encodeURIComponent(roomCode || '')}`
    })
  }
})
