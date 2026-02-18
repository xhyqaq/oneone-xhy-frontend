Page({
  data: {
    topInset: 28,
    showJoinInput: false,
    roomCode: '',
    recentRooms: [
      {
        id: 'a3kf',
        members: 4,
        date: '02/17',
        rounds: 18,
        amount: '+280.00',
        cls: 'positive'
      },
      {
        id: '7vcf',
        members: 5,
        date: '02/15',
        rounds: 12,
        amount: '-150.00',
        cls: 'negative'
      }
    ]
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8
    })
  },

  goRoom() {
    wx.navigateTo({
      url: '/pages/room/room'
    })
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

  goRoomFromRecent() {
    wx.navigateTo({
      url: '/pages/room/room'
    })
  },

  showJoinInputBar() {
    this.setData({
      showJoinInput: true
    })
  },

  onRoomCodeInput(e) {
    this.setData({
      roomCode: (e.detail.value || '').trim()
    })
  },

  joinByCode() {
    const code = this.data.roomCode
    if (code.length !== 4) {
      wx.showToast({
        title: '请输入4位房间号',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/room/room'
    })
  }
})
