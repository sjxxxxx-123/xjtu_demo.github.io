# 鲜椒本科模拟器 (XJTU Undergraduate Simulator)

![Static Site](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-blue) ![Responsive](https://img.shields.io/badge/layout-responsive-success) ![AI Events](https://img.shields.io/badge/feature-AI%20events-purple) ![Language](https://img.shields.io/badge/lang-中文%20%2B%20English-orange)

## 简介 / Overview
- 纯前端的校园生活模拟小游戏，体验“鲜椒”本科四年的学习与生活。
- 包含成就系统、随机事件、AI 生成事件、移动端适配等功能。
- 无需后端服务，直接打开 `index.html` 即可游玩。

## 目录结构 / Project Structure
- 根页面：`index.html`（开始页）、`character.html`（创建角色）、`game.html`（主游戏）、`thesis.html`（毕设模式）、`ending.html`（结局）、`achievements.html`（成就）。
- 样式：`css/style.css`、`css/mobile_v2.css`。
- 脚本：`js/game.js`（主逻辑）、`js/data.js`（数据配置）、`js/events.js`（本地随机事件）、`js/ai_module.js`（AI 事件）、`js/achievements.js`（成就系统）、`js/config.js`（运行时配置，示例见 `js/config.example.js`）。

## 快速开始 / Quick Start
1) 打开 `index.html` 直接开始游戏（推荐现代浏览器）。
2) 若要启用 AI 事件，在浏览器本地存储或 `js/config.js` 中设置 `GAME_CONFIG` 的 `API_KEY` 和 `API_ENDPOINT`。
3) 移动端直接访问同一目录下的页面即可，已做基础响应式适配。

## 配置 / Configuration
- **AI Key**：
  - 本地开发：在 `js/config.js` 填写 `API_KEY`（或使用示例 `js/config.example.js` 复制为 `config.js`）。
  - 运行时：也可在游戏内通过界面输入后存入 `localStorage`（键名 `xjtu_ai_key`）。
- **AI 模型**：默认使用 ModelScope 端点；可通过 `GAME_CONFIG.AI_MODEL` 调整。
- **存档**：浏览器 `localStorage` 持久化，键名 `xjtu_game_state`。

## 特性 / Features
- 剧情与数值：GPA、SAN、体力、声望、金钱等多维属性，随行动和事件动态变化。
- 成就系统：111 项成就，含书院专属、校园彩蛋、考试挑战等分类。
- 随机事件：本地事件库 + 可选 AI 生成事件。
- 移动端支持：专用样式，移动操作与桌面一致。
- 结局分支：普通毕业、优秀毕业、保研、肄业等多种结局。

## 开发提示 / Dev Notes
- 项目无构建链路，修改后直接刷新浏览器即可生效。
- 若修改 AI 端点或模型，记得同步处理跨域与密钥安全问题（生产环境请勿暴露私钥）。
- UI 主色为交大蓝，定义在 `css/style.css` 的 CSS 变量中，可统一调整。

## 致谢 / Credits
- 作者标注：`sjxxxx`（见各文件头部注释）。
- 依赖：无外部构建依赖；字体使用 Google Fonts Noto Sans SC。
