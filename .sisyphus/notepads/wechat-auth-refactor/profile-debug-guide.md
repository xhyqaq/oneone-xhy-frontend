# Profile 页面问题排查指南

## 问题描述
- **PC 开发者工具**：可以正常显示用户信息和统计数据
- **真机预览**：显示"个人数据加载失败"

## 根本原因
`fetchProfileStats()` 函数调用 `api.getHistoryRooms(1, 100)` 失败，原因和历史记录页面一样：
1. 真机无法访问后端 API（网络/域名配置问题）
2. 登录失败导致没有有效的 token

## 已做的改进

### 1. 添加了详细日志
```javascript
console.log('[Profile] 开始获取个人统计数据')
console.log('[Profile] API返回数据:', data)
console.log('[Profile] 房间数量:', rooms.length)
console.error('[Profile] 获取统计数据失败:', err)
```

### 2. 改为静默失败
- 统计数据加载失败时，不再显示错误 Toast
- 用户仍然可以看到基本信息（昵称、头像、ID）
- 用户仍然可以使用菜单功能（历史记录、使用手册、修改昵称）
- 统计数据显示默认值（0局、50%胜率、+0.00盈亏）

### 3. 为什么这样设计？
**产品决策**：统计数据不是核心功能，即使加载失败也不应该阻止用户使用其他功能。

**用户体验**：
- ✅ 好的体验：用户可以看到基本信息，可以修改昵称，可以查看历史记录
- ❌ 差的体验：显示错误提示，用户不知道该怎么办

## 测试步骤

### 第一步：重新编译
在微信开发者工具中点击"编译"

### 第二步：真机预览
1. 点击"预览"生成二维码
2. 用手机微信扫码
3. 进入"我的"页面

### 第三步：查看日志（开发者工具）
在开发者工具的控制台中查看日志：
```
[Profile] 开始获取个人统计数据
[Request] 发起请求: {url: "/history/rooms?page=1&limit=100", ...}
[Request] 请求失败: {errMsg: "request:fail -101:net::ERR_CONNECTION_RESET"}
[Profile] 获取统计数据失败: Error: ...
[Profile] 使用默认统计数据
```

### 第四步：查看真机日志（可选）
1. 微信 → 发现 → 小程序
2. 找到你的小程序
3. 右上角三个点 → 打开调试
4. 查看 vConsole 日志

## 预期行为

### PC 开发者工具
- ✅ 显示用户昵称和头像
- ✅ 显示统计数据（如果有历史房间）
- ✅ 可以点击历史记录、使用手册
- ✅ 可以修改昵称

### 真机预览（当前状态）
- ✅ 显示用户昵称和头像（如果登录成功）
- ⚠️ 统计数据显示默认值（0局、50%、+0.00）
- ✅ 可以点击历史记录、使用手册
- ✅ 可以修改昵称
- ❌ 不显示错误提示（静默失败）

## 完整解决方案

要让真机也能正常显示统计数据，需要解决网络问题：

### 方案 1: 配置微信服务器域名（必须）
1. 登录 https://mp.weixin.qq.com/
2. 开发 → 开发管理 → 开发设置 → 服务器域名
3. 添加 `https://6255b761.r2.cpolar.top`
4. 保存并提交

### 方案 2: 使用固定域名（推荐）
1. 购买域名（如 `yourdomain.com`）
2. 配置 CNAME 解析到 cpolar 地址
3. 在微信公众平台配置自己的域名
4. 修改 `app.js` 中的 `baseUrl`

### 方案 3: 部署到公网服务器（生产环境）
1. 购买云服务器
2. 配置 HTTPS 证书
3. 部署后端应用
4. 在微信公众平台配置域名

## 临时测试方案

如果只是想测试功能，可以在数据库中手动添加一些测试数据：

```sql
-- 1. 创建一个测试房间
INSERT INTO rooms (id, room_code, status, ended_at, created_at)
VALUES ('room_test001', 'ABC123', 2, NOW(), NOW() - INTERVAL '1 hour');

-- 2. 添加用户到房间
INSERT INTO room_members (room_id, user_id, nickname, balance)
VALUES ('room_test001', 'user_17714049725759106', '123', 100.50);

-- 3. 添加一些交易记录
INSERT INTO transactions (id, room_id, payer_id, payer_name, payee_id, payee_name, amount, created_at)
VALUES 
  ('trans_001', 'room_test001', 'user_17714049725759106', '123', 'user_other', '其他用户', 50.00, NOW()),
  ('trans_002', 'room_test001', 'user_other', '其他用户', 'user_17714049725759106', '123', 150.50, NOW());
```

然后在 PC 开发者工具中测试，应该能看到统计数据。

## 调试命令

在小程序控制台执行：

```javascript
// 测试获取统计数据
const api = require('../../utils/api')
api.getHistoryRooms(1, 100)
  .then(data => {
    console.log('成功:', data)
  })
  .catch(err => {
    console.error('失败:', err)
  })
```

## 总结

**当前状态**：
- ✅ 添加了详细日志
- ✅ 改为静默失败，不影响用户使用
- ⚠️ 真机预览时统计数据显示默认值

**下一步**：
1. 配置微信服务器域名（解决网络问题）
2. 或者接受当前状态（统计数据显示默认值，不影响核心功能）

**建议**：
- 短期：接受当前状态，专注于核心功能开发
- 长期：配置域名或部署到公网服务器
