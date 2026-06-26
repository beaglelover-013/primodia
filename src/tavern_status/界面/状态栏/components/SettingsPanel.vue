<template>
  <button type="button" class="settings-btn" aria-label="设置" @click="open">
    <svg viewBox="0 0 24 24">
      <path
        d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.66 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.49 7.49 0 0 0 0 1.88L2.78 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96a7 7 0 0 0 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"
      />
    </svg>
  </button>

  <Teleport to="body">
    <div v-if="visible" class="settings-overlay" @click="close"></div>
    <aside v-if="visible" class="settings-panel" role="dialog" aria-label="界面设置">
      <header class="settings-head">
        <h3>设置 <BaseIcon name="Sparkles" :size="10" class="star-icon" /></h3>
        <button type="button" class="settings-close" aria-label="关闭" @click="close">
          <BaseIcon name="X" :size="18" />
        </button>
      </header>
      <div class="settings-body">
        <div class="settings-section">
          <h4>字体大小</h4>
          <div class="settings-options" data-setting="size">
            <button
              v-for="opt in sizeOptions"
              :key="opt.value"
              type="button"
              class="settings-option"
              :class="{ active: settings.size === opt.value }"
              @click="setSetting('size', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="settings-actions">
          <button type="button" class="settings-reset" @click="reset">恢复默认</button>
          <span class="settings-version">设置自动保存</span>
        </div>
      </div>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import BaseIcon from './BaseIcon.vue';

const KEY = 'uiSettings';
const DEFAULTS = { font: 'default', size: '100' };
const visible = ref(false);
const settings = reactive({ ...load() });
const sizeOptions = [
  { value: '90', label: '90%' },
  { value: '100', label: '默认' },
  { value: '110', label: '110%' },
  { value: '120', label: '120%' },
  { value: '135', label: '135%' },
];

function load(): Record<string, string> {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* noop */
  }
}
function apply() {
  document.body.dataset.size = settings.size;
}
function setSetting(k: string, v: string) {
  (settings as any)[k] = v;
  apply();
  save();
}
function open() {
  visible.value = true;
}
function close() {
  visible.value = false;
}
function reset() {
  Object.assign(settings, DEFAULTS);
  apply();
  save();
}
onMounted(apply);
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.42);
  z-index: 300;
}
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 340px;
  max-width: 92vw;
  background: linear-gradient(180deg, var(--parchment), var(--parchment-warm));
  border-left: 2px solid var(--gold-deep);
  z-index: 301;
  box-shadow: -10px 0 28px hsl(0 0% 0% / 0.45);
  display: flex;
  flex-direction: column;
  color: var(--ink);
}
.settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid hsl(33 24% 28% / 0.4);
  background: linear-gradient(180deg, hsl(43 70% 80% / 0.45), hsl(41 50% 50% / 0.12));
}
.settings-head h3 {
  margin: 0;
  font-size: calc(16px * var(--text-scale, 1));
  color: var(--ink);
  letter-spacing: 1.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.settings-close {
  appearance: none;
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  padding: 0;
  display: grid;
  place-items: center;
}
.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}
.settings-section {
  margin-bottom: 22px;
}
.settings-section h4 {
  margin: 0 0 8px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
  letter-spacing: 1px;
  font-weight: 800;
}
.settings-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.settings-option {
  appearance: none;
  font-family: inherit;
  font-size: calc(12px * var(--text-scale, 1));
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid hsl(33 24% 28% / 0.35);
  background: hsl(0 0% 100% / 0.35);
  color: var(--ink-soft);
  cursor: pointer;
  transition: 0.12s ease;
  font-weight: 600;
}
.settings-option.active {
  background: linear-gradient(180deg, hsl(43 50% 80%), hsl(40 42% 54%));
  border-color: hsl(33 24% 28% / 0.6);
  color: var(--ink-strong);
  box-shadow: 0 2px 6px hsl(0 0% 0% / 0.15);
}
.settings-actions {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px dashed hsl(33 24% 28% / 0.32);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings-reset {
  appearance: none;
  font-family: inherit;
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-soft);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}
.settings-version {
  font-size: 10px;
  color: var(--ink-faint);
  font-style: italic;
}
</style>
