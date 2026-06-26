
# 普利莫迪亚 UI 视觉重设计

## 现状分析

当前 22 个 Vue 组件 + global.css 共约 3500 行代码。视觉问题：

| 问题 | 严重度 | 涉及范围 |
|------|--------|----------|
| 大量 emoji（🍳🥘🫙🍽️🍺🔨⚔️ 等） | **致命** | 所有页面按钮、状态标签 |
| 装饰星号 `✦` 用文本字符而非 SVG | 高 | 所有 page paper-head |
| 通用色板缺乏 HSL 系统 | 中 | global.css 全文件 |
| 缺少玻璃拟态质感 | 中 | 卡片、面板 |
| 羊皮纸缺少纹理深度 | 中 | .page 背景 |
| 过渡动画简单 | 低 | hover 只有 brightness/filter |

## 设计目标

**「泥金羊皮卷编年录」2.0** — 在中世纪奇幻账本美学基础上，注入现代高端质感。

## 核心技术方案

### 1. 图标体系：Lucide Icons

用 Lucide 的 SVG icon 替换所有 emoji。当前 webpack externals 已配置 CDN 回退，Lucide 可直接从 `lucide-vue-next` 导入或内联 SVG。

**映射表（关键 emoji → Lucide icon）**：

| 旧 emoji | 场景 | Lucide Icon |
|----------|------|-------------|
| 🍳 | 烹饪/做菜 | `CookingPot` |
| 🥘 | 做菜按钮 | `ChefHat` |
| 🫙 | 做酱 | `FlaskConical` |
| 🍽️ | 上菜结账 | `UtensilsCrossed` |
| 🍷 | 做喝的 | `Wine` |
| 🍺 | 酿酒 | `Beer` |
| 🌱 | 种菜 | `Sprout` |
| 🔨 | 建造 | `Hammer` |
| ⚔️ | 冒险 | `Swords` |
| ⏩ | 快进 | `FastForward` |
| 🎲 | 骰子 | `Dices` |
| 🧾 | 结账 | `ReceiptText` |
| 📋 | 复制 | `Clipboard` |
| 🔄 | 刷新 | `RefreshCw` |
| 📥 | 导出 | `Download` |
| 📤 | 导入 | `Upload` |
| 🩺 | 健康检查 | `Stethoscope` |
| 👩‍🍳 | 玩家头像默认 | `User` |
| 👤 | 角色头像默认 | `UserCircle` |
| × | 关闭 | `X` |
| − | 减 | `Minus` |
| ✦ | 装饰星 | `Sparkles` |
| ❤️ | 生命值 | `Heart` |
| ⚡ | 精力 | `Zap` |
| 💛 | 好感度 | `Heart`（金色变体） |
| 💧 | 膀胱 | `Droplets` |
| 📅 | 营业天数 | `CalendarDays` |
| 👥 | 客人数 | `Users` |
| 🛏️ | 客房 | `Bed` |
| 📈 | 收入 | `TrendingUp` |
| 📍 | 位置 | `MapPin` |
| ⚙️ | 设置 | `Settings`（已用SVG） |
| ✓ | 已复制 | `Check` |

### 2. CSS 变量体系升级

**HSL 色板**（保留原有羊皮/泥金色调，转为 HSL 便于主题切换）：

```css
:root {
  /* 羊皮纸系 — HSL */
  --h-parchment: 43;   /* 羊皮纸色相 */
  --h-gold: 43;         /* 泥金色相 */
  --h-ink: 35;          /* 墨水色相 */

  /* 背景层 */
  --surface-0: hsl(33 38% 7%);          /* 最深底 */
  --surface-1: hsl(33 28% 13%);         /* 外壳底 */
  --surface-2: hsl(33 22% 18%);         /* 面板底 */

  /* 羊皮纸 */
  --parchment: hsl(43 38% 75%);
  --parchment-warm: hsl(40 34% 70%);
  --parchment-light: hsl(44 45% 85%);

  /* 泥金 */
  --gold: hsl(41 55% 53%);
  --gold-bright: hsl(44 80% 82%);
  --gold-deep: hsl(40 55% 40%);

  /* 墨水 */
  --ink: hsl(35 35% 14%);
  --ink-strong: hsl(33 38% 10%);
  --ink-soft: hsl(33 22% 22%);
  --ink-dim: hsl(33 18% 32%);
  --ink-faint: hsl(33 15% 42%);

  /* 玻璃拟态 */
  --glass-bg: hsl(33 38% 7% / 0.65);
  --glass-border: hsl(43 55% 53% / 0.2);
  --glass-blur: 12px;

  /* 阴影系统 */
  --shadow-card: 0 4px 24px hsl(33 38% 5% / 0.4);
  --shadow-elevated: 0 8px 32px hsl(33 38% 3% / 0.55);
}
```

### 3. 玻璃拟态 + 纹理

**羊皮纸纹理**（CSS `background-image` 噪点）：

```css
.page {
  background:
    /* 纸纤维噪点 */
    url("data:image/svg+xml,...") repeat,
    /* 羊皮纸渐变 */
    linear-gradient(180deg, var(--parchment), var(--parchment-warm));
  /* 保留现有阴影 */
}
```

**玻璃拟态面板**：

```css
.panel-glass {
  background: hsl(33 38% 7% / 0.55);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(43 55% 53% / 0.18);
  box-shadow: var(--shadow-card);
}
```

### 4. 微交互动画增强

| 元素 | 动画 |
|------|------|
| 页面切换 | `v-show` → CSS `@keyframes pageEnter`：`opacity 0→1` + `translateY(8px→0)` + `scale(0.98→1)` |
| 侧栏按钮 | 保留现有 `::before` 滑入，增加 `transform: scale(1.02)` on hover |
| 卡片 hover | `translateY(-3px)` + `box-shadow` 加深 + `border-color` 提亮 |
| 按钮点击 | `scale(0.96)` active state |
| 设置齿轮 | 保留旋转动画 |
| 金币闪烁 | 保留 flicker |
| 数值变化 | CSS `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |

### 5. 实现策略

**阶段 A：基础设施**（一次性改完）
- A1. 重写 `global.css`：HSL 色板 + 新增 `.panel-glass`、纹理 `.page`
- A2. 建立 SVG Icon 组件 `BaseIcon.vue`（统一 size/color/stroke-width）

**阶段 B：组件迁移**（逐个改）
- B1. Sidebar：SVG 图标已内联 → 替换装饰星 `✦` → `Sparkles` icon
- B2. HUD + StoryPage
- B3. TavernPage
- B4. InventoryPage
- B5. ShoppingPage
- B6. LedgerPage
- B7. ProfilePage + RolesPage
- B8. MapPage + MapCanvas
- B9. FarmingPage → DebugPage（剩余 8 个面板）
- B10. OutputDock + SettingsPanel + OpeningForm

**阶段 C：收尾**
- C1. 将所有 `<style scoped>` 中的硬编码色值改为 CSS 变量引用
- C2. 确保 `<style scoped>` 中用到的 glass/纹理类正确继承
