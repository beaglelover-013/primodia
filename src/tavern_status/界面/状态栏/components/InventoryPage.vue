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
      <h2>库存 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2>
    </div>
    <div class="paper-body">
      <div class="inv-filter">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="inv-tab"
          :class="{ active: activeCat === cat }"
          @click="activeCat = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div v-if="showMat" class="inv-mat-block">
        <div class="inv-chip-grid">
          <div v-for="(item, name) in matItems" :key="name" class="inv-mat-tile" :data-selected="item.sel">
            <div class="inv-mat-tile-top">
              <span class="inv-mat-tile-name">{{ name }}</span>
              <span class="inv-mat-tile-qty">{{ item.qtyStr }}</span>
            </div>
            <div class="inv-name-cell">
              <button
                type="button"
                class="inv-name-btn"
                :class="{ 'is-selected': item.sel > 0 }"
                @click="incItem(name)"
              >
                <span class="inv-name-text">加选</span>
                <span v-if="item.sel > 0" class="inv-sel-badge">×{{ item.sel }}</span>
              </button>
              <button v-if="item.sel > 0" type="button" class="inv-name-dec" @click="decItem(name)">
                <BaseIcon name="Minus" :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showTbl">
        <table class="inv-table">
          <thead>
            <tr>
              <th>物品名</th>
              <th>数量</th>
              <th>售价</th>
              <th>分类</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, name) in tblItems" :key="name" class="inv-item" :data-selected="item.sel">
              <td>
                <div class="inv-name-cell">
                  <button
                    type="button"
                    class="inv-name-btn"
                    :class="{ 'is-selected': item.sel > 0 }"
                    @click="incItem(name)"
                  >
                    <span class="inv-name-text">{{ name }}</span>
                    <span v-if="item.sel > 0" class="inv-sel-badge">×{{ item.sel }}</span>
                  </button>
                  <button v-if="item.sel > 0" type="button" class="inv-name-dec" @click="decItem(name)">
                    <BaseIcon name="Minus" :size="12" />
                  </button>
                </div>
              </td>
              <td>{{ item.qtyStr }}</td>
              <td class="inv-col-price">
                <template v-if="item.priceCopper != null"
                  >{{ item.priceCopper }}<span class="inv-price-unit">铜/{{ item.unit }}</span></template
                >
                <span v-else class="inv-price-empty">—</span>
              </td>
              <td>
                <span class="inv-badge">{{ item.cat }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="inv-actions">
        <button type="button" class="inv-act-btn" @click="doAction('cook')">
          <BaseIcon name="ChefHat" :size="14" /> 做菜
        </button>
        <button type="button" class="inv-act-btn" @click="doAction('sauce')">
          <BaseIcon name="FlaskConical" :size="14" /> 做酱
        </button>
        <button type="button" class="inv-act-btn" @click="doAction('drink')">
          <BaseIcon name="Wine" :size="14" /> 做喝的
        </button>
        <button type="button" class="inv-act-btn" @click="doAction('serve')">
          <BaseIcon name="UtensilsCrossed" :size="14" /> 上菜结账
        </button>
        <button type="button" class="inv-clear" @click="clearSel">清空选择</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const inventory = computed(() => (data.value as any)['库存'] || {});

const categories = ['全部', '食材', '调料', '成品', '其他'];
const activeCat = ref('全部');
const selMap = ref<Record<string, number>>({});

const showMat = computed(() => activeCat.value === '全部' || activeCat.value === '食材' || activeCat.value === '调料');
const showTbl = computed(() => activeCat.value === '全部' || activeCat.value === '成品' || activeCat.value === '其他');

const allItems = computed(() => {
  const result: Record<string, any> = {};
  for (const [name, v] of Object.entries(inventory.value) as [string, any][]) {
    const qty = v['数量'] ?? 0;
    const unit = v['单位'] || '份';
    result[name] = {
      cat: v['分类'] || '其他',
      qty,
      unit,
      qtyStr: `${qty}${unit}`,
      priceCopper: v['售价铜币'] ?? null,
      sel: selMap.value[name] || 0,
    };
  }
  return result;
});

const matItems = computed(() => {
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(allItems.value)) {
    if ((v.cat === '食材' || v.cat === '调料') && (activeCat.value === '全部' || v.cat === activeCat.value)) r[k] = v;
  }
  return r;
});

const tblItems = computed(() => {
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(allItems.value)) {
    if ((v.cat === '成品' || v.cat === '其他') && (activeCat.value === '全部' || v.cat === activeCat.value)) r[k] = v;
  }
  return r;
});

function incItem(name: string) {
  const item = inventory.value[name];
  if (!item) return;
  const cur = selMap.value[name] || 0;
  const max = item['数量'] ?? 0;
  if (cur < max) selMap.value[name] = cur + 1;
}

function decItem(name: string) {
  const cur = selMap.value[name] || 0;
  if (cur > 0) {
    selMap.value[name] = cur - 1;
    if (selMap.value[name] <= 0) delete selMap.value[name];
  }
}

function clearSel() {
  selMap.value = {};
}

function doAction(action: string) {
  const items = Object.entries(selMap.value).filter(([, s]) => s > 0);
  if (!items.length) {
    const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
    if (out) out.value = '请先点击物品名按钮添加要使用的份数。';
    return;
  }
  const lines = items.map(([name, sel]) => `${name} ×${sel}`).join('、');
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out)
    out.value = `[${{ cook: '做菜', sauce: '做酱', drink: '做喝的', serve: '上菜结账' }[action] || action}]\n所选物品：${lines}\n\n请在聊天中继续描述操作。`;
}
</script>

<style scoped>
.inv-sel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  font-size: calc(11px * var(--text-scale, 1));
  font-weight: 700;
  color: #fff1ce;
  background: #6a4a22;
  border-radius: 999px;
}
.inv-badge {
  font-size: calc(11px * var(--text-scale, 1));
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid hsl(33 24% 28% / 0.3);
  background: hsl(0 0% 100% / 0.24);
  white-space: nowrap;
}
.inv-col-price {
  white-space: nowrap;
  color: var(--ink-head2);
  font-weight: 600;
}
.inv-price-unit {
  font-weight: 400;
  color: var(--ink-mid);
  font-size: calc(10px * var(--text-scale, 1));
}
.inv-price-empty {
  color: #9b8568;
  font-weight: 400;
}
.inv-clear {
  font-size: calc(11px * var(--text-scale, 1));
  color: #6d5439;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
}
</style>
