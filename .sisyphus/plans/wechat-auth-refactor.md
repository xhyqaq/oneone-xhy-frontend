# 微信小程序用户认证流程重构

**计划名称**: wechat-auth-refactor  
**创建时间**: 2026-02-18  
**目标**: 删除失效的 `syncUserProfileFromWechat()` 函数，简化用户认证流程

---

## 背景

微信小程序在 2021 年后修改了隐私政策，`wx.getUserProfile()` API 不再返回真实的用户昵称和头像，只会返回"微信用户"和默认头像。当前代码中的 `syncUserProfileFromWechat()` 函数已经失效，需要删除。

**核心变更**：
- 用户进入小程序时仅进行静默登录（获取 openid）
- 新用户默认昵称为"微信用户"
- 用户可以在"我的"页面手动修改昵称
- 暂不支持头像上传功能（后续对接 OSS）
- 昵称无需额外校验（仅保留非空检查）

---

## 任务清单

### Wave 1: 删除失效代码（无依赖，可并行）

- [x] **Task 1.1**: 删除 `app.js` 中的 `syncUserProfileFromWechat()` 函数及其调用
  - **文件**: `app.js`
  - **操作**: 
    1. 修改 `onLaunch()`: 删除 `await this.syncUserProfileFromWechat().catch(() => {})`
    2. 修改 `onShow()`: 删除 `await this.syncUserProfileFromWechat().catch(() => {})`
    3. 删除整个 `syncUserProfileFromWechat()` 函数定义（第 64-122 行）
    4. 删除 `globalData` 中的 `profileSyncing: false`
  - **验证**: `grep -r "syncUserProfileFromWechat" miniprogram/` 应无结果
  - **Parallelizable**: Yes
  - **Depends on**: None
  - **Blocks**: Task 1.2

- [x] **Task 1.2**: 修改 `pages/profile/profile.js` 中的设置菜单
  - **文件**: `pages/profile/profile.js`
  - **操作**:
    1. 修改 `openProfileActions()` 函数（第 48-71 行）
    2. 将 `itemList` 从 `['同步微信头像昵称', '修改昵称']` 改为 `['修改昵称']`
    3. 删除 `if (res.tapIndex === 0)` 分支（第 59-63 行）
    4. 将 `if (res.tapIndex === 1)` 改为 `if (res.tapIndex === 0)`
  - **验证**: 
    - 手动测试：打开"我的"页面 → 点击设置按钮 → 应只显示"修改昵称"选项
    - 代码检查：`grep "同步微信头像昵称" pages/profile/profile.js` 应无结果
  - **Parallelizable**: No
  - **Depends on**: Task 1.1
  - **Blocks**: Task 2.1

### Wave 2: 测试和验证（依赖 Wave 1）

- [ ] **Task 2.1**: 完整流程测试
  - **操作**:
    1. 清除小程序缓存（开发者工具 → 清除缓存）
    2. 重新打开小程序，确认静默登录成功
    3. 检查控制台，确认没有 `syncUserProfileFromWechat` 相关错误
    4. 进入"我的"页面，确认显示默认昵称"微信用户"
    5. 点击设置按钮，确认只显示"修改昵称"选项
    6. 修改昵称为"测试用户"，确认保存成功
    7. 关闭小程序，重新打开，确认昵称已保存
    8. 测试边界情况：
       - 输入空昵称 → 应提示"昵称不能为空"
       - 输入正常昵称 → 应正常保存
  - **验证**: 所有测试用例通过
  - **Parallelizable**: No
  - **Depends on**: Task 1.2
  - **Blocks**: None

---

## 范围控制（MUST NOT）

**禁止以下操作**：
- ❌ 不要添加头像上传功能（后续对接 OSS）
- ❌ 不要添加昵称长度或格式校验（仅保留非空检查）
- ❌ 不要修改 `app.js` 中的其他认证逻辑（如 `ensureLogin()`）
- ❌ 不要重构整个"我的"页面的 UI
- ❌ 不要添加图片裁剪、缓存、历史记录等额外功能
- ❌ 不要实现复杂的错误处理系统（使用简单的 `wx.showToast`）
- ❌ 不要添加昵称唯一性校验（允许重复昵称）
- ❌ 不要修改后端代码（后端已有的接口足够使用）
- ❌ 不要添加单元测试或 E2E 测试框架
- ❌ 不要添加用户引导流程（如首次登录弹窗）
- ❌ 不要修改数据库结构或迁移历史数据

---

## 验收标准

### 代码层面
- [ ] `grep -r "syncUserProfileFromWechat" .` 无结果（排除 .sisyphus 目录）
- [ ] `grep "同步微信头像昵称" pages/profile/profile.js` 无结果
- [ ] 小程序开发者工具编译无错误
- [ ] 控制台无 JavaScript 错误

### 功能层面
- [ ] 新用户首次进入小程序，昵称显示为"微信用户"
- [ ] 用户可以在"我的"页面修改昵称
- [ ] 修改后的昵称持久化保存
- [ ] 设置菜单中不再显示"同步微信头像昵称"选项

### 用户体验
- [ ] 用户进入小程序无需任何授权操作
- [ ] 修改昵称流程流畅，无卡顿
- [ ] 错误提示清晰易懂

---

## 技术细节

### 文件修改清单
1. `/Users/xhy/WeChatProjects/oneone-xhy/app.js`
   - 删除第 4 行：`await this.syncUserProfileFromWechat().catch(() => {})`
   - 修改第 7 行：`onShow()` 中删除同步调用
   - 删除第 64-122 行：整个 `syncUserProfileFromWechat()` 函数
   - 删除 `globalData` 中的 `profileSyncing: false`

2. `/Users/xhy/WeChatProjects/oneone-xhy/pages/profile/profile.js`
   - 修改第 49 行：`itemList` 改为 `['修改昵称']`
   - 删除第 59-63 行：`if (res.tapIndex === 0)` 分支
   - 修改第 65 行：`if (res.tapIndex === 1)` 改为 `if (res.tapIndex === 0)`

### API 调用
- 前端调用：`PUT /api/auth/nickname`
- 请求体：`{ "nickname": "新昵称" }`
- 响应：`{ "code": 0, "message": "success", "data": null }`

### 错误处理
- 网络错误：显示"网络异常，请稍后重试"
- 昵称为空：显示"昵称不能为空"
- 后端错误：显示后端返回的 `message` 字段

---

## 注意事项

1. **不影响老用户**：已有昵称和头像的用户数据保持不变
2. **静默登录保持不变**：`ensureLogin()` 函数不做任何修改
3. **后端无需改动**：现有的 `PUT /api/auth/nickname` 接口已满足需求
4. **测试环境**：在微信开发者工具中测试，确保真机环境也正常

---

## 执行顺序

```
Task 1.1 (删除 app.js 中的失效代码)
    ↓
Task 1.2 (修改 profile.js 中的设置菜单)
    ↓
Task 2.1 (完整流程测试)
```

所有任务必须按顺序执行，不可跳过。
