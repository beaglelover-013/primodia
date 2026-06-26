<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useGameStore, formatCopper, type Heroine, type TavernRegion, type TavernRoom } from '../stores/game';
import PmIcon from '../components/PmIcon.vue';

const game = useGameStore();

const selectedRegionId = ref('main-hall');
const selectedRegion = computed(() => game.regions.find(r => r.id === selectedRegionId.value) ?? game.regions[0]);
const selectedWorkerId = ref<string | null>(null);
const selectedWorker = computed(() => game.heroines.find(h => h.id === selectedWorkerId.value) ?? null);
const floorCells = [
  { id: 'rooms', label: '客房', className: 'rooms' },
  { id: 'front-door', label: '前门', className: 'front' },
  { id: 'main-hall', label: '主厅', className: 'hall' },
  { id: 'bar', label: '柜台', className: 'bar' },
  { id: 'kitchen', label: '厨房', className: 'kitchen' },
  { id: 'cellar', label: '地窖', className: 'cellar' },
  { id: 'yard', label: '后院', className: 'yard' },
  { id: 'stable', label: '马厩', className: 'stable' },
];

const addOpen = ref(false);
const addTarget = ref<TavernRegion | null>(null);
const addRoomTarget = ref<TavernRoom | null>(null);
const newFacility = reactive({
  name: '',
  style: '',
  costCopper: 800,
  note: '',
});
function openAddFacility(r: TavernRegion, room?: TavernRoom) {
  addTarget.value = r;
  addRoomTarget.value = room ?? null;
  newFacility.name = '';
  newFacility.style = '';
  newFacility.costCopper = room ? 500 : 800;
  newFacility.note = '';
  addOpen.value = true;
}
async function applyAddFacility() {
  if (!addTarget.value || !newFacility.name.trim()) return;
  const targetName = addRoomTarget.value ? `${addTarget.value.name} · ${addRoomTarget.value.name}` : addTarget.value.name;
  const result = await game.executePseudoZeroAction({
    type: 'FACILITY_ADD',
    regionId: addTarget.value.id,
    roomId: addRoomTarget.value?.id,
    facility: {
      name: newFacility.name.trim(),
      style: newFacility.style.trim() || '自定',
      condition: '良好' as const,
      description: newFacility.note.trim() || '由玩家添置的新设施。',
      priceCopper: Math.max(0, Math.floor(newFacility.costCopper || 0)),
    },
  }, {
    type: 'FACILITY_ADD',
    title: `添置设施 · ${newFacility.name.trim()}`,
    aiHint: `请承接本回合上下文，叙述玩家在「${targetName}」安排添置「${newFacility.name.trim()}」的当下过程。不要额外添加设施、改随身钱袋/钱匣或改世界书；若需要移动，只通过 MVU 地点补丁表达。`,
    logText: `FACILITY_ADD · ${targetName} · ${newFacility.name.trim()}`,
    autoSend: false,
    preserveLocalState: true,
  });
  if (!result.ok) {
    return;
  }
  addOpen.value = false;
}

const fastForward = reactive({
  open: false,
  hours: 4,
  intensity: '正常' as '低调' | '正常' | '热闹' | '通宵',
});
function openFastForward() {
  fastForward.open = true;
}
async function runFastForward() {
  const hours = Math.max(1, Math.floor(Number(fastForward.hours) || 1));
  const intensity = fastForward.intensity;
  const result = game.dispatchAction({
    type: 'TAVERN_FAST_FORWARD',
    hours,
    intensity,
  });
  if (!result.ok) {
    game.pushLog('提示', result.message);
    return;
  }
  game.appendDraft(
    `我让「${game.tavernName}」开始营业，并连续经营约${hours}小时，营业风格偏「${intensity}」。观察客流、点单、收入、疲惫和酒馆里的气氛变化。（前端已结算：时间、钱匣收入、声望和精力变化。）`,
    { type: 'TAVERN_FAST_FORWARD' },
  );
  game.pushLog('提示', `经营快进 · ${intensity} · ${hours}小时 已结算并加入行动框。`);
  fastForward.open = false;
}
function toggleBusinessOpen() {
  const open = !game.isBusinessOpen;
  const result = game.dispatchAction({
    type: 'BUSINESS_TOGGLE',
    open,
  });
  if (!result.ok) {
    game.pushLog('提示', result.message);
    return;
  }
  game.appendDraft(
    open
      ? `我打开「${game.tavernName}」开始营业，整理柜台、炉火和主厅，准备接待今天的第一批客人。（前端已结算：营业状态已开启。）`
      : `我让「${game.tavernName}」歇业收店，收拾桌面、安顿店内事务并关上门。（前端已结算：营业状态已关闭，当前客流记录已清空。）`,
    { type: 'BUSINESS_TOGGLE' },
  );
  game.pushLog('提示', `${open ? '开始营业' : '歇业收店'} 已结算并加入行动框。`);
}
function updateGuestCap(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  game.setBusinessGuestCap(value);
}
function updateVisitorChance(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  game.setBusinessVisitorChance(value);
}

function conditionTone(c: TavernRegion['condition']) {
  return `condition-${c}`;
}

function needsCleaning(c: TavernRegion['condition']) {
  return !['崭新', '整洁', '良好'].includes(c);
}

function dispatchClean(r: TavernRegion) {
  const previousCondition = r.condition;
  const result = game.dispatchAction({ type: 'REGION_CLEAN', regionId: r.id });
  if (!result.ok) {
    game.pushLog('提示', result.message);
    return;
  }
  game.appendDraft(`我清扫并维护「${r.name}」，整理现场、擦洗污痕并检查设施状态。`, {
    type: 'REGION_CLEAN',
    undoPatch: {
      type: 'REGION_CLEAN',
      regionId: r.id,
      previousCondition,
    },
  });
  game.pushLog('提示', `清扫维护 · ${r.name} 已结算并加入行动框。`);
}

const facilityCount = computed(() => game.regions.reduce((acc, r) => acc + r.facilities.length + (r.rooms?.reduce((sum, room) => sum + room.facilities.length, 0) ?? 0), 0));
const dirtyCount = computed(() => game.regions.filter(r => needsCleaning(r.condition)).length);
function regionFacilityCount(r: TavernRegion) {
  return r.facilities.length + (r.rooms?.reduce((sum, room) => sum + room.facilities.length, 0) ?? 0);
}
function regionById(id: string) {
  return game.regions.find(r => r.id === id);
}
function assignedRegionFor(h: Heroine) {
  return game.regions.find(r => r.staff?.includes(h.name));
}
const regionNpcActivities = computed(() => selectedRegion.value ? game.npcActivitiesForRegion(selectedRegion.value.name) : []);
const selectedRegionStaff = computed(() => selectedRegion.value?.staff ? selectedRegion.value.staff.split(/[、,，\s]+/).filter(Boolean) : []);
const selectedRegionVisitors = computed(() => {
  if (!selectedRegion.value) return [];
  const staff = new Set(selectedRegionStaff.value);
  const activityByHeroine = new Map(regionNpcActivities.value.map(activity => [activity.heroineId, activity]));
  return game.heroines
    .filter(h => game.resolveTavernNpcRegion(h.located) === selectedRegion.value!.name && !staff.has(h.name))
    .map(h => ({ heroine: h, activity: activityByHeroine.get(h.id) }));
});
function activityRemainingText(activity: { expiresTurn?: number } | undefined) {
  if (!activity?.expiresTurn) return '';
  return ` · 剩${Math.max(1, activity.expiresTurn - game.successfulNarrationTurn)}回合`;
}
function assignWorkerToRegion(r: TavernRegion) {
  if (!selectedWorker.value) return;
  const worker = selectedWorker.value;
  const previousLocated = worker.located;
  const previousRegion = game.regions.find(item => item.staff?.includes(worker.name));
  const previousTargetStaff = r.staff;
  const result = game.dispatchAction({
    type: 'WORKER_ASSIGN',
    heroineId: worker.id,
    regionId: r.id,
  });
  if (!result.ok) {
    game.pushLog('提示', result.message);
    return;
  }
  game.appendDraft(`我安排 ${worker.name} 前往「${r.name}」当值，观察她的反应和空间里的气氛变化。`, {
    type: 'WORKER_ASSIGN',
    undoPatch: {
      type: 'WORKER_ASSIGN',
      heroineId: worker.id,
      previousLocated,
      targetRegionId: r.id,
      previousTargetStaff,
      previousRegionId: previousRegion?.id,
      previousRegionStaff: previousRegion?.staff,
    },
  });
  game.pushLog('提示', `员工分配 · ${worker.name} -> ${r.name} 已结算并加入行动框。`);
}
</script>

<template>
  <section class="page pm-paper" id="page-tavern">
    <header class="pm-paper-head">
      <div>
        <h2 class="h-title">
          <PmIcon name="tavern" :size="22" />
          {{ game.tavernName }} · 八大区域
        </h2>
        <div class="sub">已添置 {{ facilityCount }} 项 · 待清洁 {{ dirtyCount }} 处</div>
      </div>
      <div class="head-actions">
        <div class="business-strip" :class="{ open: game.isBusinessOpen }">
          <span class="business-state">{{ game.isBusinessOpen ? '营业中' : '未营业' }}</span>
          <span>{{ game.currentGuests }}/{{ game.guestCap }}</span>
          <input
            class="guest-cap"
            type="number"
            min="1"
            :value="game.guestCap"
            title="客流上限"
            @change="updateGuestCap"
          />
          <label class="visitor-chance">
            <span>来客率</span>
            <input
              type="number"
              min="0"
              max="100"
              :value="game.visitorChance"
              title="每回合生成访客的概率"
              @change="updateVisitorChance"
            />
            <span>%</span>
          </label>
        </div>
        <button class="pm-btn" :class="{ dark: game.isBusinessOpen, ghost: !game.isBusinessOpen }" @click="toggleBusinessOpen">
          <PmIcon :name="game.isBusinessOpen ? 'x' : 'tavern'" :size="14" />
          {{ game.isBusinessOpen ? '歇业' : '开始营业' }}
        </button>
        <button id="btn-fast-forward" class="pm-btn dark" @click="openFastForward">
          <PmIcon name="hourglass" :size="14" />
          经营快进
        </button>
      </div>
    </header>

    <div class="pm-paper-body tavern-board">
      <section class="floor-plan" aria-label="酒馆平面图">
        <button
          v-for="cell in floorCells"
          :key="cell.id"
          class="floor-room"
          :class="[cell.className, { active: selectedRegionId === cell.id, worn: regionById(cell.id) ? needsCleaning(regionById(cell.id)!.condition) : false }]"
          @click="selectedRegionId = cell.id"
        >
          <strong>{{ cell.label }}</strong>
          <span>{{ regionById(cell.id) ? regionFacilityCount(regionById(cell.id)!) : 0 }}设施</span>
          <em>{{ regionById(cell.id)?.staff ?? (regionById(cell.id)?.rooms?.length ? `${regionById(cell.id)?.rooms?.length}房间` : '空位') }}</em>
        </button>
      </section>

      <aside v-if="selectedRegion" class="region-detail">
        <header class="rg-head">
          <div class="rg-emblem">
            <PmIcon :name="selectedRegion.icon" :size="22" />
          </div>
          <div class="rg-title">
            <h3>{{ selectedRegion.name }}</h3>
            <div class="rg-sub">{{ selectedRegion.subtitle }}</div>
          </div>
          <span class="pm-tag" :class="conditionTone(selectedRegion.condition)">{{ selectedRegion.condition }}</span>
        </header>

        <p class="rg-desc">{{ selectedRegion.description }}</p>

        <section v-if="game.lastVisitorSeed" class="visitor-note">
          <span>最近访客</span>
          <strong>{{ game.lastVisitorSeed }}</strong>
        </section>

        <div class="rg-meta">
          <span class="pm-tag">{{ selectedRegion.style }}</span>
          <span v-if="selectedRegion.staff" class="pm-tag dim">{{ selectedRegion.staff }}</span>
          <span class="pm-tag dim">{{ regionFacilityCount(selectedRegion) }} 项设施</span>
        </div>

        <div class="rg-actions">
          <button class="pm-btn sm" @click="openAddFacility(selectedRegion)">
            <PmIcon name="hammer" :size="12" /> 添置设施
          </button>
          <button v-if="needsCleaning(selectedRegion.condition)" class="pm-btn sm ghost" @click="dispatchClean(selectedRegion)">
            <PmIcon name="check" :size="12" /> 派工清洁
          </button>
        </div>

        <section class="presence-board">
          <div class="rg-fac-title">当前在此的人</div>
          <div v-if="selectedRegionStaff.length || selectedRegionVisitors.length" class="presence-list">
            <div v-if="selectedRegionStaff.length" class="presence-group">
              <span class="presence-label">当值员工</span>
              <span v-for="name in selectedRegionStaff" :key="name" class="presence-chip staff">{{ name }}</span>
            </div>
            <div v-if="selectedRegionVisitors.length" class="presence-group">
              <span class="presence-label">在场配角</span>
              <span v-for="item in selectedRegionVisitors" :key="item.heroine.id" class="presence-chip">
                {{ item.heroine.name }}
                <small v-if="item.activity">· {{ item.activity.behaviors.join('、') }}{{ activityRemainingText(item.activity) }}</small>
              </span>
            </div>
          </div>
          <div v-else class="pm-empty compact">暂时没有记录到在场配角。</div>
        </section>

        <section class="staff-board">
          <div class="rg-fac-title">员工分配</div>
          <div class="staff-grid">
            <button
              v-for="h in game.heroines"
              :key="h.id"
              class="staff-chip"
              :class="{ active: selectedWorkerId === h.id }"
              @click="selectedWorkerId = h.id"
            >
              <span>{{ h.name }}</span>
              <small>{{ assignedRegionFor(h)?.name ?? h.located }}</small>
            </button>
          </div>
          <button class="pm-btn sm staff-assign" :disabled="!selectedWorker" @click="assignWorkerToRegion(selectedRegion)">
            <PmIcon name="pin" :size="12" /> 分配到当前区域
          </button>
        </section>

        <section class="rg-fac">
          <div class="rg-fac-title">设施清单</div>
          <div v-for="f in selectedRegion.facilities" :key="f.id" class="rg-fac-item">
            <div class="rg-fac-top">
              <span class="rg-fac-name">{{ f.name }}</span>
              <span class="pm-tag" :class="conditionTone(f.condition)">{{ f.condition }}</span>
              <span v-if="f.priceCopper" class="pm-tag dim">{{ formatCopper(f.priceCopper) }}</span>
            </div>
            <p class="rg-fac-desc">{{ f.description }}</p>
          </div>
        </section>

        <section v-if="selectedRegion.rooms?.length" class="room-list">
          <div class="rg-fac-title">独立房间</div>
          <article v-for="room in selectedRegion.rooms" :key="room.id" class="room-card">
            <header class="room-head">
              <div>
                <strong>{{ room.name }}</strong>
                <span>{{ room.type }} · {{ formatCopper(room.priceCopper) }}/天</span>
              </div>
              <button class="pm-btn sm ghost" @click="openAddFacility(selectedRegion, room)">添置</button>
            </header>
            <div class="room-stats">
              <span>舒适 {{ room.comfort }}</span>
              <span>隐私 {{ room.privacy }}</span>
              <span>清洁 {{ room.cleanliness }}</span>
            </div>
            <div v-if="room.facilities.length" class="room-facs">
              <span v-for="f in room.facilities" :key="f.id" class="pm-tag">{{ f.name }}</span>
            </div>
            <div v-else class="pm-empty compact">暂无独立设施，等待玩家亲自添置。</div>
          </article>
        </section>
      </aside>
    </div>

    <!-- 添置设施弹窗 -->
    <Teleport to="body">
      <div v-if="addOpen" class="pm-modal-mask" @click.self="addOpen = false">
        <div class="pm-modal">
          <header class="pm-modal-head">
            <h3>
              <PmIcon name="hammer" :size="16" />
              添置设施 · {{ addRoomTarget ? `${addTarget?.name} · ${addRoomTarget.name}` : addTarget?.name }}
            </h3>
            <button class="pm-link" @click="addOpen = false"><PmIcon name="x" :size="16" /></button>
          </header>
          <div class="pm-modal-body">
            <label class="pm-field">
              <span>设施名称</span>
              <input v-model="newFacility.name" class="pm-input" placeholder="例如: 厚窗帘、写字桌、香料柜、告示板" />
            </label>
            <label class="pm-field">
              <span>外观 / 材质</span>
              <input v-model="newFacility.style" class="pm-input" placeholder="例如: 烟熏橡木、黄铜包角、深绿绒布" />
            </label>
            <label class="pm-field">
              <span>花费铜币</span>
              <input v-model.number="newFacility.costCopper" type="number" min="0" class="pm-input" />
            </label>
            <label class="pm-field">
              <span>叙事备注</span>
              <textarea
                v-model="newFacility.note"
                class="pm-textarea"
                placeholder="这件设施会让区域发生什么变化？例如: 让雨夜旅人一推门就看见炉火。"
              ></textarea>
            </label>
          </div>
          <footer class="pm-modal-foot">
            <button class="pm-btn ghost" @click="addOpen = false">取消</button>
            <button class="pm-btn" @click="applyAddFacility">写入添置行动</button>
          </footer>
        </div>
      </div>
    </Teleport>

    <!-- 经营快进弹窗 -->
    <Teleport to="body">
      <div v-if="fastForward.open" class="pm-modal-mask" @click.self="fastForward.open = false">
        <div class="pm-modal">
          <header class="pm-modal-head">
            <h3>
              <PmIcon name="hourglass" :size="16" />
              经营快进 · 客流与收成结算
            </h3>
            <button class="pm-link" @click="fastForward.open = false"><PmIcon name="x" :size="16" /></button>
          </header>
          <div class="pm-modal-body">
            <label class="pm-field">
              <span>时长 (小时)</span>
              <div class="ff-row">
                <input v-model.number="fastForward.hours" type="number" min="1" max="12" class="pm-input small" />
                <span class="pm-dim">推荐 2 ~ 6 小时</span>
              </div>
            </label>
            <label class="pm-field">
              <span>营业风格</span>
              <div class="ff-tabs">
                <button
                  v-for="opt in ['低调', '正常', '热闹', '通宵']"
                  :key="opt"
                  class="pm-btn sm"
                  :class="{ ghost: fastForward.intensity !== opt }"
                  @click="fastForward.intensity = opt as any"
                >
                  {{ opt }}
                </button>
              </div>
            </label>
            <div class="pm-divider">预算估算</div>
            <ul class="ff-est">
              <li>预计客流: <strong>{{ Math.floor(fastForward.hours * 7 * (({ '低调': 0.6, '正常': 1, '热闹': 1.5, '通宵': 2.2 } as Record<string, number>)[fastForward.intensity])) }}</strong> 位</li>
              <li>预计净收入: <strong>{{ Math.floor(fastForward.hours * 1200 * (({ '低调': 0.6, '正常': 1, '热闹': 1.5, '通宵': 2.2 } as Record<string, number>)[fastForward.intensity])) }}</strong> 铜</li>
              <li>预计精力消耗: <strong>{{ Math.floor(fastForward.hours * 4 * (({ '低调': 0.6, '正常': 1, '热闹': 1.5, '通宵': 2.2 } as Record<string, number>)[fastForward.intensity])) }}</strong></li>
            </ul>
          </div>
          <footer class="pm-modal-foot">
            <button class="pm-btn ghost" @click="fastForward.open = false">取消</button>
            <button class="pm-btn" @click="runFastForward">开始营业</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.head-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.business-strip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--pm-line-soft);
  border-radius: 4px;
  background: var(--pm-dark-panel-soft);
  color: var(--pm-muted);
  font-size: 12px;
}
.business-strip.open {
  border-color: rgba(94, 142, 82, 0.62);
  color: var(--pm-ink);
}
.business-state {
  font-weight: 700;
  color: var(--pm-gold);
}
.guest-cap {
  width: 54px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--pm-line-soft);
  border-radius: 4px;
  background: var(--pm-parch-bright);
  color: var(--pm-ink);
}
.visitor-chance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--pm-muted);
  white-space: nowrap;
}
.visitor-chance input {
  width: 46px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--pm-line-soft);
  border-radius: 4px;
  background: var(--pm-parch-bright);
  color: var(--pm-ink);
}
.visitor-note {
  display: grid;
  gap: 4px;
  margin: 10px 0;
  padding: 10px 12px;
  border: 1px dashed var(--pm-line-soft);
  border-radius: 4px;
  background: var(--pm-dark-panel-soft);
}
.visitor-note span {
  font-size: 11px;
  color: var(--pm-muted);
}
.visitor-note strong {
  font-weight: 500;
  line-height: 1.7;
}

.tavern-board {
  display: grid;
  grid-template-columns: minmax(420px, 1.25fr) minmax(320px, 0.75fr);
  gap: 14px;
  align-items: start;
}
.floor-plan {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-template-rows: 86px 116px 104px 86px;
  gap: 6px;
  min-height: 420px;
  padding: 14px;
  border: 2px solid rgba(80, 52, 24, 0.46);
  border-radius: 4px;
  background:
    linear-gradient(rgba(93, 63, 29, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93, 63, 29, 0.08) 1px, transparent 1px),
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.26), transparent 36%),
    linear-gradient(180deg, rgba(255, 245, 215, 0.82), rgba(212, 186, 136, 0.58));
  background-size: 22px 22px, 22px 22px, auto, auto;
  box-shadow: inset 0 0 0 1px rgba(255, 245, 215, 0.4);
}
.floor-room {
  position: relative;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 3px;
  min-width: 0;
  padding: 8px 6px;
  border: 2px solid rgba(87, 57, 26, 0.54);
  border-radius: 4px;
  background: rgba(255, 248, 226, 0.52);
  color: var(--pm-ink);
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.52);
}
.floor-room:hover,
.floor-room.active {
  border-color: rgba(130, 84, 31, 0.92);
  background: linear-gradient(180deg, rgba(246, 222, 159, 0.86), rgba(209, 166, 82, 0.64));
}
.floor-room.worn::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-top: 1px dashed rgba(92, 47, 28, 0.4);
  transform: rotate(-10deg);
  pointer-events: none;
}
.floor-room strong {
  font-family: var(--pm-font-display);
  font-size: calc(15px * var(--pm-text-scale));
  letter-spacing: 0.08em;
}
.floor-room span,
.floor-room em {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
  font-style: normal;
}
.floor-room.rooms {
  grid-column: 1 / 7;
  grid-row: 1;
}
.floor-room.front {
  grid-column: 1 / 2;
  grid-row: 2;
}
.floor-room.hall {
  grid-column: 2 / 5;
  grid-row: 2 / 4;
}
.floor-room.bar {
  grid-column: 5 / 7;
  grid-row: 2;
}
.floor-room.kitchen {
  grid-column: 4 / 6;
  grid-row: 3;
}
.floor-room.cellar {
  grid-column: 6 / 7;
  grid-row: 3;
}
.floor-room.yard {
  grid-column: 1 / 4;
  grid-row: 3;
}
.floor-room.stable {
  grid-column: 1 / 7;
  grid-row: 4;
}
.region-detail {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(110, 80, 34, 0.44);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(255, 245, 215, 0.78), rgba(212, 186, 136, 0.54));
}
.rg-head {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
}
.region-detail :deep(.pm-tag.condition-宕柊),
.rg-fac-item :deep(.pm-tag.condition-宕柊) {
  background: var(--pm-grad-gold);
  border-color: var(--pm-gold-dim);
  color: var(--pm-text-on-gold);
}
.region-detail :deep(.pm-tag.condition-鏁存磥),
.rg-fac-item :deep(.pm-tag.condition-鏁存磥) {
  background: var(--pm-status-clean-bg);
  border-color: var(--pm-status-clean-border);
  color: var(--pm-status-clean-text);
}
.region-detail :deep(.pm-tag.condition-鑹ソ),
.rg-fac-item :deep(.pm-tag.condition-鑹ソ) {
  background: var(--pm-status-good-bg);
  border-color: var(--pm-status-good-border);
  color: var(--pm-status-good-text);
}
.region-detail :deep(.pm-tag.condition-蹇欎贡),
.rg-fac-item :deep(.pm-tag.condition-蹇欎贡) {
  background: var(--pm-status-warn-bg);
  border-color: var(--pm-status-warn-border);
  color: var(--pm-status-warn-text);
}
.region-detail :deep(.pm-tag.condition-鑲剰),
.rg-fac-item :deep(.pm-tag.condition-鑲剰) {
  background: var(--pm-status-neutral-bg);
  border-color: var(--pm-status-neutral-border);
  color: var(--pm-status-neutral-text);
}
.region-detail :deep(.pm-tag.condition-鐮存崯),
.rg-fac-item :deep(.pm-tag.condition-鐮存崯) {
  background: var(--pm-status-bad-bg);
  border-color: var(--pm-status-bad-border);
  color: var(--pm-status-bad-text);
}
.region-detail :deep(.pm-tag.condition-鍋滅敤),
.rg-fac-item :deep(.pm-tag.condition-鍋滅敤) {
  background: var(--pm-status-neutral-bg);
  border-color: var(--pm-status-neutral-border);
  color: var(--pm-status-neutral-text);
}
.region-detail :deep(.pm-tag.condition-升级中),
.rg-fac-item :deep(.pm-tag.condition-升级中) {
  background: var(--pm-status-magic-bg);
  border-color: var(--pm-status-magic-border);
  color: var(--pm-status-magic-text);
}
.rg-emblem {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 245, 215, 0.6), transparent 60%),
    var(--pm-grad-gold);
  border: 1px solid rgba(110, 80, 34, 0.6);
  color: var(--pm-text-on-gold);
  display: grid;
  place-items: center;
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.45);
}
.rg-title h3 {
  margin: 0;
  font-family: var(--pm-font-display);
  font-size: calc(15px * var(--pm-text-scale));
  letter-spacing: 0.06em;
  color: var(--pm-ink);
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.rg-title .lv {
  font-family: var(--pm-font-num);
  font-size: calc(11px * var(--pm-text-scale));
  color: var(--pm-ink-dim);
}
.rg-sub {
  font-size: calc(11.5px * var(--pm-text-scale));
  color: var(--pm-ink-dim);
}
.rg-desc {
  font-size: calc(12.5px * var(--pm-text-scale));
  color: var(--pm-ink-soft);
  line-height: 1.7;
}
.rg-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.presence-board {
  padding: 8px;
  border: 1px dashed rgba(110, 80, 34, 0.38);
  border-radius: 4px;
  background: rgba(255, 248, 226, 0.36);
}
.presence-list,
.presence-group {
  display: grid;
  gap: 6px;
}
.presence-group {
  grid-template-columns: 74px 1fr;
  align-items: start;
}
.presence-label {
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
  line-height: 24px;
}
.presence-chip {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(110, 80, 34, 0.34);
  border-radius: 999px;
  background: rgba(255, 252, 239, 0.68);
  color: var(--pm-ink);
  font-size: calc(11.5px * var(--pm-text-scale));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
.presence-chip.staff {
  background: rgba(232, 199, 124, 0.48);
  border-color: rgba(122, 84, 31, 0.5);
}
.presence-chip small {
  color: var(--pm-ink-soft);
}
.staff-board {
  padding: 8px;
  border: 1px dashed rgba(110, 80, 34, 0.42);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.42);
}
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 6px;
}
.staff-chip {
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid rgba(110, 80, 34, 0.42);
  border-radius: 4px;
  background: rgba(255, 248, 226, 0.58);
  color: var(--pm-ink);
  text-align: left;
}
.staff-chip:hover,
.staff-chip.active {
  border-color: rgba(130, 84, 31, 0.9);
  background: linear-gradient(180deg, rgba(246, 222, 159, 0.82), rgba(209, 166, 82, 0.56));
}
.staff-chip span,
.staff-chip small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.staff-chip span {
  font-weight: 700;
}
.staff-chip small {
  color: var(--pm-ink-dim);
  font-size: calc(10.5px * var(--pm-text-scale));
}
.staff-assign {
  width: 100%;
  justify-content: center;
  margin-top: 7px;
}

.rg-fac {
  margin-top: 0;
  padding: 8px;
  border-radius: 10px;
  border: 1px dashed rgba(110, 80, 34, 0.45);
  background: rgba(255, 245, 215, 0.45);
}
.rg-fac-title {
  font-family: var(--pm-font-display);
  letter-spacing: 0.16em;
  font-size: calc(11px * var(--pm-text-scale));
  color: var(--pm-ink-dim);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.rg-fac-item {
  padding: 6px 0;
  border-bottom: 1px dashed rgba(110, 80, 34, 0.25);
}
.rg-fac-item:last-child {
  border-bottom: none;
}
.rg-fac-top {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.rg-fac-name {
  font-weight: 600;
  color: var(--pm-ink);
}
.rg-fac-desc {
  margin-top: 3px;
  font-size: calc(11.5px * var(--pm-text-scale));
  color: var(--pm-ink-dim);
  line-height: 1.55;
}
.add-line {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px dashed rgba(110, 80, 34, 0.55);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.38);
  color: var(--pm-ink-soft);
  font-weight: 700;
}
.room-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
.room-card {
  display: grid;
  gap: 7px;
  padding: 9px;
  border: 1px solid rgba(110, 80, 34, 0.34);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.5);
}
.room-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.room-head div {
  display: grid;
  gap: 2px;
}
.room-head strong {
  color: var(--pm-ink);
}
.room-head span,
.room-stats {
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
}
.room-stats,
.room-facs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-empty.compact {
  padding: 6px;
  min-height: 0;
  font-size: calc(11px * var(--pm-text-scale));
}

.big-lv {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--pm-font-display);
  font-size: calc(20px * var(--pm-text-scale));
  letter-spacing: 0.1em;
  color: var(--pm-ink);
}
.big-lv .cur {
  color: var(--pm-ink-fade);
}
.big-lv .new {
  color: var(--pm-gold-dim);
  text-shadow: 0 0 12px rgba(201, 160, 74, 0.5);
}

.ff-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pm-input.small {
  width: 90px;
}
.ff-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ff-est {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 6px;
  font-size: calc(13px * var(--pm-text-scale));
  color: var(--pm-ink);
}
.ff-est strong {
  font-family: var(--pm-font-num);
  color: var(--pm-gold-dim);
}
@media (max-width: 1100px) {
  .tavern-board {
    grid-template-columns: 1fr;
  }
  .region-detail {
    position: static;
  }
}
@media (max-width: 720px) {
  .floor-plan {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
    min-height: 0;
  }
  .floor-room.rooms,
  .floor-room.front,
  .floor-room.hall,
  .floor-room.bar,
  .floor-room.kitchen,
  .floor-room.cellar,
  .floor-room.yard,
  .floor-room.stable {
    grid-column: auto;
    grid-row: auto;
    min-height: 74px;
  }
}
</style>
