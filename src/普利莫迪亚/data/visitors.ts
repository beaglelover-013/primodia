export interface VisitorDiceRolls {
  source: number;
  beastfolkSubtype?: number;
  occupation: number;
  event: number;
  eventExtra?: number[];
  count: number;
  adventurerRank?: number;
  state: number;
}

export interface VisitorSeed {
  text: string;
  count: number;
  race: string;
  occupation: string;
  eventText: string;
  state: string;
  adventurerRank?: string;
  rolls: VisitorDiceRolls;
}

interface DiceRange<T> {
  min: number;
  max: number;
  value: T;
}

interface EventValue {
  code: string;
  text: string;
}

const sourceRanges: DiceRange<string>[] = [
  { min: 1, max: 48, value: '韦斯托利亚人类' },
  { min: 49, max: 61, value: '卡尔德里亚人类' },
  { min: 62, max: 67, value: '阿尔登马克人类' },
  { min: 68, max: 76, value: '兽族' },
  { min: 77, max: 83, value: '矮人' },
  { min: 84, max: 88, value: '珑族' },
  { min: 89, max: 91, value: '暗精灵' },
  { min: 92, max: 93, value: '半人马' },
  { min: 94, max: 95, value: '龙裔' },
  { min: 96, max: 96, value: '拉弥亚' },
  { min: 97, max: 97, value: '那伽' },
  { min: 98, max: 98, value: '人鱼' },
  { min: 99, max: 99, value: '稀有种族' },
  { min: 100, max: 100, value: '血族' },
];

const beastfolkRanges: DiceRange<string>[] = [
  { min: 1, max: 25, value: '狐族' },
  { min: 26, max: 37, value: '犬族' },
  { min: 38, max: 49, value: '猫族' },
  { min: 50, max: 57, value: '兔族' },
  { min: 58, max: 64, value: '狼族' },
  { min: 65, max: 71, value: '鹿族' },
  { min: 72, max: 78, value: '狸猫族' },
  { min: 79, max: 83, value: '牛族' },
  { min: 84, max: 87, value: '熊猫族' },
  { min: 88, max: 90, value: '虎族' },
  { min: 91, max: 93, value: '狮族' },
  { min: 94, max: 95, value: '薮猫族' },
  { min: 96, max: 97, value: '羊族' },
  { min: 98, max: 98, value: '鸟族' },
  { min: 99, max: 99, value: '鳄族' },
  { min: 100, max: 100, value: '蜥蜴族' },
];

const rareRaces = ['精灵', '约顿', '雪女族', '佛摩尔族'];
const disguisedRaces = ['人类', '矮人', '珑族', '狐族', '犬族', '猫族', '暗精灵'];

const occupationRanges: DiceRange<string>[] = [
  { min: 1, max: 22, value: '商贩' },
  { min: 23, max: 40, value: '旅人' },
  { min: 41, max: 52, value: '本地村民' },
  { min: 53, max: 62, value: '冒险者' },
  { min: 63, max: 70, value: '猎人' },
  { min: 71, max: 76, value: '工匠' },
  { min: 77, max: 81, value: '马夫' },
  { min: 82, max: 85, value: '水手' },
  { min: 86, max: 88, value: '信使' },
  { min: 89, max: 91, value: '农场主' },
  { min: 92, max: 93, value: '蒸汽技师' },
  { min: 94, max: 95, value: '公会成员' },
  { min: 96, max: 96, value: '巡逻兵' },
  { min: 97, max: 97, value: '税吏' },
  { min: 98, max: 98, value: '学者' },
  { min: 99, max: 99, value: '逃亡者' },
  { min: 100, max: 100, value: '流浪者' },
];

const adventurerRankRanges: DiceRange<string>[] = [
  { min: 1, max: 40, value: '黑铁级' },
  { min: 41, max: 70, value: '青铜级' },
  { min: 71, max: 85, value: '白银级' },
  { min: 86, max: 94, value: '黄金级' },
  { min: 95, max: 98, value: '秘银级' },
  { min: 99, max: 99, value: '山铜级' },
  { min: 100, max: 100, value: '精金级' },
];

const eventRanges: DiceRange<EventValue>[] = [
  { min: 1, max: 28, value: { code: 'A', text: '来吃饭歇脚' } },
  { min: 29, max: 40, value: { code: 'H', text: '没什么特别的事，就是路过进来看看' } },
  { min: 41, max: 52, value: { code: 'B', text: '来等人或找人聊天' } },
  { min: 53, max: 62, value: { code: 'C', text: '来打听消息' } },
  { min: 63, max: 70, value: { code: 'D', text: '来谈生意或找货' } },
  { min: 71, max: 77, value: { code: 'E', text: '需要一点帮助' } },
  { min: 78, max: 84, value: { code: 'F', text: '带着麻烦或冲突' } },
  { min: 85, max: 90, value: { code: 'G', text: '有特殊要求' } },
  { min: 91, max: 97, value: { code: 'X', text: '复合诉求' } },
  { min: 98, max: 100, value: { code: 'Y', text: '带着突发情况闯进来' } },
];

const countRanges: DiceRange<number>[] = [
  { min: 1, max: 1, value: 1 },
  { min: 2, max: 2, value: 2 },
  { min: 3, max: 3, value: 3 },
  { min: 4, max: 4, value: 4 },
];

const stateRanges: DiceRange<string>[] = [
  { min: 1, max: 1, value: '平常' },
  { min: 2, max: 2, value: '开朗友善' },
  { min: 3, max: 3, value: '疲惫' },
  { min: 4, max: 4, value: '焦躁急迫' },
  { min: 5, max: 5, value: '警惕沉默' },
  { min: 6, max: 6, value: '兴奋得意' },
  { min: 7, max: 7, value: '低落沮丧' },
  { min: 8, max: 8, value: '带着醉意' },
  { min: 9, max: 9, value: '受伤或不适' },
  { min: 10, max: 10, value: '像是在隐瞒什么' },
];

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function pickRange<T>(ranges: DiceRange<T>[], roll: number): T {
  return ranges.find(item => roll >= item.min && roll <= item.max)?.value ?? ranges[0].value;
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function rollEventPair(firstRoll: number) {
  const picked: EventValue[] = [];
  const rolls: number[] = [];
  let guard = 0;
  while (picked.length < 2 && guard < 20) {
    const roll = guard === 0 ? firstRoll : rollDie(100);
    const event = pickRange(eventRanges, roll);
    guard += 1;
    if (event.code === 'X') continue;
    if (picked.some(item => item.code === event.code)) continue;
    picked.push(event);
    rolls.push(roll);
  }
  return {
    text: picked.map(item => item.text).join('，同时'),
    rolls,
  };
}

export function rollVisitorSeed(): VisitorSeed {
  const sourceRoll = rollDie(100);
  const occupationRoll = rollDie(100);
  const eventRoll = rollDie(100);
  const countRoll = rollDie(4);
  const stateRoll = rollDie(10);
  const rolls: VisitorDiceRolls = {
    source: sourceRoll,
    occupation: occupationRoll,
    event: eventRoll,
    count: countRoll,
    state: stateRoll,
  };

  let race = pickRange(sourceRanges, sourceRoll);
  if (race === '兽族') {
    const subtypeRoll = rollDie(100);
    rolls.beastfolkSubtype = subtypeRoll;
    race = pickRange(beastfolkRanges, subtypeRoll);
  } else if (race === '稀有种族') {
    race = pickOne(rareRaces);
  } else if (race === '血族') {
    race = `血族伪装的${pickOne(disguisedRaces)}`;
  }

  const occupation = pickRange(occupationRanges, occupationRoll);
  let adventurerRank: string | undefined;
  if (occupation === '冒险者') {
    const rankRoll = rollDie(100);
    rolls.adventurerRank = rankRoll;
    adventurerRank = pickRange(adventurerRankRanges, rankRoll);
  }

  const event = pickRange(eventRanges, eventRoll);
  let eventText = event.text;
  if (event.code === 'X') {
    const pair = rollEventPair(rollDie(100));
    eventText = pair.text || '来吃饭歇脚，同时来打听消息';
    rolls.eventExtra = pair.rolls;
  }

  const count = pickRange(countRanges, countRoll);
  const state = pickRange(stateRanges, stateRoll);
  const roleText = adventurerRank ? `${race}的${adventurerRank}冒险者` : `${race}${occupation}`;
  const text =
    count <= 1
      ? `一个${roleText}准备走进酒馆，${eventText}，看起来${state}。`
      : `${count}个人准备走进酒馆，领头的是一个${roleText}，${eventText}，看起来${state}。`;

  return { text, count, race, occupation, eventText, state, adventurerRank, rolls };
}
