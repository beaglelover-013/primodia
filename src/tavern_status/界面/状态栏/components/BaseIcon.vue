<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="fill || 'none'"
    :stroke="stroke || 'currentColor'"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="base-icon"
  >
    <path :d="iconPath" />
    <template v-if="extraPaths && extraPaths.length">
      <path v-for="(p, i) in extraPaths" :key="i" :d="p" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    fill?: string;
    stroke?: string;
  }>(),
  {
    size: 16,
    fill: 'none',
    stroke: 'currentColor',
  },
);

type IconEntry = { d: string; paths?: string[] };

const ICON_MAP: Record<string, IconEntry> = {
  Sparkles: {
    d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
    paths: ['M5 3v4', 'M19 17v4', 'M3 5h4', 'M17 19h4'],
  },
  X: { d: 'M18 6 6 18M6 6l12 12' },
  Minus: { d: 'M5 12h14' },
  Check: { d: 'M20 6 9 17l-5-5' },
  User: { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  UserCircle: { d: 'M18 20a6 6 0 0 0-12 0M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  Heart: {
    d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  },
  Zap: { d: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' },
  Droplets: {
    d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05zM9.3 17.65A5.2 5.2 0 0 0 12 19c2.21 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S11.29 9.75 11 8.3c-.09.46-.26.9-.49 1.32',
  },
  ChefHat: {
    d: 'M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6zM6 17h12',
  },
  CookingPot: { d: 'M2 12h20M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8M4 16' },
  FlaskConical: {
    d: 'M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7M7 15h10',
  },
  UtensilsCrossed: { d: 'M16 2v5.4a2.4 2.4 0 0 0 .4 1.4l3 4.2V22M8 2v5.4a2.4 2.4 0 0 1-.4 1.4L5 11V22M8 12h8M6 10h12' },
  Wine: { d: 'M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z' },
  Beer: {
    d: 'M17 11h1a3 3 0 0 1 0 6h-1M9 12v6M13 12v6M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z',
  },
  Sprout: { d: 'M14.5 2v2.5M10.5 2v2.5M12 4.5V17M7 17h10' },
  Hammer: { d: 'M15 12-8.5 8.5a2.12 2.12 0 0 1 0-3L15 4l4 4-3.5 3.5 0 0Z' },
  Swords: { d: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21 5 21l6-6' },
  FastForward: { d: 'M13 19V5l8 7-8 7ZM3 19V5l8 7-8 7Z' },
  Dices: { d: 'M12 7h.01M7 12h.01M17 12h.01M12 17h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  ReceiptText: { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1L20 2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1L4 2Z' },
  Clipboard: {
    d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M15 2H9a1 1 0 0 0-1 1v1h8V3a1 1 0 0 0-1-1z',
  },
  RefreshCw: {
    d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5',
  },
  Download: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
  Upload: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  Stethoscope: {
    d: 'M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .3.3',
  },
  MapPin: { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' },
  CalendarDays: { d: 'M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' },
  Users: {
    d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  Bed: { d: 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9' },
  TrendingUp: { d: 'M22 7 13.5 15.5 8.5 10.5 2 17M22 7v-5h-5' },
};

const entry = computed<IconEntry>(() => ICON_MAP[props.name] || { d: '' });
const iconPath = computed(() => entry.value.d);
const extraPaths = computed(() => entry.value.paths);
</script>

<style scoped>
.base-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
