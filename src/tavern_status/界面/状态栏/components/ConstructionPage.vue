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
      <h2>建造 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">一砖一瓦，把酒馆建成你想要的样子。</p>
      <div class="panel-glass">
        <h3>区域列表</h3>
        <div style="display: grid; gap: 6px; margin-top: 6px">
          <details v-for="(r, name, idx) in regions" :key="idx" class="region-card" open>
            <summary class="region-summary">
              <div class="region-head">
                <h4>{{ name }}</h4>
                <span class="state" :class="r.status || ''">{{ r.status || '' }}</span>
              </div>
            </summary>
            <div class="region-content">
              <div v-if="r.facilities?.length" class="region-tools">
                <span v-for="(f, fi) in r.facilities" :key="fi" class="tag">{{ f }}</span>
              </div>
              <div v-if="r.decorations?.length" class="region-tools" style="margin-top: 4px; opacity: 0.7">
                装饰: <span v-for="(d, di) in r.decorations" :key="di" class="tag">{{ d }}</span>
              </div>
              <p v-if="r.vibe" class="region-desc" style="margin-top: 4px">{{ r.vibe }}</p>
            </div>
          </details>
          <p v-if="!Object.keys(regions).length" style="color: var(--ink-faint); font-style: italic; padding: 8px 0">
            暂无区域数据。
          </p>
        </div>
      </div>
      <div class="panel-glass" style="margin-top: 12px">
        <h3>扩建/升级</h3>
        <button type="button" class="inv-act-btn" @click="build">
          <BaseIcon name="Hammer" :size="14" /> 告诉 AI 想建什么
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
const tavern = computed(() => (data.value as any)['酒馆'] || {});
const regions = computed(() => tavern.value['区域列表'] || {});
function build() {
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) out.value = '[建造]\n请在聊天中告诉 AI 你想扩建或改造什么。';
}
</script>
