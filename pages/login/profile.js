const app = getApp();

Page({
  data: {
    avatarUrl: '', 
    nickName: '',
    genderText: '',
    gender: 0, 
    genderOptions: ['男', '女'],
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
  },

  onNicknameChange(e) {
    const nickName = e.detail.value;
    this.setData({ nickName });
  },

  onGenderChange(e) {
    const index = Number(e.detail.value);
    const genderMap = [1, 2]; 
    this.setData({
      genderText: this.data.genderOptions[index],
      gender: genderMap[index]
    });
  },

  async uploadAvatar(filePath) {
    if (!filePath || filePath.startsWith('http') || filePath.startsWith('cloud')) {
      return filePath;
    }
    const suffix = filePath.match(/\.[^.]+?$/)?.[0] || '.jpg';
    const cloudPath = `avatars/${Date.now()}-${Math.floor(Math.random() * 10000)}${suffix}`;
    const res = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
    });
    return res.fileID;
  },

  async handleSave() {
    const { avatarUrl, nickName, gender } = this.data;
    if (!avatarUrl || !nickName) {
      wx.showToast({ title: '请先完善头像和昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建档案中...' });
    try {
      const db = wx.cloud.database();
      const checkRes = await db.collection('users').get();
      if (checkRes.data.length > 0) {
        wx.hideLoading();
        wx.showToast({ title: '您已注册，正在登录', icon: 'none' });
        setTimeout(() => wx.reLaunch({ url: '/pages/discover/discover' }), 1000);
        return;
      }

      const fileID = await this.uploadAvatar(avatarUrl);
      const userInfo = {
        nickName,
        avatarUrl: fileID,
        gender: gender || 0,
        createTime: db.serverDate()
      };

      const addRes = await db.collection('users').add({ data: userInfo });
      wx.hideLoading();

      const fullUserInfo = { ...userInfo, _id: addRes._id };
      wx.setStorageSync('token', 'token_' + Date.now());
      wx.setStorageSync('userInfo', fullUserInfo);
      app.globalData.isLogin = true;
      app.globalData.userInfo = fullUserInfo;

      wx.showToast({ title: '注册成功' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/discover/discover' });
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('注册失败', err);
      wx.showToast({ title: '注册失败，请重试', icon: 'none' });
    }
  }
});