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
    showWarning: true,
    showQrPopup: false,
    transferSubmitting: false,
    qrCodeUrl: '',
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

  refreshRoomData() {
    const roomId = this.data.roomId
    if (!roomId) {
      return
    }
    
    let roomData = null
    let transData = null
    let completed = 0
    let hasError = false

    const handleComplete = () => {
      completed++
      if (completed === 2 && !hasError) {
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
      }
    }

    const handleError = (err) => {
      if (!hasError) {
        hasError = true
        wx.showToast({
          title: err.message || '房间数据加载失败',
          icon: 'none'
        })
      }
    }

    api.getRoom(roomId).then(function(data) {
      roomData = data
      handleComplete()
    }).catch(function(err) {
      handleError(err)
    })

    api.getTransactions(roomId, 1, 20).then(function(data) {
      transData = data
      handleComplete()
    }).catch(function(err) {
      handleError(err)
    })
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

  showInviteDialog() {
    const app = getApp()
    const token = app.globalData.token || ''
    const url = `${app.globalData.baseUrl}/rooms/${this.data.roomId}/qrcode`

    console.log('[InviteQR] start', {
      roomId: this.data.roomId,
      hasToken: Boolean(token),
      url
    })

    this.setData({
      showQrPopup: true,
      qrCodeUrl: ''
    })

    const startDownload = (authToken) => {
      console.log('[InviteQR] download begin', { hasToken: Boolean(authToken) })
      wx.downloadFile({
        url: url,
        header: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        success: (res) => {
          const headers = res.header || {}
          const contentType = headers['content-type'] || headers['Content-Type'] || ''
          console.log('[InviteQR] download success', {
            statusCode: res.statusCode,
            contentType,
            tempFilePath: res.tempFilePath || ''
          })
          if (res.statusCode === 200 && contentType.indexOf('image/') === 0) {
            this.setData({
              qrCodeUrl: res.tempFilePath
            })
            return
          }

          const fs = wx.getFileSystemManager()
          fs.readFile({
            filePath: res.tempFilePath,
            encoding: 'utf8',
            success: (fileRes) => {
              let errMsg = '加载二维码失败'
              try {
                const body = JSON.parse(fileRes.data || '{}')
                console.error('[InviteQR] non-image response body', body)
                if (body && body.message) {
                  errMsg = body.message
                }
              } catch (e) {
                console.error('[InviteQR] parse non-image body failed', e)
              }
              wx.showToast({ title: errMsg, icon: 'none' })
            },
            fail: (err) => {
              console.error('[InviteQR] read temp file failed', err)
              wx.showToast({ title: '加载二维码失败', icon: 'none' })
            }
          })
        },
        fail: (err) => {
          console.error('[InviteQR] download failed', err)
          wx.showToast({
            title: '加载二维码失败',
            icon: 'none'
          })
        }
      })
    }

    if (!token && typeof app.ensureLogin === 'function') {
      console.log('[InviteQR] no token, try relogin before download')
      app.ensureLogin(function() {
        console.log('[InviteQR] relogin done', { hasToken: Boolean(app.globalData.token) })
        startDownload(app.globalData.token || '')
      })
      return
    }

    startDownload(token)
  },

  closeRoomQr() {
    this.setData({
      showQrPopup: false
    })
  },

  onShareAppMessage() {
    return {
      title: `加入 ${this.data.roomCode} 房间一起记账`,
      path: `/pages/room/room?roomId=${this.data.roomId}&roomCode=${this.data.roomCode}`,
      imageUrl: ''
    }
  },

  closeWarning() {
    this.setData({
      showWarning: false
    })
  },

  onQrDialogTap() {},

  onMemberTap(e) {
    const index = e.currentTarget.dataset.index
    const member = this.data.members[index]
    if (!member || member.invite) {
      return
    }

    if (!member.self) {
      if (this.data.transferSubmitting) {
        return
      }

      wx.showModal({
        title: `向${member.name}转账`,
        editable: true,
        placeholderText: '请输入金额（如 12.5）',
        success: (res) => {
          if (!res.confirm) {
            return
          }

          const amountTextValue = (res.content || '').trim()
          if (!amountTextValue) {
            wx.showToast({ title: '请输入金额', icon: 'none' })
            return
          }

          const amount = Number(amountTextValue)
          const validMoney = /^\d+(\.\d{1,2})?$/.test(amountTextValue)
          if (!Number.isFinite(amount) || amount <= 0 || !validMoney) {
            wx.showToast({ title: '金额格式不正确', icon: 'none' })
            return
          }

          this.setData({ transferSubmitting: true })
          api.createTransaction(this.data.roomId, member.userId, amount).then(function() {
            wx.showToast({ title: '转账成功', icon: 'success' })
            this.refreshRoomData()
            this.setData({ transferSubmitting: false })
          }.bind(this)).catch(function(err) {
            wx.showToast({
              title: err.message || '转账失败',
              icon: 'none'
            })
            this.setData({ transferSubmitting: false })
          })
        }
      })
      return
    }

    wx.showModal({
      title: '修改名称',
      editable: true,
      placeholderText: member.name,
      success: (res) => {
        if (!res.confirm) {
          return
        }
        const nextName = (res.content || '').trim()
        if (!nextName) {
          wx.showToast({ title: '名称不能为空', icon: 'none' })
          return
        }
        api.updateNickname(nextName).then(function() {
          const app = getApp()
          const currentUser = app.globalData.user || {}
          const nextUser = { ...currentUser, nickname: nextName }
          app.globalData.user = nextUser
          wx.setStorageSync('user', nextUser)
          this.setData({
            [`members[${index}].name`]: nextName,
            [`members[${index}].short`]: nextName.slice(0, 1)
          })
        }.bind(this)).catch(function(err) {
          wx.showToast({
            title: err.message || '修改失败',
            icon: 'none'
          })
        })
      }
    })
  }
})
