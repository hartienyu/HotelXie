# HotelXie 酒店预订小程序

基于微信小程序原生框架开发，后端采用微信云开发（CloudBase）方案，UI 使用 TDesign 组件库构建。这是一个轻量级的酒店预订 Demo，专注于核心的浏览与下单流程。

## 主要功能

* **酒店浏览 (Discover)**：基于瀑布流/列表形式展示酒店信息，支持基础的检索查看。
* **预订下单 (Booking)**：内置酒店预订逻辑，支持通过云函数安全提交订单数据。
* **用户登录 (Login)**：集成微信一键登录，通过云函数实现用户身份鉴权。

## 技术栈

* **客户端**：微信小程序原生 (WXML / WXSS / JavaScript)
* **UI 组件库**：[TDesign Miniprogram](https://tdesign.gtimg.com/miniprogram/)
* **服务端**：微信云开发 (Cloud Functions + Cloud Database)

## 目录结构

```text
├── cloudfunctions/        # 云函数目录
│   ├── login/             # 用户登录鉴权
│   └── submitBooking/     # 提交预订订单
├── pages/                 # 页面文件
│   ├── discover/          # 酒店列表与发现页
│   └── login/             # 登录授权页
├── services/              # 业务逻辑封装
│   ├── booking/           # 预订相关接口 (searchHotels, submitBooking)
│   └── hotel/             # 酒店列表数据接口
├── style/                 # 全局样式与主题配置
├── miniprogram_npm/       # 构建后的 npm 依赖
├── app.js                 # 小程序入口与云环境初始化
└── project.config.json    # 工程配置文件