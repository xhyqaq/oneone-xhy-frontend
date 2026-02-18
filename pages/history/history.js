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

  async fetchHistoryRooms() {
    try {
      const data = await api.getHistoryRooms(1, 30)
      const rawRooms = data.rooms || []
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
    } catch (err) {
      wx.showToast({
        title: err.message || '历史记录加载失败',
        icon: 'none'
      })
      this.setData({
        rooms: []
      })
    }
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
