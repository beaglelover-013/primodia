<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import PmIcon from '../components/PmIcon.vue';

interface GalleryImage {
  id: string;
  title: string;
  group: string;
  url: string;
  note: string;
}

const STORAGE_KEY = 'primordia-gallery-images';

const defaultImages: GalleryImage[] = [
  {
    id: 'sample-1',
    title: '铁壶酒馆 · 门前雨夜',
    group: '酒馆',
    url: '',
    note: '这里可以放图床链接。空链接不会显示图片, 只作为占位提醒。',
  },
];

const images = ref<GalleryImage[]>([]);
const activeId = ref<string | null>(null);
const filter = ref('全部');
const draft = reactive({
  title: '',
  group: '酒馆',
  url: '',
  note: '',
});

const groups = computed(() => ['全部', ...Array.from(new Set(images.value.map(item => item.group).filter(Boolean)))]);
const visibleImages = computed(() => (filter.value === '全部' ? images.value : images.value.filter(item => item.group === filter.value)));
const activeImage = computed(() => images.value.find(item => item.id === activeId.value) ?? null);

function loadGallery() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    images.value = Array.isArray(parsed) ? parsed : defaultImages;
  } catch {
    images.value = defaultImages;
  }
}

function saveGallery() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images.value));
}

function addImage() {
  const url = draft.url.trim();
  if (!url) return;
  images.value.unshift({
    id: `cg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: draft.title.trim() || '未命名画卷',
    group: draft.group.trim() || '未分类',
    url,
    note: draft.note.trim(),
  });
  draft.title = '';
  draft.url = '';
  draft.note = '';
  saveGallery();
}

function removeImage(id: string) {
  images.value = images.value.filter(item => item.id !== id);
  if (activeId.value === id) activeId.value = null;
  saveGallery();
}

function openImage(item: GalleryImage) {
  if (!item.url) return;
  activeId.value = item.id;
}

onMounted(loadGallery);
</script>

<template>
  <section id="page-gallery" class="page pm-paper">
    <header class="pm-paper-head">
      <div>
        <h2 class="h-title">
          <PmIcon name="map" :size="22" />
          图册画廊
        </h2>
        <div class="sub">图床收藏 {{ images.length }} 张 · 仅前端展示, 不写入变量</div>
      </div>
    </header>

    <div class="pm-paper-body gallery-layout">
      <aside class="gallery-form pm-card">
        <h3>收进画册</h3>
        <label class="pm-field">
          <span>标题</span>
          <input v-model="draft.title" class="pm-input" placeholder="例如: 雨夜主厅、阿黛拉立绘、后院菜畦" />
        </label>
        <label class="pm-field">
          <span>分类</span>
          <input v-model="draft.group" class="pm-input" placeholder="例如: 酒馆、人物、料理、地图、氛围" />
        </label>
        <label class="pm-field">
          <span>图床链接</span>
          <input v-model="draft.url" class="pm-input" placeholder="https://..." />
        </label>
        <label class="pm-field">
          <span>备注</span>
          <textarea v-model="draft.note" class="pm-textarea" placeholder="给自己看的简短备注, 可不填。"></textarea>
        </label>
        <button class="pm-btn" :disabled="!draft.url.trim()" @click="addImage">
          <PmIcon name="plus" :size="13" /> 加入图册
        </button>
      </aside>

      <main class="gallery-main">
        <div class="gallery-tabs">
          <button v-for="group in groups" :key="group" :class="{ active: filter === group }" @click="filter = group">
            {{ group }}
          </button>
        </div>

        <div class="gallery-grid">
          <article v-for="item in visibleImages" :key="item.id" class="cg-card" :class="{ empty: !item.url }">
            <button class="cg-thumb" @click="openImage(item)">
              <img v-if="item.url" :src="item.url" :alt="item.title" loading="lazy" />
              <span v-else>等待图床链接</span>
            </button>
            <div class="cg-info">
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.group }}</small>
              </div>
              <button class="pm-link" title="移出图册" @click="removeImage(item.id)">
                <PmIcon name="x" :size="14" />
              </button>
            </div>
            <p v-if="item.note">{{ item.note }}</p>
          </article>
        </div>

        <div v-if="visibleImages.length === 0" class="pm-empty">这个分类还没有图片。</div>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="activeImage" class="cg-mask" @click.self="activeId = null">
        <div class="cg-viewer">
          <header>
            <div>
              <strong>{{ activeImage.title }}</strong>
              <span>{{ activeImage.group }}</span>
            </div>
            <button class="pm-link" @click="activeId = null"><PmIcon name="x" :size="18" /></button>
          </header>
          <img :src="activeImage.url" :alt="activeImage.title" />
          <p v-if="activeImage.note">{{ activeImage.note }}</p>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.34fr) minmax(420px, 1fr);
  gap: 16px;
  align-items: start;
}

.gallery-form {
  padding: 16px;
  display: grid;
  gap: 12px;
}
.gallery-form h3 {
  margin: 0;
  font-family: var(--pm-font-display);
  color: var(--pm-ink);
  letter-spacing: 0.08em;
}
.gallery-form .pm-btn {
  width: 100%;
  justify-content: center;
}

.gallery-main {
  min-width: 0;
}
.gallery-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.gallery-tabs button {
  flex: 0 0 auto;
  border: 1px solid rgba(134, 97, 42, 0.35);
  background: rgba(255, 248, 226, 0.52);
  color: var(--pm-ink-soft);
  border-radius: 4px;
  padding: 7px 12px;
  font-family: var(--pm-font-display);
}
.gallery-tabs button.active {
  background: linear-gradient(180deg, #e9c970, #b9872c);
  color: #21170d;
  box-shadow: inset 0 1px 0 rgba(255, 248, 226, 0.7);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}
.cg-card {
  border: 1px solid rgba(134, 97, 42, 0.28);
  background:
    linear-gradient(135deg, rgba(255, 252, 236, 0.7), rgba(231, 207, 151, 0.26)),
    rgba(255, 248, 226, 0.58);
  box-shadow: 0 10px 22px -18px rgba(67, 42, 15, 0.7);
  padding: 8px;
  border-radius: 4px;
}
.cg-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 3px;
  background:
    linear-gradient(135deg, rgba(53, 38, 22, 0.08), rgba(255, 255, 255, 0.18)),
    rgba(255, 248, 226, 0.72);
  border: 1px solid rgba(134, 97, 42, 0.28);
  display: grid;
  place-items: center;
  color: rgba(70, 49, 29, 0.55);
  font-family: var(--pm-font-display);
}
.cg-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease, filter 0.22s ease;
}
.cg-thumb:hover img {
  transform: scale(1.035);
  filter: saturate(1.08) contrast(1.03);
}
.cg-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.cg-info strong {
  display: block;
  font-family: var(--pm-font-display);
  color: var(--pm-ink);
  letter-spacing: 0.04em;
}
.cg-info small {
  display: block;
  color: rgba(70, 49, 29, 0.62);
  margin-top: 2px;
}
.cg-card p {
  margin: 8px 0 0;
  color: var(--pm-ink-soft);
  line-height: 1.6;
}

.cg-mask {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(12, 8, 5, 0.78);
  display: grid;
  place-items: center;
  padding: 26px;
}
.cg-viewer {
  width: min(1100px, 96vw);
  max-height: 92vh;
  display: grid;
  gap: 10px;
  background: linear-gradient(180deg, #2b2118, #130d08);
  border: 1px solid rgba(243, 220, 162, 0.35);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  padding: 14px;
}
.cg-viewer header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--pm-parch);
}
.cg-viewer header strong {
  display: block;
  font-family: var(--pm-font-display);
  color: var(--pm-gold-bright);
}
.cg-viewer header span,
.cg-viewer p {
  color: rgba(243, 220, 162, 0.7);
}
.cg-viewer img {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  justify-self: center;
  background: #0d0905;
}

@media (max-width: 900px) {
  .gallery-layout {
    grid-template-columns: 1fr;
  }
}
</style>
