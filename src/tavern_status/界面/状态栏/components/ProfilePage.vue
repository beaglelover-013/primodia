<template>
  <article class="page">
    <span class="page-orn po1"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="page-orn po2"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="page-orn po3"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="page-orn po4"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>

    <div class="paper-head">
      <h2>玩家档案 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <template v-if="player && Object.keys(player).length">
        <section class="profile-hero">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar"><BaseIcon name="User" :size="32" /></div>
          </div>
          <div class="profile-id">
            <h3 class="profile-name">{{ basic['姓名'] || '未知' }}</h3>
            <div class="profile-meta">
              <span class="profile-meta-pill">{{ basic['种族'] || '人类' }}</span>
              <span class="profile-meta-pill">{{ basic['年龄'] ?? '?' }} 岁</span>
              <span class="profile-meta-pill profile-title">{{ basic['称号'] || '略有耳闻' }}</span>
            </div>
            <p class="profile-tagline">{{ basic['简介标语'] || '' }}</p>
          </div>
        </section>

        <h3 class="profile-h3">基本信息</h3>
        <div class="info-grid">
          <div class="info-cell">
            <span class="info-k">姓名</span><span class="info-v">{{ basic['姓名'] || '—' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-k">种族</span><span class="info-v">{{ basic['种族'] || '—' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-k">年龄</span><span class="info-v">{{ basic['年龄'] ?? '—' }} 岁</span>
          </div>
        </div>

        <h3 class="profile-h3">状态</h3>
        <div class="profile-stats-grid">
          <div class="status-card" :class="{ 'is-low': hpPct < 0.3 }">
            <div class="status-row">
              <BaseIcon name="Heart" :size="14" class="icon-rose" /><span class="status-name">生命值 HP</span
              ><span class="status-num">{{ hp['当前'] ?? 0 }} / {{ hp['上限'] ?? 100 }}</span>
            </div>
            <div class="status-bar"><i :style="{ width: Math.min(100, hpPct * 100) + '%' }"></i></div>
          </div>
          <div class="status-card" :class="{ 'is-low': stamPct < 0.3 }">
            <div class="status-row">
              <BaseIcon name="Zap" :size="14" class="icon-amber" /><span class="status-name">精力</span
              ><span class="status-num">{{ stam['当前'] ?? 0 }} / {{ stam['上限'] ?? 100 }}</span>
            </div>
            <div class="status-bar"><i :style="{ width: Math.min(100, stamPct * 100) + '%' }"></i></div>
          </div>
        </div>

        <h3 class="profile-h3">烹饪等级</h3>
        <div class="cook-card">
          <div class="cook-row">
            <div class="cook-icon"><BaseIcon name="ChefHat" :size="18" /></div>
            <div class="cook-meta">
              <div class="cook-title">
                <span class="cook-lv">LV.{{ cook['等级'] ?? 1 }}</span
                ><span class="cook-rank-name">{{ cook['等级称号'] || '学徒' }}</span>
              </div>
              <div class="cook-sub">
                累计做菜 <strong>{{ cook['累计做菜次数'] ?? 0 }}</strong> 次 · 距 LV.{{ (cook['等级'] ?? 1) + 1 }}「{{
                  cook['下一级称号'] || '—'
                }}」还需 <strong>{{ cookRem }}</strong> 次
              </div>
            </div>
          </div>
          <div class="status-bar cook-bar"><i :style="{ width: cookPct * 100 + '%' }"></i></div>
        </div>

        <h3 class="profile-h3">当前穿着</h3>
        <div class="role-section-card">
          <p class="role-outfit-line">{{ player['当前穿着'] || '待初始化' }}</p>
        </div>
      </template>
      <p v-else style="color: var(--ink-faint); font-style: italic; padding: 16px">暂无玩家档案数据。</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const player = computed(() => (data.value as any)['玩家'] || null);
const basic = computed(() => player.value?.['基本信息'] || {});
const st = computed(() => player.value?.['状态'] || {});
const cook = computed(() => player.value?.['烹饪等级'] || {});
const hp = computed(() => st.value['生命值'] || {});
const stam = computed(() => st.value['精力'] || {});

const hpPct = computed(() => (hp.value['当前'] ?? 0) / (hp.value['上限'] ?? 1));
const stamPct = computed(() => (stam.value['当前'] ?? 0) / (stam.value['上限'] ?? 1));
const cookPct = computed(() => Math.min(1, (cook.value['累计做菜次数'] ?? 0) / (cook.value['升级所需次数'] ?? 10)));
const cookRem = computed(() => Math.max(0, (cook.value['升级所需次数'] ?? 10) - (cook.value['累计做菜次数'] ?? 0)));
</script>

<style scoped>
.icon-rose {
  color: hsl(350 65% 55%);
}
.icon-amber {
  color: hsl(40 80% 55%);
}
.profile-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid hsl(33 24% 28% / 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.3), hsl(0 0% 100% / 0.1));
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.5);
  margin-bottom: 6px;
}
.profile-avatar-wrap {
  flex: none;
  width: 64px;
  height: 64px;
}
.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 25%, var(--gold-hi), var(--gold));
  border: 2px solid hsl(33 24% 28% / 0.45);
  color: hsl(33 60% 15%);
}
.profile-id {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.profile-name {
  margin: 0;
  font-size: calc(18px * var(--text-scale, 1));
  color: hsl(33 50% 24%);
}
.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.profile-meta-pill {
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid hsl(33 24% 28% / 0.35);
  background: hsl(0 0% 100% / 0.3);
  color: var(--ink-soft);
}
.profile-meta-pill.profile-title {
  background: linear-gradient(180deg, hsl(43 70% 80% / 0.7), hsl(40 45% 55% / 0.4));
  border-color: hsl(35 40% 38% / 0.5);
  color: hsl(35 50% 22%);
  font-weight: 700;
}
.profile-tagline {
  margin: 2px 0 0;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-dim);
  font-style: italic;
}
.profile-h3 {
  margin: 14px 0 8px;
  color: var(--ink-head2);
  font-size: calc(14px * var(--text-scale, 1));
  display: flex;
  align-items: center;
  gap: 6px;
}
.profile-h3::before {
  content: '✦';
  color: var(--gold);
  font-size: calc(10px * var(--text-scale, 1));
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 6px;
}
.info-cell {
  border: 1px solid hsl(33 24% 28% / 0.3);
  border-radius: 8px;
  background: hsl(0 0% 100% / 0.18);
  padding: 6px 10px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
}
.info-k {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-mid);
}
.info-v {
  font-weight: 700;
  color: hsl(33 45% 22%);
}
.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}
.status-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 10px 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
}
.status-name {
  font-weight: 700;
  flex: 1;
  color: var(--ink-soft);
}
.status-num {
  font-weight: 700;
  color: hsl(33 45% 22%);
  font-variant-numeric: tabular-nums;
}
.status-bar {
  height: 8px;
  border-radius: 999px;
  background: hsl(33 24% 28% / 0.18);
  border: 1px solid hsl(33 24% 28% / 0.22);
  overflow: hidden;
}
.status-bar > i {
  display: block;
  height: 100%;
  width: 0;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.status-card:first-child .status-bar > i {
  background: linear-gradient(90deg, hsl(0 55% 52%), hsl(5 60% 65%));
}
.status-card:last-child .status-bar > i {
  background: linear-gradient(90deg, hsl(210 40% 50%), hsl(200 45% 60%));
}
.status-card.is-low .status-bar > i {
  background: linear-gradient(90deg, hsl(0 60% 35%), hsl(10 55% 50%));
  animation: pulse-low 1.6s ease-in-out infinite;
}
@keyframes pulse-low {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
.cook-card {
  border: 1px solid hsl(40 40% 38% / 0.45);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(43 50% 80% / 0.45), hsl(40 40% 52% / 0.18));
  padding: 10px 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.45);
}
.cook-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cook-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: hsl(40 40% 38% / 0.2);
  border: 1px solid hsl(40 40% 38% / 0.45);
  flex: none;
  color: hsl(40 45% 25%);
}
.cook-meta {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.cook-title {
  font-size: calc(15px * var(--text-scale, 1));
  font-weight: 700;
  color: hsl(35 50% 22%);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.cook-lv {
  display: inline-block;
  background: hsl(35 50% 20% / 0.85);
  color: hsl(43 70% 80%);
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}
.cook-rank-name {
  font-size: calc(15px * var(--text-scale, 1));
}
.cook-sub {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-dim);
}
.cook-sub strong {
  color: hsl(33 45% 22%);
  font-weight: 700;
}
.cook-bar > i {
  background: linear-gradient(90deg, hsl(43 50% 60%), hsl(40 42% 48%));
}
.role-section-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 10px 12px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.role-outfit-line {
  margin: 0;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
  line-height: 1.6;
}
</style>
