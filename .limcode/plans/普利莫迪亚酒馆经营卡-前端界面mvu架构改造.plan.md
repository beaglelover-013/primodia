<!-- LIMCODE_SOURCE_ARTIFACT_START -->
{"type":"design","path":".limcode/design/普利莫迪亚酒馆经营卡-前端界面mvu架构改造.md","contentHash":"sha256:673d5185720d8d66e61583eb6a7bafb9836f4171262abf820fa9b7cfbc284b4c"}
<!-- LIMCODE_SOURCE_ARTIFACT_END -->

## TODO LIST

<!-- LIMCODE_TODO_LIST_START -->
- [x] 新建 App.vue + Sidebar.vue + OutputDock.vue + SettingsPanel.vue  `#create-app-layout`
- [x] 新建 TavernPage + InventoryPage + ShoppingPage + LedgerPage  `#create-core-pages`
- [x] 新建 engineBridge.ts + 改写 script.ts 为纯工具模块  `#create-engine-bridge`
- [x] 新建 MapCanvas.vue + MapPage.vue（SVG 地图交互）  `#create-map-page`
- [x] 新建 脚本/变量结构/index.ts（注册 Schema 到 MVU）  `#create-mvu-script`
- [x] 新建 Farming/Brewing/Construction/Employees/Business/Adventure/Relationships/Debug 组件  `#create-new-panels`
- [x] 新建 ProfilePage + RolesPage（玩家档案 + 角色）  `#create-profile-roles`
- [x] 新建 HUD.vue + StoryPage.vue（剧情页 + HUD）  `#create-story-page`
- [x] 新建 界面/状态栏/index.html + index.ts + store.ts + global.css  `#create-vue-entry`
- [x] 修复 schema.ts: z.default → z.prefault 全面迁移  `#fix-schema`
- [x] 更新 index.yaml 正则引用 + 清理废弃文件  `#update-yaml-cleanup`
<!-- LIMCODE_TODO_LIST_END -->

# 普利莫迪亚酒馆经营卡 - 前端界面 MVU 架构改造 实施计划

> **设计来源**: `.limcode/design/普利莫迪亚酒馆经营卡-前端界面mvu架构改造.md`

---

## 阶段 0：修复 schema.ts — z.prefault 迁移

**背景**：当前 `schema.ts` 使用 `z.default()`（zod 3 语法），不符合 MVU zod 4 规范，必须改为 `z.prefault()`。

### 修改 `src/tavern_status/schema.ts`

**规则**：
- `z.default(value)` → `z.prefault(value)`
- 每个 `z.object({...})` 的所有字段都要 prefault，然后 `.prefault({})` 整体 prefault
- `z.string().or(z.literal('待初始化')).default('待初始化')` → `z.string().or(z.literal('待初始化')).prefault('待初始化')`
- `z.coerce.number().default(0)` → `z.coerce.number().prefault(0)`
- 移除顶部注释 "z.prefault 不是 zod 原生方法"
- 保留所有 `.transform()` 逻辑（`_.clamp` 等）

---

## 阶段 1：创建必需的新文件

### 1.1 新建 `src/tavern_status/脚本/变量结构/index.ts`

```ts
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

$(() => {
  registerMvuSchema(Schema);
});
```

这是 MVU 角色卡的必需脚本，将 Schema 注册给 MVU 变量框架。

### 1.2 新建 `src/tavern_status/界面/状态栏/index.html`

遵循 MVU 前端界面模板的简洁格式：

```html
<head></head>
<body>
  <div id="app"></div>
</body>
```

### 1.3 新建 `src/tavern_status/界面/状态栏/index.ts`

遵循 MVU 前端界面入口规范，等待 MVU + 变量就绪后挂载 Vue：

```ts
import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { Schema } from '../../schema';

$(async () => {
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
  createApp(App).use(createPinia()).mount('#app');
});
```

### 1.4 新建 `src/tavern_status/界面/状态栏/store.ts`

使用 `defineMvuDataStore` 统一管理 MVU 数据：

```ts
import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(
  Schema,
  { type: 'message', message_id: getCurrentMessageId() }
);
```

所有 Vue 组件通过 `const store = useDataStore()` 获取响应式 `store.data`。

### 1.5 新建 `src/tavern_status/界面/状态栏/global.css`

将 `index.html` 中第 25-2425 行的 `<style>` 内容提取迁移到此文件。保留所有 CSS 自定义属性、动画、类名。

---

## 阶段 2：核心 Vue 组件

### 2.1 App.vue — 主布局组件

布局结构（保留现有 HTML 结构）：

```
.app-wrap
  ├── 四角装饰 <span.corner>
  ├── .app
  │   ├── Sidebar.vue (aside.sidebar)
  │   └── section.main
  │       ├── .pages
  │       │   └── 17 个 Page 组件（v-show 切换）
  │       └── OutputDock.vue (footer.output-dock)
  └── SettingsPanel.vue (固定位置设置按钮)
```

组件使用 `<script setup lang="ts">`，导航状态用 `ref<string>` 管理当前页面名。

### 2.2 Sidebar.vue — 侧栏导航

- 渲染 "普利莫迪亚编年录" 标题 + 15 个导航按钮
- props: `modelValue: string`（当前页面）
- emit: `update:modelValue`（切换页面）
- SVG 图标内联到模板中
- `active` class 绑定

### 2.3 OutputDock.vue — 输出区

- 标题 + 复制按钮 + textarea
- 使用 `useLocalStorage` 或简单 emit 管理输出内容
- 复制功能保留

### 2.4 SettingsPanel.vue — 设置面板

- 保留字体大小选择逻辑
- 使用 localStorage 持久化
- 滑出面板动画

---

## 阶段 3：页面组件（按现有功能逐一重构）

每个页面组件从 MVU `store.data` 读取数据，模板从 `index.html` 提取结构，逻辑从 `script.ts` 对应渲染函数迁移。

### 3.1 HUD.vue（共用）— 剧情 HUD 条

从 `renderStoryHud()` 迁移，从 `store.data.世界` 读取日期/时间/天气/位置/声望/金钱。

### 3.2 StoryPage.vue — 剧情页

- HUD 条 + 故事文本区
- 故事文本沿用 `setupStoryMaintext()` 逻辑（提取 `<maintext>` 标签、去除 `<thinking>`）
- 监听 `tavern_events.MESSAGE_RECEIVED` 自动刷新

### 3.3 TavernPage.vue — 酒馆页

从 `renderTavern()` 迁移：
- 酒馆基础设定（名称/城市/风格）
- 区域列表（details/summary 可折叠卡片）
- 进行中的制作列表
- 经营快进表单
- 访客骰按钮

### 3.4 InventoryPage.vue — 库存页

从 `renderInventory()` 迁移：
- 分类筛选按钮（全部/食材/调料/成品/其他）
- 食材/调料 → 材料卡片网格
- 成品/其他 → 表格
- 加选/减选逻辑
- 操作按钮（做菜/做酱/做喝的/上菜结账）
- `collectInvSelected()` 逻辑

### 3.5 ShoppingPage.vue — 购物页

从 `setupShopping()` 迁移：
- 店铺标签切换
- 商品网格
- 购物篮管理
- 结账按钮

### 3.6 LedgerPage.vue — 账本页

从 `renderLedger()` 迁移：
- 经营足迹统计卡片
- 金银流转
- 当前总资产（含货币格式化 `fmtCopper`）

### 3.7 ProfilePage.vue — 玩家档案页

从 `renderProfile()` 迁移：
- 头像 + 基本信息
- 生命值/精力条
- 烹饪等级卡片
- 当前穿着

### 3.8 RolesPage.vue — 角色页

从 `renderRoles()` + `setupRoleClickDelegation()` 迁移：
- 角色卡片网格（列表视图）
- 角色详情视图
- 亲密度阶段/好感度条/膀胱值/精力
- 返回按钮

### 3.9 MapPage.vue — 地图页

从 `setupMap()` 迁移（最复杂的组件）：
- SVG 地图画布（内联 SVG）
- 节点渲染、连线渲染
- 拖拽平移/滚轮缩放/双击复位
- 节点选中高亮
- 相邻/次邻节点详情
- `buildMapInfoText()` 用于导出

**拆分为子组件 MapCanvas.vue**（纯 SVG 渲染）和 MapPage.vue（详情面板 + 工具栏）

### 3.10 FarmingPage.vue — 农田页

从 `renderFarming()` 迁移 + 种新作物按钮。

### 3.11 BrewingPage.vue — 酿酒页

从 `renderBrewing()` 迁移 + 封新桶按钮。

### 3.12 ConstructionPage.vue — 建造页

从 `renderConstruction()` 迁移 + 扩建按钮。

### 3.13 EmployeesPage.vue — 员工页

从 `renderEmployees()` 迁移。

### 3.14 BusinessPage.vue — 产业页

从 `renderBusiness()` 迁移。

### 3.15 AdventurePage.vue — 冒险页

从 `renderAdventure()` 迁移（层域卡片 + 出发按钮）。

### 3.16 RelationshipsPage.vue — 关系页

从 `renderRelationships()` 迁移。

### 3.17 DebugPage.vue — 调试页

从 `renderDebug()` + `setupDebugPanel()` 迁移：
- 存档 JSON 查看/复制
- 导入/导出存档
- Action 日志
- 局势摘要
- 健康检查

---

## 阶段 4：引擎交互层

### 4.1 改写 `src/tavern_status/script.ts` → 保留必要逻辑

当前 `script.ts` 体积巨大（1951行），改造策略：

1. **删除**：所有 DOM 渲染函数（`render*`、`setup*`）→ 这些逻辑迁移到 Vue 组件
2. **保留为共享工具模块**：
   - `fmtCopper()` — 货币格式化
   - `esc()` — HTML 转义
   - `dispatchAndNarrate()` → 引擎结算 + AI 叙事核心
   - `logAction()` / `dispatchAndLog()` — Action 日志
   - `loadCurrentSave()` / `writeSave()` — 存档读写（留作引擎侧）
   - `setOutput()` — 输出区控制（改为 emit/store）
3. **新建共享 composable**：`useEngine.ts` — 提供引擎交互函数给 Vue 组件

### 4.2 引擎交互模式

Vue 组件触发操作 → 调用 `dispatchAndNarrate()` → 引擎结算 → AI 叙事 → 新楼层写入 → MVU 更新 → pinia 同步 → 组件自动重渲染。

需要在组件中：

```ts
import { dispatchAndNarrate } from '../../engineBridge';
```

其中 `engineBridge.ts` 是对 `script.ts` 中引擎核心函数的封装。

---

## 阶段 5：清理和收尾

### 5.1 更新 `index.yaml`

- 修改正则 `[界面]状态栏` 的内容，指向新的 `界面/状态栏/index.html` URL
- 确保 `脚本/变量结构` 引用指向 `dist/tavern_status/脚本/变量结构/index.js`

### 5.2 废弃旧入口

- `src/tavern_status/index.ts` → 删除或重命名为 `_old_index.ts`
- `src/tavern_status/index.html` → 删除或重命名为 `_old_index.html`
- `src/tavern_status/style.css` → 迁移到 `global.css` 后删除

### 5.3 保留不改动的文件

以下文件/目录完全不动：
- `engine/` 全部文件
- `services/` 全部文件
- `actions.ts`
- `dispatcher.ts`
- `第一条消息/`
- `世界书/`
- `schema.json`（build 时自动生成）
- 根目录下的 `index.html`、`style.css`（项目级别文件，不动）

### 5.4 webpack 构建配置

无需修改 — webpack 配置已支持 `.vue` SFC 编译和 `@util/` 路径别名，新文件结构兼容现有配置。

---

## 文件清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `schema.ts` | z.default → z.prefault |
| 新建 | `脚本/变量结构/index.ts` | MVU Schema 注册脚本 |
| 新建 | `界面/状态栏/index.html` | 最小化 HTML 入口 |
| 新建 | `界面/状态栏/index.ts` | Vue 挂载入口 |
| 新建 | `界面/状态栏/store.ts` | Pinia Store |
| 新建 | `界面/状态栏/global.css` | 全局 CSS 变量 + 样式 |
| 新建 | `界面/状态栏/App.vue` | 主布局 |
| 新建 | `界面/状态栏/components/Sidebar.vue` | 侧栏导航 |
| 新建 | `界面/状态栏/components/HUD.vue` | 剧情 HUD |
| 新建 | `界面/状态栏/components/StoryPage.vue` | 剧情页 |
| 新建 | `界面/状态栏/components/TavernPage.vue` | 酒馆页 |
| 新建 | `界面/状态栏/components/InventoryPage.vue` | 库存页 |
| 新建 | `界面/状态栏/components/ShoppingPage.vue` | 购物页 |
| 新建 | `界面/状态栏/components/LedgerPage.vue` | 账本页 |
| 新建 | `界面/状态栏/components/ProfilePage.vue` | 玩家档案页 |
| 新建 | `界面/状态栏/components/RolesPage.vue` | 角色页 |
| 新建 | `界面/状态栏/components/MapCanvas.vue` | SVG 地图画布 |
| 新建 | `界面/状态栏/components/MapPage.vue` | 地图页 |
| 新建 | `界面/状态栏/components/FarmingPage.vue` | 农田页 |
| 新建 | `界面/状态栏/components/BrewingPage.vue` | 酿酒页 |
| 新建 | `界面/状态栏/components/ConstructionPage.vue` | 建造页 |
| 新建 | `界面/状态栏/components/EmployeesPage.vue` | 员工页 |
| 新建 | `界面/状态栏/components/BusinessPage.vue` | 产业页 |
| 新建 | `界面/状态栏/components/AdventurePage.vue` | 冒险页 |
| 新建 | `界面/状态栏/components/RelationshipsPage.vue` | 关系页 |
| 新建 | `界面/状态栏/components/DebugPage.vue` | 调试页 |
| 新建 | `界面/状态栏/components/OutputDock.vue` | 输出区 |
| 新建 | `界面/状态栏/components/SettingsPanel.vue` | 设置面板 |
| 新建 | `engineBridge.ts` | 引擎交互桥接 |
| 删除 | `index.html`（src/tavern_status/ 下） | 废弃旧 HTML |
| 修改 | `index.yaml` | 更新正则引用路径 |
| 废弃 | `script.ts` | 大部分逻辑迁移到组件中，保留工具函数到 engineBridge.ts |
| 废弃 | `style.css`（src/tavern_status/ 下） | 迁移到 global.css |
| 废弃 | `index.ts`（src/tavern_status/ 下） | 入口改为 界面/状态栏/index.ts |
