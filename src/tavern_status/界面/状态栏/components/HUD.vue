<template>
  <div class="story-hud">
    <div class="hud-item">
      <span class="k">日期</span><span class="v">{{ w['当前日期'] || '—' }}</span>
    </div>
    <div class="hud-item">
      <span class="k">时间</span><span class="v">{{ w['当前时间'] || '—' }}</span>
    </div>
    <div class="hud-item">
      <span class="k">天气</span><span class="v">{{ w['天气'] || '—' }}</span>
    </div>
    <div class="hud-item long">
      <span class="k">当前位置</span><span class="v">{{ w['当前位置'] || '—' }}</span>
    </div>
    <div class="hud-item coins">
      <span class="k">金钱</span>
      <span class="coin myth">秘银币 {{ coin?.秘银币 ?? 0 }}</span>
      <span class="coin plat">铂金币 {{ coin?.铂金币 ?? 0 }}</span>
      <span class="coin gold">金币 {{ coin?.金币 ?? 0 }}</span>
      <span class="coin silv">银币 {{ coin?.银币 ?? 0 }}</span>
      <span class="coin copp">铜币 {{ coin?.铜币 ?? 0 }}</span>
    </div>
    <div class="hud-item">
      <span class="k">声望</span><span class="v">{{ w['声望'] || '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { Store } from 'pinia';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const w = computed(() => (data.value as any)['世界'] || {});
const coin = computed(() => w.value['金钱'] || {});
</script>

<style scoped>
.story-hud {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(111, 74, 33, 0.45);
  background: linear-gradient(180deg, rgba(56, 39, 25, 0.95), rgba(44, 30, 19, 0.95));
  color: #f3e4c2;
}
.hud-item {
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 4px 8px;
  border: 1px solid rgba(201, 163, 74, 0.32);
  background: rgba(255, 255, 255, 0.04);
}
.hud-item .k {
  font-size: calc(11px * var(--text-scale, 1));
  opacity: 0.76;
}
.hud-item .v {
  font-size: calc(12px * var(--text-scale, 1));
  font-weight: 700;
  color: #fff1ce;
}
.hud-item.long {
  min-width: 220px;
}
.hud-item.coins {
  gap: 4px;
}
.coin {
  font-size: calc(11px * var(--text-scale, 1));
  border-radius: 999px;
  padding: 2px 6px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.coin.myth {
  background: #3a4b63;
  border-color: #7ba3d8;
  color: #dceaff;
}
.coin.plat {
  background: #58616b;
  border-color: #bac4cf;
  color: #eef3fa;
}
.coin.gold {
  background: #5a4722;
  border-color: #d9b15b;
  color: #ffe7af;
}
.coin.silv {
  background: #4f545c;
  border-color: #a8b0bc;
  color: #e9edf3;
}
.coin.copp {
  background: #5a3a2a;
  border-color: #b47953;
  color: #f3cfb8;
}
</style>
