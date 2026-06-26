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
      <h2>员工 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">一个人撑不了一间酒馆。</p>
      <div class="panel-glass">
        <h3>当前员工</h3>
        <div class="brew-list" style="margin-top: 6px">
          <template v-if="Object.keys(emps).length">
            <div v-for="(e, idx) in emps" :key="idx" class="brew-item">
              <div class="brew-head">
                <strong>{{ e.role || '' }}</strong
                ><span class="state good">{{ e.race || '' }}</span>
              </div>
              <div class="brew-meta">{{ (e.personality || '').slice(0, 40) }}</div>
              <div class="brew-meta" style="color: var(--ink-mid); font-style: italic">{{ e.currentState || '' }}</div>
            </div>
          </template>
          <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">还没有员工。</p>
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
const emps = computed(() => (data.value as any)['employees'] || {});
</script>
