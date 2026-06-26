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
      <h2>农田 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">后院的菜地。种下去的希望，长出来的就是生活。</p>
      <div class="panel-glass">
        <h3>作物状态</h3>
        <div class="brew-list" style="margin-top: 6px">
          <template v-if="Object.keys(farms).length">
            <div v-for="(c, key) in farms" :key="key" class="brew-item">
              <div class="brew-head">
                <strong>{{ key.split(':')[1] || key }}</strong>
                <span class="countdown">{{ c.status || '' }}</span>
              </div>
            </div>
          </template>
          <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">后院还空着。种点什么吧。</p>
        </div>
      </div>
      <div class="panel-glass" style="margin-top: 12px">
        <h3>种新作物</h3>
        <button type="button" class="inv-act-btn" @click="plant">
          <BaseIcon name="Sprout" :size="14" /> 跟 AI 说要种什么
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
const farms = computed(() => (data.value as any)['farms'] || {});

function plant() {
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) out.value = '[种菜]\n请在聊天中告诉 AI 你想种什么作物。';
}
</script>
