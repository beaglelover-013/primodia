<template>
  <footer class="output-dock" aria-label="统一输出区">
    <div class="output-dock-head">
      <label class="output-dock-title" for="globalOutput">{{ outputTitle }}</label>
      <button type="button" class="output-dock-copy" title="复制本区全部文字" @click="copyOutput">
        <BaseIcon :name="copyIcon" :size="14" /> {{ copyText }}
      </button>
    </div>
    <textarea
      id="globalOutput"
      v-model="outputText"
      class="global-output-text"
      spellcheck="false"
      placeholder="引擎结算、AI 叙事与操作日志将显示在此处。"
    />
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseIcon from './BaseIcon.vue';
import { outputTitle, outputText } from '../../../composables/useOutput';

const copyText = ref('复制');
const copyIcon = ref('Clipboard');

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputText.value);
    copyText.value = '已复制';
    copyIcon.value = 'Check';
    setTimeout(() => {
      copyText.value = '复制';
      copyIcon.value = 'Clipboard';
    }, 2000);
    toastr.success('已复制到剪贴板');
  } catch {
    toastr.warning('复制失败');
  }
}
</script>

<style scoped>
.output-dock {
  flex: none;
  border-top: 1px solid hsl(43 55% 53% / 0.38);
  background: linear-gradient(180deg, hsl(33 38% 18% / 0.97), hsl(33 38% 8% / 0.98));
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.output-dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.output-dock-title {
  font-size: calc(11px * var(--text-scale, 1));
  font-weight: 700;
  color: hsl(43 40% 80%);
  cursor: default;
}
.output-dock-copy {
  appearance: none;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid hsl(43 55% 53% / 0.4);
  background: hsl(0 0% 100% / 0.1);
  color: hsl(43 40% 85%);
  font-size: calc(11px * var(--text-scale, 1));
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  transition: 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.output-dock-copy:hover {
  background: hsl(0 0% 100% / 0.2);
  border-color: hsl(44 80% 78% / 0.55);
}
.global-output-text {
  width: 100%;
  min-height: 60px;
  max-height: 200px;
  resize: vertical;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid hsl(43 55% 53% / 0.32);
  background: hsl(33 38% 8% / 0.5);
  color: hsl(43 30% 85%);
  font-size: calc(12px * var(--text-scale, 1));
  line-height: 1.5;
  padding: 8px 10px;
  font-family: inherit;
}
</style>
