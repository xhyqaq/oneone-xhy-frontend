Page({
  data: {
    topInset: 28,
    showQrPopup: false,
    roomId: '7vcf',
    members: [
      { short: '张', name: '张三', amount: '+150.00', cls: 'positive', color: '#05904d', self: true },
      { short: '李', name: '李四', amount: '-50.00', cls: 'negative', color: '#f2723f' },
      { short: '王', name: '王五', amount: '-100.00', cls: 'negative', color: '#4c8ed1' },
      { short: '赵', name: '赵六', amount: '+80.00', cls: 'positive', color: '#cd56bc' },
      { short: '明', name: '小明', amount: '-80.00', cls: 'negative', color: '#e1ad1c' },
      { invite: true }
    ],
    records: [
      { from: '李四', fromShort: '李', fromColor: '#f2723f', to: '我', toShort: '张', toColor: '#05904d', amount: '50.00', time: '14:32' },
      { from: '王五', fromShort: '王', fromColor: '#4c8ed1', to: '我', toShort: '张', toColor: '#05904d', amount: '100.00', time: '14:28' },
      { from: '我', fromShort: '张', fromColor: '#05904d', to: '赵六', toShort: '赵', toColor: '#cd56bc', amount: '30.00', time: '14:15' }
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
  },

  goSettlement() {
    wx.navigateTo({
      url: '/pages/settlement/settlement'
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

  onQrDialogTap() {
  },

  onMemberTap(e) {
    const index = e.currentTarget.dataset.index
    const member = this.data.members[index]
    if (!member || !member.self) {
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
          wx.showToast({
            title: '名称不能为空',
            icon: 'none'
          })
          return
        }

        this.setData({
          [`members[${index}].name`]: nextName,
          [`members[${index}].short`]: nextName.slice(0, 1)
        })
      }
    })
  }
})
