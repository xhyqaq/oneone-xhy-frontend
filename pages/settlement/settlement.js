Page({
  data: {
    topInset: 28,
    summary: [
      { label: '总流水', value: '23', unit: '笔' },
      { label: '总金额', value: '785', unit: '元' },
      { label: '参与人数', value: '5', unit: '人' }
    ],
    ranking: [
      { rank: 1, short: '张', name: '张三', amount: '+150.00', cls: 'positive', width: '100%' },
      { rank: 2, short: '赵', name: '赵六', amount: '+80.00', cls: 'positive', width: '54%' },
      { rank: 3, short: '李', name: '李四', amount: '-50.00', cls: 'negative', width: '34%' },
      { rank: 4, short: '明', name: '小明', amount: '-80.00', cls: 'negative', width: '54%' },
      { rank: 5, short: '王', name: '王五', amount: '-100.00', cls: 'negative', width: '67%' }
    ]
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const statusBarHeight = windowInfo && windowInfo.statusBarHeight ? windowInfo.statusBarHeight : 20
    this.setData({
      topInset: statusBarHeight + 8
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
