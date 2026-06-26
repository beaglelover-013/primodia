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
      <h2>账本 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="ledger-tagline">铁壶酒馆 · 自开张以来的累计回响。</p>

      <h3 class="ledger-h3">经营足迹</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon"><BaseIcon name="CalendarDays" :size="18" /></div>
          <div class="stat-meta">
            <div class="stat-k">累计营业天数</div>
            <div class="stat-v">{{ foot['累计营业天数'] ?? 0 }}<span class="stat-unit"> 天</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><BaseIcon name="Users" :size="18" /></div>
          <div class="stat-meta">
            <div class="stat-k">累计接待客人数</div>
            <div class="stat-v">{{ foot['累计接待客人数'] ?? 0 }}<span class="stat-unit"> 位</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><BaseIcon name="Bed" :size="18" /></div>
          <div class="stat-meta">
            <div class="stat-k">累计客房入住</div>
            <div class="stat-v">{{ foot['累计客房入住'] ?? 0 }}<span class="stat-unit"> 间夜</span></div>
          </div>
        </div>
      </div>

      <h3 class="ledger-h3">金银流转</h3>
      <div class="stat-grid">
        <div class="stat-card stat-income">
          <div class="stat-icon"><BaseIcon name="TrendingUp" :size="18" /></div>
          <div class="stat-meta">
            <div class="stat-k">累计总收入</div>
            <div class="stat-v">{{ fmtCopper(income) }}</div>
            <div class="stat-sub">{{ (income || 0).toLocaleString('zh-CN') }} 铜</div>
          </div>
        </div>
      </div>

      <h3 class="ledger-h3">当前总资产</h3>
      <div class="asset-card">
        <div class="asset-coins">
          <span v-for="tier in COIN_TIERS" :key="tier.name" class="coin" :class="coinCls[tier.name]"
            >{{ tier.name }}币 {{ assets[coinKey[tier.name]] ?? 0 }}</span
          >
        </div>
        <div class="asset-total">
          <span class="asset-total-k">折算合计</span>
          <span class="asset-total-v">{{ fmtCopper(assets['折算合计铜币'] ?? 0) }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const ledger = computed(() => (data.value as any)['账本'] || {});
const foot = computed(() => ledger.value['经营足迹'] || {});
const income = computed(() => ledger.value['金银流转']?.['累计总收入铜币'] ?? 0);
const assets = computed(() => ledger.value['当前总资产'] || {});

const COIN_TIERS = [
  { name: '秘银', value: 250_000_000 },
  { name: '铂', value: 500_000 },
  { name: '金', value: 1_000 },
  { name: '银', value: 100 },
  { name: '铜', value: 1 },
] as const;
const coinKey: Record<string, string> = { 秘银: '秘银币', 铂: '铂金币', 金: '金币', 银: '银币', 铜: '铜币' };
const coinCls: Record<string, string> = { 秘银: 'myth', 铂: 'plat', 金: 'gold', 银: 'silv', 铜: 'copp' };

function fmtCopper(total: number): string {
  if (!total || total <= 0) return '0铜';
  let rem = total;
  const parts: string[] = [];
  for (const tier of COIN_TIERS) {
    const c = Math.floor(rem / tier.value);
    if (c > 0) {
      parts.push(`${c}${tier.name}`);
      rem -= c * tier.value;
    }
  }
  return parts.join(' ');
}
</script>

<style scoped>
.ledger-tagline {
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-dim);
  font-style: italic;
  margin-bottom: 12px;
}
.ledger-h3 {
  margin: 14px 0 8px;
  color: var(--ink-head2);
  font-size: calc(14px * var(--text-scale, 1));
  display: flex;
  align-items: center;
  gap: 6px;
}
.ledger-h3::before {
  content: '✦';
  color: var(--gold);
  font-size: calc(10px * var(--text-scale, 1));
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}
.stat-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: hsl(33 45% 24% / 0.14);
  border: 1px solid hsl(33 24% 28% / 0.22);
  flex: none;
  color: var(--ink-head2);
}
.stat-meta {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.stat-k {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-mid);
}
.stat-v {
  font-size: calc(18px * var(--text-scale, 1));
  font-weight: 700;
  color: hsl(33 45% 22%);
  line-height: 1.15;
}
.stat-unit {
  font-size: calc(11px * var(--text-scale, 1));
  font-weight: 400;
  color: var(--ink-mid);
}
.stat-sub {
  font-size: calc(10px * var(--text-scale, 1));
  color: var(--ink-faint);
}
.stat-card.stat-income {
  background: linear-gradient(180deg, hsl(100 35% 80% / 0.45), hsl(100 35% 55% / 0.18));
  border-color: hsl(100 25% 30% / 0.4);
}
.asset-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.asset-coins {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.asset-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 1px dashed hsl(33 24% 28% / 0.3);
  padding-top: 8px;
}
.asset-total-k {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-dim);
}
.asset-total-v {
  font-size: calc(16px * var(--text-scale, 1));
  font-weight: 700;
  color: hsl(33 45% 18%);
}
.coin {
  font-size: calc(11px * var(--text-scale, 1));
  border-radius: 999px;
  padding: 2px 6px;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: box-shadow 0.3s ease;
}
.coin:hover {
  box-shadow: 0 0 12px hsl(44 80% 78% / 0.3);
}
.coin.myth {
  background: hsl(210 25% 30%);
  border-color: hsl(210 40% 65%);
  color: hsl(210 40% 90%);
}
.coin.plat {
  background: hsl(210 10% 38%);
  border-color: hsl(210 15% 60%);
  color: hsl(210 20% 90%);
}
.coin.gold {
  background: hsl(43 30% 25%);
  border-color: hsl(43 55% 52%);
  color: hsl(43 70% 80%);
}
.coin.silv {
  background: hsl(210 8% 33%);
  border-color: hsl(210 15% 58%);
  color: hsl(210 15% 88%);
}
.coin.copp {
  background: hsl(18 30% 28%);
  border-color: hsl(18 40% 52%);
  color: hsl(18 45% 82%);
}
</style>
