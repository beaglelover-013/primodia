export type MapTrafficKind = 'trade' | 'water';

export interface MapTrafficRoute {
  id: string;
  name: string;
  kind: MapTrafficKind;
  color: string;
  routeType: string;
  nodes: string[];
  transport: string[];
  goods: string[];
  note: string;
}

export const tradeRoutes: MapTrafficRoute[] = [
  {
    id: 'emerald-spice-road',
    name: '翡叶香路',
    kind: 'trade',
    color: '#5f8f4b',
    routeType: '林道/官道',
    nodes: ['香径镇', '翡叶城', '月泉城', '环石城', '灶安城', '纳维里斯', '浅滩村', '麦穗原', '王冠堡', '白石修道院', '菌冠城', '铁砧堡'],
    transport: ['马车商队', '地龙驮运', '精灵木舟'],
    goods: ['香料', '热带水果', '精灵织物', '草药'],
    note: '精灵香料由南方林境北上, 在纳维里斯转入人类与北方市场。',
  },
  {
    id: 'anvil-pass-road',
    name: '铁砧隘路',
    kind: 'trade',
    color: '#8a7b63',
    routeType: '山路/隘口',
    nodes: ['铁砧堡', '熔岩门', '菌冠城', '影泉城', '白石修道院', '王冠堡', '铁砧渡', '红土堡', '绿谷', '铁炉镇', '克朗港'],
    transport: ['铁壳驮虫', '驮牦', '山地驮兽', '马车商队'],
    goods: ['金属锭', '蒸汽零件', '矿石', '矮人工具'],
    note: '矮人工业品出山后转入人类平原, 是金属与蒸汽零件的命脉。',
  },
  {
    id: 'silk-rice-road',
    name: '绢稻之路',
    kind: 'trade',
    color: '#b9a85e',
    routeType: '官道/陆路',
    nodes: ['竹安城', '萩铃城', '忠风城', '东关镇', '铁壁城', '青麦原', '鹿角林', '麦穗原', '王冠堡', '纳维里斯', '红土堡', '绿谷', '克朗港'],
    transport: ['马车商队', '地龙驮运', '翠江水运'],
    goods: ['茶叶', '稻米', '豆腐', '竹器', '山菌'],
    note: '兽族联邦的农产和手工品沿东部商道进入人类领地。',
  },
  {
    id: 'sand-gold-road',
    name: '沙金之路',
    kind: 'trade',
    color: '#c38a3e',
    routeType: '沙漠商路',
    nodes: ['赤砂城', '金曦城', '藏红镇', '驼铃村', '环石城', '纳维里斯', '浅滩村', '王冠堡'],
    transport: ['骆驼商队', '马车商队', '地龙驮运'],
    goods: ['蔗糖', '藏红花', '龙裔工艺品', '砂岩器物'],
    note: '龙裔高原的贵价调味品与糖料经纳维里斯北上。',
  },
  {
    id: 'anvil-sea-road',
    name: '铁砧海路',
    kind: 'trade',
    color: '#3d8f9a',
    routeType: '海航',
    nodes: ['珊瑚庭', '克朗港', '白崖城', '雾港', '银波镇', '赤砂城', '潮汐城', '碧波庭'],
    transport: ['帆船', '海船', '人鱼领航'],
    goods: ['海盐', '珍珠', '深海鱼', '海藻', '沿岸货物'],
    note: '人鱼控制的海上航线串起大陆主要港口与外海贸易点。',
  },
];

export const waterRoutes: MapTrafficRoute[] = [
  {
    id: 'silver-crown-river',
    name: '银冠河',
    kind: 'water',
    color: '#4d86a7',
    routeType: '水路',
    nodes: ['铁砧堡', '熔岩门', '菌冠城', '白石修道院', '王冠堡', '铁砧渡', '红土堡', '绿谷', '费尔马克', '雾港'],
    transport: ['平底驳船', '内河顺流', '内河逆流', '蒸汽河船试航'],
    goods: ['谷物', '乳制品', '制造品', '海产进口'],
    note: '大陆商业价值最高的内河, 中下游航运极繁忙。',
  },
  {
    id: 'traveler-river',
    name: '旅人河',
    kind: 'water',
    color: '#5b9eb0',
    routeType: '水路',
    nodes: ['东关镇', '铁壁城', '青麦原', '浅滩村', '纳维里斯', '环石城', '石笋镇'],
    transport: ['平底船', '地方船户', '拉弥亚向导', '沼蜥'],
    goods: ['补给物资', '谷物', '深界产出', '短途客运'],
    note: '纳维里斯的生命线, 卡尔德里亚补给顺流入城。',
  },
  {
    id: 'jade-river',
    name: '翠江',
    kind: 'water',
    color: '#4b9a76',
    routeType: '水路',
    nodes: ['竹安城', '月影城', '萩铃城', '莲露城', '丰原城', '厚实镇', '碧波庭'],
    transport: ['平底船', '水乡小船', '翠江货船'],
    goods: ['茶叶', '稻米', '莲藕', '竹器', '豆制品'],
    note: '兽族联邦内部最高效的货运水路。',
  },
  {
    id: 'marsh-dragon-river',
    name: '沼龙江',
    kind: 'water',
    color: '#547c63',
    routeType: '湿地水路',
    nodes: ['烈金城', '雷原镇', '深沼城', '潜渊镇', '红树村'],
    transport: ['浅底宽船', '沼蜥', '鳄邦向导'],
    goods: ['淡水鱼', '木材', '沼泽药草', '三角洲货物'],
    note: '鳄邦垄断的三角洲水网, 外族通常只到边缘贸易点。',
  },
  {
    id: 'emerald-river',
    name: '翡河',
    kind: 'water',
    color: '#3f9a89',
    routeType: '精灵水路',
    nodes: ['香径镇', '翡叶城', '月泉城', '溪语村', '潮汐城'],
    transport: ['精灵木舟', '竹筏', '独木舟'],
    goods: ['香料', '草药', '林冠水果', '那伽河口货物'],
    note: '精灵自行管理的森林河路, 外族商船不能使用。',
  },
];

export const mapTrafficRoutes = [...tradeRoutes, ...waterRoutes];
