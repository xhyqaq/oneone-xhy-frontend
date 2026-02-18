const api = require('../../utils/api')

function formatAmount(value) {
  const num = Number(value || 0)
  const sign = num >= 0 ? '+' : '-'
  return `${sign}${Math.abs(num).toFixed(2)}`
}

function toRecentRoom(item) {
  const dateStr = item.endedAt || item.createdAt || ''
  let formattedDate = ''
  if (dateStr) {
    formattedDate = dateStr.slice(0, 10).replace(/-/g, '/')
  }
  
  return {
    id: item.roomCode,
    roomId: item.roomId,
    members: item.memberCount,
    date: formattedDate,
    rounds: item.transactionCount,
    amount: formatAmount(item.myBalance),
    cls: Number(item.myBalance) >= 0 ? 'positive' : 'negative'
  }
}

Page({
  data: {
    topInset: 28,
    showJoinDialog: false,
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

  fetchRecentRooms() {
    api.getHistoryRooms(1, 5).then(function(data) {
      const rooms = (data.rooms || []).map(toRecentRoom)
      this.setData({
        recentRooms: rooms
      })
    }.bind(this)).catch(function(err) {
      this.setData({
        recentRooms: []
      })
    }.bind(this))
  },

  goRoom() {
    if (this.data.creatingRoom) {
      return
    }
    this.setData({ creatingRoom: true })
    api.createRoom().then(function(data) {
      wx.navigateTo({
        url: `/pages/room/room?roomId=${encodeURIComponent(data.roomId)}&roomCode=${encodeURIComponent(data.roomCode)}`
      })
      this.setData({ creatingRoom: false })
    }.bind(this)).catch(function(err) {
      wx.showToast({
        title: err.message || '创建房间失败',
        icon: 'none'
      })
      this.setData({ creatingRoom: false })
    }.bind(this))
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

  showJoinDialog() {
    this.setData({
      showJoinDialog: true,
      roomCode: ''
    })
  },

  closeJoinDialog() {
    this.setData({
      showJoinDialog: false,
      roomCode: ''
    })
  },

  onJoinDialogTap() {},

  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        if (res.result) {
          const scene = res.result
          const parts = scene.split('_')
          if (parts.length === 2) {
            const roomId = parts[0]
            const roomCode = parts[1]
            wx.navigateTo({
              url: `/pages/room/room?roomId=${encodeURIComponent(roomId)}&roomCode=${encodeURIComponent(roomCode)}`
            })
          } else {
            wx.showToast({
              title: '无效的二维码',
              icon: 'none'
            })
          }
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({
            title: '扫码失败',
            icon: 'none'
          })
        }
      }
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

  joinByCode() {
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
    api.joinRoom(code).then(function(data) {
      wx.navigateTo({
        url: `/pages/room/room?roomId=${encodeURIComponent(data.roomId)}&roomCode=${encodeURIComponent(data.roomCode || code)}`
      })
      this.setData({ joiningRoom: false })
    }.bind(this)).catch(function(err) {
      wx.showToast({
        title: err.message || '加入房间失败',
        icon: 'none'
      })
      this.setData({ joiningRoom: false })
    }.bind(this))
  }
})
