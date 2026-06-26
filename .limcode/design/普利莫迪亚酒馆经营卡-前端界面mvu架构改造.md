
# 普利莫迪亚酒馆经营卡 - 前端界面 MVU 架构改造设计

## 问题诊断

当前 `src/tavern_status/` 存在以下架构问题：

1. **混合数据源**：`script.ts` 同时使用 MVU 缓存数据（`Mvu.getMvuData`）和独立的引擎存档（`loadSave/writeSave`），数据流混乱
2. **jQuery DOM 操作**：`script.ts` 用原生 DOM API 直接操作 HTML 元素，而非响应式 Vue 框架
3. **巨大内联 HTML**：`index.html` 含 3115 行内联 HTML+CSS，不符合前端界面模板的简洁 `<div id="app">` 规范
4. **schema.ts 使用 z.default 而非 z.prefault**：与 MVU zod 4 规范不兼容
5. **缺少必需的脚本**：缺少 `脚本/变量结构/index.ts` 来注册 schema 到 MVU
6. **缺少 pinia store**：未使用 `defineMvuDataStore` 实现 MVU 变量双向同步

## 目标架构

### 目录结构（遵循 MVU 角色卡模板）

```
src/tavern_status/
├── index.yaml              # 角色卡配置（已有，需微调）
├── schema.ts               # Zod 变量结构（需修复 z.prefault）
├── schema.json             # 生成的 JSON Schema
│
├── 第一条消息/
│   └── 0.txt               # 已有
│
├── 脚本/
│   └── 变量结构/
│       └── index.ts        # 注册 Schema 到 MVU（需新建）
│
├── 界面/
│   └── 状态栏/
│       ├── index.html      # 最小化 HTML（<div id="app">）
│       ├── index.ts        # Vue 挂载入口
│       ├── store.ts        # Pinia Store（defineMvuDataStore）
│       ├── App.vue         # 主布局组件
│       ├── global.css      # CSS 变量 + 全局样式
│       └── components/
│           ├── Sidebar.vue         # 侧栏导航
│           ├── StoryPage.vue       # 剧情页
│           ├── TavernPage.vue      # 酒馆页
│           ├── InventoryPage.vue   # 库存页
│           ├── ShoppingPage.vue    # 购物页
│           ├── LedgerPage.vue      # 账本页
│           ├── ProfilePage.vue     # 玩家档案页
│           ├── RolesPage.vue       # 角色页
│           ├── MapPage.vue         # 地图页
│           ├── FarmingPage.vue     # 农田页
│           ├── BrewingPage.vue     # 酿酒页
│           ├── ConstructionPage.vue # 建造页
│           ├── EmployeesPage.vue   # 员工页
│           ├── BusinessPage.vue    # 产业页
│           ├── AdventurePage.vue   # 冒险页
│           ├── RelationshipsPage.vue # 关系页
│           ├── DebugPage.vue       # 调试页
│           ├── OutputDock.vue      # 输出区
│           ├── SettingsPanel.vue   # 设置面板
│           ├── MapCanvas.vue       # SVG 地图（复用 Map 逻辑）
│           └── HUD.vue             # 剧情 HUD 条
│
├── engine/                  # 引擎逻辑（保留，适配新数据流）
├── services/                # 服务层（保留）
├── actions.ts               # Action 类型（保留）
├── dispatcher.ts            # Action 分发（保留）
├── style.css                # 全局 SCSS（保留并迁移到 global.css）
└── index.ts                 # 入口（废弃，改为 界面/状态栏/index.ts）
```

### 数据流设计

```
User Input → AI Response (含 MVU 命令)
     ↓
MVU 解析 → stat_data 更新
     ↓
defineMvuDataStore (pinia) ← 2秒轮询 + watch 双向同步
     ↓
Vue Reactive data → 自动渲染所有组件
```

旧的引擎存档系统（`GameSave`、`loadSave`、`writeSave`）保留用于引擎结算逻辑，但前端渲染完全走 MVU 数据通道。

### 关键技术决策

1. **Vue + Pinia 替代 jQuery DOM 操作**：所有界面渲染由 Vue 组件响应式完成
2. **defineMvuDataStore 替代手动 refreshData()**：pinia store 自动从 MVU 读取数据，watch 自动同步回 MVU
3. **CSS 迁移**：保留现有羊皮卷主题，CSS 变量 + 全局 CSS 移到 `global.css`，组件特定样式用 `<style scoped>`
4. **Tailwind 优先**：新组件优先使用 tailwindcss 类，复杂样式用 scoped CSS
5. **引擎代码保留**：`engine/`、`services/`、`actions.ts`、`dispatcher.ts` 保持不变，仅适配新的数据访问方式

### z.prefault 修复要点

- `z.prefault(value)` 替代 `z.default(value)`
- `z.object({...}).prefault({})` 保证幂等解析（容错 JSON patch `remove` 操作）
- 所有嵌套 zod object 的每个字段都需要 prefault
- 工具类型：`z.string().or(z.literal('待初始化')).prefault('待初始化')` 
