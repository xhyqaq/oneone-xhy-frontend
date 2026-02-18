# Draft: 扫码加入房间功能

## 需求确认

**用户期望**：通过微信扫码直接进入房间（最简单的用户体验）

**技术方案**：使用微信小程序码（官方推荐方案）

## 技术决策

### 选择：微信小程序码（而非普通二维码）

**理由**：
- 扫码后直接打开小程序并跳转到房间页面
- 无需用户手动输入房间号
- 符合用户期望的"最简单"体验

**实现路径**：
1. 后端调用微信服务端 API 生成小程序码
2. 小程序码携带参数：`scene=roomCode` 或直接跳转到 `pages/room/room?roomId=xxx&roomCode=xxx`
3. 用户扫码后自动进入房间页面

## 当前代码现状

### 已有功能
1. ✅ 房间页面有二维码弹窗 UI（`pages/room/room.wxml` 第65-75行）
2. ✅ 加入房间 API：`api.joinRoom(roomCode)`（`utils/api.js` 第10-16行）
3. ✅ 首页提示"扫码或输入房号"（`pages/index/index.wxml` 第20行）

### 缺失功能
1. ❌ 二维码弹窗中只有占位元素 `qr-fake`，没有真实二维码图片
2. ❌ 没有后端接口生成小程序码
3. ❌ 没有扫码入口（调用 `wx.scanCode()`）

## 待明确问题

### 1. 后端支持
**问题**：后端是否可以添加生成小程序码的接口？

**需要的接口**：
```
GET /api/qrcode/room/{roomCode}
或
GET /api/rooms/{roomId}/qrcode

返回：小程序码图片 URL 或 base64
```

**后端需要做的**：
- 调用微信服务端 API：`https://api.weixin.qq.com/wxa/getwxacodeunlimit`
- 传入参数：`scene=roomCode` 或 `page=pages/room/room&scene=roomId_roomCode`
- 返回生成的小程序码图片

### 2. 扫码入口设计
**问题**：在首页哪里添加扫码按钮？

**选项**：
- A. 在"扫码或输入房号"文字旁边添加扫码图标
- B. 在输入框右侧添加扫码图标按钮
- C. 添加独立的"扫码加入"大按钮（与"创建房间"并列）

### 3. 小程序码参数设计
**问题**：小程序码应该携带什么参数？

**选项**：
- A. 只携带 `roomCode`（4位房间号），扫码后调用 `joinRoom` API
- B. 携带 `roomId` 和 `roomCode`，扫码后直接进入房间页面
- C. 使用 URL Scheme，携带完整路径

**推荐**：选项 B - 携带 `roomId` 和 `roomCode`
- 理由：减少一次 API 调用，体验更快
- 实现：`scene=roomId_roomCode`（如 `scene=abc123_1234`）

## 下一步

等待用户回答：
1. 后端是否可以添加生成小程序码的接口？
2. 扫码入口希望放在哪里？
3. 是否同意推荐的参数设计方案？
