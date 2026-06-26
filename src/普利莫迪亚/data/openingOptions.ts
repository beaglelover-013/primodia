export interface OpeningTerritoryOption {
  id: string;
  label: string;
  factionIncludes: string[];
  people: string;
  hint: string;
  tavernFriendly: boolean;
}

export interface OpeningRaceOption {
  value: string;
  group: string;
  hint: string;
}

export const openingTerritories: OpeningTerritoryOption[] = [
  { id: '卡尔德里亚', label: '卡尔德里亚', factionIncludes: ['卡尔德里亚'], people: '人类', hint: '大陆中央肥沃平原，食材稳定，最适合常规酒馆起步。', tavernFriendly: true },
  { id: '韦斯托利亚', label: '韦斯托利亚', factionIncludes: ['韦斯托利亚'], people: '人类', hint: '西海岸商会领地，港口密集，进口食材丰富。', tavernFriendly: true },
  { id: '阿尔登马克', label: '阿尔登马克', factionIncludes: ['阿尔登马克'], people: '人类', hint: '东部边境军地，融合菜、军人客源和兽族商队都常见。', tavernFriendly: true },
  { id: '杜尔加德联山国', label: '杜尔加德联山国', factionIncludes: ['杜尔加德联山国'], people: '矮人', hint: '铁砧山脉的矿山与工坊国，重口味、烈酒和蒸汽工坊气息浓。', tavernFriendly: true },
  { id: '多卡海姆', label: '多卡海姆', factionIncludes: ['多卡海姆'], people: '暗精灵', hint: '幽暗山地森林，菌菇、草药和弱光环境是经营重点。', tavernFriendly: true },
  { id: '翡叶永森', label: '翡叶永森', factionIncludes: ['翡叶永森'], people: '精灵', hint: '南方香料密林，香料便宜但味觉标准极高。', tavernFriendly: true },
  { id: '阿什卡纳尔', label: '阿什卡纳尔', factionIncludes: ['阿什卡纳尔'], people: '龙裔', hint: '西南高原半岛，蔗糖、藏红花和高辣度饮食文化突出。', tavernFriendly: true },
  { id: '灶丘', label: '灶丘', factionIncludes: ['灶丘'], people: '珑族', hint: '温暖河谷，热食、回甘、米酒和精细手工食材是核心。', tavernFriendly: true },
  { id: '阿斯特拉原野', label: '阿斯特拉原野', factionIncludes: ['阿斯特拉原野'], people: '半人马', hint: '中部草原游牧地，固定酒馆少，驿站和流动补给更合理。', tavernFriendly: false },
  { id: '奥菲迪亚', label: '奥菲迪亚', factionIncludes: ['奥菲迪亚'], people: '拉弥亚', hint: '纳维里斯南境溶洞群，深界浅层食材和嗅味感知很重要。', tavernFriendly: true },
  { id: '帕塔拉', label: '帕塔拉', factionIncludes: ['帕塔拉'], people: '那伽', hint: '精灵领地东南河口三角洲，海鲜、盐花、鱼露和潮汐客流突出。', tavernFriendly: true },
  { id: '纳维里斯', label: '纳维里斯', factionIncludes: ['纳维里斯'], people: '多种族', hint: '中立枢纽城与深界主入口，食材和客源最混杂。', tavernFriendly: true },
  { id: '兽族联邦·犬邦（鸣原）', label: '兽族联邦·犬邦（鸣原）', factionIncludes: ['犬邦（鸣原）'], people: '犬族', hint: '草原牧场与巡逻护卫文化，香气和肉食很关键。', tavernFriendly: true },
  { id: '兽族联邦·狼邦（嗥原）', label: '兽族联邦·狼邦（嗥原）', factionIncludes: ['狼邦（嗥原）'], people: '狼族', hint: '群猎传统明显，肉汤、炖肉、烟熏肉比甜食更有优势。', tavernFriendly: true },
  { id: '兽族联邦·狐邦（萩岭）', label: '兽族联邦·狐邦（萩岭）', factionIncludes: ['狐邦（萩岭）'], people: '狐族', hint: '丘陵商贸邦，茶叶、山货和贸易客源突出。', tavernFriendly: true },
  { id: '兽族联邦·猫邦（霞丘）', label: '兽族联邦·猫邦（霞丘）', factionIncludes: ['猫邦（霞丘）'], people: '猫族', hint: '夜行文化强，夜市、暗光审美和肉食需求明显。', tavernFriendly: true },
  { id: '兽族联邦·薮猫邦（影丘）', label: '兽族联邦·薮猫邦（影丘）', factionIncludes: ['薮猫邦（影丘）'], people: '薮猫族', hint: '夜间经营和暗光摆盘很重要，鲜味与脂肪香优先。', tavernFriendly: true },
  { id: '兽族联邦·狸猫邦（迷原）', label: '兽族联邦·狸猫邦（迷原）', factionIncludes: ['狸猫邦（迷原）'], people: '狸猫族', hint: '湿地水网与杂货商文化，口感、汤汁和实在分量重要。', tavernFriendly: true },
  { id: '兽族联邦·鸟邦（翠峰）', label: '兽族联邦·鸟邦（翠峰）', factionIncludes: ['鸟邦（翠峰）'], people: '鸟族', hint: '崖壁与高空城市，空间、视野和轻食节奏需要特别考虑。', tavernFriendly: true },
  { id: '兽族联邦·熊猫邦（翠屏）', label: '兽族联邦·熊猫邦（翠屏）', factionIncludes: ['熊猫邦（翠屏）'], people: '熊猫族', hint: '竹林山地，竹笋、竹器和温和经营环境突出。', tavernFriendly: true },
  { id: '兽族联邦·兔邦（露泽）', label: '兽族联邦·兔邦（露泽）', factionIncludes: ['兔邦（露泽）'], people: '兔族', hint: '水乡米仓，稻米、莲藕、甜型河鲜和避苦口味明显。', tavernFriendly: true },
  { id: '兽族联邦·鹿邦（幽泽）', label: '兽族联邦·鹿邦（幽泽）', factionIncludes: ['鹿邦（幽泽）'], people: '鹿族', hint: '湖区药草邦，香草、苦味、回甘和药材贸易突出。', tavernFriendly: true },
  { id: '兽族联邦·羊邦（牧坡）', label: '兽族联邦·羊邦（牧坡）', factionIncludes: ['羊邦（牧坡）'], people: '羊族', hint: '丘陵牧场，温和厚实的热汤、谷物和乳制品更讨喜。', tavernFriendly: true },
  { id: '兽族联邦·牛邦（原泽）', label: '兽族联邦·牛邦（原泽）', factionIncludes: ['牛邦（原泽）'], people: '牛族', hint: '粮仓平原，份量、主食和大碗热食是经营核心。', tavernFriendly: true },
  { id: '兽族联邦·狮邦（烈原）', label: '兽族联邦·狮邦（烈原）', factionIncludes: ['狮邦（烈原）'], people: '狮族', hint: '稀树草原战士邦，肉食、份量和气势感很重要。', tavernFriendly: true },
  { id: '兽族联邦·鳄邦（沼泽三角洲）', label: '兽族联邦·鳄邦（沼泽三角洲）', factionIncludes: ['鳄邦（沼泽三角洲）'], people: '鳄族', hint: '沼泽三角洲，口感质地、热食和水路贸易很关键。', tavernFriendly: true },
  { id: '兽族联邦·蜥蜴邦（石鳞地）', label: '兽族联邦·蜥蜴邦（石鳞地）', factionIncludes: ['蜥蜴邦（石鳞地）'], people: '蜥蜴族', hint: '岩漠矿地，矿物底味、热食和气味先行的体验突出。', tavernFriendly: true },
  { id: '蔚澜诸域', label: '蔚澜诸域', factionIncludes: ['蔚澜诸域'], people: '人鱼', hint: '环大陆海域，人鱼传统酒馆不常规，更适合港口或浮台贸易点。', tavernFriendly: false },
  { id: '乌特加尔德', label: '乌特加尔德', factionIncludes: ['乌特加尔德'], people: '约顿', hint: '极北冻原与火山脉，份量和温度感知会让常规经营失效。', tavernFriendly: false },
  { id: '塔尔维拉', label: '塔尔维拉', factionIncludes: ['塔尔维拉'], people: '雪女族', hint: '极北冰封海岸，冷热感知标准与南方完全不同。', tavernFriendly: false },
  { id: '多布赫湾', label: '多布赫湾', factionIncludes: ['多布赫湾'], people: '佛摩尔族', hint: '西北破碎峡湾，陆路联系极少，外族开店极不现实。', tavernFriendly: false },
];

export const openingRaceOptions: OpeningRaceOption[] = [
  { value: '人类', group: '中部种族', hint: '适应力强，分布最广。' },
  { value: '矮人', group: '北方山脉带', hint: '工匠、矿山与蒸汽技术传统。' },
  { value: '暗精灵', group: '北中部过渡带', hint: '幽暗森林与菌菇草药传统。' },
  { value: '精灵', group: '南方展开带', hint: '长寿、自然魔力与香料密林传统。' },
  { value: '龙裔', group: '西南高原', hint: '鳞片、血脉魔力与高温体质。' },
  { value: '珑族', group: '中部内陆', hint: '小巧农耕民族，灶火与精细手工传统。' },
  { value: '半人马', group: '中部草原', hint: '游牧、奔跑与星辰传统。' },
  { value: '拉弥亚', group: '南境溶洞', hint: '蛇身母系种族，嗅味合一。' },
  { value: '那伽', group: '河口水域', hint: '水域种族，潮汐与咸鲜文化。' },
  { value: '人鱼', group: '海域与岛链', hint: '海洋种族，可暂时化腿上陆。' },
  { value: '约顿', group: '极北带', hint: '极北巨人族，体型巨大。' },
  { value: '雪女族', group: '极北带', hint: '亲和冰雪魔力的极地种族。' },
  { value: '佛摩尔族', group: '极北带', hint: '幽暗峡湾种族，极少出现在大陆。' },
  { value: '血族', group: '无固定领地', hint: '外貌与转化前种族相同，建议在备注写转化前种族。' },
  { value: '兔族', group: '兽族十六邦', hint: '露泽水乡，听觉敏锐，跳跃力强。' },
  { value: '猫族', group: '兽族十六邦', hint: '霞丘夜行文化，暗视强。' },
  { value: '犬族', group: '兽族十六邦', hint: '鸣原草原，嗅觉强，忠诚直率。' },
  { value: '狐族', group: '兽族十六邦', hint: '萩岭商贸传统，精细灵巧。' },
  { value: '羊族', group: '兽族十六邦', hint: '牧坡丘陵，温顺与纺织传统。' },
  { value: '牛族', group: '兽族十六邦', hint: '原泽粮仓，力量耐力强。' },
  { value: '薮猫族', group: '兽族十六邦', hint: '影丘暗光文化，大耳簇毛。' },
  { value: '狸猫族', group: '兽族十六邦', hint: '迷原湿地，适应性强。' },
  { value: '鹿族', group: '兽族十六邦', hint: '幽泽药草传统，自然感知敏锐。' },
  { value: '鸟族', group: '兽族十六邦', hint: '翠峰高空巢城，翼与足爪文化。' },
  { value: '虎族', group: '兽族十六邦', hint: '虎啸岭山林，力量与猎人传统。' },
  { value: '狮族', group: '兽族十六邦', hint: '烈原首领护卫与战士传统。' },
  { value: '鳄族', group: '兽族十六邦', hint: '沼泽三角洲，厚鳞与水域传统。' },
  { value: '蜥蜴族', group: '兽族十六邦', hint: '石鳞地岩漠，隐蔽和矿区传统。' },
  { value: '熊猫族', group: '兽族十六邦', hint: '翠屏竹林，温和与竹器传统。' },
  { value: '狼族', group: '兽族十六邦', hint: '嗥原群猎，耐力和协作突出。' },
];

export function findOpeningTerritory(id: string) {
  return openingTerritories.find(item => item.id === id || item.label === id);
}
