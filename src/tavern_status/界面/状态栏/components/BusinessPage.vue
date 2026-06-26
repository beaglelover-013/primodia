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
      <h2>产业 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">从一间厨房到一个小小的商业网络。</p>
      <div style="display: grid; gap: 6px">
        <template v-if="Object.keys(bizs).length">
          <div v-for="(b, name, idx) in bizs" :key="idx" class="brew-item">
            <div class="brew-head">
              <strong>{{ name }}</strong
              ><span class="state good">{{ b.type || '' }}</span>
            </div>
            <div class="brew-meta">{{ b.incomeNote || b.status || '' }}</div>
          </div>
        </template>
        <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">暂无产业。</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const bizs = computed(() => (data.value as any)['businesses'] || {});
</script>
