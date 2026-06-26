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
      <h2>调试 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <div class="debug-grid">
        <div class="debug-col">
          <section class="panel-glass">
            <h3>存档 JSON</h3>
            <p class="debug-hint">当前 chat 变量的完整快照（自动刷新）。</p>
            <textarea ref="jsonArea" class="debug-textarea" readonly spellcheck="false" :value="saveJson"></textarea>
            <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap">
              <button type="button" class="inv-act-btn" @click="refreshSave">
                <BaseIcreshCw" :size="1" type="file4" /> 刷新
              </button>
              <button type="button" class="inv-act-btn" @click="copySave">
                <BaseIcon name="Clipboard" :size="14" /> 复制
              </button>
            </div>
          </section>
          <section class="panel-glass">
            <h3>导入/导出存档</h3>
            <p class="debug-hint">导出为 .json 文件，或导入备份恢复。</p>
            <div style="display: flex; gap: 6px; flex-wrap: wrap">
              <button type="button" class="inv-act-btn" @click="exportSave">
                <BaseIcon name="Download" :size="14" /> 导出存档
              </button>
              <label class="inv-act-btn" style="cursor: pointer; margin: 0">
                <BaseIcon name="Upload" :size="14" /> 导入存档
                <input ref="importInput" type="file" accept=".json" style="display: none" @change="importSave" />
              </label>
            </div>
          </section>
        </div>
        <div class="debug-col">
          <section class="panel-glass">
            <h3>Action 日志</h3>
            <p class="debug-hint">最近 20 条引擎操作记录。</p>
            <div ref="logEl" class="debug-log">{{ logText || '暂无日志……' }}</div>
          </section>
          <section class="panel-glass">
            <h3>健康检查</h3>
            <div ref="healthEl" class="debug-log"><span style="opacity: 0.45">点击下方按钮执行检查……</span></div>
            <button type="button" class="inv-act-btn" style="margin-top: 6px" @click="runHealth">
              <BaseIcon name="Stethoscope" :size="14" /> 执行健康检查
            </button>
          </section>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const jsonArea = ref<HTMLTextAreaElement | null>(null);
const logEl = ref<HTMLDivElement | null>(null);
const healthEl = ref<HTMLDivElement | null>(null);
const importInput = ref<HTMLInputElement | null>(null);
const logEntries = ref<string[]>([]);
const saveJson = computed(() => {
  try {
    return JSON.stringify(data.value, null, 2);
  } catch {
    return '（无法序列化）';
  }
});
const logText = computed(() => logEntries.value.join('\n') || '暂无日志……');

function refreshSave() {
  if (jsonArea.value) jsonArea.value.value = saveJson.value;
}
async function copySave() {
  if (!saveJson.value) return;
  try {
    await navigator.clipboard.writeText(saveJson.value);
  } catch {
    jsonArea.value?.select();
  }
}
function exportSave() {
  const blob = new Blob([saveJson.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `primordia-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
function importSave() {
  const file = importInput.value?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
    if (out) out.value = `[导入存档]\n已读取文件 ${file.name}\n请将存档数据粘贴到变量中。`;
    if (importInput.value) importInput.value.value = '';
  };
  reader.readAsText(file);
}
function runHealth() {
  if (!healthEl.value) return;
  const checks = [
    { pass: (data.value as any)['世界'] != null, severity: 'error', category: '结构', message: '缺少「世界」字段' },
    { pass: (data.value as any)['酒馆'] != null, severity: 'error', category: '结构', message: '缺少「酒馆」字段' },
    { pass: (data.value as any)['库存'] != null, severity: 'warn', category: '结构', message: '缺少「库存」字段' },
  ];
  const errs = checks.filter(c => !c.pass);
  const lines = [
    `<div style="font-weight:700;margin-bottom:4px;color:${errs.length ? '#d46c5c' : '#8abd87'}">${errs.length ? `发现 ${errs.length} 个问题` : '所有检查项均通过'}</div>`,
  ];
  for (const c of errs)
    lines.push(
      `<div style="color:${c.severity === 'error' ? '#d46c5c' : '#d9b15b'};margin-bottom:1px;">[${c.severity.toUpperCase()}] [${c.category}] ${c.message}</div>`,

    );
  healthEl.value.innerHTML = lines.join('');
}
</script>

<style scoped>
.debug-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.debug-col {
  display: grid;
  gap: 10px;
  align-content: start;
}
.debug-hint {
  font-size: calc(10px * var(--text-scale, 1));
  color: var(--ink-faint);
  margin: 0 0 6px;
  font-style: italic;
}
.debug-textarea {
  width: 100%;
  min-height: 260px;
  max-height: 400px;
  resize: vertical;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid hsl(33 24% 28% / 0.32);
  background: hsl(33 38% 10% / 0.5);
  color: hsl(43 30% 85%);
  font-size: calc(11px * var(--text-scale, 1));
  line-height: 1.4;
  padding: 8px 10px;
  font-family: monospace;
}
.debug-log {
  max-height: 160px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid hsl(33 24% 28% / 0.24);
  background: hsl(33 38% 8% / 0.4);
  padding: 6px 8px;
  font-size: calc(10px * var(--text-scale, 1));
  color: hsl(43 25% 75%);
  line-height: 1.5;
  font-family: monospace;
  min-height: 48px;
  white-space: pre-wrap;
}
</style>
