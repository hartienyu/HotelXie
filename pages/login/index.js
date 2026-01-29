const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuBottom: 0,
    menuHeight: 32,
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      navBarHeight: 44,
      menuBottom: menuButtonInfo.bottom,
      menuHeight: menuButtonInfo.height
    });
  },

  async goToProfile() {
    wx.showLoading({ title: '检查账号中...' });
    const db = wx.cloud.database();
    try {
      const res = await db.collection('users').get();
      wx.hideLoading();

      if (res.data.length > 0) {
        const userInfo = res.data[0];
        wx.setStorageSync('token', 'token_' + Date.now());
        wx.setStorageSync('userInfo', userInfo);
        app.globalData.isLogin = true;
        app.globalData.userInfo = userInfo;

        wx.showToast({ title: '欢迎回来' });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/discover/discover' });
        }, 500);
      } else {
        wx.navigateTo({ url: '/pages/login/profile' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('登录检查失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  goBack() {
    wx.showModal({
      title: '提示',
      content: '小程序为会员功能，请登录',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});