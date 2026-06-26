<template>
  <aside class="sidebar">
    <div class="brand"><h1>普利莫迪亚编年录</h1></div>
    <nav class="menu">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-btn"
        :class="{ active: modelValue === item.id }"
        :data-page="item.id"
        @click="$emit('update:modelValue', item.id)"
      >
        <span class="glyph" :class="item.animClass || ''" v-html="item.icon"></span>
        <span class="label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const navItems = [
  {
    id: 'story',
    label: '剧情',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2c2 2.1 1.7 3.8.4 5.4 2.2-.4 3.9 1.5 3.9 3.8 0 2.9-2.1 5.1-4.4 5.1-2.4 0-4.4-2.2-4.4-5.1 0-1.9 1.2-3.5 3-3.8C9.5 5.9 9.9 3.9 12 2zM7.5 16h9v2h-9zm-1.5 3h12v2H6z"/></svg>',
    animClass: 'anim-candle',
  },
  {
    id: 'tavern',
    label: '酒馆',
    icon: '<svg viewBox="0 0 24 24"><path d="M4 5h16l-1 5.5A4.5 4.5 0 0 1 14.6 14H9.4A4.5 4.5 0 0 1 5 10.5L4 5zm7 9h2v4h3v2H8v-2h3v-4z"/></svg>',
  },
  {
    id: 'inventory',
    label: '库存',
    icon: '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4V7zm9-1.9L6 7.8 12 11l6-3.2-6-2.7zm-7 4.3v6.4l6 2.7v-6.4l-6-2.7zm14 0l-6 2.7v6.4l6-2.7V9.4z"/></svg>',
  },
  {
    id: 'shopping',
    label: '购物',
    icon: '<svg viewBox="0 0 24 24"><path d="M7 7l5-4 5 4h4v2h-1.2l-1.5 11.4A2 2 0 0 1 17.3 22H6.7a2 2 0 0 1-2-1.6L3.2 9H2V7h4zm5-1.6L9.3 7h5.4L12 5.4zM5.3 9l1.4 11h10.6l1.4-11H5.3zm3.7 2h2v6H9v-6zm4 0h2v6h-2v-6z"/></svg>',
  },
  {
    id: 'ledger',
    label: '账本',
    icon: '<svg viewBox="0 0 24 24"><path d="M5 3h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V3zm4 4h7v2H9V7zm0 4h7v2H9v-2zm0 4h4v2H9v-2zM3 7h2v12h11v2H5a2 2 0 0 1-2-2V7z"/></svg>',
    animClass: 'anim-ledger',
  },
  {
    id: 'profile',
    label: '玩家档案',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12zm0 2c-3.8 0-7 1.8-7 4v1.5h14V18c0-2.2-3.2-4-7-4z"/></svg>',
  },
  {
    id: 'roles',
    label: '角色',
    icon: '<svg viewBox="0 0 24 24"><path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 13c-3 0-5.5 1.4-5.5 3.2V19h9v-2.8C11.5 14.4 11 13.8 10 13.4A7.2 7.2 0 0 0 8 13zm8 0c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  },
  {
    id: 'map',
    label: '地图',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4.8-12.8-6 2.4-2.4 6 6-2.4 2.4-6z"/></svg>',
    animClass: 'anim-map',
  },
  {
    id: 'farming',
    label: '农田',
    icon: '<svg viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm4 8h2v6H7v-6zm4-4h2v10h-2V8zm4 4h2v6h-2v-6zM4 18h16v2H4v-2z"/></svg>',
  },
  {
    id: 'brewing',
    label: '酿酒',
    icon: '<svg viewBox="0 0 24 24"><path d="M7 2h10v2H7V2zm2 4h6v1H9V6zm-1 3h8v1H8V9zm6 3v10l-4-2-4 2V12h8z"/></svg>',
  },
  {
    id: 'construction',
    label: '建造',
    icon: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 15.6 12 3.6 3.6 0 0 1 12 15.6z"/></svg>',
  },
  {
    id: 'employees',
    label: '员工',
    icon: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  },
  {
    id: 'business',
    label: '产业',
    icon: '<svg viewBox="0 0 24 24"><path d="M21 6h-2V3H5v3H3c-1.1 0-2 .9-2 2v7h2.22c.42 1.36 1.67 2.33 3.14 2.33 1.47 0 2.72-.97 3.14-2.33h4.97c.42 1.36 1.67 2.33 3.14 2.33 1.47 0 2.72-.97 3.14-2.33H23V8c0-1.1-.9-2-2-2zM7 5h10v1H7V5zm2 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>',
  },
  {
    id: 'adventure',
    label: '冒险',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  },
  {
    id: 'relationships',
    label: '关系',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  },
  {
    id: 'debug',
    label: '调试',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v1h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v1h2V5a1 1 0 0 0-1-1zM8 10v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/></svg>',
  },
];
</script>

<style scoped>
.sidebar {
  border-right: 1px solid rgba(201, 163, 74, 0.3);
  background:
    radial-gradient(circle at 0% 0%, rgba(242, 218, 158, 0.18), transparent 42%),
    linear-gradient(180deg, #3f2b1d, #2b1e14);
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}
.brand {
  padding: 12px 10px 10px;
  border-bottom: 1px solid rgba(201, 163, 74, 0.22);
  color: #f4e3bf;
}
.brand h1 {
  margin: 0;
  font-size: calc(16px * var(--text-scale, 1));
  letter-spacing: 0.4px;
  color: var(--gold-hi);
  text-shadow: 0 1px 0 #000;
}
.menu {
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nav-btn {
  appearance: none;
  border: none;
  width: 100%;
  border-radius: 10px;
  cursor: pointer;
  padding: 7px 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  color: #f3dfb8;
  border: 1px solid rgba(201, 163, 74, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.1)), linear-gradient(180deg, #563b27, #3d2a1b);
  position: relative;
  overflow: hidden;
  transition: 0.2s ease;
  font-family: inherit;
  font-size: inherit;
}
.nav-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: linear-gradient(180deg, var(--gold-hi), var(--gold));
  transition: width 0.22s ease;
}
.nav-btn:hover {
  transform: translateX(2px);
  border-color: rgba(242, 218, 158, 0.5);
}
.nav-btn.active {
  color: #2d1f13;
  border-color: rgba(242, 218, 158, 0.76);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(0, 0, 0, 0.05)), linear-gradient(180deg, #e5c57a, #b88f40);
}
.nav-btn.active::before {
  width: 4px;
}
.glyph {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 7px;
  display: grid;
  place-items: center;
  color: #f6e8ca;
  border: 1px solid rgba(242, 218, 158, 0.32);
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 240, 200, 0.22), transparent 45%),
    linear-gradient(180deg, #6a492c, #4b331f);
  position: relative;
  z-index: 1;
}
.glyph svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  display: block;
}
.label {
  font-weight: 700;
  font-size: calc(13px * var(--text-scale, 1));
  z-index: 1;
}
.nav-btn.active .glyph {
  color: #5a3b1d;
  border-color: rgba(242, 218, 158, 0.75);
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.5), transparent 48%),
    linear-gradient(180deg, #f0d899, #caa24c);
}
.anim-candle svg {
  animation: flicker 1.9s ease-in-out infinite;
}
.anim-ledger svg {
  animation: bookSwing 2.8s ease-in-out infinite;
}
.anim-map svg {
  animation: compass 3.2s ease-in-out infinite;
}
</style>
