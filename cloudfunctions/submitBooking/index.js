const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_TYPE_CACHED
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { roomId, checkInDate, checkOutDate, roomPrice, hotelName, roomName } = event;
  
  if (!roomId || !checkInDate || !checkOutDate) {
    return { code: -1, message: '参数缺失' };
  }

  try {
    const { OPENID } = cloud.getWXContext();

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const bookingDates = [];
    const currentDate = new Date(inDate);
    
    while (currentDate < outDate) {
      const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
      const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
      bookingDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (const inventoryDate of bookingDates) {
      const inventoryQuery = await db.collection('room_inventory')
        .where({
          roomId: roomId,
          inventoryDate: inventoryDate
        })
        .get();

      if (inventoryQuery.data.length > 0) {
        const stockRecord = inventoryQuery.data[0];
        
        if (stockRecord.currentStock <= 0) {
          return { code: -1, message: `${inventoryDate} 当天已满房` };
        }
        
        await db.collection('room_inventory').doc(stockRecord._id).update({
          data: { 
            currentStock: _.inc(-1),
            updateTime: db.serverDate()
          }
        });
        
      } else {
        let finalTotalStock = 10;
        let finalHotelName = hotelName || '未知酒店';
        let finalRoomName = roomName || '未知房型';
        let finalHotelId = roomId.includes('-') ? roomId.split('-')[0] : roomId;

        const refQuery = await db.collection('room_inventory')
          .where({ roomId: roomId })
          .limit(1)
          .get();

        if (refQuery.data.length > 0) {
           const refRecord = refQuery.data[0];
           if (refRecord.totalStock) finalTotalStock = refRecord.totalStock;
           if (refRecord.hotelId) finalHotelId = refRecord.hotelId;
           if (refRecord.hotelName) finalHotelName = refRecord.hotelName;
           if (refRecord.roomName) finalRoomName = refRecord.roomName;
        }
        
        await db.collection('room_inventory').add({
          data: {
            roomId: roomId,
            inventoryDate: inventoryDate,
            currentStock: finalTotalStock - 1,
            totalStock: finalTotalStock,
            hotelId: finalHotelId,
            hotelName: finalHotelName,
            roomName: finalRoomName,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }
    }

    const bookingResult = await db.collection('inn_booking').add({
      data: {
        _openid: OPENID,
        userId: OPENID,
        roomId,
        hotelName: hotelName || '民宿',
        roomName: roomName || '标准间',
        checkInDate,
        checkOutDate,
        stayDays: bookingDates.length,
        roomPrice: Number(roomPrice || 0),
        createTime: db.serverDate(),
        status: 1
      }
    });

    return {
      code: 0,
      message: '预订成功',
      data: { orderId: bookingResult._id }
    };

  } catch (err) {
    console.error('Service Error:', err);
    return {
      code: -1,
      message: '系统错误: ' + err.message
    };
  }
};