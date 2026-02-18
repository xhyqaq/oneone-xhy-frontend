Page({
  data: {
    topInset: 28,
    rooms: [
      { id: 'a3kf', members: 4, date: '02月17日 20:30', duration: '2小时15分', rounds: 18, amount: '+280.00', cls: 'positive' },
      { id: '7vcf', members: 3, date: '02月15日 19:00', duration: '1小时40分', rounds: 12, amount: '-150.00', cls: 'negative' },
      { id: 'm9x2', members: 5, date: '02月12日 21:00', duration: '3小时10分', rounds: 24, amount: '+65.00', cls: 'positive' },
      { id: 'p4wt', members: 4, date: '02月08日 14:00', duration: '2小时30分', rounds: 15, amount: '-200.00', cls: 'negative' }
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
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    })
  }
})
