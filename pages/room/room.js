const api = require('../../utils/api')

const COLORS = ['#05904d', '#f2723f', '#4c8ed1', '#cd56bc', '#e1ad1c', '#44a9a3', '#8a62db', '#f07d53']

function amountClass(value) {
  return Number(value || 0) >= 0 ? 'positive' : 'negative'
}

function amountText(value) {
  const num = Number(value || 0)
  const sign = num >= 0 ? '+' : '-'
  return `${sign}${Math.abs(num).toFixed(2)}`
}

function formatTimeText(iso) {
  if (!iso) {
    return '--:--'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

Page({
  data: {
    topInset: 28,
    showQrPopup: false,
    roomId: '',
    roomCode: '----',
    memberCount: 0,
    myBalance: '+0.00',
    myBalanceCls: 'positive',
    members: [],
    records: []
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8,
      roomId: options.roomId || '',
      roomCode: options.roomCode || '----'
    })
    this.refreshRoomData()
  },

  onShow() {
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  startPolling() {
    this.stopPolling()
    this.pollTimer = setInterval(() => {
      this.refreshRoomData()
    }, 3000)
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  async refreshRoomData() {
    const roomId = this.data.roomId
    if (!roomId) {
      return
    }
    try {
      const [roomData, transData] = await Promise.all([
        api.getRoom(roomId),
        api.getTransactions(roomId, 1, 20)
      ])
      const app = getApp()
      const myUserId = app.globalData.user ? app.globalData.user.userId : ''

      const members = (roomData.members || []).map((item, index) => {
        const isSelf = item.userId === myUserId
        return {
          userId: item.userId,
          short: (item.nickname || '?').slice(0, 1),
          name: item.nickname || '未命名',
          amount: amountText(item.balance),
          cls: amountClass(item.balance),
          color: COLORS[index % COLORS.length],
          self: isSelf
        }
      })

      if (members.length < 8) {
        members.push({ invite: true })
      }

      const me = (roomData.members || []).find((item) => item.userId === myUserId)
      const records = (transData.transactions || []).slice(0, 8).map((item) => ({
        from: item.payerName,
        fromShort: (item.payerName || '?').slice(0, 1),
        fromColor: '#4c8ed1',
        to: item.payeeName,
        toShort: (item.payeeName || '?').slice(0, 1),
        toColor: '#05904d',
        amount: amountText(item.amount),
        time: formatTimeText(item.createdAt)
      }))

      this.setData({
        roomCode: roomData.roomCode || this.data.roomCode,
        memberCount: (roomData.members || []).length,
        myBalance: amountText(me ? me.balance : 0),
        myBalanceCls: amountClass(me ? me.balance : 0),
        members,
        records
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '房间数据加载失败',
        icon: 'none'
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

  goSettlement() {
    wx.navigateTo({
      url: `/pages/settlement/settlement?roomId=${encodeURIComponent(this.data.roomId)}`
    })
  },

  openRoomQr() {
    this.setData({
      showQrPopup: true
    })
  },

  closeRoomQr() {
    this.setData({
      showQrPopup: false
    })
  },

  onShareRoom() {
    wx.showToast({
      title: '分享功能暂未实现',
      icon: 'none'
    })
  },

  onQrDialogTap() {},

  async onMemberTap(e) {
    const index = e.currentTarget.dataset.index
    const member = this.data.members[index]
    if (!member || !member.self) {
      return
    }

    wx.showModal({
      title: '修改名称',
      editable: true,
      placeholderText: member.name,
      success: async (res) => {
        if (!res.confirm) {
          return
        }
        const nextName = (res.content || '').trim()
        if (!nextName) {
          wx.showToast({ title: '名称不能为空', icon: 'none' })
          return
        }
        try {
          await api.updateNickname(nextName)
          const app = getApp()
          const currentUser = app.globalData.user || {}
          const nextUser = { ...currentUser, nickname: nextName }
          app.globalData.user = nextUser
          wx.setStorageSync('user', nextUser)
          this.setData({
            [`members[${index}].name`]: nextName,
            [`members[${index}].short`]: nextName.slice(0, 1)
          })
        } catch (err) {
          wx.showToast({
            title: err.message || '修改失败',
            icon: 'none'
          })
        }
      }
    })
  }
})
