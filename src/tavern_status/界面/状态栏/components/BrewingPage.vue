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
      <h2>酿酒 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">时间是好酒最好的朋友。</p>
      <div class="panel-glass">
        <h3>酿造中</h3>
        <div class="brew-list" style="margin-top: 6px">
          <template v-if="Object.keys(brews).length">
            <div v-for="(b, name, idx) in brews" :key="idx" class="brew-item">
              <div class="brew-head">
                <strong>{{ name }}</strong
                ><span class="countdown">{{ b.aging || '' }}</span>
              </div>
              <div class="brew-meta">
                <span>容器：{{ b.container || '' }}</span>
              </div>
            </div>
          </template>
          <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">没有在酿的东西。</p>
        </div>
      </div>
      <div class="panel-glass" style="margin-top: 12px">
        <h3>封新桶</h3>
        <button type="button" class="inv-act-btn" @click="startBrew">
          <BaseIcon name="Beer" :size="14" /> 跟 AI 说要酿什么
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const brews = computed(() => (data.value as any)['brews'] || {});
function startBrew() {
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) out.value = '[酿酒]\n请在聊天中告诉 AI 你想酿什么酒。';
}
</script>
