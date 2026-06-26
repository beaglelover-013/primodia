<template>
  <svg ref="svgRef" class="world-map" :viewBox="viewBoxStr">
    <defs>
      <pattern id="mapDots" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="10" fill="rgba(111,74,33,.06)" />
      </pattern>
      <radialGradient id="playerPulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(242,218,158,.4)" />
        <stop offset="100%" stop-color="rgba(242,218,158,0)" />
      </radialGradient>
    </defs>
    <rect :x="-8750" :y="-12500" :width="20000" :height="27500" fill="url(#mapDots)" />
    <g class="map-grid">
      <line
        v-for="(l, i) in gridLines"
        :key="'v' + i"
        :x1="l.x1"
        :x2="l.x2"
        :y1="l.y1"
        :y2="l.y2"
        :class="l.axis ? 'axis-origin' : ''"
      />
      <text v-for="(l, i) in gridLabels" :key="'l' + i" :x="l.x" :y="l.y" :class="l.axis ? 'axis-origin' : ''">
        {{ l.text }}
      </text>
    </g>
    <g class="map-edges">
      <line
        v-for="(e, i) in mapData.edges"
        :key="'e' + i"
        class="map-edge"
        :class="transportClass(e.transport)"
        :x1="nodePos(e.from).x"
        :y1="nodePos(e.from).y"
        :x2="nodePos(e.to).x"
        :y2="nodePos(e.to).y"
        :data-from="e.from"
        :data-to="e.to"
      />
    </g>
    <g class="map-nodes">
      <g
        v-for="n in mapData.nodes"
        :key="n.id"
        class="map-node"
        :class="['type-' + n.type, { selected: selected === n.id }]"
        :transform="'translate(' + n.x + ' ' + -n.y + ')'"
        :data-node-id="n.id"
        @click="$emit('select', n.id)"
      >
        <circle v-if="n.id === mapData.playerNode" class="map-player-ring" r="100" />
        <circle class="map-node-circle" :class="'faction-' + n.faction" :r="nodeRadius(n.type)" />
        <path
          v-if="n.id === mapData.playerNode"
          class="map-player-star"
          d="M0 -26 L6.5 -8 L26 -8 L10.5 4.7 L16 24.7 L0 13 L-16 24.7 L-10.5 4.7 L-26 -8 L-6.5 -8 Z"
        />
        <text class="map-node-label" :y="nodeRadius(n.type) + 40">{{ n.name }}</text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

defineProps<{
  mapData: any;
  selected: string;
}>();

defineEmits<{ (e: 'select', v: string): void }>();

const svgRef = ref<SVGSVGElement | null>(null);

const vb = ref({ x: -7000, y: -9750, w: 16250, h: 19250 });
const viewBoxStr = computed(() => `${vb.value.x} ${vb.value.y} ${vb.value.w} ${vb.value.h}`);

const TRANSPORT_CLASS: Record<string, string> = {
  官道: 't-road',
  乡道: 't-trail',
  水路: 't-water',
  山路: 't-mountain',
  林径: 't-forest',
  海路: 't-sea',
};

function transportClass(t: string) {
  return TRANSPORT_CLASS[t] || '';
}

const nodeById = new Map<string, any>();

function nodePos(id: string) {
  const n = nodeById.get(id);
  return n ? { x: n.x, y: -n.y } : { x: 0, y: 0 };
}

function nodeRadius(type: string) {
  const radii: Record<string, number> = { city: 45, town: 30, village: 20 };
  return radii[type] || 10;
}

// Grid lines
const gridLines = computed(() => {
  const SCALE = 2.5,
    STEP = 500;
  const lines: any[] = [];
  const xMin = -3000,
    xMax = 3500,
    yMin = -4000,
    yMax = 4000;
  for (let ox = xMin; ox <= xMax; ox += STEP) {
    const sx = ox * SCALE;
    lines.push({ x1: sx, x2: sx, y1: -yMax * SCALE, y2: -yMin * SCALE, axis: ox === 0 });
  }
  for (let oy = yMin; oy <= yMax; oy += STEP) {
    const sy = -oy * SCALE;
    lines.push({ x1: xMin * SCALE, x2: xMax * SCALE, y1: sy, y2: sy, axis: oy === 0 });
  }
  return lines;
});

const gridLabels = computed(() => {
  const SCALE = 2.5,
    STEP = 500;
  const labels: any[] = [];
  const xMin = -3000,
    xMax = 3500,
    yMin = -4000,
    yMax = 4000;
  for (let ox = xMin; ox <= xMax; ox += STEP)
    labels.push({ x: ox * SCALE + 12, y: -yMin * SCALE - 30, text: `x=${ox}`, axis: ox === 0 });
  for (let oy = yMin; oy <= yMax; oy += STEP)
    labels.push({ x: xMin * SCALE + 30, y: -oy * SCALE - 12, text: `y=${oy}`, axis: oy === 0 });
  return labels;
});
</script>

<style scoped>
.world-map {
  width: 100%;
  height: 100%;
  display: block;
}
.map-edge {
  stroke-width: 8;
  stroke-linecap: round;
  fill: none;
  transition:
    opacity 0.2s ease,
    stroke-width 0.2s ease;
}
.map-edge.t-road {
  stroke: #bd9445;
}
.map-edge.t-trail {
  stroke: #8a6a3a;
  stroke-dasharray: 25 15;
}
.map-edge.t-water {
  stroke: #4a7da9;
}
.map-edge.t-mountain {
  stroke: #8a5a2c;
}
.map-edge.t-forest {
  stroke: #3e6e3a;
  stroke-dasharray: 20 12;
}
.map-edge.t-sea {
  stroke: #3a7aaa;
  stroke-dasharray: 30 15;
}
.map-node-circle {
  stroke: rgba(80, 50, 20, 0.7);
  stroke-width: 4;
  transition:
    stroke-width 0.2s ease,
    filter 0.2s ease;
}
.map-node:hover .map-node-circle {
  stroke-width: 6;
}
.map-node.selected .map-node-circle {
  stroke: #5a3a0e;
  stroke-width: 6;
  filter: drop-shadow(0 0 10px rgba(154, 116, 47, 0.6));
}
.map-node-label {
  font-size: calc(50px * var(--text-scale, 1));
  fill: #5a3b1c;
  font-weight: 700;
  pointer-events: none;
  text-shadow:
    0 0 15px rgba(255, 255, 240, 0.85),
    0 0 16px rgba(255, 255, 240, 0.85);
}
.map-node.selected .map-node-label {
  fill: #1f1408;
}
.map-player-ring {
  fill: url(#playerPulse);
  pointer-events: none;
}
.map-player-star {
  fill: #f2da9e;
  stroke: #9a742f;
  stroke-width: 3;
  pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(242, 218, 158, 0.7));
}
</style>
