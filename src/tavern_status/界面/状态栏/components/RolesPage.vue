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
      <h2>角色 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <section v-if="!detailId" class="roles-list-view">
        <p class="role-list-tagline">铁壶酒馆周遭的人物速写。</p>
        <div class="role-card-grid">
          <div v-for="(r, id) in roles" :key="id" class="role-card" role="button" tabindex="0" @click="showDetail(id)">
            <div class="role-card-top">
              <div class="role-card-avatar"><BaseIcon name="UserCircle" :size="22" /></div>
              <div class="role-card-id">
                <h4 class="role-card-name">{{ r['显示名'] || id }}</h4>
                <div class="role-card-meta">{{ r['种族'] || '' }}</div>
                <div class="role-card-loc"><BaseIcon name="MapPin" :size="10" /> {{ r['当前位置'] || '未知' }}</div>
                <span
                  class="stamina-state-tag"
                  :class="staminaCls(r['精力状态'])"
                  style="margin-top: 4px; display: inline-block"
                  >{{ r['精力状态'] || '一般' }}</span
                >
              </div>
            </div>
            <div class="role-card-divider"></div>
            <div class="intimacy-row">
              <span class="intimacy-stage-badge"
                >LV.{{ r['亲密度阶段'] ?? 1 }} · {{ stageName(r['亲密度阶段'] ?? 1) }}</span
              >
              <span class="intimacy-dots">
                <span
                  v-for="i in 8"
                  :key="i"
                  class="intimacy-dot"
                  :class="{ filled: i <= (r['亲密度阶段'] ?? 1) }"
                ></span>
              </span>
            </div>
            <div class="status-card" style="margin-top: 6px">
              <div class="status-row">
                <BaseIcon name="Heart" :size="14" class="icon-gold" /><span class="status-name">好感度</span
                ><span class="status-num">{{ r['好感度']?.['当前'] ?? 0 }} / {{ r['好感度']?.['上限'] ?? 100 }}</span>
              </div>
              <div class="status-bar"><i :style="{ width: favorPct(r) + '%' }"></i></div>
            </div>
            <p class="intimacy-quote">「{{ r['亲密度描述'] || '' }}」</p>
          </div>
        </div>
      </section>

      <section v-else class="roles-detail-view">
        <button type="button" class="role-back-btn" @click="detailId = ''">← 返回列表</button>
        <div v-if="detail">
          <section class="role-detail-hero">
            <div class="role-avatar-wrap">
              <div class="role-detail-avatar-btn"><BaseIcon name="UserCircle" :size="36" /></div>
            </div>
            <div class="role-detail-id">
              <h3 class="role-detail-name">{{ detail['显示名'] || detailId }}</h3>
              <div class="role-detail-meta">
                <span class="profile-meta-pill">{{ detail['种族'] || '' }}</span>
                <span class="profile-meta-pill">{{ detail['年龄'] ?? '?' }} 岁</span>
                <span class="profile-meta-pill profile-title"
                  ><BaseIcon name="MapPin" :size="10" /> {{ detail['当前位置'] || '未知' }}</span
                >
              </div>
              <p class="role-detail-tagline">{{ detail['简介标语'] || '' }}</p>
            </div>
          </section>
          <h3 class="profile-h3">关系状态</h3>
          <div class="role-section-card">
            <div class="intimacy-row">
              <span class="intimacy-stage-badge"
                >亲密度 LV.{{ detail['亲密度阶段'] ?? 1 }} / 8 · {{ stageName(detail['亲密度阶段'] ?? 1) }}</span
              >
              <span class="intimacy-dots">
                <span
                  v-for="i in 8"
                  :key="i"
                  class="intimacy-dot"
                  :class="{ filled: i <= (detail['亲密度阶段'] ?? 1) }"
                ></span>
              </span>
            </div>
            <p class="intimacy-quote">「{{ detail['亲密度描述'] || '' }}」</p>
          </div>
          <h3 class="profile-h3">当前穿着</h3>
          <div class="role-section-card">
            <p class="role-outfit-line">{{ detail['穿着'] || '' }}</p>
          </div>
          <h3 class="profile-h3">状态</h3>
          <div class="profile-stats-grid">
            <div class="status-card">
              <div class="status-row">
                <BaseIcon name="Zap" :size="14" class="icon-amber" /><span class="status-name">精力</span
                ><span class="stamina-state-tag" :class="staminaCls(detail['精力状态'])">{{
                  detail['精力状态'] || '一般'
                }}</span>
              </div>
            </div>
            <div class="status-card">
              <div class="status-row">
                <BaseIcon name="Droplets" :size="14" class="icon-blue" /><span class="status-name">膀胱</span
                ><span class="status-num">{{ bladderVal }}/100</span
                ><span class="bladder-state-tag" :class="bladderCls">{{ bladderLabel }}</span>
              </div>
            </div>
          </div>
          <h3 class="profile-h3">当前位置</h3>
          <div class="role-section-card">
            <div class="role-loc-line"><BaseIcon name="MapPin" :size="12" /> {{ detail['当前位置'] || '未知' }}</div>
          </div>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const roles = computed(() => (data.value as any)['角色'] || {});

const detailId = ref('');
const detail = computed(() => (detailId.value ? roles.value[detailId.value] : null) as any);

const STAGE_NAMES: Record<number, string> = {
  1: '初识',
  2: '面熟',
  3: '点头之交',
  4: '熟人',
  5: '朋友',
  6: '知交',
  7: '挚友',
  8: '至亲',
};
const STAMINA_CLASS: Record<string, string> = {
  精力充沛: 'st-energetic',
  状态良好: 'st-good',
  一般: 'st-normal',
  疲惫: 'st-tired',
  筋疲力竭: 'st-exhausted',
};

function stageName(s: number) {
  return STAGE_NAMES[s] || '初识';
}
function staminaCls(s: string) {
  return STAMINA_CLASS[s] || 'st-normal';
}
function favorPct(r: any) {
  return Math.min(100, Math.round(((r['好感度']?.['当前'] ?? 0) / (r['好感度']?.['上限'] ?? 100)) * 100));
}

const bladderVal = computed(() => detail.value?.['膀胱值']?.['当前'] ?? 0);
const bladderLabel = computed(() => {
  const v = bladderVal.value;
  if (v < 50) return '舒适';
  if (v < 80) return '微胀';
  if (v < 95) return '急迫';
  return '紧绷';
});
const bladderCls = computed(() => {
  const v = bladderVal.value;
  if (v < 50) return 'low';
  if (v < 80) return 'mid';
  if (v < 95) return 'high';
  return 'critical';
});

function showDetail(id: string) {
  detailId.value = id;
}
</script>

<style scoped>
.icon-gold {
  color: var(--gold);
}
.icon-amber {
  color: hsl(40 80% 55%);
}
.icon-blue {
  color: hsl(200 50% 55%);
}
.role-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}
.role-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 12px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.24), hsl(0 0% 100% / 0.1));
  padding: 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  cursor: pointer;
}
.role-card:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 hsl(0 0% 100% / 0.5),
    0 6px 14px hsl(0 0% 0% / 0.14);
}
.role-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.role-card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 25%, var(--gold-hi), var(--gold));
  border: 2px solid hsl(33 24% 28% / 0.45);
  flex: none;
  color: hsl(33 60% 15%);
}
.role-card-id {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.role-card-name {
  margin: 0;
  font-size: calc(14px * var(--text-scale, 1));
  color: hsl(33 50% 24%);
  font-weight: 700;
}
.role-card-meta {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-mid);
}
.role-card-loc {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-head2);
  display: flex;
  align-items: center;
  gap: 3px;
}
.role-card-divider {
  height: 1px;
  border-top: 1px dashed hsl(33 24% 28% / 0.3);
}
.intimacy-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.intimacy-stage-badge {
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, hsl(43 70% 80% / 0.7), hsl(40 45% 55% / 0.4));
  border: 1px solid hsl(40 40% 38% / 0.5);
  color: hsl(35 50% 22%);
  font-weight: 700;
  white-space: nowrap;
}
.intimacy-dots {
  display: inline-flex;
  gap: 2px;
}
.intimacy-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: hsl(33 24% 28% / 0.18);
  border: 1px solid hsl(33 24% 28% / 0.32);
}
.intimacy-dot.filled {
  background: linear-gradient(180deg, hsl(43 55% 60%), hsl(40 40% 42%));
  border-color: hsl(40 40% 38% / 0.7);
}
.intimacy-quote {
  font-size: calc(11px * var(--text-scale, 1));
  color: hsl(33 18% 28%);
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}
.stamina-state-tag {
  font-size: calc(10px * var(--text-scale, 1));
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
  font-weight: 700;
}
.st-energetic {
  background: hsl(140 30% 38% / 0.18);
  border-color: hsl(140 30% 50% / 0.5);
  color: hsl(140 35% 18%);
}
.st-good {
  background: hsl(100 35% 32% / 0.18);
  border-color: hsl(100 25% 45% / 0.45);
  color: hsl(100 38% 20%);
}
.st-normal {
  background: hsl(43 40% 32% / 0.2);
  border-color: hsl(40 40% 40% / 0.5);
  color: hsl(40 45% 18%);
}
.st-tired {
  background: hsl(18 50% 40% / 0.2);
  border-color: hsl(18 45% 45% / 0.55);
  color: hsl(18 50% 20%);
}
.st-exhausted {
  background: hsl(0 55% 32% / 0.22);
  border-color: hsl(0 50% 38% / 0.65);
  color: hsl(0 55% 22%);
  animation: pulse-low 1.4s ease-in-out infinite;
}
.bladder-state-tag {
  font-size: calc(10px * var(--text-scale, 1));
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
  font-weight: 700;
}
.bladder-state-tag.low {
  background: hsl(100 35% 32% / 0.18);
  border-color: hsl(100 25% 45% / 0.45);
  color: hsl(100 38% 20%);
}
.bladder-state-tag.mid {
  background: hsl(43 40% 35% / 0.2);
  border-color: hsl(40 40% 40% / 0.5);
  color: hsl(40 45% 18%);
}
.bladder-state-tag.high {
  background: hsl(18 50% 40% / 0.2);
  border-color: hsl(18 45% 45% / 0.55);
  color: hsl(18 50% 20%);
}
.bladder-state-tag.critical {
  background: hsl(0 55% 32% / 0.22);
  border-color: hsl(0 50% 38% / 0.65);
  color: hsl(0 55% 22%);
  animation: pulse-low 1.4s ease-in-out infinite;
}
@keyframes pulse-low {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
.profile-meta-pill {
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid hsl(33 24% 28% / 0.35);
  background: hsl(0 0% 100% / 0.3);
  color: var(--ink-soft);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.profile-meta-pill.profile-title {
  background: linear-gradient(180deg, hsl(43 70% 80% / 0.7), hsl(40 45% 55% / 0.4));
  border-color: hsl(35 40% 38% / 0.5);
  color: hsl(35 50% 22%);
  font-weight: 700;
}
.profile-h3 {
  margin: 14px 0 8px;
  color: var(--ink-head2);
  font-size: calc(14px * var(--text-scale, 1));
  display: flex;
  align-items: center;
  gap: 6px;
}
.profile-h3::before {
  content: '✦';
  color: var(--gold);
  font-size: calc(10px * var(--text-scale, 1));
}
.role-detail-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid hsl(33 24% 28% / 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.3), hsl(0 0% 100% / 0.1));
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.5);
  margin-bottom: 6px;
}
.role-avatar-wrap {
  flex: none;
  width: 78px;
  height: 78px;
}
.role-detail-avatar-btn {
  width: 78px;
  height: 78px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 25%, var(--gold-hi), var(--gold));
  border: 2px solid hsl(33 24% 28% / 0.45);
  color: hsl(33 60% 15%);
}
.role-detail-id {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.role-detail-name {
  margin: 0;
  font-size: calc(18px * var(--text-scale, 1));
  color: hsl(33 50% 24%);
}
.role-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.role-detail-tagline {
  margin: 2px 0 0;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-dim);
  font-style: italic;
}
.role-back-btn {
  appearance: none;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid hsl(33 24% 28% / 0.4);
  background: hsl(0 0% 100% / 0.22);
  padding: 5px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
  transition: 0.15s ease;
  color: var(--ink-soft);
  font-size: calc(12px * var(--text-scale, 1));
}
.role-section-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 10px 12px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.role-outfit-line {
  margin: 0;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
  line-height: 1.6;
}
.role-loc-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: calc(13px * var(--text-scale, 1));
  color: hsl(33 45% 22%);
  font-weight: 600;
}
.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}
.status-card {
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 10px 12px;
  display: grid;
  gap: 8px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
}
.status-name {
  font-weight: 700;
  flex: 1;
  color: var(--ink-soft);
}
.status-num {
  font-weight: 700;
  color: hsl(33 45% 22%);
  font-variant-numeric: tabular-nums;
}
.status-bar {
  height: 8px;
  border-radius: 999px;
  background: hsl(33 24% 28% / 0.18);
  border: 1px solid hsl(33 24% 28% / 0.22);
  overflow: hidden;
}
.status-bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--gold-hi), var(--gold));
  transition: width 0.4s ease;
}
</style>
