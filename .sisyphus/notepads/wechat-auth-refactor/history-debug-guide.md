# 历史房间记录调试指南

## 问题描述
无法获取历史房间列表

## 已添加的调试日志

### 1. history.js 日志
- `[历史记录] 开始获取历史房间列表`
- `[历史记录] 当前用户:` - 显示当前登录用户信息
- `[历史记录] 当前token:` - 显示是否有 token
- `[历史记录] API返回数据:` - 显示后端返回的原始数据
- `[历史记录] 房间数量:` - 显示获取到的房间数量
- `[历史记录] 获取失败:` - 显示错误信息

### 2. request.js 日志
- `[Request] 发起请求:` - 显示请求的 URL 和方法
- `[Request] Token状态:` - 显示 token 获取状态
- `[Request] 完整URL:` - 显示完整的请求 URL
- `[Request] 响应成功:` - 显示响应状态码和数据
- `[Request] HTTP错误:` - 显示 HTTP 错误
- `[Request] 响应格式错误:` - 显示响应格式问题
- `[Request] 业务错误:` - 显示业务逻辑错误
- `[Request] 请求失败:` - 显示网络请求失败

## 调试步骤

### 第一步：在开发者工具中测试

1. 打开微信开发者工具
2. 编译项目
3. 打开控制台（Console 标签）
4. 进入"历史记录"页面
5. 查看控制台输出的日志

**预期看到的日志顺序**：
```
[历史记录] 开始获取历史房间列表
[历史记录] 当前用户: {userId: "xxx", nickname: "xxx", ...}
[历史记录] 当前token: 已有token
[Request] 发起请求: {url: "/history/rooms?page=1&limit=30", method: "GET", auth: true}
[Request] Token状态: 已获取
[Request] 完整URL: https://6255b761.r2.cpolar.top/api/history/rooms?page=1&limit=30
[Request] 响应成功: {statusCode: 200, data: {...}}
[历史记录] API返回数据: {total: 0, page: 1, limit: 30, rooms: []}
[历史记录] 房间数量: 0
[历史记录] 数据设置成功
```

### 第二步：分析可能的错误

#### 错误 1: 登录失败
**日志特征**：
```
[历史记录] 当前用户: null
[历史记录] 当前token: 无token
```

**原因**：用户未登录或登录失败

**解决方法**：
1. 检查 `app.js` 的 `ensureLogin()` 是否成功
2. 查看是否有登录相关的错误日志
3. 确认后端 `/api/auth/login` 接口是否正常

---

#### 错误 2: 网络请求失败
**日志特征**：
```
[Request] 请求失败: {errMsg: "request:fail -101:net::ERR_CONNECTION_RESET"}
```

**原因**：无法连接到后端服务器

**解决方法**：
1. 检查 cpolar 是否在运行
2. 在微信公众平台配置服务器域名
3. 确认 `baseUrl` 是否正确

---

#### 错误 3: 后端返回错误
**日志特征**：
```
[Request] 业务错误: 2004 用户不在房间内
```

**原因**：后端业务逻辑错误

**解决方法**：
1. 检查后端日志
2. 确认数据库中是否有数据
3. 检查用户权限

---

#### 错误 4: 没有历史记录
**日志特征**：
```
[历史记录] 房间数量: 0
暂无历史记录
```

**原因**：数据库中确实没有已结束的房间

**解决方法**：
1. 创建一个房间
2. 添加一些交易记录
3. 结束房间（status = 2）
4. 重新进入历史记录页面

---

### 第三步：检查数据库

如果日志显示请求成功但没有数据，检查数据库：

```sql
-- 检查用户是否存在
SELECT * FROM users WHERE id = 'user_xxx';

-- 检查用户参与的房间
SELECT * FROM room_members WHERE user_id = 'user_xxx';

-- 检查已结束的房间
SELECT * FROM rooms WHERE status = 2;

-- 检查用户的历史房间
SELECT r.* 
FROM rooms r
JOIN room_members rm ON r.id = rm.room_id
WHERE rm.user_id = 'user_xxx' AND r.status = 2
ORDER BY r.ended_at DESC;
```

---

### 第四步：后端日志

如果前端日志显示请求发送成功，但没有收到响应，检查后端日志：

```bash
# 查看后端日志
tail -f /path/to/backend/logs/app.log

# 或者如果使用 systemd
journalctl -u oneone-backend -f
```

---

## 常见问题排查

### Q1: 显示"暂无历史记录"但数据库中有数据

**可能原因**：
1. 房间的 `status` 不是 2（已结束）
2. 用户不在 `room_members` 表中
3. 后端查询逻辑有问题

**排查方法**：
```sql
-- 检查房间状态
SELECT id, room_code, status, ended_at FROM rooms;

-- 检查用户是否在房间中
SELECT * FROM room_members WHERE user_id = 'user_xxx';
```

---

### Q2: 请求一直失败

**可能原因**：
1. 登录失败，没有 token
2. 网络问题
3. 服务器域名未配置

**排查方法**：
1. 查看 `[Request] Token状态` 日志
2. 查看 `[Request] 请求失败` 日志
3. 在浏览器中访问 `https://6255b761.r2.cpolar.top/api/health`

---

### Q3: 后端返回 401 Unauthorized

**可能原因**：
1. token 无效或过期
2. token 格式错误
3. 后端 JWT 验证失败

**排查方法**：
1. 查看 `[Request] Token状态` 日志
2. 清除缓存重新登录
3. 检查后端 JWT 密钥配置

---

## 下一步行动

1. **立即执行**：重新编译小程序，进入历史记录页面
2. **查看日志**：在控制台中查看所有日志输出
3. **截图发送**：将控制台日志截图发给我
4. **我会分析**：根据日志定位具体问题

---

## 临时测试代码

如果想快速测试 API 是否正常，可以在控制台执行：

```javascript
// 测试历史记录 API
const app = getApp()
const api = require('../../utils/api')

api.getHistoryRooms(1, 10)
  .then(data => {
    console.log('成功:', data)
  })
  .catch(err => {
    console.error('失败:', err)
  })
```
