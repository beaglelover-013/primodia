<template>
  <article class="page story-page">
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

    <HUD />

    <div v-if="isGenerating" class="generating-banner">剧情正在生成……</div>

    <div class="story-scroll">
      <div class="paper-head">
        <h2>剧情 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
      </div>
      <div class="paper-body" v-html="storyHtml"></div>

      <div v-if="options.length" class="story-options">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="game-option-btn"
          :disabled="optionsDisabled || isGenerating"
          @click="onOptionClick(opt)"
        >
          <span class="opt-id">{{ opt.id }}.</span>
          <span class="opt-text">{{ opt.text }}</span>
        </button>
      </div>

      <form class="story-custom" @submit.prevent="onCustomSubmit">
        <input
          v-model="customInput"
          type="text"
          placeholder="输入自定义行动……"
          :disabled="optionsDisabled || isGenerating"
        />
        <button type="submit" class="btn-secondary" :disabled="optionsDisabled || isGenerating || !customInput.trim()">
          发送
        </button>
      </form>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BaseIcon from './BaseIcon.vue';
import HUD from './HUD.vue';
import { loadFromLatestMessage, type ParsedOption } from '../../../utils/messageParser';
import { handleUnifiedRequest } from '../../../utils/requestHandler';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const storyHtml = ref('<p class="dropcap">等待剧情展开……</p>');
const options = ref<ParsedOption[]>([]);
const customInput = ref('');
const isGenerating = ref(false);
const optionsDisabled = ref(false);
const streamingText = ref('');

function renderStory() {
  const text = streamingText.value || loadFromLatestMessage().maintext;
  options.value = loadFromLatestMessage().options;
  if (!text) {
    storyHtml.value = '<p class="dropcap">等待剧情展开……</p>';
    return;
  }
  const parts = text
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
  storyHtml.value = parts
    .map((para, i) => {
      const cls = i === 0 ? ' class="dropcap"' : '';
      return `<p${cls}>${esc(para).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

async function onOptionClick(opt: ParsedOption) {
  await handleUnifiedRequest({ type: 'option', content: opt.text }, requestCallbacks());
}
async function onCustomSubmit() {
  const t = customInput.value.trim();
  if (!t) return;
  customInput.value = '';
  await handleUnifiedRequest({ type: 'custom', content: t }, requestCallbacks());
}

function requestCallbacks() {
  return {
    onDisableOptions: () => {
      optionsDisabled.value = true;
    },
    onShowGenerating: () => {
      isGenerating.value = true;
      streamingText.value = '';
    },
    onHideGenerating: () => {
      isGenerating.value = false;
      streamingText.value = '';
    },
    onEnableOptions: () => {
      optionsDisabled.value = false;
    },
    onError: (msg: string) => {
      toastr.error(msg);
    },
    onRefreshStory: () => {
      renderStory();
    },
    onStreamingUpdate: (text: string) => {
      streamingText.value = text;
      renderStory();
    },
  };
}

let events: EventOnReturn[] = [];
let refreshTimer: number | null = null;
function scheduleRefresh() {
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    streamingText.value = '';
    renderStory();
    refreshTimer = null;
  }, 300);
}

onMounted(() => {
  renderStory();
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    events = [
      eventOn(tavern_events.MESSAGE_RECEIVED, scheduleRefresh),
      eventOn(tavern_events.MESSAGE_UPDATED, scheduleRefresh),
      eventOn(tavern_events.MESSAGE_SWIPED, scheduleRefresh),
      eventOn(tavern_events.MESSAGE_EDITED, scheduleRefresh),
      eventOn(tavern_events.CHAT_CHANGED, scheduleRefresh),
    ];
  }
});
onUnmounted(() => {
  events.forEach(fn => fn?.());
  if (refreshTimer !== null) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.story-page {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}
.story-scroll {
  padding: 12px;
  flex: 1;
}
.generating-banner {
  margin: 8px 12px 0;
  padding: 8px 12px;
  text-align: center;
  border-radius: 8px;
  background: hsl(40 50% 50% / 0.15);
  color: hsl(40 60% 60%);
  font-size: 0.9rem;
}
.story-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 1rem;
}
.game-option-btn {
  display: flex;
  gap: 8px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  border-radius: 8px;
  border: 1px solid hsl(40 50% 50% / 0.35);
  background: hsl(0 0% 0% / 0.2);
  color: hsl(43 40% 80%);
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.15s;
}
.game-option-btn:hover:not(:disabled) {
  border-color: hsl(40 50% 50% / 0.6);
  transform: translateX(4px);
}
.game-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.opt-id {
  flex-shrink: 0;
  font-weight: 700;
  color: hsl(40 60% 60%);
}
.story-custom {
  display: flex;
  gap: 8px;
  margin-top: 1rem;
}
.story-custom input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid hsl(40 50% 50% / 0.3);
  background: hsl(0 0% 0% / 0.2);
  color: hsl(43 40% 80%);
}
.btn-secondary {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid hsl(40 50% 50% / 0.4);
  background: transparent;
  color: hsl(40 60% 60%);
  cursor: pointer;
}
</style>
