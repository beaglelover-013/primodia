<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useGameStore, type GuestGroup } from '../stores/game';
import type { GuestUpdateStatus } from '../utils/messageParser';
import PmIcon from './PmIcon.vue';

const game = useGameStore();
const open = ref(false);
const editingId = ref('');
const dragged = ref(false);
const fabPosition = reactive({ right: 18, bottom: 88 });
const dragState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  startRight: 18,
  startBottom: 88,
});

const statuses: GuestUpdateStatus[] = ['刚进店', '等待点单', '已点单', '待上菜', '用餐中', '已离开'];
const draft = reactive({
  label: '',
  guests: '',
  status: '等待点单' as GuestUpdateStatus,
  order: '',
  note: '',
});

const activeGuests = computed(() => game.guestGroups.filter(group => group.status !== '已离开'));
const orderGuests = computed(() =>
  activeGuests.value.filter(group => ['刚进店', '等待点单', '已点单'].includes(group.status)),
);
const serveGuests = computed(() => activeGuests.value.filter(group => ['已点单', '待上菜'].includes(group.status)));
const badgeCount = computed(() => serveGuests.value.length || activeGuests.value.length);

function loadFabPosition() {
  try {
    const raw = localStorage.getItem('primordia-service-tray-position');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const right = Number(parsed.right);
    const bottom = Number(parsed.bottom);
    if (Number.isFinite(right)) fabPosition.right = Math.max(8, Math.min(window.innerWidth - 80, right));
    if (Number.isFinite(bottom)) fabPosition.bottom = Math.max(8, Math.min(window.innerHeight - 60, bottom));
  } catch {
    // Ignore stale local UI preferences.
  }
}

function saveFabPosition() {
  localStorage.setItem('primordia-service-tray-position', JSON.stringify(fabPosition));
}

function beginDrag(event: PointerEvent) {
  dragged.value = false;
  dragState.active = true;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.startRight = fabPosition.right;
  dragState.startBottom = fabPosition.bottom;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function moveDrag(event: PointerEvent) {
  if (!dragState.active) return;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged.value = true;
  fabPosition.right = Math.max(8, Math.min(window.innerWidth - 80, dragState.startRight - dx));
  fabPosition.bottom = Math.max(8, Math.min(window.innerHeight - 60, dragState.startBottom - dy));
}

function endDrag() {
  if (!dragState.active) return;
  dragState.active = false;
  saveFabPosition();
}

function openTray() {
  if (dragged.value) {
    window.setTimeout(() => (dragged.value = false), 0);
    return;
  }
  open.value = true;
}

function resetDraft() {
  editingId.value = '';
  draft.label = '';
  draft.guests = '';
  draft.status = '等待点单';
  draft.order = '';
  draft.note = '';
}

function editGuest(group: GuestGroup) {
  editingId.value = group.id;
  draft.label = group.label;
  draft.guests = group.guests;
  draft.status = group.status;
  draft.order = group.order;
  draft.note = group.note;
  open.value = true;
}

function saveDraft() {
  const patch = {
    label: draft.label.trim() || '未命名桌',
    guests: draft.guests.trim() || '未记录客人',
    status: draft.status,
    order: draft.order.trim(),
    note: draft.note.trim(),
  };
  if (editingId.value) game.updateGuestGroup(editingId.value, patch);
  else game.addGuestGroup(patch);
  resetDraft();
}

function statusTone(status: GuestUpdateStatus) {
  if (status === '待上菜') return 'hot';
  if (status === '已点单') return 'warn';
  if (status === '用餐中') return 'good';
  if (status === '已离开') return 'dim';
  return '';
}

onMounted(loadFabPosition);
</script>

<template>
  <button
    class="service-fab"
    type="button"
    title="服务托盘，可拖动"
    :style="{ right: `${fabPosition.right}px`, bottom: `${fabPosition.bottom}px` }"
    @pointerdown="beginDrag"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @click="openTray"
  >
    <PmIcon name="pot" :size="18" />
    <span>服务</span>
    <b v-if="badgeCount">{{ badgeCount }}</b>
  </button>

  <Teleport to="body">
    <div v-if="open" class="service-backdrop" @click.self="open = false">
      <aside class="service-drawer">
        <header class="service-head">
          <div>
            <h2>服务托盘</h2>
            <p>记录当前在店客人、点单和待上菜对象。AI 回填不到时，可以在这里手动补。</p>
          </div>
          <button class="icon-btn" type="button" title="关闭" @click="open = false">
            <PmIcon name="x" :size="16" />
          </button>
        </header>

        <section class="service-editor">
          <div class="editor-grid">
            <label>
              <span>桌名</span>
              <input v-model="draft.label" placeholder="靠窗那桌" />
            </label>
            <label>
              <span>状态</span>
              <select v-model="draft.status">
                <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
              </select>
            </label>
            <label class="wide">
              <span>客人</span>
              <input v-model="draft.guests" placeholder="两个疲惫的狐族商贩" />
            </label>
            <label class="wide">
              <span>点单</span>
              <input v-model="draft.order" placeholder="热汤、麦酒" />
            </label>
            <label class="wide">
              <span>备注</span>
              <textarea v-model="draft.note" rows="2" placeholder="刚才问过有没有便宜热食"></textarea>
            </label>
          </div>
          <div class="editor-actions">
            <button class="pm-btn ghost sm" type="button" @click="resetDraft">清空</button>
            <button class="pm-btn sm" type="button" @click="saveDraft">
              {{ editingId ? '保存修改' : '新增客人' }}
            </button>
          </div>
        </section>

        <section class="tray-section">
          <h3>待上菜</h3>
          <p v-if="serveGuests.length === 0" class="empty">还没有需要上菜的客人。</p>
          <article v-for="group in serveGuests" :key="group.id" class="guest-card">
            <div class="guest-top">
              <strong>{{ group.label }}</strong>
              <span class="status-pill" :class="statusTone(group.status)">{{ group.status }}</span>
            </div>
            <p>{{ group.guests }}</p>
            <p v-if="group.order"><b>点单</b>{{ group.order }}</p>
            <p v-if="group.note"><b>备注</b>{{ group.note }}</p>
            <div class="guest-actions">
              <button type="button" @click="editGuest(group)">编辑</button>
              <button type="button" @click="game.markGuestGroupServed(group.id)">用餐中</button>
              <button type="button" @click="game.updateGuestGroup(group.id, { status: '已离开' })">离开</button>
            </div>
          </article>
        </section>

        <section class="tray-section">
          <h3>待点单 / 已点单</h3>
          <p v-if="orderGuests.length === 0" class="empty">暂无待点单记录。</p>
          <article v-for="group in orderGuests" :key="group.id" class="guest-card">
            <div class="guest-top">
              <strong>{{ group.label }}</strong>
              <span class="status-pill" :class="statusTone(group.status)">{{ group.status }}</span>
            </div>
            <p>{{ group.guests }}</p>
            <p v-if="group.order"><b>点单</b>{{ group.order }}</p>
            <p v-if="group.note"><b>备注</b>{{ group.note }}</p>
            <div class="guest-actions">
              <button type="button" @click="editGuest(group)">编辑</button>
              <button type="button" @click="game.updateGuestGroup(group.id, { status: '待上菜' })">待上菜</button>
              <button type="button" @click="game.updateGuestGroup(group.id, { status: '已离开' })">离开</button>
            </div>
          </article>
        </section>

        <section class="tray-section">
          <h3>在店客人</h3>
          <p v-if="activeGuests.length === 0" class="empty">现在店里没有记录到客人。</p>
          <article v-for="group in activeGuests" :key="group.id" class="guest-card compact">
            <div class="guest-top">
              <strong>{{ group.label }}</strong>
              <span class="status-pill" :class="statusTone(group.status)">{{ group.status }}</span>
            </div>
            <p>{{ group.guests }}</p>
            <div class="guest-actions">
              <button type="button" @click="editGuest(group)">编辑</button>
              <button type="button" @click="game.removeGuestGroup(group.id)">移除</button>
            </div>
          </article>
        </section>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.service-fab {
  position: fixed;
  z-index: 70;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid var(--pm-gold);
  border-radius: 999px;
  background: var(--pm-dark-panel-solid);
  color: var(--pm-gold-bright);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  font-family: var(--pm-font-display);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.service-fab:active {
  cursor: grabbing;
}

.service-fab b {
  min-width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--pm-gold-bright);
  color: var(--pm-ink);
  font-size: 11px;
}

.service-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(13, 8, 4, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: flex-end;
}

.service-drawer {
  width: min(460px, calc(100vw - 24px));
  height: 100%;
  overflow: auto;
  padding: 18px;
  background: #efe0bd;
  color: var(--pm-ink);
  border-left: 1px solid var(--pm-line);
  box-shadow: -22px 0 48px rgba(0, 0, 0, 0.62);
}

.service-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px dashed var(--pm-line-soft);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.service-head h2 {
  margin: 0 0 4px;
  font-family: var(--pm-font-display);
  font-size: 22px;
}

.service-head p,
.empty,
.guest-card p {
  margin: 0;
  color: var(--pm-ink-soft);
  line-height: 1.6;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--pm-line);
  border-radius: 4px;
  background: var(--pm-paper-soft);
  color: var(--pm-ink);
}

.service-editor,
.guest-card {
  border: 1px solid var(--pm-line-soft);
  background: #f8edcf;
  border-radius: 6px;
  padding: 12px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 10px;
}

.editor-grid .wide {
  grid-column: 1 / -1;
}

.editor-grid span {
  display: block;
  margin-bottom: 4px;
  color: var(--pm-ink-dim);
  font-size: 12px;
}

.editor-grid input,
.editor-grid select,
.editor-grid textarea {
  width: 100%;
  border: 1px solid var(--pm-line);
  border-radius: 4px;
  background: var(--pm-input-bg);
  color: var(--pm-ink);
  padding: 8px;
}

.editor-actions,
.guest-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.tray-section {
  margin-top: 16px;
}

.tray-section h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--pm-ink);
}

.guest-card {
  margin-bottom: 8px;
}

.guest-card.compact {
  padding: 10px;
}

.guest-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.guest-card b {
  margin-right: 6px;
  color: var(--pm-ink);
}

.status-pill {
  white-space: nowrap;
  border: 1px solid var(--pm-line);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  background: var(--pm-paper-soft);
}

.status-pill.hot {
  color: #7b1f18;
  border-color: rgba(160, 58, 40, 0.42);
  background: rgba(255, 217, 190, 0.82);
}

.status-pill.warn {
  color: #76520a;
  border-color: rgba(178, 130, 31, 0.48);
  background: rgba(255, 232, 164, 0.86);
}

.status-pill.good {
  color: #285a2b;
  border-color: rgba(60, 135, 66, 0.45);
  background: rgba(217, 243, 207, 0.86);
}

.status-pill.dim {
  opacity: 0.65;
}

.guest-actions button {
  border: 1px solid var(--pm-line);
  border-radius: 4px;
  background: var(--pm-paper-soft);
  color: var(--pm-ink);
  padding: 4px 8px;
}
</style>
