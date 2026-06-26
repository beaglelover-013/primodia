<template>
  <article class="page">
    <span class="page-orn po1"><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg></span>
    <span class="page-orn po2"><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg></span>
    <span class="page-orn po3"><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg></span>
    <span class="page-orn po4"><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg></span>

    <div class="paper-head"><h2>购物 <BaseIcon name="Sparkles" :size="12" class="star-icon" /></h2></div>
    <div class="paper-body">
      <p class="shop-tagline">铜板与铂币的流转，从一只篮子开始。</p>
      <div class="shop-tabs" role="tablist">
        <button v-for="(shop, id) in shops" :key="id" type="button" class="shop-tab" :class="{ active: currentShop === id }" @click="currentShop = id" role="tab">{{ (shop['描述'] || id).slice(0, 12) }}</button>
      </div>
      <div class="shop-grid">
        <section class="shop-products-wrap">
          <h3 class="shop-h3">货品</h3>
          <div class="shop-products">
            <button v-for="(item, name) in currentItems" :key="name" type="button" class="shop-product" :data-in-cart="isInCart(name) ? '1' : '0'" @click="addToCart(name)">
              <span v-if="isInCart(name)" class="shop-product-badge">×{{ cartQty(name) }}</span>
              <div class="shop-product-name">{{ name }}</div>
              <div class="shop-product-meta">
                <span class="shop-product-cat">{{ item['分类'] || '其他' }}</span>
                <span class="shop-product-price">{{ fmtCopper(item['单价铜币'] ?? 0) }} / {{ item['单位'] || '份' }}</span>
              </div>
              <div v-if="item['备注']" class="shop-product-note">{{ item['备注'] }}</div>
            </button>
          </div>
        </section>
        <aside class="shop-cart-wrap">
          <h3 class="shop-h3">购物篮 <span class="shop-h3-sub">{{ cartTotalQty }} 件</span></h3>
          <div class="shop-cart">
            <div v-for="(line, key) in cart" :key="key" class="cart-line">
              <div><div class="cart-line-name">{{ line.itemName }}</div></div>
              <div class="cart-line-price">{{ fmtCopper(line.price) }} × {{ line.qty }}<br><b>= {{ fmtCopper(line.qty * line.price) }}</b></div>
              <div class="cart-line-ctrl">
                <button type="button" class="cart-step" @click="decCart(key)"><BaseIcon name="Minus" :size="12" /></button>
                <span class="cart-qty">{{ line.qty }} {{ line.unit }}</span>
                <button type="button" class="cart-step" @click="incCart(key)">+</button>
                <button type="button" class="cart-line-rm" @click="rmCart(key)">移除</button>
              </div>
            </div>
            <p v-if="!Object.keys(cart).length" class="shop-cart-empty">点商品名加入篮子。</p>
          </div>
          <div class="shop-cart-foot">
            <div class="shop-total"><span class="shop-total-k">合计</span><span class="shop-total-v">{{ fmtCopper(cartTotal) }}</span></div>
            <div class="shop-cart-actions">
              <button type="button" class="inv-act-btn shop-pay-btn" @click="checkout"><BaseIcon name="ReceiptText" :size="14" /> 结账并入库</button>
              <button type="button" class="inv-clear" @click="clearCart">清空购物篮</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import BaseIcon from './BaseIcon.vue';

const store = inject('store') as any;
const data = computed(() => store?.data ?? {});
const shops = computed(() => ((data.value as any)['购物'] || {})['店铺列表'] || {});

const currentShop = ref(Object.keys(shops.value)[0] || '');
const cart = ref<Record<string, { shopId: string; itemName: string; qty: number; price: number; unit: string }>>({});

const currentItems = computed(() => { const s = shops.value[currentShop.value]; return (s && s['商品列表']) || {}; });

function cartKey(name: string) { return `${currentShop.value}::${name}`; }
function isInCart(name: string) { return !!cart.value[cartKey(name)]; }
function cartQty(name: string) { return cart.value[cartKey(name)]?.qty || 0; }

function addToCart(name: string) {
  const k = cartKey(name);
  if (cart.value[k]) { cart.value[k].qty++; return; }
  const item = currentItems.value[name];
  if (!item) return;
  cart.value[k] = { shopId: currentShop.value, itemName: name, qty: 1, price: item['单价铜币'] ?? 0, unit: item['单位'] || '份' };
}

function incCart(k: string) { if (cart.value[k]) cart.value[k].qty++; }
function decCart(k: string) { if (!cart.value[k]) return; cart.value[k].qty--; if (cart.value[k].qty <= 0) delete cart.value[k]; }
function rmCart(k: string) { delete cart.value[k]; }
function clearCart() { cart.value = {}; }

const cartTotalQty = computed(() => Object.values(cart.value).reduce((a, l) => a + l.qty, 0));
const cartTotal = computed(() => Object.values(cart.value).reduce((a, l) => a + l.qty * l.price, 0));

const COIN_TIERS = [{ name: '秘银', value: 250_000_000 }, { name: '铂', value: 500_000 }, { name: '金', value: 1_000 }, { name: '银', value: 100 }, { name: '铜', value: 1 }] as const;

function fmtCopper(total: number): string {
  if (!total || total <= 0) return '0铜';
  let rem = total;
  const parts: string[] = [];
  for (const tier of COIN_TIERS) {
    const c = Math.floor(rem / tier.value);
    if (c > 0) { parts.push(`${c}${tier.name}`); rem -= c * tier.value; }
  }
  return parts.join(' ');
}

function checkout() {
  const lines = Object.values(cart.value);
  if (!lines.length) { const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null; if (out) out.value = '购物篮是空的。'; return; }
  let total = 0;
  const rows = lines.map(l => { const sub = l.qty * l.price; total += sub; return `- ${l.itemName} ×${l.qty}${l.unit} @ ${fmtCopper(l.price)}/${l.unit} = ${fmtCopper(sub)}`; }).join('\n');
  const out = document.getElementById('globalOutput') as HTMLTextAreaElement | null;
  if (out) out.value = `[购物清单]\n${rows}\n\n合计支出：${fmtCopper(total)}`;
}
</script>