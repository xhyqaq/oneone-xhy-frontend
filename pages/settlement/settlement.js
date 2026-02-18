const api = require('../../utils/api')

function amountClass(value) {
  return Number(value || 0) >= 0 ? 'positive' : 'negative'
}

function amountText(value) {
  const num = Number(value || 0)
  const sign = num >= 0 ? '+' : '-'
  return `${sign}${Math.abs(num).toFixed(2)}`
}

Page({
  data: {
    topInset: 28,
    roomId: '',
    summary: [
      { label: '总流水', value: '0', unit: '笔' },
      { label: '总金额', value: '--', unit: '元' },
      { label: '参与人数', value: '0', unit: '人' }
    ],
    ranking: []
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8,
      roomId: options.roomId || ''
    })
    this.loadSettlement()
  },

  loadSettlement() {
    const roomId = this.data.roomId
    if (!roomId) {
      return
    }
    api.getSettlement(roomId).then(function(data) {
      const members = data.members || []
      const positiveTotal = members
        .filter((item) => Number(item.balance) > 0)
        .reduce((sum, item) => sum + Number(item.balance || 0), 0)

      const maxAbs = members.reduce((m, item) => {
        const abs = Math.abs(Number(item.balance || 0))
        return abs > m ? abs : m
      }, 1)

      const ranking = members.map((item, idx) => {
        const width = `${Math.max(20, Math.round((Math.abs(Number(item.balance || 0)) / maxAbs) * 100))}%`
        return {
          rank: idx + 1,
          short: (item.nickname || '?').slice(0, 1),
          name: item.nickname || '未命名',
          amount: amountText(item.balance),
          cls: amountClass(item.balance),
          width
        }
      })

      this.setData({
        summary: [
          { label: '总流水', value: `${data.totalTransactions || 0}`, unit: '笔' },
          { label: '总金额', value: `${positiveTotal.toFixed(2)}`, unit: '元' },
          { label: '参与人数', value: `${members.length}`, unit: '人' }
        ],
        ranking
      })
    }.bind(this)).catch(function(err) {
      wx.showToast({
        title: err.message || '加载结算失败',
        icon: 'none'
      })
    })
  },

  goBack() {
    wx.navigateBack()
  },

  finalSettlement() {
    if (!this.data.roomId) {
      return
    }
    api.createSettlement(this.data.roomId).then(function() {
      wx.showToast({
        title: '结算成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/history/history'
        })
      }, 600)
    }).catch(function(err) {
      wx.showToast({
        title: err.message || '结算失败',
        icon: 'none'
      })
    })
  }
})
