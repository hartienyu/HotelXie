export function fetchHotelsList(pageIndex = 1, pageSize = 20) {
  const db = wx.cloud.database();
  const skipCount = Math.max(0, (pageIndex - 1) * pageSize);

  return new Promise(async (resolve, reject) => {
    try {
      const res = await db.collection('hotels')
        .skip(skipCount)
        .limit(pageSize)
        .get();
      
      const list = res.data;
      
      let cloudIDs = [];
      list.forEach(item => {
        if (Array.isArray(item.hotelImages)) {
          cloudIDs.push(...item.hotelImages.filter(id => id.startsWith('cloud://')));
        }
        if (Array.isArray(item.roomList)) {
          item.roomList.forEach(room => {
            if (Array.isArray(room.roomImages)) {
              cloudIDs.push(...room.roomImages.filter(id => id.startsWith('cloud://')));
            }
          });
        }
      });
      
      cloudIDs = [...new Set(cloudIDs)];

      let urlMap = {};
      if (cloudIDs.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < cloudIDs.length; i += batchSize) {
          const batch = cloudIDs.slice(i, i + batchSize);
          const urlRes = await wx.cloud.getTempFileURL({ fileList: batch });
          urlRes.fileList.forEach(f => {
            urlMap[f.fileID] = f.tempFileURL;
          });
        }
      }

      const formattedList = list.map(item => {
        const replaceImgs = (imgs) => (imgs || []).map(id => urlMap[id] || id);
        const newRoomList = (item.roomList || []).map(room => {
          // 只有当数据库里真的没 id 时，才临时生成一个作为兜底，防止报错
          const realId = room.id || `${item._id}_${Math.random().toString(36).substr(2, 5)}`;
          return {
            ...room,
            id: realId,
            roomImages: replaceImgs(room.roomImages)
          };
        });

        return {
          spuId: item._id,
          name: item.name,
          score: item.score || 4.8,
          tags: item.tags || [],
          hotelImages: replaceImgs(item.hotelImages),
          roomList: newRoomList
        };
      });

      resolve(formattedList);

    } catch (err) {
      console.error('获取数据失败', err);
      resolve([]);
    }
  });
}