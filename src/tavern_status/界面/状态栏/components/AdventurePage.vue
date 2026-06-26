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
      <h2>冒险 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <p class="map-tagline">深界——地表之下的广袤平行世界。越深越壮丽、越危险、资源越稀有。</p>
      <div style="display: grid; gap: 8px">
        <details v-for="r in realms" :key="r.level" class="region-card" :open="r.level <= 3">
          <summary class="region-summary">
            <div class="region-head">
              <h4>L{{ r.level }} · {{ r.name }}</h4>
              <span class="state" :class="r.zone === 'commute' ? 'good' : 'warn'">{{
                r.zone === 'commute' ? '通勤' : '远征'
              }}</span>
            </div>
          </summary>
          <div class="region-content">
            <p class="region-desc">{{ r.tagline }}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px">
              <span class="tag">等级: {{ r.rankRequired }}</span>
              <span v-for="(a, ai) in r.aliases.slice(0, 2)" :key="ai" class="tag">{{ a }}</span>
            </div>
            <p style="font-size: calc(11px * var(--text-scale, 1)); color: var(--ink-dim); margin: 6px 0 0">
              {{ r.zone === 'commute' ? '通勤区（24h内可原路返回）' : '远征区（返回经纳维里斯）' }}
            </p>
            <p class="subspace-desc" style="margin-top: 4px">{{ r.firstImpression }}</p>
            <div style="margin-top: 4px; font-size: calc(10px * var(--text-scale, 1)); color: var(--ink-faint)"></div>
            资源: {{ (r.resources || []).slice(0, 4).join('、') }}
          </div>
        </details>
      </div>
      <div class="panel-glass" style="margin-top: 12px">
        <h3>自由出发</h3>
        <p style="font-size: calc(11px * var(--text-scale, 1)); color: var(--ink-dim); margin: 0 0 8px">
          输入目的地名称，AI 会帮你展开冒险叙事。
        </p>
        <button type="button" class="inv-act-btn" @click="goAdventure">
          <BaseIcon name="Swords" :size="14" /> 跟 AI 说想去哪冒险
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseIcon from './BaseIcon.vue';

const DEEP_REALMS = [
  {
    level: 1,
    name: '翠风原野',
    zone: 'commute',
    rankRequired: '入门',
    tagline: '绿草如茵，微风拂面——深界最温柔的问候。',
    aliases: ['繁花原', '初风原'],
    resources: ['药草', '野果', '低级魔素结晶'],
    firstImpression: '踏入深界的第一站，阳光透过晶壁投射出奇异的虹彩，空气比地表更加清新。',
  },
  {
    level: 2,
    name: '深岩矿域',
    zone: 'commute',
    rankRequired: '初涉深界',
    tagline: '岩石的脉络中流淌着矿物的光芒。',
    aliases: ['矿脉回廊', '黑曜石洞穴'],
    resources: ['铜矿', '铁矿', '魔素石碎片'],
    firstImpression: '昏暗的通道中，墙壁上嵌着发光的矿物颗粒，远处传来矿镐的回响。',
  },
  {
    level: 3,
    name: '千柱深林',
    zone: 'commute',
    rankRequired: '熟悉深界',
    tagline: '巨大的石柱如古树的躯干般支撑着穹顶。',
    aliases: ['柱林', '回声森林'],
    resources: ['魔法木材', '荧光苔藓', '中级魔素结晶'],
    firstImpression: '无数天然石柱林立，缠绕着发光的藤蔓，整个空间笼罩在幽蓝的微光中。',
  },
  {
    level: 4,
    name: '万蔓雨林',
    zone: 'expedition',
    rankRequired: '老练探险者',
    tagline: '茂密的深界植被织成一张巨大的生命力之网。',
    aliases: ['荆棘迷宫', '翠绿深渊'],
    resources: ['稀有药材', '高等木料', '生物样本'],
    firstImpression: '湿热的气息扑面而来，巨大的蕨类植物在荧光菌类的映照下呈现出梦幻般的轮廓。',
  },
  {
    level: 5,
    name: '焰潮群岛',
    zone: 'expedition',
    rankRequired: '深界专家',
    tagline: '岩浆河上的孤岛群，火与土的史诗。',
    aliases: ['火焰迷宫', '熔岩列岛'],
    resources: ['火晶石', '黑曜石', '耐热合金'],
    firstImpression: '灼热的气浪扭曲了视线，黑色的岩石岛屿漂浮在暗红色的岩浆河流上，仿佛地狱中的渡口。',
  },
  {
    level: 6,
    name: '澄镜牧野',
    zone: 'expedition',
    rankRequired: '深界专家',
    tagline: '水晶般透明的巨大湖泊倒映着穹顶的光怪陆离。',
    aliases: ['镜湖原', '幻光平原'],
    resources: ['净水结晶', '月长石', '幻光孢子'],
    firstImpression: '湖面如镜，倒映着数百米高处穹顶上发光的晶簇，宛如另一个星空世界。',
  },
  {
    level: 7,
    name: '苍嶂群峰',
    zone: 'expedition',
    rankRequired: '传奇',
    tagline: '深界中最接近天穹的地方——但这里的天穹依然是岩石。',
    aliases: ['天柱山', '云顶峰林'],
    resources: ['天空矿', '远古化石', '高阶魔素核心'],
    firstImpression: '巨大的石峰刺向穹顶，山间云雾缭绕，空气中弥漫着远古的气息。',
  },
];
const realms = ref(DEEP_REALMS);
function goAdventure() {
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) out.value = '[冒险]\n请在聊天中告诉 AI 你想去哪里冒险。';
}
</script>

<style scoped>
.subspace-desc {
  margin: 0;
  font-size: calc(11px * var(--text-scale, 1));
  color: hsl(33 18% 28%);
  line-height: 1.5;
}
</style>
