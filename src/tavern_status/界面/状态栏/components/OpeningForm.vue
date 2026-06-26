<template>
  <div class="opening-overlay" role="dialog" aria-label="开局设定">
    <form class="opening-card glass-panel" @submit.prevent="onSubmit">
      <h2>普利莫迪亚 · 开局</h2>
      <p class="opening-hint">设定你的角色与酒馆，变量将写入 0 层并生成第一幕剧情。</p>

      <label>
        <span>角色姓名</span>
        <input v-model="form.playerName" type="text" required maxlength="32" placeholder="例如：艾莉娅" />
      </label>
      <label>
        <span>种族</span>
        <input v-model="form.playerRace" type="text" required maxlength="24" placeholder="人类" />
      </label>
      <label>
        <span>酒馆名称</span>
        <input v-model="form.tavernName" type="text" required maxlength="32" placeholder="铁壶酒馆" />
      </label>
      <label>
        <span>所在城市</span>
        <input v-model="form.city" type="text" required maxlength="32" placeholder="布拉姆维克" />
      </label>
      <label>
        <span>酒馆风格（可选）</span>
        <input
          v-model="form.tavernStyle"
          type="text"
          maxlength="80"
          placeholder="北境长屋式，暖炉中心，木梁低顶"
        />
      </label>

      <p v-if="error" class="opening-error">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? '正在初始化……' : '开始故事' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { OpeningFormData } from '../../../types';
import { initializeGameVariables, createOpeningStoryMessage } from '../../../utils/gameInitializer';
import { loadCurrentSave } from '../../../engineBridge';

const emit = defineEmits<{ (e: 'complete'): void }>();

const form = reactive<OpeningFormData>({
  playerName: '艾莉娅',
  playerRace: '人类',
  tavernName: '铁壶酒馆',
  city: '布拉姆维克',
  tavernStyle: '北境长屋式，暖炉中心，木梁低顶',
});

const submitting = ref(false);
const error = ref('');

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  error.value = '';

  const okVars = await initializeGameVariables({ ...form });
  if (!okVars) {
    error.value = '变量初始化失败，请重试。';
    submitting.value = false;
    return;
  }

  const okStory = await createOpeningStoryMessage({ ...form });
  if (!okStory) {
    error.value = '开局剧情创建失败，但变量已写入，可刷新后重试。';
  }

  loadCurrentSave();
  submitting.value = false;
  emit('complete');
}
</script>

<style scoped>
.opening-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(12, 8, 4, 0.88);
  backdrop-filter: blur(12px);
}
.opening-card {
  width: min(100%, 420px);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(201, 162, 90, 0.35);
  background: rgba(44, 30, 19, 0.92);
  color: #f3e4c2;
}
.opening-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #e8c97a;
}
.opening-hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  opacity: 0.85;
  line-height: 1.5;
}
label {
  display: block;
  margin-bottom: 0.75rem;
}
label span {
  display: block;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  opacity: 0.8;
}
input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  border: 1px solid rgba(201, 162, 90, 0.3);
  background: rgba(0, 0, 0, 0.25);
  color: #f3e4c2;
  font: inherit;
}
.opening-error {
  color: #e88;
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}
.btn-primary {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #c9a25a, #8b6914);
  color: #1a1208;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
