# 鲜椒本科模拟器

![Static Site](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-blue) ![Responsive](https://img.shields.io/badge/layout-responsive-success) ![AI Events](https://img.shields.io/badge/feature-AI%20events-purple) ![Language](https://img.shields.io/badge/lang-中文%20%2B%20English-orange)

一款纯前端的校园生活模拟小游戏，带你体验“鲜椒”本科四年的学习与生活轨迹。
从入学到毕业，你需要在学业、身心、社交与资源之间做权衡，追求更高的 GPA、声望与成就。

## 亮点一览
- **多维成长**：GPA、SAN、体力、声望、金钱等属性联动，行动与事件会持续影响成长曲线。
- **丰富事件**：本地随机事件库 + 可选 AI 生成事件，让每次周目都不一样。
- **成就体系**：111 项成就，覆盖书院专属、校园彩蛋、考试挑战等分组。
- **结局分支**：普通毕业、优秀毕业、保研、肄业等多种结局路径。
- **移动端适配**：专用样式，手机端与桌面端体验一致。

## 页面导航
- `index.html`：开始页
- `character.html`：角色创建
- `game.html`：主游戏
- `thesis.html`：毕设模式
- `ending.html`：结局页
- `achievements.html`：成就页

## 快速开始
1) 直接打开 `index.html` 即可开始游戏（推荐现代浏览器）。
2) 想启用 AI 事件：在 `js/config.js` 中设置 `GAME_CONFIG.API_KEY` 与 `GAME_CONFIG.API_ENDPOINT`。
3) 移动端访问同目录页面即可，已内置响应式样式。

## 配置说明
- `js/config.js`：运行时配置（可由 `js/config.example.js` 复制生成）。
- `GAME_CONFIG.API_KEY`：AI 事件密钥，也可在游戏内录入并保存到 `localStorage`（键名 `xianjao_ai_key`）。
- `GAME_CONFIG.AI_MODEL`：可选模型配置，默认对接 ModelScope 端点。
- 存档位置：浏览器 `localStorage`，键名 `xianjao_game_state`。

## 目录结构
- 样式：`css/style.css`、`css/mobile_v2.css`
- 脚本：
  - `js/game.js`：主流程与逻辑
  - `js/data.js`：数据配置
  - `js/events.js`：本地随机事件
  - `js/ai_module.js`：AI 事件模块
  - `js/achievements.js`：成就系统
  - `js/config.js`：运行时配置

## 开发提示
- 项目无构建链路，修改后直接刷新浏览器即可生效。
- 调整 AI 端点或模型时，请注意跨域配置与密钥安全，生产环境勿暴露私钥。
- 主题色统一定义在 `css/style.css` 的 CSS 变量中，修改一处即可全局生效。

## 致谢
- 作者标注：`sjxxxx`（见各文件头部注释）。
- 无外部构建依赖；字体使用 Google Fonts Noto Sans SC。
