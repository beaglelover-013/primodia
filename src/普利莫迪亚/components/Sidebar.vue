<script setup lang="ts">
import { useGameStore, type TabId } from '../stores/game';
import PmIcon from './PmIcon.vue';

const game = useGameStore();

interface NavItem {
  id: TabId;
  name: string;
  icon: string;
  badge?: string;
  status?: 'ready' | 'dev';
  sub?: string;
}

const navItems: NavItem[] = [
  { id: 'chronicle', name: '编年录', icon: 'ledger', sub: '正文 · 选择', status: 'ready' },
  { id: 'tavern', name: '酒馆', icon: 'tavern', sub: '主厅 · 房间 · 经营', status: 'ready' },
  { id: 'protagonist', name: '主角档案', icon: 'heart', sub: '状态 · 厨艺', status: 'ready' },
  { id: 'inventory', name: '行囊与库房', icon: 'pot', sub: '使用 · 入库 · 炉台', status: 'ready' },
  { id: 'recipes', name: '配方簿', icon: 'ledger', sub: '复刻 · 记录', status: 'ready' },
  { id: 'characters', name: '人物羁绊', icon: 'people', sub: '配角 · 羁绊', status: 'ready' },
  { id: 'gallery', name: '图册画廊', icon: 'map', sub: 'CG · 图床 · 收藏', status: 'ready' },
  { id: 'map', name: '大地图', icon: 'map', sub: '普利莫迪亚 · 节点', status: 'ready' },
  { id: 'shop', name: '街坊商铺', icon: 'coin', sub: '店铺 · 货架 · 购买', status: 'ready' },
  { id: 'ledger', name: '账单', icon: 'ledger', sub: '历史足迹 · 资产', status: 'ready' },
  { id: 'farm', name: '农田与酒窖', icon: 'farm', sub: '种植 · 陈酿', status: 'ready' },
  { id: 'variables', name: '变量总览', icon: 'ledger', sub: '正式变量 · 检查', status: 'ready' },
  { id: 'settings', name: '系统与设置', icon: 'gear', sub: '字体 · 存档 · 健康', status: 'ready' },
];

function switchTab(id: TabId) {
  game.currentTab = id;
}
</script>

<template>
  <aside class="sidebar">
    <div class="scroll-top">
      <div class="scroll-band">普利莫迪亚</div>
    </div>

    <nav class="nav">
      <button
        v-for="item in navItems"
        :id="`nav-${item.id}`"
        :key="item.id"
        class="nav-item"
        :class="{ active: game.currentTab === item.id }"
        @click="switchTab(item.id)"
      >
        <span class="nav-icon">
          <PmIcon :name="item.icon" :size="20" />
        </span>
        <span class="nav-text">
          <span class="nav-name">{{ item.name }}</span>
          <span class="nav-sub">{{ item.sub }}</span>
        </span>
        <span v-if="item.status === 'dev'" class="nav-badge dev">开发中</span>
        <span class="nav-cursor"></span>
      </button>
    </nav>

    <div class="scroll-foot">
      <div class="oath">「烛火、账本、啤酒泡沫, 以及仍未落笔的夜晚。」</div>
      <div class="scroll-band">CHRONICLES</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--pm-side-bg);
  border: none;
  border-radius: 0;
  box-shadow:
    inset -1px 0 0 var(--pm-line-faint),
    0 12px 30px -16px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.scroll-top,
.scroll-foot {
  padding: 12px 12px;
  background: linear-gradient(180deg, var(--pm-dark-panel-soft), transparent);
  border-bottom: 1px dashed var(--pm-line-soft);
}
.scroll-foot {
  margin-top: auto;
  border-top: 1px dashed var(--pm-line-soft);
  border-bottom: none;
  background: linear-gradient(0deg, var(--pm-dark-panel-soft), transparent);
}
.scroll-band {
  font-family: var(--pm-font-display);
  letter-spacing: 0.2em;
  font-size: calc(11px * var(--pm-text-scale));
  color: var(--pm-parch-soft);
  text-align: center;
}
.oath {
  font-family: var(--pm-font-body);
  font-size: calc(11.5px * var(--pm-text-scale));
  color: var(--pm-parch-soft);
  text-align: center;
  font-style: italic;
  margin-bottom: 8px;
  line-height: 1.7;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  position: relative;
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 10px;
  text-align: left;
  border-radius: 4px;
  background: transparent;
  color: var(--pm-parch-soft);
  transition: 0.18s ease;
}
.nav-item:hover {
  background: var(--pm-dark-panel-soft);
  color: var(--pm-parch-bright);
}
.nav-item.active {
  background:
    linear-gradient(180deg, var(--pm-dark-panel-soft), rgba(0, 0, 0, 0.02)),
    var(--pm-dark-panel);
  color: var(--pm-gold-bright);
  box-shadow:
    inset 0 1px 0 var(--pm-line-soft),
    inset 0 0 0 1px var(--pm-line-soft),
    0 8px 18px -10px rgba(0, 0, 0, 0.55);
}
.nav-item.active .nav-name {
  color: var(--pm-gold-bright);
}
.nav-item.active .nav-icon {
  color: var(--pm-gold-bright);
  background: var(--pm-grad-gold);
  border-color: var(--pm-line-bright);
}

.nav-icon {
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(243, 220, 162, 0.12), rgba(243, 220, 162, 0.04));
  border: 1px solid rgba(243, 220, 162, 0.22);
  display: grid;
  place-items: center;
  color: rgba(243, 220, 162, 0.85);
}
.nav-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.nav-name {
  font-family: var(--pm-font-display);
  font-size: calc(13.5px * var(--pm-text-scale));
  letter-spacing: 0.12em;
  font-weight: 600;
}
.nav-sub {
  font-size: calc(10.5px * var(--pm-text-scale));
  color: rgba(243, 220, 162, 0.55);
  letter-spacing: 0.05em;
}

.nav-badge {
  font-size: calc(10px * var(--pm-text-scale));
  padding: 2px 7px;
  border-radius: 999px;
  background: linear-gradient(180deg, #6a4f23, #2a1c11);
  border: 1px solid rgba(243, 220, 162, 0.35);
  color: rgba(243, 220, 162, 0.85);
  letter-spacing: 0.1em;
}
.nav-cursor {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  background: linear-gradient(180deg, transparent, var(--pm-gold-bright), transparent);
  border-radius: 999px;
  transition: transform 0.25s ease;
}
.nav-item.active .nav-cursor {
  transform: translateY(-50%) scaleY(1);
}

@media (max-width: 980px) {
  .sidebar {
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    scrollbar-width: thin;
  }
  .scroll-top,
  .scroll-foot {
    display: none;
  }
  .nav {
    flex-direction: row;
    flex-wrap: nowrap;
    padding: 7px 8px;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .nav-item {
    grid-template-columns: 28px auto;
    flex: 0 0 auto;
    min-width: 0;
    padding: 6px 8px;
  }
  .nav-icon {
    width: 28px;
    height: 28px;
  }
  .nav-name {
    font-size: calc(12px * var(--pm-text-scale));
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .nav-sub {
    display: none;
  }
}

@media (max-width: 720px) {
  .nav-item {
    grid-template-columns: 28px;
    width: 42px;
    justify-content: center;
  }
  .nav-text {
    display: none;
  }
}
</style>
