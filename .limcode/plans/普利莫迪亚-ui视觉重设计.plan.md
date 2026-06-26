<!-- LIMCODE_SOURCE_ARTIFACT_START -->
{"type":"design","path":".limcode/design/普利莫迪亚-ui视觉重设计.md","contentHash":"sha256:ea207a226b4b39aa501689eeb87123bd9185d0b6492233fb1026970c4287fdd1"}
<!-- LIMCODE_SOURCE_ARTIFACT_END -->

## TODO LIST

<!-- LIMCODE_TODO_LIST_START -->
- [x] 【A1】重写 global.css：HSL 色板 + 玻璃拟态 .panel-glass + 羊皮纸纹理 .page + 增强动画  `#a1-global-css`
- [x] 【A2】新建 BaseIcon.vue：统一 Lucide SVG icon 组件（size/color/stroke）  `#a2-base-icon`
- [x] 【B1】Sidebar + App.vue：替换装饰星 ✦ → Sparkles icon  `#b1-sidebar-app`
- [x] 【B2】HUD + StoryPage：emoji 替换 + 玻璃面板  `#b2-hud-story`
- [x] 【B3】TavernPage：⏩🎲 emoji 替换 + 经营快进/访客骰 Icons  `#b3-tavern`
- [x] 【B4】InventoryPage：🍳🥘🫙🍽️🍷 全部替换为 Lucide icons  `#b4-inventory`
- [x] 【B5】ShoppingPage：🧾 emoji 替换  `#b5-shopping`
- [x] 【B6】LedgerPage：📅👥🛏️📈 替换 + 货币 coin 微交互  `#b6-ledger`
- [x] 【B7】ProfilePage + RolesPage：❤️⚡💛💧👤 全部替换  `#b7-profile-roles`
- [x] 【B8】MapPage + MapCanvas：📍 替换  `#b8-map`
- [x] 【B9】Farming~Debug 8 个面板：🌱🍺🔨⚔️🩺📋🔄📥📤 替换  `#b9-panels`
- [x] 【B10】OutputDock + SettingsPanel + OpeningForm：📋 emoji 替换  `#b10-dock-settings`
- [x] 【C1】所有组件 <style scoped> 硬编码色值 → CSS 变量引用  `#c1-scoped-vars`
- [x] 【C2】全量检查：无残留 emoji、一致 glass 风格、动画流畅  `#c2-final-pass`
<!-- LIMCODE_TODO_LIST_END -->

# 普利莫迪亚 UI 视觉重设计 — 实施计划

> **设计来源**: `.limcode/design/普利莫迪亚-ui视觉重设计.md`

---

## 目标

将 22 个 Vue 组件从「原始泥金羊皮卷」升级为 **「泥金羊皮卷 2.0」**：

- **0 个 emoji** → 全部 Lucide SVG Icons
- HSL 色板 → 主题化友好
- 玻璃拟态面板 + 羊皮纸纹理
- 丰富的微交互动画

---

## 阶段 A：基础设施（2 个任务）

### A1. 重写 `global.css`

**文件**: `src/tavern_status/界面/状态栏/global.css`

**变更**:
1. `:root` 色板全部改为 HSL 格式，新增 `--surface-0/1/2`、`--glass-bg/border/blur`、`--shadow-card/elevated`
2. 新增 `.panel-glass` 类：`backdrop-filter: blur(12px)` + 半透明底 + 金边
3. `.page` 背景增加 SVG 噪点纹理（data: URI 内联）
4. 新增 `@keyframes pageEnter`：`opacity 0→1` + `translateY(8px→0)` + `scale(0.98→1)`
5. 新增按钮 active: `scale(0.96)` transition
6. 保留所有现有 CSS 变量名作为别名兼容（如 `--ink`、`--gold` 等），内部值改为 HSL
7. 旧 hex 值转 HSL：`#dbc9a3` → `hsl(43 38% 75%)` 等

### A2. 新建 `BaseIcon.vue`

**文件**: `src/tavern_status/界面/状态栏/components/BaseIcon.vue`

**接口**:
```vue
<BaseIcon name="CookingPot" size="18" />
```

**实现**: 使用 Lucide icon 的 SVG path 数据内联（不依赖 `lucide-vue-next` npm 包，直接用 path data）。

这是因为 webpack externals 可能不处理 `lucide-vue-next`，直接内联 SVG path 更可靠。

按设计文档的 emoji→icon 映射表，每个 icon 存储其 SVG path d 属性值。

---

## 阶段 B：逐组件迁移（10 个任务）

### 通用规则

每个组件中：
- 所有 emoji 文本 → `<BaseIcon name="..." size="14" />`
- 按钮内 icon + 文字用 `inline-flex items-center gap-1.5`
- 装饰星 `✦` → `<BaseIcon name="Sparkles" size="10" class="star-icon" />`
- `.panel` → `.panel-glass`（暗色面板场景）
- 页面根元素添加 `page-enter` 动画类

### B1. Sidebar + App.vue

- **Sidebar**: 侧栏图标已是 SVG，无需改 emoji。但装饰星在 paper-head 的 `<span class="star">✦</span>` 替换为 `<BaseIcon name="Sparkles" size="12" class="star-icon" />`
- **App.vue**: 无 emoji，但 `.pages` 容器增加 `page-enter` 子选择器

### B2. HUD + StoryPage

- **HUD**: 无 emoji（已无），但 coin 色值改为 CSS 变量
- **StoryPage**: 无 emoji

### B3. TavernPage

- `⏩ 生成叙事提示` → `<BaseIcon name="FastForward" size="14" />` + 文字
- `🎲 投掷 1d10000` → `<BaseIcon name="Dices" size="14" />` + 文字

### B4. InventoryPage

**emoji 最多的组件**：
- `🥘 做菜` → `<BaseIcon name="ChefHat" size="14" />`
- `🫙 做酱` → `<BaseIcon name="FlaskConical" size="14" />`
- `🍷 做喝的` → `<BaseIcon name="Wine" size="14" />`
- `🍽️ 上菜结账` → `<BaseIcon name="UtensilsCrossed" size="14" />`

### B5. ShoppingPage

- `🧾 结账并入库` → `<BaseIcon name="ReceiptText" size="14" />`

### B6. LedgerPage

- 统计卡片的 emoji icon：`📅`→`CalendarDays`、`👥`→`Users`、`🛏️`→`Bed`、`📈`→`TrendingUp`
- 货币 coin pill 增加 subtle 微光动画

### B7. ProfilePage + RolesPage

**ProfilePage**:
- `👩‍🍳` 默认头像 → `<BaseIcon name="User" size="28" />`
- `❤️` → `<BaseIcon name="Heart" size="14" class="text-rose-600" />`
- `⚡` → `<BaseIcon name="Zap" size="14" class="text-amber-400" />`
- `🍳` → `<BaseIcon name="CookingPot" size="14" />`

**RolesPage**:
- `👤` → `<BaseIcon name="UserCircle" size="18" />`
- `💛` → `<BaseIcon name="Heart" size="14" class="text-gold" />`
- `💧` → `<BaseIcon name="Droplets" size="14" />`
- `📍` → `<BaseIcon name="MapPin" size="12" />`

### B8. MapPage + MapCanvas

- `📍 回到玩家` → `<BaseIcon name="MapPin" size="14" />`
- `📋 复制位置摘要` → `<BaseIcon name="Clipboard" size="14" />`

### B9. Farming~Debug 8 面板

| 组件 | emoji → icon |
|------|-------------|
| FarmingPage | `🌱` → `Sprout` |
| BrewingPage | `🍺` → `Beer` |
| ConstructionPage | `🔨` → `Hammer` |
| AdventurePage | `⚔️` → `Swords` |
| DebugPage | `🔄`→`RefreshCw`、`📋`→`Clipboard`、`📥`→`Download`、`📤`→`Upload`、`🩺`→`Stethoscope` |
| EmployeesPage | 无 emoji |
| BusinessPage | 无 emoji |
| RelationshipsPage | `👤`→`UserCircle` |

### B10. OutputDock + SettingsPanel + OpeningForm

- **OutputDock**: `📋 复制` → `<BaseIcon name="Clipboard" size="14" />`，`✓ 已复制` → `<BaseIcon name="Check" size="14" />`
- **SettingsPanel**: 设置齿轮已是 SVG 无需改。装饰星 `✦` → `Sparkles`
- **OpeningForm**: 检查并替换任何 emoji

---

## 阶段 C：收尾（2 个任务）

### C1. Scoped 硬编码色值 → CSS 变量

遍历所有 22 个组件的 `<style scoped>`：
- 将 `#xxxxxx` hex 色值替换为对应的 `var(--xxx)` 变量
- 将 `rgba(111, 74, 33, ...)` 替换为 `hsl(var(--h-ink) ... / ...)` 格式
- 确保 `.panel-glass` 在需要的组件中正确引用

### C2. 全量检查

- 搜索 `[\x{1F300}-\x{1F9FF}]`（emoji 正则），确保 0 残留
- 搜索 `✦`（文本星号），确保已替换
- 目视检查所有 22 个组件模板中的 icon 使用
- 验证 glass 风格一致性
