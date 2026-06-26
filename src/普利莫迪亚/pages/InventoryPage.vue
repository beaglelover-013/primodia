<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useGameStore, formatCopper, type InventoryItem, type InventorySource } from '../stores/game';
import PmIcon from '../components/PmIcon.vue';

const game = useGameStore();

type Cat = '全部' | InventoryItem['category'];
const categories: Cat[] = ['全部', '食材', '调料', '成品', '酒水', '杂物'];
const currentCat = ref<Cat>('全部');
const inventoryView = ref<InventorySource>('satchel');

interface SlotEntry {
  itemId: string;
  qty: number;
}
type CraftMode = 'cooking' | 'sauce' | 'drink';
type MethodLevel = {
  label: string;
  groups: [string, string[]][];
};

const slots = ref<SlotEntry[]>([]);
const slotLogIds = ref<string[]>([]);
const selectedServeGuestId = ref('');
const craftMode = ref<CraftMode>('cooking');
type MoveDirection = 'to_storage' | 'to_satchel';
const activeMove = ref<{ itemId: string; direction: MoveDirection; qty: number } | null>(null);
const craftModeLabels: Record<CraftMode, string> = {
  cooking: '做菜',
  sauce: '做酱',
  drink: '做饮品',
};
const techniqueByMode = reactive<Record<CraftMode, string>>({
  cooking: '煮',
  sauce: '搅拌混合',
  drink: '压榨取汁',
});
const selectedMethodLevelByMode = reactive<Record<CraftMode, string>>({
  cooking: '1级·烧火工',
  sauce: '1级·烧火工',
  drink: '1级·烧火工',
});
const expandedLevelByMode = reactive<Record<CraftMode, string | null>>({
  cooking: null,
  sauce: null,
  drink: null,
});

const methodLevels: MethodLevel[] = [
  {
    label: '1级·烧火工',
    groups: [
      ['清水煮烫', ['煮', '水煮', '清煮', '汆', '焯', '烫', '涮', '滚', '浸煮', '沸煮', '白灼', '汤煮']],
      ['明火烤制', ['烤', '明火烤', '炭烤', '串烤', '火塘烤', '烧烤']],
      ['冷拌生拌', ['凉拌', '冷拌', '生拌']],
      ['简单腌味', ['盐腌', '糖腌', '醋腌']],
    ],
  },
  {
    label: '2级·守灶童',
    groups: [
      ['慢炖焖煲', ['炖', '清炖', '焖', '煨', '煲', '熬']],
      ['平锅煎烙', ['煎', '干煎', '平底锅煎', '烙']],
      ['甜咸水煮', ['盐水煮', '糖水煮']],
      ['入味腌泡', ['干腌', '湿腌', '泡', '酱腌', '香料腌']],
    ],
  },
  {
    label: '3级·灶台学徒',
    groups: [
      ['热锅快炒', ['炒', '清炒', '小炒', '快炒', '生炒', '熟炒']],
      ['油锅炸制', ['炸', '深炸', '浅炸', '清炸', '干炸']],
      ['干锅煸炒', ['煸', '干煸', '干炒']],
      ['进阶烤制', ['架烤', '坑烤', '旋转烤']],
      ['浓味焖炖', ['红炖', '黄焖', '红焖']],
    ],
  },
  {
    label: '4级·行炉工',
    groups: [
      ['蒸笼水汽', ['蒸', '清蒸', '笼蒸', '隔水蒸', '汽蒸']],
      ['炉内烘烤', ['烘烤', '焙', '炉烤']],
      ['烧烩收汁', ['烧', '红烧', '白烧', '烩', '烹']],
      ['木烟熏香', ['熏', '烟熏', '热熏', '木熏']],
      ['热油处理', ['过油', '滑油', '油泼']],
      ['汤汁调味', ['奶煮', '酒煮', '咖喱煮', '辣酱炖']],
    ],
  },
  {
    label: '5级·持勺匠',
    groups: [
      ['猛火爆炒', ['滑炒', '软炒', '爆', '油爆', '酱爆', '葱爆', '火爆', '炝炒', '回锅', '铁锅炒', '镬气炒']],
      ['焦香煎封', ['香煎', '煎封', '半煎炸', '煎烤', '铁板煎', '煎焗', '塌', '贴', '锅贴', '石板煎']],
      ['裹粉酥炸', ['酥炸', '脆炸', '软炸', '挂糊炸', '裹粉炸']],
      ['浓汁烧焖', ['干烧', '葱烧', '酱烧', '照烧', '蒲烧', '扒', '油焖']],
      ['包裹焗烤', ['纸包烤', '叶包烤', '竹筒烤', '盐焗', '沙焗']],
      ['粉蒸成菜', ['粉蒸']],
      ['连环工序', ['先煎后焖', '先炸后烧', '先烤后炖', '先蒸后煎', '先腌后烤', '先汆后炒']],
    ],
  },
  {
    label: '6级·灶台师傅',
    groups: [
      ['卤水浸熟', ['卤', '红卤', '白卤', '糟卤', '酱', '酱卤', '卤水浸']],
      ['进阶蒸法', ['旱蒸', '酒蒸', '盐蒸', '蒸烤', '盏蒸']],
      ['嫩蛋羹蒸', ['茶碗蒸', '蛋羹蒸', '隔水蒸']],
      ['风干腊制', ['风干', '晒干', '阴干', '烘干', '盐干', '烟干', '干制', '熏腊', '腊制']],
      ['发酵入味', ['糟', '酒糟腌', '泡菜发酵', '乳酸发酵', '酒精发酵']],
      ['进阶熏制', ['冷熏', '茶熏', '稻草熏', '熏烤']],
      ['冷食冷泡', ['生食', '生切', '刺身', '冷泡', '冷浸', '酸腌', '酸汁腌', '冷熏生食', '冷盘拼制', '冰镇']],
      ['油浸油封', ['油浸', '油封', '油泡', '油焖']],
      ['低温慢熟', ['温火慢煮', '水浴', '隔水慢炖']],
    ],
  },
  {
    label: '7级·首席灶师',
    groups: [
      ['糖壳糖霜', ['挂霜', '拔丝', '琉璃', '糖衣', '糖霜', '糖封', '凝糖', '糖炒']],
      ['蜜汁焦糖', ['熬糖', '糖煮', '糖熬', '蜜煮', '蜜汁', '焦糖化', '熬浆', '挂浆', '冰糖炖', '果酱熬制', '果脯制作']],
      ['深度发酵', ['豆豉发酵', '腐乳发酵', '霉菌发酵']],
      ['珍藏腌渍', ['生腌', '熟腌', '酒渍', '蜜渍', '油渍', '酱渍', '盐藏', '糖藏', '油藏']],
      ['凝冻结冻', ['凝冻', '胶冻', '冷制甜品', '冻制']],
      ['封壳烤制', ['泥烤', '盐壳烤', '灰烤']],
      ['焗烤上色', ['焗', '芝士焗', '烤焗', '蒸烤']],
      ['酱汁融合', ['奶油打发', '蛋奶融合', '油醋调和', '酱汁融合']],
    ],
  },
  {
    label: '8级·灶火宗师',
    groups: [
      ['宗师复现', ['前7级所有手法的宗师级精度']],
      ['宴席安排', ['安排多道菜的先后、轻重、冷热、荤素、酒食搭配']],
      ['种族调味', ['根据不同种族口味偏好调整同一道菜的调味和工序']],
      ['自创招牌', ['可创造个人招牌工序, 必须建立在已存在的火、水、油、蒸、烤、熏、腌、糖、冷制等传统工艺上']],
      ['魔法辅炉', ['可使用稳定火焰、恒温炉石、保温符文、洁净水阵等魔法辅助, 不凭空跳过烹饪过程']],
    ],
  },
];

const sauceMethodLevels: MethodLevel[] = [
  { label: '1级·烧火工', groups: [['基础混合', ['搅拌混合', '研磨捣碎', '切碎拌制', '盐拌', '水调', '油调']]] },
  { label: '2级·守灶童', groups: [['基础冷制', ['盐渍', '酸渍', '糖渍', '酒渍', '蜜渍', '冷浸', '简单发酵', '粗过滤']]] },
  { label: '3级·灶台学徒', groups: [['基础热制', ['熬煮', '收汁浓缩', '煮酱', '慢熬', '果酱熬制', '糖浆熬制', '撇沫', '去渣']]] },
  { label: '4级·行炉工', groups: [['质地控制', ['勾芡', '过筛', '布滤', '压滤', '澄清', '撇油', '面粉糊化', '米浆增稠']]] },
  { label: '5级·持勺匠', groups: [['稳定融合', ['面糊炒制', '冷乳化', '炒酱', '爆香', '煸香', '香料浸油', '油浸制酱', '酒醋调和']]] },
  { label: '6级·灶台师傅', groups: [['深层风味', ['焦糖化', '曲菌发酵', '盐渍发酵', '乳酸发酵', '醋酸发酵', '木桶熟成', '陶缸熟成', '烟熏制酱']]] },
  { label: '7级·首席灶师', groups: [['瞬间控制', ['热乳化', '脱离法', '高级收汁', '黄油乳化', '双层锅隔水乳化', '酒液脱锅', '酸油平衡乳化', '胶质肉汁酱']]] },
  { label: '8级·灶火宗师', groups: [['规则外组合', ['独创', '复杂组合工序', '萃取', '凝胶化', '自然发酵控制', '复合熟成', '失败风味修复', '奇迹搭配激活']]] },
];

const drinkMethodLevels: MethodLevel[] = [
  { label: '1级·烧火工', groups: [['基础出杯', ['混合', '加热', '兑水', '蜜水调制', '简单搅拌', '温饮']]] },
  { label: '2级·守灶童', groups: [['基础提取', ['冲泡', '压榨', '手挤', '捣汁', '热泡', '简单煮饮', '粗滤', '撇沫']]] },
  { label: '3级·灶台学徒', groups: [['口感整理', ['捣碎混入', '过滤', '布滤', '沉淀', '分层取液', '果肉悬浮', '谷物熬饮', '奶煮']]] },
  { label: '4级·行炉工', groups: [['比例调配', ['浸泡', '调配', '冷泡', '酒浸', '蜜浸', '香料浸泡', '酸甜平衡', '冷热调饮']]] },
  { label: '5级·持勺匠', groups: [['活性变化', ['发酵', '陶壶摇混', '皮囊摇混', '木杯翻摇', '双杯翻注', '二次发酵', '发泡酒', '麦芽糖化', '酵母培养', '香料酒浸制', '利口酒浸制']]] },
  { label: '6级·灶台师傅', groups: [['高价值酒饮', ['蒸馏', '蒸汽蒸馏', '陈酿', '木桶熟成', '陶缸熟成', '掐头去尾', '花露蒸馏', '草药蒸馏']]] },
  { label: '7级·首席灶师', groups: [['表演与极端处理', ['点火', '冰封', '酒液火焰处理', '冻析浓缩', '蒸汽热调', '多段调饮', '分层调饮', '高级醒酒']]] },
  { label: '8级·灶火宗师', groups: [['组合与独创', ['独创', '组合工序', '复合酿造', '蒸馏后陈酿', '陈酿后调配', '冰封后蒸馏', '多基底调和', '奇迹搭配激活']]] },
];

const activeMethodLevels = computed(() => {
  if (craftMode.value === 'sauce') return sauceMethodLevels;
  if (craftMode.value === 'drink') return drinkMethodLevels;
  return methodLevels;
});
const activeTechnique = computed({
  get: () => techniqueByMode[craftMode.value],
  set: value => {
    techniqueByMode[craftMode.value] = value;
  },
});
const activeSelectedLevel = computed({
  get: () => selectedMethodLevelByMode[craftMode.value],
  set: value => {
    selectedMethodLevelByMode[craftMode.value] = value;
  },
});
const activeExpandedLevel = computed({
  get: () => expandedLevelByMode[craftMode.value],
  set: value => {
    expandedLevelByMode[craftMode.value] = value;
  },
});
const expandedMethodGroups = computed(() => activeMethodLevels.value.find(g => g.label === activeExpandedLevel.value)?.groups ?? []);
const isSatchelView = computed(() => inventoryView.value === 'satchel');
const canUseStorageHere = computed(() => ['酒馆', '库房炉台', '农田酒窖'].includes(game.currentSceneType));
const canUseActiveInventory = computed(() => isSatchelView.value || canUseStorageHere.value);
const activeInventory = computed(() => (isSatchelView.value ? game.satchel : game.inventory));
const visibleItems = computed(() => (currentCat.value === '全部' ? activeInventory.value : activeInventory.value.filter(i => i.category === currentCat.value)));
const groupedByCat = computed(() => {
  const out: Record<string, InventoryItem[]> = {};
  for (const it of visibleItems.value) {
    if (!out[it.category]) out[it.category] = [];
    out[it.category].push(it);
  }
  return out;
});
const basketSummary = computed(() => summarizeSlots(slots.value));
const serveTotal = computed(() =>
  slots.value.reduce((total, slot) => {
    const item = findItem(slot.itemId);
    return total + (item?.priceCopper ?? 0) * slot.qty;
  }, 0),
);
const serveSelection = computed(() => selectedCraftItems());
const canServeSelection = computed(() =>
  serveSelection.value.length > 0 && serveSelection.value.every(item => ['食材', '调料', '成品', '酒水'].includes(item.category)),
);
const serveHasRawItems = computed(() => serveSelection.value.some(item => item.category === '食材' || item.category === '调料'));
const serveGuests = computed(() => game.orderableGuestGroups());
const selectedServeGuest = computed(() => serveGuests.value.find(group => group.id === selectedServeGuestId.value));
const mustSelectServeGuest = computed(() => serveGuests.value.length > 0);
watch(
  serveGuests,
  guests => {
    if (!guests.length) {
      selectedServeGuestId.value = '';
      return;
    }
    if (!guests.some(group => group.id === selectedServeGuestId.value)) {
      selectedServeGuestId.value = guests[0]?.id ?? '';
    }
  },
  { immediate: true },
);
watch(
  () => game.inventory.map(item => `${item.id}:${item.qty}`).join('|'),
  () => {
    slots.value = slots.value
      .map(slot => {
        const item = findItem(slot.itemId);
        if (!item || item.qty <= 0) return null;
        return { ...slot, qty: Math.min(slot.qty, item.qty) };
      })
      .filter((slot): slot is SlotEntry => slot !== null);
    if (slots.value.length === 0) clearSlotLogs();
  },
);

function findItem(id: string) {
  return game.inventory.find(i => i.id === id);
}

function summarizeSlots(slots: SlotEntry[]) {
  return slots
    .map(slot => {
      const item = findItem(slot.itemId);
      return item ? `${item.name}×${slot.qty}` : '';
    })
    .filter(Boolean)
    .join('、');
}

function isServeItem(it: InventoryItem) {
  return ['食材', '调料', '成品', '酒水'].includes(it.category);
}

function handleTileClick(it: InventoryItem) {
  if (isSatchelView.value) {
    game.pushLog('提示', '行囊里的物品可以点“使用”或“整理入库”。');
    return;
  }
  addToSlots(it);
}

function moveItemCategory(it: InventoryItem, category: InventoryItem['category']) {
  game.dispatchAction({
    type: 'INVENTORY_MOVE_CATEGORY',
    itemId: it.id,
    category,
  });
}

function moveItemCategoryFromEvent(it: InventoryItem, event: Event) {
  const category = (event.target as HTMLSelectElement).value as InventoryItem['category'];
  moveItemCategory(it, category);
}

function canSaveRecipe(it: InventoryItem) {
  return Boolean(it.recipeSource?.ingredients?.length) && ['成品', '酒水', '调料'].includes(it.category);
}

function recipeButtonText(it: InventoryItem) {
  if (!canSaveRecipe(it)) return '缺少材料记录';
  return game.isRecipeSavedForItem(it) ? '已保存' : '保存配方';
}

function saveRecipe(it: InventoryItem) {
  if (!canSaveRecipe(it)) {
    game.pushLog('提示', `「${it.name}」缺少材料记录，不能保存为配方。`);
    return;
  }
  game.saveRecipeFromInventoryItem(it.id);
}

function openMovePanel(it: InventoryItem, direction: MoveDirection) {
  activeMove.value = { itemId: it.id, direction, qty: Math.min(1, Math.max(1, it.qty)) };
}

function isMovePanelOpen(it: InventoryItem, direction: MoveDirection) {
  return activeMove.value?.itemId === it.id && activeMove.value.direction === direction;
}

function setMoveQty(it: InventoryItem, qty: number) {
  if (!activeMove.value || activeMove.value.itemId !== it.id) return;
  activeMove.value.qty = Math.max(1, Math.min(Math.max(1, it.qty), Math.floor(Number(qty) || 1)));
}

function setMoveQtyFromEvent(it: InventoryItem, event: Event) {
  setMoveQty(it, Number((event.target as HTMLInputElement).value));
}

function stepMoveQty(it: InventoryItem, delta: number) {
  setMoveQty(it, (activeMove.value?.qty ?? 1) + delta);
}

function maxMoveQty(it: InventoryItem) {
  setMoveQty(it, it.qty);
}

async function confirmMove(it: InventoryItem) {
  if (!activeMove.value || activeMove.value.itemId !== it.id) return;
  if (activeMove.value.direction === 'to_storage') await organizeToStorage(it, activeMove.value.qty);
  else await takeToSatchel(it, activeMove.value.qty);
}

async function organizeToStorage(it: InventoryItem, qty: number) {
  if (!isSatchelView.value) return;
  const result = await game.executePseudoZeroAction({
    type: 'INVENTORY_MOVE_TO_STORAGE',
    itemId: it.id,
    qty,
  }, {
    type: 'INVENTORY_MOVE_TO_STORAGE',
    title: '整理入库',
    logText: `整理入库 · ${it.name} ×${qty}`,
    autoSend: true,
    preserveLocalState: true,
  });
  if (result.ok) activeMove.value = null;
  else game.pushLog('提示', result.message);
}

async function takeToSatchel(it: InventoryItem, qty: number) {
  if (isSatchelView.value) return;
  const result = await game.executePseudoZeroAction({
    type: 'INVENTORY_MOVE_TO_SATCHEL',
    itemId: it.id,
    qty,
  }, {
    type: 'INVENTORY_MOVE_TO_SATCHEL',
    title: '取出到行囊',
    logText: `取出到行囊 · ${it.name} ×${qty}`,
    autoSend: true,
    preserveLocalState: true,
  });
  if (result.ok) activeMove.value = null;
  else game.pushLog('提示', result.message);
}

async function useInventoryItem(it: InventoryItem, source: InventorySource) {
  if (source === 'storage' && !canUseStorageHere.value) {
    game.pushLog('提示', '当前不在酒馆内，不能直接使用库房物品。请使用个人行囊里的物品，或先回酒馆。');
    return;
  }
  const result = await game.executePseudoZeroAction({
    type: 'USE_ITEM',
    itemId: it.id,
    source,
  }, {
    type: 'USE_ITEM',
    title: `使用${it.name}`,
    aiHint: '请叙述玩家使用该物品的过程；若产生明确短期影响，请按本回合提示写入临时状态。',
    logText: `使用物品 · ${source === 'satchel' ? '行囊' : '库房'} · ${it.name}`,
    preserveLocalState: true,
  });
  if (!result.ok) game.pushLog('提示', result.message);
}

function isLevelUnlocked(label: string) {
  const idx = activeMethodLevels.value.findIndex(level => level.label === label);
  return idx >= 0 && idx < game.protagonist.cookingLevel;
}

function randomMethodFrom(level: MethodLevel) {
  const pool = level.groups.flatMap(([, methods]) => methods);
  return pool[Math.floor(Math.random() * pool.length)] ?? level.groups[0][1][0];
}

function pickLevel(level: MethodLevel) {
  if (!isLevelUnlocked(level.label)) return;
  activeSelectedLevel.value = level.label;
  activeTechnique.value = randomMethodFrom(level);
}

function toggleLevel(level: MethodLevel) {
  if (!isLevelUnlocked(level.label)) return;
  activeExpandedLevel.value = activeExpandedLevel.value === level.label ? null : level.label;
  activeSelectedLevel.value = level.label;
}

function addToSlots(it: InventoryItem) {
  if (it.qty <= 0) {
    game.pushLog('提示', `${it.name} 已无库存。`);
    return;
  }
  const existed = slots.value.find(s => s.itemId === it.id);
  if (existed) {
    if (existed.qty < it.qty) existed.qty += 1;
  } else {
    slots.value.push({ itemId: it.id, qty: 1 });
  }
  slotLogIds.value.push(game.pushLog('提示', `${it.name} 已放入本次选择。`));
}

function decSlot(idx: number) {
  const slot = slots.value[idx];
  if (!slot) return;
  slot.qty -= 1;
  if (slot.qty <= 0) slots.value.splice(idx, 1);
  if (slots.value.length === 0) clearSlotLogs();
}

function clearSlotLogs() {
  game.removeLogs(slotLogIds.value);
  slotLogIds.value = [];
}

function clearSlots() {
  slots.value = [];
  clearSlotLogs();
}

function selectedCraftItems() {
  return slots.value
    .map(slot => {
      const item = findItem(slot.itemId);
      if (!item) return null;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        qty: slot.qty,
        tags: item.tags,
        priceCopper: item.priceCopper,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function recordCraftAction(mode: CraftMode) {
  if (!basketSummary.value) return;
  craftMode.value = mode;
  const technique = techniqueByMode[mode];
  const summaryBeforeAction = basketSummary.value;
  const result = await game.executePseudoZeroAction({
    type: 'COOK_DISH',
    mode,
    technique,
    items: selectedCraftItems(),
  }, {
    type: 'COOK_DISH',
    title: craftModeLabels[mode],
    aiHint: '请按对应生成引擎叙述制作过程, 并输出 <craft_result> 隐藏数据块供前端入库。',
    logText: `${craftModeLabels[mode]} · ${technique} · ${summaryBeforeAction}`,
    preserveLocalState: true,
  });
  if (!result.ok) {
    return;
  }
  clearSlots();
}

function makeCooking() {
  if (!basketSummary.value) return;
  recordCraftAction('cooking');
}

function makeSauce() {
  if (!basketSummary.value) return;
  recordCraftAction('sauce');
}

function makeDrink() {
  if (!basketSummary.value) return;
  recordCraftAction('drink');
}

async function serveItems() {
  if (!basketSummary.value) return;
  if (!canServeSelection.value) {
    game.pushLog('提示', '本次选择里有不能上桌的杂物。食材、调料、成品和酒水可以上菜。');
    return;
  }
  if (mustSelectServeGuest.value && !selectedServeGuest.value) {
    game.pushLog('提示', '请选择要上菜的客人或桌。');
    return;
  }
  const summaryBeforeAction = basketSummary.value;
  const totalBeforeAction = serveTotal.value;
  const guest = selectedServeGuest.value;
  const targetText = guest ? `给「${guest.label}」` : '普通上菜';
  const rawServeHint = serveHasRawItems.value
    ? '本次包含食材或调料，请按冷盘、佐食、直接可入口的食材、客人要求的原料或小份试吃来叙述，不要假装已经额外烹饪。'
    : '';
  const result = await game.executePseudoZeroAction({
    type: 'SERVE_DISH',
    items: selectedCraftItems(),
    guestId: guest?.id,
  }, {
    type: 'SERVE_DISH',
    title: '上菜',
    aiHint: guest
      ? `玩家把本次上菜送到「${guest.label}」。那桌是${guest.guests || '未记录客人'}，之前点了「${guest.order || '未记录点单'}」。${rawServeHint}请叙述上菜与客人反应，不要重新计算价格，不要改变库存、随身钱袋或钱匣。`
      : `${rawServeHint}请叙述上菜、客人反应和酒馆气氛，不要重新计算价格，不要改变库存、随身钱袋或钱匣。`,
    logText: `上菜 · ${targetText} · ${summaryBeforeAction} · ${formatCopper(totalBeforeAction)}`,
    preserveLocalState: true,
  });
  if (!result.ok) {
    return;
  }
  clearSlots();
}
function qualityTone(q?: InventoryItem['quality']) {
  if (q === '奇迹' || q === '绝佳搭配') return 'gold';
  if (q === '经典搭配') return 'good';
  if (q === '轻微冲突') return 'warn';
  if (q === '严重冲突' || q === '灾难级') return 'bad';
  if (q === '无冲突') return 'violet';
  return undefined;
}
</script>

<template>
  <section id="page-inventory" class="page pm-paper">
    <header class="pm-paper-head">
      <div>
        <h2 class="h-title">
          <PmIcon name="pot" :size="22" />
          行囊与库房
        </h2>
        <div class="sub">行囊使用与入库 · 库房做菜或上菜 · 让叙事判断结果</div>
      </div>
      <div class="head-actions">
        <button class="pm-btn ghost" @click="currentCat = '全部'">
          <PmIcon name="flourish" :size="12" /> 全部
        </button>
      </div>
    </header>

    <div class="pm-paper-body inv-layout">
      <div class="inv-left">
        <div class="inventory-mode-tabs" aria-label="库存视图切换">
          <button class="mode-tab" :class="{ active: inventoryView === 'satchel' }" @click="inventoryView = 'satchel'">
            <PmIcon name="ledger" :size="13" /> 个人行囊
          </button>
          <button class="mode-tab" :class="{ active: inventoryView === 'storage' }" @click="inventoryView = 'storage'">
            <PmIcon name="pot" :size="13" /> 库房
          </button>
        </div>
        <div class="inv-tabs">
          <button v-for="cat in categories" :key="cat" class="inv-tab" :class="{ active: currentCat === cat }" @click="currentCat = cat">
            {{ cat }}
          </button>
        </div>

        <div v-for="(items, cat) in groupedByCat" :key="cat" class="inv-block">
          <div class="inv-block-head">
            <PmIcon name="chevron-down" :size="14" />
            <span>{{ cat }}</span>
            <span class="pm-dim">· {{ items.length }} 项</span>
          </div>
          <div class="inv-tiles">
            <article
              v-for="it in items"
              :key="it.id"
              class="inv-tile"
              :class="{ compact: !isServeItem(it), clickable: !isSatchelView }"
              :title="isSatchelView ? '行囊物品可使用或整理入库' : '加入本次选择'"
              @click="handleTileClick(it)"
            >
              <div class="inv-tile-top">
                <span class="inv-tile-name">{{ it.name }}</span>
                <span v-if="it.quality" class="pm-tag" :class="qualityTone(it.quality)">{{ it.quality }}</span>
              </div>

              <div v-if="it.tags.length" class="inv-tile-tags">
                <span v-for="t in it.tags.slice(0, 5)" :key="t" class="pm-tag">{{ t }}</span>
              </div>
              <p v-if="it.desc" class="inv-tile-desc">{{ it.desc }}</p>

              <footer class="inv-tile-foot">
                <span class="pm-num inv-tile-qty">× {{ it.qty }}</span>
                <span class="price">{{ formatCopper(it.priceCopper ?? 0) }}</span>
              </footer>
              <label v-if="!isSatchelView" class="category-mover" title="整理到其他分类" @click.stop>
                <span>整理</span>
                <select :value="it.category" @change="moveItemCategoryFromEvent(it, $event)">
                  <option v-for="cat in categories.filter(c => c !== '全部')" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </label>
              <div class="item-actions">
                <button
                  class="recipe-save"
                  :disabled="!canUseActiveInventory"
                  :title="canUseActiveInventory ? '使用这件物品' : '当前不在酒馆内，不能直接使用库房物品'"
                  @click.stop="useInventoryItem(it, inventoryView)"
                >
                  使用
                </button>
                <button v-if="isSatchelView" class="recipe-save" @click.stop="openMovePanel(it, 'to_storage')">
                  整理入库
                </button>
                <button v-else class="recipe-save" @click.stop="openMovePanel(it, 'to_satchel')">
                  取出
                </button>
              </div>
              <div
                v-if="isMovePanelOpen(it, isSatchelView ? 'to_storage' : 'to_satchel')"
                class="move-popover"
                @click.stop
              >
                <span class="move-label">{{ isSatchelView ? '入库数量' : '取出数量' }}</span>
                <div class="move-controls">
                  <button :disabled="(activeMove?.qty ?? 1) <= 1" @click="stepMoveQty(it, -1)">-</button>
                  <input
                    type="number"
                    min="1"
                    :max="it.qty"
                    :value="activeMove?.qty ?? 1"
                    @input="setMoveQtyFromEvent(it, $event)"
                  />
                  <button :disabled="(activeMove?.qty ?? 1) >= it.qty" @click="stepMoveQty(it, 1)">+</button>
                </div>
                <div class="move-actions">
                  <button class="ghost" @click="maxMoveQty(it)">全部</button>
                  <button class="ghost" @click="activeMove = null">取消</button>
                  <button @click="confirmMove(it)">确认</button>
                </div>
              </div>
              <button
                v-if="!isSatchelView && ['成品', '酒水', '调料'].includes(it.category)"
                class="recipe-save"
                :class="{ muted: !canSaveRecipe(it), saved: game.isRecipeSavedForItem(it) }"
                :disabled="!canSaveRecipe(it)"
                @click.stop="saveRecipe(it)"
              >
                {{ recipeButtonText(it) }}
              </button>
            </article>
          </div>
        </div>
        <div v-if="visibleItems.length === 0" class="pm-empty inv-empty">
          {{ isSatchelView ? '个人行囊里暂时没有东西。去商铺购买后会先放在这里。' : '库房里暂时没有这个分类的物品。' }}
        </div>
      </div>

      <aside class="inv-right">
        <div class="bench">
          <header class="bench-head">
            <div>
              <h3>本次选择</h3>
              <div class="pm-dim">{{ isSatchelView ? '行囊物品先整理进库房，再用于炉台。' : '库房物品能放进来，再决定做菜或上桌。' }}</div>
            </div>
            <button class="pm-btn sm ghost" :disabled="slots.length === 0" @click="clearSlots">一键清空</button>
          </header>

          <section class="selected-box">
            <div v-if="slots.length === 0" class="pm-empty">{{ isSatchelView ? '切到库房后，可以点选材料做菜或上菜。' : '点击任意库存卡片即可加入, 点一次加一份。' }}</div>
            <div v-for="(slot, idx) in slots" v-else :key="slot.itemId" class="selected-line">
              <span>{{ findItem(slot.itemId)?.name }}×{{ slot.qty }}</span>
              <button title="减少一份" @click="decSlot(idx)"><PmIcon name="minus" :size="12" /></button>
            </div>
          </section>

          <section class="method-board">
            <div class="method-head">
              <div class="method-label">做法</div>
              <div class="craft-tabs">
                <button
                  v-for="mode in (['cooking', 'sauce', 'drink'] as CraftMode[])"
                  :key="mode"
                  class="craft-tab"
                  :class="{ active: craftMode === mode }"
                  @click="craftMode = mode"
                >
                  {{ craftModeLabels[mode] }}
                </button>
              </div>
            </div>
            <div class="level-strip">
              <div
                v-for="group in activeMethodLevels"
                :key="group.label"
                class="level-entry"
                :class="{ locked: !isLevelUnlocked(group.label), active: activeSelectedLevel === group.label }"
              >
                <button class="level-chip" :disabled="!isLevelUnlocked(group.label)" @click="pickLevel(group)">
                  {{ group.label }}
                </button>
                <button class="fold-chip" :disabled="!isLevelUnlocked(group.label)" @click.stop="toggleLevel(group)">
                  <PmIcon :name="activeExpandedLevel === group.label ? 'chevron-down' : 'chevron-right'" :size="12" />
                </button>
              </div>
            </div>

            <div v-if="activeExpandedLevel" class="method-groups">
              <section v-for="[groupName, methods] in expandedMethodGroups" :key="groupName" class="method-group">
                <h4>{{ groupName }}</h4>
                <div class="method-strip">
                  <button
                    v-for="method in methods"
                    :key="method"
                    class="method-chip"
                    :class="{ active: activeTechnique === method }"
                    @click="activeTechnique = method"
                  >
                    {{ method }}
                  </button>
                </div>
              </section>
            </div>
            <div v-else class="method-hint">
              当前{{ craftModeLabels[craftMode] }}会从「{{ activeSelectedLevel }}」里随机取法: <strong>{{ activeTechnique }}</strong>
            </div>
          </section>

          <div class="cook-preview">
            <span class="label">将写入</span>
            <p>{{ basketSummary ? `<user>用「${activeTechnique}」${craftModeLabels[craftMode]}「${basketSummary}」。` : '选择物品后会生成一句行动记录。' }}</p>
          </div>

          <div class="serve-total">
            <span>上菜应收</span>
            <strong>{{ formatCopper(serveTotal) }}</strong>
          </div>

          <div v-if="serveGuests.length" class="serve-target">
            <label>
              <span>上菜对象</span>
              <select v-model="selectedServeGuestId">
                <option value="">选择客人或桌</option>
                <option v-for="guest in serveGuests" :key="guest.id" :value="guest.id">
                  {{ guest.label }} · {{ guest.order || guest.guests }}
                </option>
              </select>
            </label>
            <p v-if="selectedServeGuest">
              {{ selectedServeGuest.guests }}
              <template v-if="selectedServeGuest.order"> · 点单: {{ selectedServeGuest.order }}</template>
            </p>
          </div>

          <div class="bench-actions">
            <button class="pm-btn dark" :class="{ ghost: craftMode !== 'sauce' }" :disabled="slots.length === 0" @click="makeSauce">
              <PmIcon name="pot" :size="13" /> 做酱
            </button>
            <button class="pm-btn dark" :class="{ ghost: craftMode !== 'drink' }" :disabled="slots.length === 0" @click="makeDrink">
              <PmIcon name="coin" :size="13" /> 做饮品
            </button>
            <button class="pm-btn dark" :class="{ ghost: craftMode !== 'cooking' }" :disabled="slots.length === 0" @click="makeCooking">
              <PmIcon name="fire" :size="13" /> 做菜
            </button>
            <button class="pm-btn dark" :disabled="!canServeSelection || (serveGuests.length > 0 && !selectedServeGuestId)" @click="serveItems">
              <PmIcon name="check" :size="13" /> 上菜
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.inv-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.82fr);
  gap: 14px;
  align-items: start;
}
.inventory-mode-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  margin-bottom: 10px;
  border: 1px solid rgba(110, 80, 34, 0.42);
  border-radius: 6px;
  background: rgba(255, 245, 215, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.48);
}
.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 5px 13px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--pm-ink-soft);
  font-size: calc(12px * var(--pm-text-scale));
  font-weight: 700;
  letter-spacing: 0.04em;
}
.mode-tab.active {
  color: var(--pm-ink);
  border-color: rgba(110, 80, 34, 0.56);
  background: linear-gradient(180deg, #f3da90, #c9a04a);
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.6);
}
.inv-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.inv-tab {
  padding: 4px 12px;
  border: 1px solid rgba(110, 80, 34, 0.4);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.55);
  color: var(--pm-ink-soft);
  font-size: calc(12px * var(--pm-text-scale));
  font-weight: 600;
}
.inv-tab.active {
  background: linear-gradient(180deg, #f3da90, #c9a04a);
  color: var(--pm-ink);
}
.inv-block {
  margin-bottom: 12px;
}
.inv-block-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--pm-ink-dim);
  font-family: var(--pm-font-display);
  font-size: calc(12px * var(--pm-text-scale));
  letter-spacing: 0.06em;
}
.inv-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
  gap: 8px;
}
.inv-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 122px;
  padding: 9px 10px;
  border: 1px solid rgba(110, 80, 34, 0.4);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(255, 245, 215, 0.78), rgba(212, 186, 136, 0.5));
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.6);
}
.inv-tile.clickable {
  cursor: pointer;
}
.inv-tile.clickable:hover {
  border-color: rgba(167, 121, 45, 0.82);
  background: linear-gradient(180deg, rgba(255, 247, 222, 0.94), rgba(219, 190, 137, 0.68));
}
.inv-tile.compact {
  min-height: 82px;
}
.inv-tile-top {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.inv-tile-name {
  color: var(--pm-ink);
  font-size: calc(13px * var(--pm-text-scale));
  font-weight: 700;
}
.inv-tile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.inv-tile-desc {
  margin: 0;
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
  line-height: 1.5;
}
.inv-tile-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
}
.inv-tile-qty {
  color: var(--pm-ink-soft);
  font-weight: 700;
}
.price {
  margin-right: auto;
  color: var(--pm-gold-dim);
  font-size: calc(11px * var(--pm-text-scale));
  font-weight: 700;
}
.category-mover {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 8px;
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
}
.category-mover select {
  min-width: 72px;
  height: 26px;
  color: var(--pm-ink);
  background: rgba(255, 248, 225, 0.72);
  border: 1px solid rgba(165, 126, 68, 0.45);
  border-radius: 4px;
  outline: none;
}
.recipe-save {
  width: 100%;
  min-height: 28px;
  border: 1px solid rgba(131, 92, 34, 0.5);
  border-radius: 4px;
  background: rgba(255, 246, 218, 0.66);
  color: var(--pm-ink);
  font-size: calc(11px * var(--pm-text-scale));
  font-weight: 700;
}
.recipe-save:not(:disabled):hover {
  border-color: rgba(167, 121, 45, 0.9);
  background: linear-gradient(180deg, #f3da90, #c9a04a);
}
.recipe-save:disabled {
  color: var(--pm-ink-faint);
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(131, 92, 34, 0.24);
  cursor: not-allowed;
}
.recipe-save.saved {
  color: var(--pm-status-good-text);
  background: var(--pm-status-good-bg);
  border-color: var(--pm-status-good-border);
}
.recipe-save.muted {
  color: var(--pm-ink-faint);
  background: rgba(255, 255, 255, 0.24);
  cursor: not-allowed;
}
.item-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 6px;
  margin-top: 6px;
}
.move-popover {
  display: grid;
  gap: 7px;
  margin-top: 6px;
  padding: 8px;
  border: 1px solid rgba(131, 92, 34, 0.48);
  border-radius: 4px;
  background: rgba(255, 248, 225, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.62);
}
.move-label {
  color: var(--pm-ink-dim);
  font-size: calc(11px * var(--pm-text-scale));
  font-weight: 700;
}
.move-controls,
.move-actions {
  display: grid;
  grid-template-columns: 28px minmax(48px, 1fr) 28px;
  gap: 5px;
  align-items: center;
}
.move-actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.move-controls input {
  width: 100%;
  height: 28px;
  min-width: 0;
  text-align: center;
  color: var(--pm-ink);
  border: 1px solid rgba(131, 92, 34, 0.45);
  border-radius: 4px;
  background: rgba(255, 252, 238, 0.78);
}
.move-controls button,
.move-actions button {
  min-height: 28px;
  border: 1px solid rgba(131, 92, 34, 0.48);
  border-radius: 4px;
  color: var(--pm-ink);
  font-size: calc(11px * var(--pm-text-scale));
  font-weight: 700;
  background: linear-gradient(180deg, #ead19a, #bd8e43);
}
.move-actions button.ghost,
.move-controls button:disabled {
  color: var(--pm-ink-dim);
  background: rgba(255, 246, 218, 0.52);
}
.move-controls button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.selected-line button {
  display: grid;
  place-items: center;
  border: 1px solid rgba(110, 80, 34, 0.45);
  border-radius: 4px;
  background: linear-gradient(180deg, #ead19a, #bd8e43);
  color: var(--pm-ink);
}
.bench {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(110, 80, 34, 0.5);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(255, 245, 215, 0.76), rgba(204, 174, 122, 0.5));
}
.bench-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--pm-ink);
}
.bench-head h3 {
  margin: 0;
  font-size: calc(16px * var(--pm-text-scale));
}
.selected-box {
  display: grid;
  gap: 6px;
  min-height: 96px;
  padding: 10px;
  border: 1px dashed rgba(110, 80, 34, 0.45);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.46);
}
.selected-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 7px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.26);
  color: var(--pm-ink);
  font-weight: 700;
}
.selected-line button {
  width: 24px;
  height: 24px;
}
.method-board {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(110, 80, 34, 0.32);
  border-radius: 4px;
  background: rgba(255, 245, 215, 0.35);
}
.method-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.method-label {
  color: var(--pm-ink-dim);
  font-family: var(--pm-font-display);
  font-size: calc(12px * var(--pm-text-scale));
  font-weight: 700;
}
.craft-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  border: 1px solid rgba(110, 80, 34, 0.32);
  border-radius: 4px;
  background: rgba(43, 29, 16, 0.08);
}
.craft-tab {
  padding: 4px 8px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--pm-ink-dim);
  font-weight: 700;
  font-size: calc(11px * var(--pm-text-scale));
}
.craft-tab.active {
  background: linear-gradient(180deg, #f3da90, #b88135);
  color: var(--pm-ink);
}
.level-strip,
.method-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.level-entry {
  display: inline-flex;
  align-items: stretch;
}
.level-chip,
.method-chip,
.fold-chip {
  border: 1px solid rgba(110, 80, 34, 0.36);
  border-radius: 4px;
  background: rgba(255, 249, 232, 0.62);
  color: var(--pm-ink-soft);
  font-weight: 700;
}
.level-chip {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  padding: 5px 8px;
  font-size: calc(11px * var(--pm-text-scale));
}
.fold-chip {
  display: grid;
  place-items: center;
  width: 28px;
  border-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.method-chip {
  padding: 4px 8px;
  font-size: calc(12px * var(--pm-text-scale));
}
.level-entry.active .level-chip,
.level-entry.active .fold-chip,
.method-chip.active {
  background: linear-gradient(180deg, #f3da90, #b88135);
  border-color: rgba(78, 48, 19, 0.58);
  color: var(--pm-ink);
}
.level-entry.locked {
  opacity: 0.42;
}
.level-entry.locked .level-chip,
.level-entry.locked .fold-chip {
  cursor: not-allowed;
}
.method-groups {
  display: grid;
  gap: 8px;
  max-height: 238px;
  overflow: auto;
  padding-right: 4px;
}
.method-group {
  display: grid;
  gap: 5px;
}
.method-group h4 {
  margin: 0;
  color: var(--pm-ink);
  font-size: calc(12px * var(--pm-text-scale));
}
.method-hint {
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(43, 29, 16, 0.12);
  color: var(--pm-ink-soft);
  font-size: calc(12px * var(--pm-text-scale));
}
.method-hint strong {
  color: var(--pm-ink);
}
.cook-preview {
  padding: 10px;
  border-radius: 4px;
  background: rgba(43, 29, 16, 0.86);
  color: var(--pm-parch);
}
.cook-preview .label {
  color: var(--pm-gold-bright);
  font-size: calc(11px * var(--pm-text-scale));
}
.cook-preview p {
  margin: 4px 0 0;
  line-height: 1.6;
}
.serve-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(43, 29, 16, 0.82);
  color: var(--pm-parch);
}
.serve-total strong {
  color: var(--pm-gold-bright);
}
.serve-target {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--pm-line-soft);
  border-radius: 4px;
  background: rgba(255, 250, 232, 0.42);
}
.serve-target label {
  display: grid;
  gap: 5px;
}
.serve-target span {
  color: var(--pm-ink-dim);
  font-size: calc(12px * var(--pm-text-scale));
}
.serve-target select {
  width: 100%;
  min-height: 32px;
  border: 1px solid var(--pm-line);
  border-radius: 4px;
  background: var(--pm-input-bg);
  color: var(--pm-ink);
  padding: 6px 8px;
}
.serve-target p {
  margin: 0;
  color: var(--pm-ink-soft);
  line-height: 1.5;
  font-size: calc(12px * var(--pm-text-scale));
}
.bench-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (max-width: 1100px) {
  .inv-layout {
    grid-template-columns: 1fr;
  }
  .bench {
    position: static;
  }
}

@media (max-width: 760px) {
  .inv-tabs,
  .level-strip,
  .method-strip {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .inv-tab,
  .level-entry,
  .method-chip {
    flex: 0 0 auto;
  }
  .inv-tiles {
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
    gap: 7px;
  }
  .inv-tile {
    min-height: 96px;
    padding: 8px;
  }
  .inv-tile.compact {
    min-height: 68px;
  }
  .inv-tile-desc {
    display: none;
  }
  .method-head,
  .bench-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .craft-tabs {
    width: 100%;
  }
  .craft-tab {
    flex: 1;
  }
}
</style>

