<script setup lang="ts">
import { computed, reactive } from 'vue';
import {
  COIN_PER_SILVER,
  GOLD_PER_PLATINUM,
  PLATINUM_PER_MITHRIL,
  SILVER_PER_GOLD,
  useGameStore,
  formatCopper,
} from '../stores/game';
import PmIcon from '../components/PmIcon.vue';

const game = useGameStore();

const recentLogs = computed(() => game.engineLogs.slice(0, 24));
const incomeLogs = computed(() =>
  game.engineLogs.filter(log => /收入|收款|上菜|奖励|\+/.test(`${log.kind} ${log.text}`)).slice(0, 8),
);
const expenseLogs = computed(() =>
  game.engineLogs.filter(log => /花费|购买|扣除|支出|扣减|-/.test(`${log.kind} ${log.text}`)).slice(0, 8),
);
const inventoryCount = computed(() => game.inventory.reduce((sum, item) => sum + Math.max(0, item.qty), 0));
const activeShop = computed(() => game.generatedShop?.name || '无');
const transferMoneyParts = reactive({
  copper: 0,
  silver: 0,
  gold: 0,
  platinum: 0,
  mithril: 0,
});

const transferCopperTotal = computed(() => {
  const copper = Math.max(0, Math.floor(Number(transferMoneyParts.copper) || 0));
  const silver = Math.max(0, Math.floor(Number(transferMoneyParts.silver) || 0));
  const gold = Math.max(0, Math.floor(Number(transferMoneyParts.gold) || 0));
  const platinum = Math.max(0, Math.floor(Number(transferMoneyParts.platinum) || 0));
  const mithril = Math.max(0, Math.floor(Number(transferMoneyParts.mithril) || 0));
  return (
    copper +
    silver * COIN_PER_SILVER +
    gold * COIN_PER_SILVER * SILVER_PER_GOLD +
    platinum * COIN_PER_SILVER * SILVER_PER_GOLD * GOLD_PER_PLATINUM +
    mithril * COIN_PER_SILVER * SILVER_PER_GOLD * GOLD_PER_PLATINUM * PLATINUM_PER_MITHRIL
  );
});

const transferMoneyText = computed(() => formatCopper(transferCopperTotal.value));

function clearTransferParts() {
  transferMoneyParts.copper = 0;
  transferMoneyParts.silver = 0;
  transferMoneyParts.gold = 0;
  transferMoneyParts.platinum = 0;
  transferMoneyParts.mithril = 0;
}

async function transferMoney(direction: 'wallet_to_cashbox' | 'cashbox_to_wallet') {
  const amount = transferCopperTotal.value;
  const result = await game.executePseudoZeroAction(
    { type: 'MONEY_TRANSFER', direction, amountCopper: amount },
    {
      type: 'MONEY_TRANSFER',
      title: direction === 'wallet_to_cashbox' ? '存入钱匣' : '从钱匣取出',
      logText: `${direction === 'wallet_to_cashbox' ? '存入钱匣' : '从钱匣取出'} · ${formatCopper(amount)}`,
      autoSend: false,
      preserveLocalState: true,
    },
  );
  if (result.ok) clearTransferParts();
  else game.pushLog('提示', result.message);
}
</script>

<template>
  <section id="page-ledger" class="page pm-paper">
    <header class="pm-paper-head">
      <div>
        <h2 class="h-title">
          <PmIcon name="ledger" :size="22" />
          账单
        </h2>
        <div class="sub">读取本局账目、库存变化与引擎足迹。</div>
      </div>
      <div class="head-actions">
        <span class="pm-tag dim">{{ recentLogs.length }} 条近期记录</span>
      </div>
    </header>

    <div class="pm-paper-body ledger-page">
      <div class="ledger-stats">
        <article class="stat pm-card">
          <span class="stat-label">随身钱袋</span>
          <span class="stat-value pm-num">{{ game.walletText }}</span>
        </article>
        <article class="stat pm-card">
          <span class="stat-label">钱匣</span>
          <span class="stat-value pm-num">{{ game.cashboxText }}</span>
        </article>
        <article class="stat pm-card">
          <span class="stat-label">资金合计</span>
          <span class="stat-value pm-num">{{ game.treasuryText }}</span>
        </article>
        <article class="stat pm-card">
          <span class="stat-label">库存总数</span>
          <span class="stat-value pm-num">{{ inventoryCount }}</span>
        </article>
        <article class="stat pm-card">
          <span class="stat-label">当前位置</span>
          <span class="stat-value">{{ game.location.place }}</span>
        </article>
        <article class="stat pm-card">
          <span class="stat-label">当前商铺</span>
          <span class="stat-value">{{ activeShop }}</span>
        </article>
      </div>

      <article class="pm-card transfer-panel">
        <div>
          <h3>资金调拨</h3>
          <p class="pm-dim">随身钱袋用于采购、送礼和路上消费；钱匣用于酒馆收入、建设和维护。</p>
        </div>
        <div class="transfer-row">
          <label>
            <span>铜</span>
            <input v-model.number="transferMoneyParts.copper" type="number" min="0" step="1" />
          </label>
          <label>
            <span>银</span>
            <input v-model.number="transferMoneyParts.silver" type="number" min="0" step="1" />
          </label>
          <label>
            <span>金</span>
            <input v-model.number="transferMoneyParts.gold" type="number" min="0" step="1" />
          </label>
          <label>
            <span>铂</span>
            <input v-model.number="transferMoneyParts.platinum" type="number" min="0" step="1" />
          </label>
          <label>
            <span>秘银</span>
            <input v-model.number="transferMoneyParts.mithril" type="number" min="0" step="1" />
          </label>
          <span class="transfer-total">合计 {{ transferMoneyText }}</span>
          <button class="pm-btn sm" @click="transferMoney('wallet_to_cashbox')">存入钱匣</button>
          <button class="pm-btn sm ghost" @click="transferMoney('cashbox_to_wallet')">从钱匣取出</button>
        </div>
      </article>

      <div class="ledger-columns">
        <article class="pm-card ledger-panel">
          <h3>收入线索</h3>
          <p v-if="incomeLogs.length === 0" class="pm-dim">还没有收入记录。</p>
          <ul v-else>
            <li v-for="log in incomeLogs" :key="log.id">
              <span class="pm-tag">{{ log.kind }}</span>
              <span>{{ log.text }}</span>
            </li>
          </ul>
        </article>

        <article class="pm-card ledger-panel">
          <h3>支出线索</h3>
          <p v-if="expenseLogs.length === 0" class="pm-dim">还没有支出记录。</p>
          <ul v-else>
            <li v-for="log in expenseLogs" :key="log.id">
              <span class="pm-tag">{{ log.kind }}</span>
              <span>{{ log.text }}</span>
            </li>
          </ul>
        </article>
      </div>

      <div class="pm-divider">近期引擎记录</div>
      <table class="ledger-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>内容</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in recentLogs" :key="log.id">
            <td class="pm-num">{{ log.at }}</td>
            <td><span class="pm-tag">{{ log.kind }}</span></td>
            <td>{{ log.text }}</td>
          </tr>
          <tr v-if="recentLogs.length === 0">
            <td colspan="3" class="empty">暂无记录。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.ledger-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ledger-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 2px;
}

.stat {
  display: flex;
  min-height: 92px;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-family: var(--pm-font-display);
  font-size: calc(11px * var(--pm-text-scale));
  color: var(--pm-ink-dim);
}

.stat-value {
  font-size: calc(18px * var(--pm-text-scale));
  color: var(--pm-ink);
}

.transfer-panel {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.transfer-panel h3 {
  margin: 0 0 6px;
  font-size: calc(15px * var(--pm-text-scale));
}

.transfer-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(58px, 76px)) auto auto auto;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.transfer-row label {
  display: grid;
  gap: 3px;
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
  font-weight: 700;
}

.transfer-row input {
  width: 100%;
  min-height: 34px;
  padding: 6px 9px;
  border: 1px solid rgba(110, 80, 34, 0.48);
  border-radius: 6px;
  background: rgba(255, 250, 235, 0.82);
  color: var(--pm-ink);
}

.transfer-total {
  min-width: 112px;
  color: var(--pm-ink-soft);
  font-size: calc(12px * var(--pm-text-scale));
  font-weight: 700;
  text-align: right;
}

.ledger-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.ledger-panel h3 {
  margin: 0 0 10px;
  font-size: calc(15px * var(--pm-text-scale));
}

.ledger-panel ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ledger-panel li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: var(--pm-ink-soft);
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgba(110, 80, 34, 0.45);
  background: rgba(255, 245, 215, 0.45);
}

.ledger-table th,
.ledger-table td {
  padding: 9px 10px;
  border-bottom: 1px dashed rgba(110, 80, 34, 0.3);
  text-align: left;
  color: var(--pm-ink-soft);
  font-size: calc(12.5px * var(--pm-text-scale));
}

@media (max-width: 980px) {
  .transfer-panel {
    grid-template-columns: 1fr;
  }

  .transfer-row {
    grid-template-columns: repeat(5, minmax(48px, 1fr));
    justify-content: stretch;
  }

  .transfer-total,
  .transfer-row .pm-btn {
    grid-column: span 5;
    width: 100%;
    text-align: left;
  }
}

.ledger-table th {
  color: var(--pm-ink);
  background: rgba(255, 245, 215, 0.7);
  font-family: var(--pm-font-display);
}

.empty {
  text-align: center;
  color: var(--pm-ink-dim);
}
</style>
