const api = require('../../utils/api')

function formatAmount(value) {
  const num = Number(value || 0)
  const sign = num >= 0 ? '+' : '-'
  return `${sign}${Math.abs(num).toFixed(2)}`
}

function toRecentRoom(item) {
  return {
    id: item.roomCode,
    roomId: item.roomId,
    members: item.memberCount,
    date: (item.endedAt || item.createdAt || '').slice(5, 10).replace('-', '/'),
    rounds: item.transactionCount,
    amount: formatAmount(item.myBalance),
    cls: Number(item.myBalance) >= 0 ? 'positive' : 'negative'
  }
}

Page({
  data: {
    topInset: 28,
    showJoinInput: false,
    roomCode: '',
    creatingRoom: false,
    joiningRoom: false,
    recentRooms: []
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8
    })
  },

  onShow() {
    this.fetchRecentRooms()
  },

  async fetchRecentRooms() {
    try {
      const data = await api.getHistoryRooms(1, 5)
      const rooms = (data.rooms || []).map(toRecentRoom)
      this.setData({
        recentRooms: rooms
      })
    } catch (err) {
      this.setData({
        recentRooms: []
      })
    }
  },

  async goRoom() {
    if (this.data.creatingRoom) {
      return
    }
    this.setData({ creatingRoom: true })
    try {
      const data = await api.createRoom()
      wx.navigateTo({
        url: `/pages/room/room?roomId=${encodeURIComponent(data.roomId)}&roomCode=${encodeURIComponent(data.roomCode)}`
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '创建房间失败',
        icon: 'none'
      })
    } finally {
      this.setData({ creatingRoom: false })
    }
  },

  goHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  goProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  goRoomFromRecent(e) {
    const roomId = e.currentTarget.dataset.roomId
    const roomCode = e.currentTarget.dataset.roomCode
    if (!roomId) {
      return
    }
    wx.navigateTo({
      url: `/pages/room/room?roomId=${encodeURIComponent(roomId)}&roomCode=${encodeURIComponent(roomCode || '')}`
    })
  },

  showJoinInputBar() {
    this.setData({
      showJoinInput: true
    })
  },

  onRoomCodeInput(e) {
    this.setData({
      roomCode: (e.detail.value || '').trim().slice(0, 4)
    })
  },

  async joinByCode() {
    if (this.data.joiningRoom) {
      return
    }
    const code = this.data.roomCode
    if (code.length !== 4) {
      wx.showToast({
        title: '请输入4位房间号',
        icon: 'none'
      })
      return
    }

    this.setData({ joiningRoom: true })
    try {
      const data = await api.joinRoom(code)
      wx.navigateTo({
        url: `/pages/room/room?roomId=${encodeURIComponent(data.roomId)}&roomCode=${encodeURIComponent(data.roomCode || code)}`
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '加入房间失败',
        icon: 'none'
      })
    } finally {
      this.setData({ joiningRoom: false })
    }
  }
})
