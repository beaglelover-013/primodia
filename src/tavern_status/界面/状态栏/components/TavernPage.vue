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
      <h2>酒馆 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <section class="panel-glass">
        <h3>酒馆基础设定</h3>
        <div class="kv">
          <div>
            <span>名称</span><strong>{{ tavern['名称'] || '—' }}</strong>
          </div>
          <div>
            <span>所在城市</span><strong>{{ tavern['所在城市'] || '—' }}</strong>
          </div>
          <div>
            <span>整体风格</span><strong>{{ tavern['整体风格'] || '—' }}</strong>
          </div>
        </div>
      </section>

      <section class="panel-glass" style="margin-top: 12px">
        <h3>区域</h3>
        <div class="region-unified">
          <details v-for="(region, name, idx) in tavern['区域列表']" :key="idx" class="region-card" open>
            <summary class="region-summary">
              <div class="region-head">
                <h4>{{ name }}</h4>
                <span class="state" :class="region['状态'] === '正常' || region['状态'] === '整洁' ? 'good' : 'warn'">{{
                  region['状态'] || '正常'
                }}</span>
              </div>
            </summary>
            <div class="region-content">
              <p class="region-desc">{{ region['描述'] }}</p>
              <div v-if="region['设施标签']?.length" class="region-tools">
                <span v-for="(t, ti) in region['设施标签']" :key="ti" class="tag">{{ t }}</span>
              </div>
              <div v-if="region['子空间'] && Object.keys(region['子空间']).length" class="subspace-wrap">
                <div v-for="(ss, sn) in region['子空间']" :key="sn" class="subspace-item">
                  <div class="subspace-top">
                    <strong>{{ sn }}</strong>
                    <span
                      class="state"
                      :class="
                        ss['状态'] === '正常' || ss['状态'] === '空闲' || ss['状态'] === '整洁'
                          ? 'good'
                          : ss['状态'] === '入住'
                            ? 'busy'
                            : 'warn'
                      "
                      >{{ ss['状态'] || '正常' }}</span
                    >
                  </div>
                  <p class="subspace-desc">{{ ss['描述'] }}</p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>
      v-mode.numberHtyp="" class-h
      <section class="panel-glass" style="margin-top: 12px">
        <h3>进行中的制作</h3>
        <div class="brew-list">
          <template v-if="Object.keys(tavern['进行中的制作'] || {}).length">
            <div v-for="(b, name, idx) in tavern['进行中的制作']" :key="idx" class="brew-item">
              <div class="brew-head">
                <strong>{{ name }}</strong>
                <span class="countdown">{{ b['剩余量感'] || b['当前状态'] || '' }}</span>
              </div>
              <div class="brew-meta">
                <span>容器：{{ b['容器'] }}</span>
                <span>所在区域：{{ b['所在区域'] }}</span>
                <span>状态：{{ b['当前状态'] }}</span>
                <span>开始：{{ b['开始'] }}</span>
                <span>预计完成：{{ b['预计完成'] }}</span>
              </div>
            </div>
          </template>
          <p v-else style="color: var(--ink-faint); font-style: italic; padding: 8px 0">暂无进行中的制作。</p>
        </div>
      </section>

      <section class="panel-glass ff-panel" style="margin-top: 12px">
        <h3>经营快进</h3>
        <p class="ff-hint">只填<strong>要跳过的小时数</strong>，生成一段给叙事 AI 的提示。</p>
        <div class="ff-row">
          <label for="ffHours">跳过</label>
          <input type="number" id="ffHours" class="ff-hours" v-model.number="ffHours" min="1" max="48" step="1" />
          <span>小时</span>
          <button type="button" class="inv-act-btn" @click="fastForward">
            <BaseIcon name="FastForward" :size="14" /> 生成叙事提示
          </button>
        </div>
      </section>

      <section class="panel-glass visitor-panel" style="margin-top: 12px">
        <h3>访客骰</h3>
        <p class="visitor-hint">按规则投掷 <strong>1d10000</strong>，四位 ABCD 解码为标签包。</p>
        <button type="button" class="inv-act-btn" @click="rollVisitor">
          <BaseIcon name="Dices" :size="14" /> 投掷 1d10000
        </button>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const tavern = computed(() => (data.value as any)['酒馆'] || {});
const ffHours = ref(3);

function fastForward() {
  const hours = Math.max(1, Math.min(48, ffHours.value));
  const outputEl = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (outputEl)
    outputEl.value = `[经营快进 ${hours}小时提示]\n请根据当前酒馆状态，描述 ${hours} 小时内发生的日常经营事件。`;
}

function rollVisitor() {
  const outputEl = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (outputEl) outputEl.value = '[访客骰 1d10000]\n请在聊天中使用 /r 1d10000 指令获得结果。';
}
</script>

<style scoped>
.ff-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.ff-hours {
  width: 70px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid hsl(33 24% 28% / 0.35);
  background: hsl(0 0% 100% / 0.35);
  color: var(--ink-soft);
  font-size: calc(13px * var(--text-scale, 1));
  font-family: inherit;
  text-align: center;
}
.ff-hint,
.visitor-hint {
  font-size: calc(11px * var(--text-scale, 1));
  color: var(--ink-dim);
  margin: 0;
}
</style>
