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
      <h2>关系 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">那些人——从推门进来开始，就再也不是陌生人了。</p>
      <div style="display: grid; gap: 8px">
        <template v-if="Object.keys(rels).length">
          <div v-for="(r, id, idx) in rels" :key="idx" class="role-card" style="cursor: default">
            <div class="role-card-top">
              <div class="role-card-avatar"><BaseIcon name="UserCircle" :size="22" /></div>
              <div class="role-card-id">
                <h4 class="role-card-name">{{ r.displayName || id }}</h4>
                <div class="role-card-meta">{{ r.race || '' }}{{ r.city ? ' · ' + r.city : '' }}</div>
              </div>
            </div>
            <div class="role-card-divider"></div>
            <p class="intimacy-quote">「{{ r.affinityLabel || '' }}」</p>
          </div>
        </template>
        <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">暂无关系记录。</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const rels = computed(() => (data.value as any)['relationships'] || {});
</script>

<style scoped>
.role-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 12px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.24), hsl(0 0% 100% / 0.1));
  padding: 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
  transition: 0.18s ease;
  color: var(--ink-soft);
}
.role-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.role-card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 25%, var(--gold-hi), var(--gold));
  border: 2px solid hsl(33 24% 28% / 0.45);
  flex: none;
  color: hsl(33 60% 15%);
}
.role-card-id {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.role-card-name {
  margin: 0;
  font-size: calc(14px * var(--text-scale, 1));
  color: hsl(33 50% 24%);
  font-weight: 700;
}
.role-card-meta {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-mid);
}
.role-card-divider {
  height: 1px;
  border-top: 1px dashed hsl(33 24% 28% / 0.3);
}
.intimacy-quote {
  font-size: calc(11px * var(--text-scale, 1));
  color: hsl(33 18% 28%);
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}
</style>
