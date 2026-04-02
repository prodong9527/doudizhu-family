# 斗地主AI对战小程序 - 部署指南

## 项目结构

```
斗地主/
├── index.html          # 主HTML文件
├── SPEC.md             # 规格文档
├── README.md           # 部署说明（本文件）
├── css/
│   └── style.css        # 样式文件（浅色艺术风格）
├── js/
│   ├── config.js       # 配置文件（需填写API密钥）
│   ├── audio.js        # 音效系统
│   ├── auth.js         # Firebase用户认证
│   ├── game.js         # 斗地主核心逻辑
│   ├── ai.js           # AI对战逻辑
│   ├── rank.js         # 段位系统
│   ├── store.js        # 商店系统
│   └── app.js          # 主应用逻辑
└── assets/
    ├── cards/
    │   ├── PNG/        # 扑克牌PNG图片
    │   └── GIF/        # 扑克牌GIF动画
    └── audio/          # 音效文件（可扩展）
```

## 部署步骤

### 第一步：配置API密钥

编辑 `js/config.js` 文件，填写你的Firebase和MiniMax API密钥：

```javascript
const CONFIG = {
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",       // 替换为你的Firebase API Key
        authDomain: "YOUR_PROJECT.firebaseapp.com", // 替换为你的项目域
        projectId: "YOUR_PROJECT_ID",           // 替换为你的项目ID
        storageBucket: "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",    // 替换为你的Sender ID
        appId: "YOUR_APP_ID"                    // 替换为你的App ID
    },
    minimax: {
        apiKey: "YOUR_MINIMAX_API_KEY",          // MiniMax API密钥
        groupId: "YOUR_GROUP_ID"                 // MiniMax Group ID
    },
    // ... 其他配置保持不变
};
```

### 第二步：创建Firebase项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称，点击继续
4. 关闭Google Analytics（可选），点击创建
5. 项目创建完成后，点击"注册应用"添加Web应用
6. 复制Firebase配置信息到 `config.js`
7. 在Firebase Console中启用Authentication（登录方式：邮箱/密码）
8. 创建Firestore Database，选择测试模式（之后可以设置安全规则）

### 第三步：上传到GitHub

1. 在GitHub上创建新仓库（例如：`doudizhu-game`）
2. 将项目所有文件上传到仓库

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/doudizhu-game.git
git push -u origin main
```

### 第四步：启用GitHub Pages

1. 在GitHub仓库页面，点击Settings
2. 左侧菜单找到Pages
3. Source选择 `main` branch 和 `/ (root)` 文件夹
4. 点击Save
5. 等待1-2分钟，你的游戏就可以访问了：`https://你的用户名.github.io/doudizhu-game/`

## MiniMax AI说明

当前版本中，AI对战逻辑是在前端实现的（ai.js）。如果需要让MiniMax参与AI决策，可以在以下位置集成：

1. 在 `ai.js` 的 `getPlay()` 方法中调用MiniMax API
2. 在 `app.js` 中添加AI对话/解说功能

示例集成方式：

```javascript
async function callMiniMaxAI(prompt) {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.minimax.apiKey}`
        },
        body: JSON.stringify({
            model: 'abab5.5-chat',
            tokens_to_generate: 256,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    return response.json();
}
```

## 功能说明

### 段位系统
- 青铜 → 白银 → 黄金 → 铂金 → 钻石
- 每个段位3个档位，每档3星
- 胜利获得1-3星，失败扣除1星

### 积分系统
- 每局胜利：+50积分
- 完胜额外：+30积分
- 每局失败：+10积分

### 皮肤商店
- 消耗积分购买牌背皮肤
- 皮肤图片路径在 `store.js` 中配置

## 注意事项

1. **API密钥安全**：由于是纯前端项目，API密钥会暴露在前端代码中。对于家庭娱乐使用风险可控，但不要分享API密钥。
2. **Firebase免费套餐**：足够家庭成员使用。
3. **浏览器兼容性**：推荐使用Chrome、Firefox、Safari最新版。
