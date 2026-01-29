App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloudbase-8gt2bb8bdc0333bd', 
        traceUser: true,
      });
      this.getUserOpenId();
    }
  },

  getUserOpenId() {
    // 检查是否已存储
    const cachedOpenId = wx.getStorageSync('userOpenId');
    if (cachedOpenId) {
      return;
    }

    // 通过云函数获取用户 OpenID
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        const openId = res.result?.openid;
        if (openId) {
          wx.setStorageSync('userOpenId', openId);
          console.log('用户 OpenID 已存储:', openId);
        }
      },
      fail: (err) => {
        console.error('获取用户 OpenID 失败:', err);
      },
    });
  },
  globalData: {
    isLogin: false, // 全局登录状态
    token: '',
  },

  silentLogin() {
    wx.login({
      success: res => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log('获取到的登录凭证 code:', res.code);
        }
      }
    });
  },

  checkLogin() {
    // 检查内存 globalData
    if (this.globalData.isLogin) return true;

    // 检查缓存
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLogin = true; // 同步回内存
      return true;
    }

    this.forceLogin();
    return false;
  },
  
  // 强制跳转登录
  forceLogin() {
    console.log('👉 准备跳转登录页...');
    wx.navigateTo({
      url: '/pages/login/index', // 指向你的登录页
    });
  }
});
