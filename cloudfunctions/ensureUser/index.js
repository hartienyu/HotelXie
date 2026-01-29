const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

function genUserId() {
  return 'uid_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openId = wxContext.OPENID;
    if (!openId) return { code: 1, message: '无法获取 OPENID' };

    const usersCol = db.collection('users');
    const existing = await usersCol.where({ openId }).limit(1).get();
    if (existing.data && existing.data.length > 0) {
      return { code: 0, userid: existing.data[0].userid, userDoc: existing.data[0] };
    }

    const now = new Date();
    const userid = genUserId();
    const addRes = await usersCol.add({
      data: { openId, userid, createdAt: now, updatedAt: now },
    });

    return { code: 0, userid, userDoc: { _id: addRes._id, openId, userid, createdAt: now } };
  } catch (err) {
    console.error('ensureUser error', err);
    return { code: 2, message: err.message || '创建用户失败' };
  }
};