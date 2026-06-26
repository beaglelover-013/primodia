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

    <div class="paper-h-dad">
      <h2>地图 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    de" class="map-tail
    <div class="paper-body">
      <p class="map-tagline">点击节点查看详情。</p>
      <div class="map-toolbar">
        <button type="button" class="map-tool-btn" @click="selectNode(mapData.playerNode)">
          <BaseIcon name="MapPin" :size="14" /> 回到玩家
        </button>
        <button type="button" class="map-tool-btn" @click="copyMapInfo">
          <BaseIcon name="Clipboard" :size="14" /> 复制位置摘要
        </button>
      </div>
      <div class="map-canvas-wrap">
        <MapCanvas :mapData="mapData" :selected="selectedId" @select="selectNode" />
      </div>
      <div class="map-detail" v-if="selectedNode">
        <div class="map-detail-head">
          <h4 class="map-detail-name">{{ selectedNode.name }}</h4>
          <span class="map-detail-pill">{{ typeLabel(selectedNode.type) }}</span>
          <span class="map-detail-pill">{{ selectedNode.factionLabel }}</span>
          <span v-if="selectedId === mapData.playerNode" class="map-detail-pill is-player"
            ><BaseIcon name="MapPin" :size="10" /> 玩家所在</span
          >
          <span class="map-detail-pill">{{ selectedNode.func }}</span>
          <span class="map-detail-pill">{{ selectedNode.geo }}</span>
        </div>
        <p class="map-detail-desc">{{ selectedNode.desc }}</p>
        <div class="map-detail-section">
          <h5>相邻节点（{{ adjList.length }}）</h5>
          <ul class="map-neighbor-list">
            <li v-for="n in adjList" :key="n.neighborId" @click="selectNode(n.neighborId)">
              <b>{{ nodeById.get(n.neighborId)?.name }}</b>
              <span style="opacity: 0.6"> {{ nodeById.get(n.neighborId)?.factionLabel }}</span>
              ｜{{ n.distance }}km｜{{ n.time }}｜{{ n.transport }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import BaseIcon from './BaseIcon.vue';
import MapCanvas from './MapCanvas.vue';

const MAP_NODES_RAW = `naveris|纳维里斯|0|0|city|neutral|中立|冒险者工会|内陆盆地|冒险者工会直辖中立城市
gronhaven|克朗港|-650|150|city|vestoria|韦斯托利亚|商贸|沿海·港口|银冠河入海口天然避风港
weissklippe|白崖城|-720|-80|city|vestoria|韦斯托利亚|学术·教育|沿海·港口|南部海岸白色悬崖
bramwick|布拉姆维克|-520|-80|village|vestoria|韦斯托利亚|农业·牧业|丘陵·缓坡|南部偏远丘陵地带
fairmark|费尔马克|-480|-60|town|vestoria|韦斯托利亚|商贸|沿河·沿湖|发石河畔丘陵集市
kronburg|王冠堡|0|350|city|calderia|卡尔德里亚|行政|沿河·沿湖|银冠河与东支流交汇处
ambossfahre|铁砧渡|-100|250|city|calderia|卡尔德里亚|商贸|沿河·沿湖|银冠河中游最重要渡口
ahrenfeld|麦穗原|80|280|town|calderia|卡尔德里亚|农业|内陆平原|腹地最肥沃麦田区
weissstein|白石修道院|-50|450|town|calderia|卡尔德里亚|宗教|丘陵·缓坡|北部丘陵古老修道院群
zhongfeng|忠风城|450|200|city|beast|兽族·犬邦|行政|内陆平原|鸣原草原核心
feiye|翡叶城|200|-600|city|elf|精灵|行政|森林·密林|翡叶永森最古老巨树
jinxi|金曦城|-400|-300|city|dragonborn|龙裔|行政|山地·高原|阿什卡纳尔高原绿洲
zaoan|灶安城|250|50|city|long|珑族|行政|沿河·沿湖|灶丘温暖河谷珑族祖籍`.trim();

const nodes = MAP_NODES_RAW.split('\n').map(line => {
  const p = line.split('|');
  return {
    id: p[0],
    name: p[1],
    x: +p[2],
    y: +p[3],
    type: p[4],
    faction: p[5],
    factionLabel: p[6],
    func: p[7],
    geo: p[8],
    desc: p[9],
  };
});

const coords: Record<string, [number, number]> = {
  naveris: [0, 0],
  gronhaven: [-4125, 1050],
  weissklippe: [-4625, -650],
  bramwick: [-3350, -1075],
  fairmark: [-3050, -900],
  kronburg: [-400, 2325],
  ambossfahre: [-1300, 1625],
  ahrenfeld: [300, 1900],
  weissstein: [-825, 3200],
  zhongfeng: [3950, 2450],
  feiye: [-300, -6200],
  jinxi: [-4200, -2950],
  zaoan: [1550, -450],
};
nodes.forEach(n => {
  const c = coords[n.id];
  if (c) {
    n.x = c[0];
    n.y = c[1];
  }
});

const nodeById = new Map(nodes.map(n => [n.id, n]));

function guessTransport(a: any, b: any) {
  const g = a.geo + b.geo;
  if (g.includes('海') || g.includes('港')) return '海路';
  if (g.includes('河') || g.includes('湖') || g.includes('水')) return '水路';
  if (g.includes('山') || g.includes('地下') || g.includes('高原')) return '山路';
  if (g.includes('森林') || g.includes('密林')) return '林径';
  if (a.type === 'city' || b.type === 'city') return '官道';
  return '乡道';
}

function buildEdges(nodes: any[]) {
  const edges: any[] = [];
  const set = new Set<string>();
  const byId = new Map(nodes.map(n => [n.id, n]));
  const add = (a: any, b: any, t: string) => {
    const k = [a.id, b.id].sort().join('|');
    if (set.has(k)) return;
    set.add(k);
    const straight = Math.hypot(a.x - b.x, a.y - b.y) * 0.2;
    const roadMult: Record<string, number> = { 官道: 1.25, 乡道: 1.35, 水路: 1.0, 山路: 1.65, 林径: 1.5, 海路: 1.0 };
    const km = Math.round(straight * (roadMult[t] || 1.3));
    const spd: Record<string, number> = { 官道: 50, 乡道: 38, 水路: 90, 山路: 28, 林径: 32, 海路: 140 };
    const d = km / (spd[t] || 40);
    const time = d < 1 ? '约' + Math.max(1, Math.round(d * 24)) + '时' : '约' + d.toFixed(1) + '日';
    edges.push({ from: a.id, to: b.id, distance: km, time, transport: t });
  };
  const groups: Record<string, any[]> = {};
  nodes.forEach(n => (groups[n.faction] ||= []).push(n));
  Object.values(groups).forEach(g => {
    g.forEach(n => {
      const near = g
        .filter(o => o !== n)
        .map(o => ({ n: o, d: Math.hypot(o.x - n.x, o.y - n.y) }))
        .sort((a, b) => a.d - b.d);
      near.slice(0, n.type === 'city' ? 3 : 2).forEach(({ n: o }) => add(n, o, guessTransport(n, o)));
    });
  });
  [
    ['fairmark', 'bramwick', '乡道'],
    ['kronburg', 'fairmark', '官道'],
    ['kronburg', 'naveris', '官道'],
    ['naveris', 'zaoan', '官道'],
    ['naveris', 'jinxi', '官道'],
    ['naveris', 'feiye', '官道'],
    ['weissstein', 'kronburg', '官道'],
    ['ambossfahre', 'kronburg', '官道'],
    ['ambossfahre', 'weissstein', '官道'],
    ['ahrenfeld', 'kronburg', '官道'],
    ['zhongfeng', 'naveris', '官道'],
    ['gronhaven', 'ambossfahre', '水路'],
    ['gronhaven', 'weissklippe', '官道'],
  ].forEach(([fid, tid, t]) => {
    const f = byId.get(fid),
      o = byId.get(tid);
    if (f && o) add(f, o, t as string);
  });
  return edges;
}

const mapData = reactive({
  regionName: '卡瑞西亚大陆',
  playerNode: 'bramwick',
  nodes,
  edges: buildEdges(nodes),
  byId: nodeById,
});
const selectedId = ref('bramwick');
const selectedNode = computed(() => nodeById.get(selectedId.value) || null);
const TYPE_LABEL: Record<string, string> = { city: '城市', town: '城镇', village: '村庄' };
function typeLabel(t: string) {
  return TYPE_LABEL[t] || t;
}
function getEdgesOf(nodeId: string) {
  return (mapData.edges as any[])
    .filter((e: any) => e.from === nodeId || e.to === nodeId)
    .map((e: any) => ({ ...e, neighborId: e.from === nodeId ? e.to : e.from }));
}
const adjList = computed(() => getEdgesOf(selectedId.value).sort((a: any, b: any) => a.distance - b.distance));
function selectNode(id: string) {
  selectedId.value = id;
}

function copyMapInfo() {
  const node = selectedNode.value;
  if (!node) return;
  const adj = getEdgesOf(node.id).sort((a: any, b: any) => a.distance - b.distance);
  const lines: string[] = [
    '<map_info>',
    '<map_loader>',
    '位置：' + node.name,
    '节点：' + node.name + '（' + typeLabel(node.type) + '·' + node.factionLabel + '）',
    '功能：' + node.func + '｜地理：' + node.geo,
    '相邻（' + adj.length + '）：',
  ];
  for (const n of adj) {
    const nb = nodeById.get(n.neighborId);
    lines.push(
      '- ' +
        nb.name +
        '（' +
        nb.factionLabel +
        '·' +
        typeLabel(nb.type) +
        '）｜' +
        n.distance +
        'km｜' +
        n.time +
        '｜' +
        n.transport,
    );
  }
  lines.push('', '相邻简述：');
  for (const n of adj) {
    const nb = nodeById.get(n.neighborId);
    lines.push('- ' + nb.name + '（' + nb.factionLabel + '）— ' + nb.desc);
  }
  lines.push('</map_loader>', '</map_info>');
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) {
    out.value = lines.join('\n');
    out.scrollTop = 0;
  }
}
</script>

<style scoped>
.map-tagline {
  margin: 0 0 10px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
}
.map-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.map-tool-btn {
  appearance: none;
  font-family: inherit;
  font-size: calc(12px * var(--text-scale, 1));
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid hsl(33 24% 28% / 0.35);
  background: hsl(0 0% 100% / 0.25);
  color: var(--ink-soft);
  cursor: pointer;
  transition: 0.12s ease;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.map-tool-btn:hover {
  background: hsl(43 50% 70% / 0.4);
  border-color: hsl(33 24% 28% / 0.55);
}
.map-canvas-wrap {
  border: 1px solid hsl(33 24% 28% / 0.4);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(40 30% 70%), hsl(35 25% 62%));
  overflow: hidden;
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}
.map-detail {
  margin-top: 8px;
  border: 1px solid hsl(33 24% 28% / 0.38);
  border-radius: 10px;
  background: linear-gradient(180deg, hsl(0 0% 100% / 0.22), hsl(0 0% 100% / 0.1));
  padding: 12px;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.4);
}
.map-detail-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}
.map-detail-name {
  margin: 0;
  font-size: calc(16px * var(--text-scale, 1));
  color: var(--ink-strong);
  flex: 1 1 100%;
}
.map-detail-pill {
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid hsl(33 24% 28% / 0.32);
  background: hsl(0 0% 100% / 0.25);
  color: var(--ink-soft);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.map-detail-pill.is-player {
  background: linear-gradient(180deg, hsl(43 70% 80% / 0.7), hsl(40 45% 55% / 0.4));
  border-color: hsl(35 40% 38% / 0.5);
  color: hsl(35 50% 22%);
  font-weight: 700;
}
.map-detail-desc {
  margin: 0 0 8px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
  line-height: 1.6;
}
.map-detail-section {
  margin-top: 10px;
}
.map-detail-section h5 {
  margin: 0 0 4px;
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-head2);
  font-weight: 700;
}
.map-neighbor-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 3px;
}
.map-neighbor-list li {
  padding: 4px 8px;
  border-radius: 6px;
  background: hsl(0 0% 100% / 0.15);
  font-size: calc(12px * var(--text-scale, 1));
  color: var(--ink-soft);
  cursor: pointer;
  transition: 0.12s ease;
}
.map-neighbor-list li:hover {
  background: hsl(43 50% 70% / 0.3);
}
</style>
