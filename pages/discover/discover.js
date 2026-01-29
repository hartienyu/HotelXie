import { fetchHotelsList } from '../../services/hotel/fetchHotels';
import { submitBooking } from '../../services/booking/submitBooking';

Page({
  data: {
    goodsList: [],
    goodsListLoadStatus: 0,
    showBookingPopup: false,
    checkInVisible: false,
    checkOutVisible: false,
    selectedRoomId: null,
    selectedRoomName: '',
    selectedHotelName: '',
    selectedRoomPrice: 0,
    selectedCheckInDate: '',
    selectedCheckOutDate: '',
    minDateStr: '',
    maxDateStr: '',
  },

  onLoad() {
    this.goodListPagination = { index: 0, num: 10 };
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();
    const max = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.setData({ minDateStr: format(today), maxDateStr: format(max) });
    this.init();
  },

  onShow() {
    const tabBar = this.getTabBar();
    if (tabBar && typeof tabBar.init === 'function') {
      tabBar.init();
    }
  },

  onPullDownRefresh() {
    this.init();
  },

  onReachBottom() {
    if (this.data.goodsListLoadStatus === 0) {
      this.loadGoodsList();
    }
  },

  init() {
    this.goodListPagination.index = 0;
    this.setData({ goodsList: [] });
    this.loadGoodsList(true);
  },

  async loadGoodsList(fresh = false) {
    if (fresh) wx.stopPullDownRefresh();
    this.setData({ goodsListLoadStatus: 1 });
    const pageSize = this.goodListPagination.num;
    let pageIndex = this.goodListPagination.index + 1;
    if (fresh) pageIndex = 1;

    try {
      const nextList = await fetchHotelsList(pageIndex, pageSize);
      this.setData({
        goodsList: fresh ? nextList : this.data.goodsList.concat(nextList),
        goodsListLoadStatus: nextList.length < pageSize ? 2 : 0,
      });
      this.goodListPagination.index = pageIndex;
    } catch (err) {
      console.error(err);
      this.setData({ goodsListLoadStatus: 3 });
    }
  },

  onReTry() {
    this.loadGoodsList();
  },

  goodListClickHandle(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.goodsList[index];
    if (item) {
      wx.navigateTo({ url: `/pages/goods/details/index?spuId=${item.spuId}` });
    }
  },

  openBookingPopup(e) {
    const { roomId, roomName, roomPrice, hotelName } = e.currentTarget.dataset;
    const today = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const defaultCheckIn = format(today);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const defaultCheckOut = format(tomorrow);

    this.setData({
      showBookingPopup: true,
      selectedRoomId: roomId,
      selectedRoomName: roomName,
      selectedHotelName: hotelName || '未知酒店',
      selectedRoomPrice: roomPrice,
      selectedCheckInDate: defaultCheckIn,
      selectedCheckOutDate: defaultCheckOut,
    });
  },

  closeBookingPopup() {
    this.setData({
      showBookingPopup: false,
      selectedRoomId: null,
      selectedRoomName: '',
      selectedHotelName: '',
      selectedRoomPrice: 0,
      selectedCheckInDate: '',
      selectedCheckOutDate: '',
    });
  },

  toggleCheckInVisible() {
    this.setData({ checkInVisible: !this.data.checkInVisible });
  },

  toggleCheckOutVisible() {
    this.setData({ checkOutVisible: !this.data.checkOutVisible });
  },

  onCheckInDateConfirm(e) {
    const { value } = e.detail;
    this.setData({ 
      selectedCheckInDate: value,
      checkInVisible: false 
    });
  },

  onCheckOutDateConfirm(e) {
    const { value } = e.detail;
    this.setData({ 
      selectedCheckOutDate: value,
      checkOutVisible: false 
    });
  },

  async submitBooking() {
    const { selectedCheckInDate, selectedCheckOutDate, selectedRoomId, selectedRoomPrice, selectedHotelName, selectedRoomName } = this.data;
    
    if (!selectedCheckInDate) {
      wx.showToast({ title: '请选择入住日期', icon: 'none' });
      return;
    }
    const checkIn = new Date(selectedCheckInDate).getTime();
    const checkOut = new Date(selectedCheckOutDate).getTime();
    const today = new Date(); today.setHours(0,0,0,0);
    const max = new Date(this.data.maxDateStr + 'T00:00:00').getTime();

    if (checkIn < today.getTime()) {
      wx.showToast({ title: '入住日期不能早于今天', icon: 'none' });
      return;
    }
    if (!selectedCheckOutDate) {
      wx.showToast({ title: '请选择离店日期', icon: 'none' });
      return;
    }
    if (checkOut <= checkIn) {
      wx.showToast({ title: '离店日期必须晚于入住日期', icon: 'none' });
      return;
    }
    if (checkOut > max) {
      wx.showToast({ title: '请选择一个月内的日期', icon: 'none' });
      return;
    }

    try {
      const res = await this.submitBookingAPI(
        selectedRoomId, 
        selectedCheckInDate, 
        selectedCheckOutDate, 
        selectedRoomPrice, 
        selectedHotelName, 
        selectedRoomName
      );

      if (res) {
        wx.showModal({
          title: '预订成功',
          content: `酒店：${selectedHotelName}\n房型：${selectedRoomName}\n入住：${selectedCheckInDate}\n离店：${selectedCheckOutDate}`,
          showCancel: false,
          confirmText: '查看订单',
          success: () => {
            this.closeBookingPopup();
            this.init();
            setTimeout(() => {
              wx.switchTab({ url: '/pages/cart/index' });
            }, 500);
          }
        });
      }
    } catch (err) {
      wx.showModal({
        title: '预订失败',
        content: err.message || '请稍后重试',
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  async submitBookingAPI(roomId, checkInDate, checkOutDate, roomPrice, hotelName, roomName) {
    try {
      const res = await submitBooking(roomId, checkInDate, checkOutDate, roomPrice, hotelName, roomName);
      if (res && res.code === 0) {
        return true;
      } else {
        const errMsg = (res && res.message) ? res.message : '预订失败，请重试';
        throw new Error(errMsg);
      }
    } catch (err) {
      throw err;
    }
  },
});