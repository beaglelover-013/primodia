import {
  getKnownWorldbookNames,
  getPrimaryCharacterWorldbookName,
  createWorldbookEntriesForEdit,
  getWorldbookEntryName,
  loadWorldbookEntriesForEdit,
  loadActiveWorldbookEntries,
  loadWorldbookEntryByName,
  matchesWorldbookEntryName,
  replaceWorldbookEntriesForEdit,
  upsertWorldbookEntryByName,
  type EditableWorldbookEntry,
} from './worldbookService';
import {
  TURN_CONTEXT_WORLDBOOK_ENTRY_NAME,
  type TurnContextWorldbookBinding,
} from './turnContextWorldbook';
import { parse as parseYaml } from 'yaml';
import { recordFinalPromptDebugSnapshot } from '../utils/unifiedRequest';

declare const generate:
  | undefined
  | ((options: {
      user_input: string;
      should_stream?: boolean;
      max_chat_history?: 'all' | number;
      overrides?: Record<string, unknown>;
      injects?: Array<Record<string, unknown>>;
    }) => Promise<unknown>);
declare const generateRaw:
  | undefined
  | ((options: {
      user_input?: string;
      should_stream?: boolean;
      should_silence?: boolean;
      max_chat_history?: 'all' | number;
      ordered_prompts?: Array<string | { role: 'system' | 'assistant' | 'user'; content: string }>;
    }) => Promise<unknown>);

export const OPENING_CHARACTER_TEMPLATE_ENTRY = '开局模板-人物档案';
export const OPENING_TAVERN_TEMPLATE_ENTRY = '开局模板-酒馆档案';
export const OPENING_CHARACTER_ENTRY = '开局人物档案';
export const OPENING_TAVERN_ENTRY = '开局酒馆档案';
export const OPENING_GAME_INFO_ENTRY = '游戏信息';
export const OPENING_REGION_ENTRY_NAMES = [
  '酒馆区域-前门门面区',
  '酒馆区域-主厅接待区',
  '酒馆区域-柜台酒水区',
  '酒馆区域-厨房餐食区',
  '酒馆区域-客房',
  '酒馆区域-地窖储藏区',
  '酒馆区域-后院生活区',
  '酒馆区域-马厩交通区',
] as const;
const OPENING_TAVERN_REGION_NAMES = OPENING_REGION_ENTRY_NAMES.map(name => name.replace(/^酒馆区域-/, ''));

export interface OpeningCharacterInput {
  name: string;
  gender: string;
  age: string;
  race: string;
  originNote: string;
  appearance: string;
  personality: string;
  backstory: string;
}

export interface OpeningTavernInput {
  name: string;
  territory: string;
  city: string;
  place: string;
  status: string;
  style: string;
  story: string;
  funds: string;
  stock: string;
}

export interface OpeningModuleChoice {
  group: string;
  entryName: string;
}

export interface OpeningWorkshopDraft {
  character: OpeningCharacterInput;
  tavern: OpeningTavernInput;
  era: string;
  region: string;
  theme: string;
  moduleChoices: OpeningModuleChoice[];
  worldbookName: string;
}

export interface OpeningGeneratedProfile {
  title: string;
  profile: string;
  summary: string;
  tags: string[];
}

export interface OpeningStoryDraft {
  maintext: string;
  options: string[];
  sum: string;
  initvar?: Record<string, any>;
  initvarYaml?: string;
  raw?: string;
}

export interface OpeningGenerationBundle {
  characterProfile: OpeningGeneratedProfile;
  tavernProfile: OpeningGeneratedProfile;
  story: OpeningStoryDraft;
}

export interface OpeningTemplateDraft {
  characterTemplate: string;
  tavernTemplate: string;
}

export interface OpeningTemplateStatus {
  worldbookName: string;
  characterTemplateFound: boolean;
  tavernTemplateFound: boolean;
  missingEntries: string[];
  emptyEntries: string[];
  characterTemplateContent?: string;
  tavernTemplateContent?: string;
}

export interface OpeningWorldbookResult {
  entry: EditableWorldbookEntry;
  characterEntry: EditableWorldbookEntry;
  tavernEntry: EditableWorldbookEntry;
  turnContextEntry: EditableWorldbookEntry;
  turnContextBinding: TurnContextWorldbookBinding;
  moduleResults: Array<OpeningModuleChoice & { prefix: string; matched: number; changed: number; foundTarget: boolean }>;
  templateResults: Array<{ entryName: string; found: boolean; changed: boolean }>;
  regionResults: Array<{ entryName: string; found: boolean; changed: boolean }>;
}

const DEFAULT_OPENING_TEMPLATE = `<maintext>
{{时代}}，{{地区}}的{{城市}}还停在一天最初的光里。{{主角名}}站在{{酒馆名}}的{{酒馆位置}}，眼前是刚刚接手的柜台、桌椅、灶火和账本。

{{主角名}}是一名{{年龄}}岁的{{种族}}{{性别称呼}}。{{外貌句}}{{性格句}}{{出身句}}{{个人故事句}}

这间酒馆位于{{领地}}，经营状态是{{经营状态}}。{{酒馆风格句}}{{酒馆故事句}}它还不算热闹，却已经足够成为一个起点：客人会来，消息会来，麻烦和机会也会从门外一点点靠近。

今天不需要立刻发生冲突。{{主角名}}只需要先看清这间酒馆、这座城市，以及自己接下来想走的第一步。
</maintext>
<option>
1.开始我们的故事
</option>`;

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

function cloneOpeningEntry(entry: EditableWorldbookEntry): EditableWorldbookEntry {
  try {
    return structuredClone(entry);
  } catch {
    return JSON.parse(JSON.stringify(entry));
  }
}

function replaceOpeningManagedBlock(content: string, block: string, marker = 'PrimordiaOpening') {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const wrapped = `${start}\n${block.trim()}\n${end}`;
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  const source = String(content ?? '').trim();
  if (pattern.test(source)) return source.replace(pattern, wrapped);
  return source ? `${source}\n\n${wrapped}` : wrapped;
}

function normalizeLines(value: string, fallback = '') {
  const text = cleanText(value);
  return text || fallback;
}

function sentence(value: string, fallback = '') {
  const text = cleanText(value);
  if (!text) return fallback;
  return /[。！？.!?]$/.test(text) ? text : `${text}。`;
}

function genderNoun(gender: string, age: string) {
  const parsedAge = Number.parseInt(age, 10);
  const young = Number.isFinite(parsedAge) && parsedAge > 0 && parsedAge < 18;
  if (gender === '男') return young ? '少年' : '男人';
  if (gender === '女') return young ? '少女' : '女人';
  return cleanText(gender) || '人物';
}

function replaceOpeningTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([^{}]+)\}\}/g, (_, rawKey: string) => values[cleanText(rawKey)] ?? '');
}

function stripCodeFence(text: string) {
  return cleanText(text)
    .replace(/^```(?:json|xml|html)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractTaggedBlock(text: string, tagName: string) {
  const source = stripCodeFence(text);
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = source.match(pattern);
  return cleanText(match?.[1]);
}

function extractAnyTaggedBlock(text: string, tagNames: string[]) {
  for (const tagName of tagNames) {
    const value = extractTaggedBlock(text, tagName);
    if (value) return value;
  }
  return '';
}

function stripOpeningForbiddenBlocks(text: string) {
  return stripCodeFence(text)
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<thought\b[^>]*>[\s\S]*?<\/thought>/gi, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<Analysis\b[^>]*>[\s\S]*?<\/Analysis>/gi, '')
    .replace(/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, '')
    .replace(/<JSONPatch\b[^>]*>[\s\S]*?<\/JSONPatch>/gi, '')
    .trim();
}

function extractOpeningInitvarYaml(text: string) {
  const updateVariable = extractTaggedBlock(text, 'UpdateVariable') || text;
  const initvar = extractTaggedBlock(updateVariable, 'initvar');
  if (!initvar) return '';
  return initvar
    .replace(/^```(?:ya?ml)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function decodeJsonPointerPath(path: unknown) {
  if (typeof path !== 'string') return [];
  return path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function setDeepValue(target: Record<string, any>, path: string[], value: unknown) {
  if (!path.length) return;
  let cursor: Record<string, any> = target;
  for (const key of path.slice(0, -1)) {
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key] as Record<string, any>;
  }
  cursor[path[path.length - 1]] = value;
}

function stripOpeningForbiddenVariableKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripOpeningForbiddenVariableKeys);
  if (!value || typeof value !== 'object') return value;
  const cleaned: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === '坐标' || key === '当前坐标' || key === '地图' || key === '系统判定') continue;
    cleaned[key] = stripOpeningForbiddenVariableKeys(child);
  }
  return cleaned;
}

function parseOpeningJsonPatchInitvar(text: string) {
  const patchText = extractTaggedBlock(text, 'JSONPatch');
  if (!patchText) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(patchText));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AI 输出了 JSONPatch，但这段 JSONPatch 无法转换为初始变量：${message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('AI 输出了 JSONPatch，但 JSONPatch 不是数组，无法转换为初始变量。');
  }
  const initvar: Record<string, any> = {};
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const patch = item as Record<string, unknown>;
    const op = String(patch.op ?? '').toLowerCase();
    if (!['insert', 'replace', 'add'].includes(op)) continue;
    const path = decodeJsonPointerPath(patch.path);
    if (!path.length) continue;
    setDeepValue(initvar, path, stripOpeningForbiddenVariableKeys(patch.value));
  }
  if (!Object.keys(initvar).length) {
    throw new Error('AI 输出了 JSONPatch，但其中没有可转换的初始变量。');
  }
  return initvar;
}

function parseOpeningInitvar(text: string) {
  const yamlText = extractOpeningInitvarYaml(text);
  if (!yamlText) {
    if (/<JSONPatch\b|<\/JSONPatch>/i.test(text)) {
      throw new Error('开局只能输出 <initvar>，不能输出 JSONPatch。');
    }
    throw new Error('AI 没有输出 <UpdateVariable><initvar> 初始变量。');
  }
  if (/<JSONPatch\b|<\/JSONPatch>/i.test(text)) {
    throw new Error('AI 同时输出了 initvar 和 JSONPatch，开局只能保留 initvar。');
  }
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`开局 initvar YAML 解析失败：${message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('开局 initvar 必须是 YAML 对象。');
  }
  const record = parsed as Record<string, any>;
  const requiredTopKeys = ['世界', '酒馆', '主角', '库房', '行囊', '临时状态', '人物羁绊', '农田与酒窖', '街坊商铺'];
  const missing = requiredTopKeys.filter(key => !(key in record));
  if (missing.length) throw new Error(`开局 initvar 缺少顶层变量：${missing.join('、')}。`);
  return { initvar: record, initvarYaml: yamlText };
}

function extractPlainOpeningText(text: string) {
  const plain = stripOpeningForbiddenBlocks(text)
    .replace(/<option\b[^>]*>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum\b[^>]*>[\s\S]*?<\/sum>/gi, '')
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, '')
    .replace(/<\/?maintext\b[^>]*>/gi, '')
    .trim();
  if (!plain || plain.startsWith('{') || plain.startsWith('[')) return '';
  return plain;
}

function extractJsonObject(text: string) {
  const source = stripCodeFence(text);
  const first = source.indexOf('{');
  const last = source.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('AI 没有返回 JSON 对象。');
  return source.slice(first, last + 1)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');
}

function parseJsonRecord(text: string, context: string) {
  try {
    const parsed = JSON.parse(extractJsonObject(text));
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${context}格式不完整：请让 AI 使用页面要求的标签格式重新生成。原始解析错误：${message}`);
  }
}

async function runOpeningGeneration(prompt: string) {
  const systemPrompt =
    '你是普利莫迪亚开局设定整理器。严格按用户要求的 XML 风格标签输出，不输出解释、Markdown 代码块或额外前后缀。开局生成阶段绝对不要输出 <UpdateVariable>、<Analysis>、<JSONPatch>，也不要初始化或修改任何变量。';
  const result = await runIsolatedOpeningGeneration(prompt, systemPrompt);
  const text = coerceGenerationText(result);
  if (!text) throw new Error('AI 没有返回可读取的文本。');
  return text;
}

async function runIsolatedOpeningGeneration(prompt: string, systemPrompt: string) {
  recordFinalPromptDebugSnapshot({
    source: '开局生成预检',
    dryRun: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    activatedWorldbookEntries: [],
  });

  if (typeof generateRaw === 'function') {
    return generateRaw({
      should_stream: false,
      should_silence: true,
      max_chat_history: 0,
      ordered_prompts: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });
  }

  if (typeof generate !== 'function') throw new Error('当前环境没有提供 generate 接口。');
  return generate({
    user_input: prompt,
    should_stream: false,
    max_chat_history: 0,
    overrides: {
      world_info_before: '',
      world_info_after: '',
      chat_history: { with_depth_entries: false, prompts: [] },
    },
    injects: [
      {
        role: 'system',
        content: systemPrompt,
        position: 'none',
        depth: 0,
        should_scan: false,
      },
    ],
  });
}

function parseTagsList(text: string) {
  return cleanText(text)
    .split(/[、，,\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeProfile(raw: unknown, fallbackTitle: string): OpeningGeneratedProfile {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    title: cleanText(record.title) || fallbackTitle,
    profile: cleanText(record.profile) || cleanText(record.content),
    summary: cleanText(record.summary),
    tags: Array.isArray(record.tags) ? record.tags.map(cleanText).filter(Boolean) : [],
  };
}

function parseOpeningProfile(text: string, fallbackTitle: string, context: string): OpeningGeneratedProfile {
  const source = stripOpeningForbiddenBlocks(text);
  const title = extractAnyTaggedBlock(source, ['title', '标题', 'shortTitle']);
  const profile = extractAnyTaggedBlock(source, ['profile', '档案', 'content']);
  const summary = extractAnyTaggedBlock(source, ['summary', '摘要']);
  const tags = parseTagsList(extractAnyTaggedBlock(source, ['tags', '标签']));
  if (profile) {
    return {
      title: title || fallbackTitle,
      profile: stripOpeningForbiddenBlocks(profile),
      summary,
      tags,
    };
  }
  return normalizeProfile(parseJsonRecord(source, context), fallbackTitle);
}

function normalizeStory(raw: unknown): OpeningStoryDraft {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    maintext: stripOpeningForbiddenBlocks(cleanText(record.maintext)),
    options: ['开始我们的故事'],
    sum: cleanText(record.sum),
  };
}

function coerceGenerationText(result: unknown) {
  if (typeof result === 'string') return cleanText(result);
  if (result && typeof result === 'object') {
    const record = result as Record<string, any>;
    return cleanText(
      record.generatedText ??
        record.normalizedMessage ??
        record.message ??
        record.content ??
        record.text ??
        record.response ??
        '',
    );
  }
  return cleanText(result);
}

function parseOpeningStory(text: string): OpeningStoryDraft {
  const source = stripOpeningForbiddenBlocks(text);
  const maintext = extractAnyTaggedBlock(source, ['maintext', '正文']);
  const sum = extractAnyTaggedBlock(source, ['sum', 'summary', '摘要']);
  if (maintext) {
    return {
      maintext: stripOpeningForbiddenBlocks(maintext),
      options: ['开始我们的故事'],
      sum,
    };
  }
  const plain = extractPlainOpeningText(source);
  if (plain) {
    return {
      maintext: plain,
      options: ['开始我们的故事'],
      sum: '',
    };
  }
  return normalizeStory(parseJsonRecord(source, '开场白'));
}

function buildOpeningCharacterProfileFromDraft(draft: OpeningWorkshopDraft): OpeningGeneratedProfile {
  const protagonist = normalizeLines(draft.character.name, '克斯');
  const race = normalizeLines(draft.character.race, '人类');
  const gender = normalizeLines(draft.character.gender, '未指定');
  const age = normalizeLines(draft.character.age, '未知年龄');
  const title = `${race}酒馆主人`;
  const profile = [
    `姓名: ${protagonist}`,
    `性别: ${gender}`,
    `年龄: ${age}`,
    `种族: ${race}`,
    draft.character.originNote ? `出身/备注: ${draft.character.originNote}` : '',
    draft.character.appearance ? `外貌: ${draft.character.appearance}` : '',
    draft.character.personality ? `性格: ${draft.character.personality}` : '',
    draft.character.backstory ? `个人故事: ${draft.character.backstory}` : '',
  ].filter(Boolean).join('\n');
  return {
    title,
    profile,
    summary: `${protagonist}是${draft.tavern.city || draft.tavern.territory || '普利莫迪亚'}的${race}酒馆主人。`,
    tags: [race, gender, draft.character.personality].map(cleanText).filter(Boolean),
  };
}

function buildOpeningTavernProfileFromDraft(draft: OpeningWorkshopDraft): OpeningGeneratedProfile {
  const tavernName = normalizeLines(draft.tavern.name, '铁壶酒馆');
  const territory = normalizeLines(draft.tavern.territory || draft.region, '韦斯托利亚');
  const city = normalizeLines(draft.tavern.city, '布拉姆维克');
  const place = normalizeLines(draft.tavern.place, '主厅接待区');
  const style = normalizeLines(draft.tavern.style, '玩家未指定，按开局故事推断');
  const regionLines = OPENING_TAVERN_REGION_NAMES.map(regionName => {
    const focus = regionName === place ? '当前开局落点，细节需要最明确' : '按本次酒馆风格延展';
    return `- ${regionName}: 状态=${normalizeLines(draft.tavern.status, '普通')}；风格=${style}；描述=${focus}；设施=按开局资金与库存倾向配置。`;
  });
  const profile = [
    `名称: ${tavernName}`,
    `领地: ${territory}`,
    `城市: ${city}`,
    `酒馆位置: ${place}`,
    `经营状态: ${normalizeLines(draft.tavern.status, '普通')}`,
    draft.tavern.style ? `酒馆风格: ${draft.tavern.style}` : '',
    draft.tavern.funds ? `初始资金倾向: ${draft.tavern.funds}` : '',
    draft.tavern.stock ? `初始库存倾向: ${draft.tavern.stock}` : '',
    draft.tavern.story ? `酒馆故事: ${draft.tavern.story}` : '',
    '八大区域:',
    ...regionLines,
  ].filter(Boolean).join('\n');
  return {
    title: tavernName,
    profile,
    summary: `${tavernName}位于${territory}的${city}，开局落点是${place}。`,
    tags: [territory, city, draft.tavern.status, draft.tavern.style].map(cleanText).filter(Boolean),
  };
}

function buildOpeningStoryFromTemplate(draft: OpeningWorkshopDraft): OpeningStoryDraft {
  const protagonist = normalizeLines(draft.character.name, '克斯');
  const tavernName = normalizeLines(draft.tavern.name, '铁壶酒馆');
  const territory = normalizeLines(draft.tavern.territory || draft.region, '韦斯托利亚');
  const city = normalizeLines(draft.tavern.city, '布拉姆维克');
  const place = normalizeLines(draft.tavern.place, '主厅接待区');
  const values: Record<string, string> = {
    时代: normalizeLines(draft.era, '共栖历1303年'),
    地区: territory,
    领地: territory,
    城市: city,
    酒馆位置: place,
    主角名: protagonist,
    性别: cleanText(draft.character.gender),
    性别称呼: genderNoun(draft.character.gender, draft.character.age),
    年龄: normalizeLines(draft.character.age, '未知年龄'),
    种族: normalizeLines(draft.character.race, '人类'),
    出身备注: cleanText(draft.character.originNote),
    外貌: cleanText(draft.character.appearance),
    性格: cleanText(draft.character.personality),
    个人故事: cleanText(draft.character.backstory),
    酒馆名: tavernName,
    经营状态: normalizeLines(draft.tavern.status, '普通'),
    酒馆风格: cleanText(draft.tavern.style),
    酒馆故事: cleanText(draft.tavern.story),
    开局主题: cleanText(draft.theme),
    外貌句: draft.character.appearance ? sentence(draft.character.appearance) : '',
    性格句: draft.character.personality ? sentence(`性格关键词是${draft.character.personality}`) : '',
    出身句: draft.character.originNote ? sentence(draft.character.originNote) : '',
    个人故事句: draft.character.backstory ? sentence(draft.character.backstory) : '',
    酒馆风格句: draft.tavern.style ? sentence(draft.tavern.style) : '',
    酒馆故事句: draft.tavern.story ? sentence(draft.tavern.story) : '',
  };
  return parseOpeningStory(replaceOpeningTemplate(DEFAULT_OPENING_TEMPLATE, values));
}

export function buildModularOpeningBundle(draft: OpeningWorkshopDraft): OpeningGenerationBundle {
  return {
    characterProfile: buildOpeningCharacterProfileFromDraft(draft),
    tavernProfile: buildOpeningTavernProfileFromDraft(draft),
    story: buildOpeningStoryFromTemplate(draft),
  };
}

function normalizeOpeningTemplateDraft(raw: unknown): OpeningTemplateDraft {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const characterTemplate = cleanText(record.characterTemplate ?? record.character_template ?? record['人物档案模板']);
  const tavernTemplate = cleanText(record.tavernTemplate ?? record.tavern_template ?? record['酒馆档案模板']);
  if (!characterTemplate) throw new Error('AI 没有生成「开局模板-人物档案」正文。');
  if (!tavernTemplate) throw new Error('AI 没有生成「开局模板-酒馆档案」正文。');
  return { characterTemplate, tavernTemplate };
}

function parseOpeningTemplates(text: string): OpeningTemplateDraft {
  const characterTemplate = extractAnyTaggedBlock(text, ['characterTemplate', '人物档案模板']);
  const tavernTemplate = extractAnyTaggedBlock(text, ['tavernTemplate', '酒馆档案模板']);
  if (characterTemplate && tavernTemplate) return { characterTemplate, tavernTemplate };
  return normalizeOpeningTemplateDraft(parseJsonRecord(text, '开局模板'));
}

async function loadTemplateContent(worldbookName: string, entryName: string) {
  const found = await findOpeningTemplateEntry(entryName, worldbookName);
  const entry = found?.entry ?? null;
  if (!entry) throw new Error(`当前绑定世界书缺少「${entryName}」。`);
  const content = entry.content?.trim() ?? '';
  if (!content) throw new Error(`当前绑定世界书里的「${entryName}」正文为空。`);
  return content;
}

async function findOpeningTemplateEntry(entryName: string, preferredWorldbookName = '') {
  const preferred = cleanText(preferredWorldbookName);
  try {
    const activeItems = await loadActiveWorldbookEntries();
    const matches = activeItems.filter(item => matchesWorldbookEntryName(item.entry, entryName));
    const preferredMatch = matches.find(item => item.worldbookName === preferred);
    const match = preferredMatch ?? matches[0];
    if (match) {
      return {
        worldbookName: match.worldbookName,
        entry: cloneOpeningEntry(match.entry),
      };
    }
  } catch (error) {
    console.warn(`[Primordia] 扫描当前绑定世界书模板失败：${entryName}`, error);
  }

  if (preferred) {
    const entry = await loadWorldbookEntryByName(preferred, entryName);
    if (entry) return { worldbookName: preferred, entry };
  }

  return null;
}

export function availableOpeningWorldbooks() {
  return getKnownWorldbookNames();
}

export function defaultOpeningWorldbookName() {
  return getPrimaryCharacterWorldbookName() || getKnownWorldbookNames()[0] || '';
}

export async function inspectOpeningTemplates(worldbookName: string): Promise<OpeningTemplateStatus> {
  const characterFound = await findOpeningTemplateEntry(OPENING_CHARACTER_TEMPLATE_ENTRY, worldbookName);
  const tavernFound = await findOpeningTemplateEntry(OPENING_TAVERN_TEMPLATE_ENTRY, worldbookName);
  const characterTemplate = characterFound?.entry ?? null;
  const tavernTemplate = tavernFound?.entry ?? null;
  const missingEntries = [
    characterTemplate ? '' : OPENING_CHARACTER_TEMPLATE_ENTRY,
    tavernTemplate ? '' : OPENING_TAVERN_TEMPLATE_ENTRY,
  ].filter(Boolean);
  const emptyEntries = [
    characterTemplate && !cleanText(characterTemplate.content) ? OPENING_CHARACTER_TEMPLATE_ENTRY : '',
    tavernTemplate && !cleanText(tavernTemplate.content) ? OPENING_TAVERN_TEMPLATE_ENTRY : '',
  ].filter(Boolean);
  return {
    worldbookName: characterFound?.worldbookName || tavernFound?.worldbookName || worldbookName,
    characterTemplateFound: Boolean(characterTemplate && cleanText(characterTemplate.content)),
    tavernTemplateFound: Boolean(tavernTemplate && cleanText(tavernTemplate.content)),
    missingEntries,
    emptyEntries,
    characterTemplateContent: cleanText(characterTemplate?.content),
    tavernTemplateContent: cleanText(tavernTemplate?.content),
  };
}

export async function saveOpeningTemplateContent(worldbookName: string, entryName: string, content: string) {
  const targetWorldbook = worldbookName || defaultOpeningWorldbookName();
  if (!targetWorldbook) throw new Error('没有可写入的世界书。');
  const cleanName = cleanText(entryName);
  const allowedNames = [OPENING_CHARACTER_TEMPLATE_ENTRY, OPENING_TAVERN_TEMPLATE_ENTRY] as string[];
  if (!allowedNames.includes(cleanName)) {
    throw new Error(`「${cleanName}」不是可保存的开局模板条目。`);
  }
  const cleanContent = cleanText(content);
  if (!cleanContent) throw new Error('模板正文不能为空。');
  return upsertWorldbookEntryByName(targetWorldbook, cleanName, {
    enabled: false,
    content: cleanContent,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: { type: 'at_depth', role: 'system', depth: 4, order: 95 },
  });
}

export async function saveOpeningTemplates(worldbookName: string, templates: OpeningTemplateDraft) {
  const targetWorldbook = worldbookName || defaultOpeningWorldbookName();
  if (!targetWorldbook) throw new Error('没有可写入的世界书。');
  const characterEntry = await saveOpeningTemplateContent(targetWorldbook, OPENING_CHARACTER_TEMPLATE_ENTRY, templates.characterTemplate);
  const tavernEntry = await saveOpeningTemplateContent(targetWorldbook, OPENING_TAVERN_TEMPLATE_ENTRY, templates.tavernTemplate);
  return { characterEntry, tavernEntry };
}

export async function generateOpeningTemplates(draft: OpeningWorkshopDraft): Promise<OpeningTemplateDraft> {
  const prompt = `请根据本次开局登记信息，写出两份“开局生成中间模板”。这些模板会被前端保存到世界书条目中，随后用于生成人物档案和酒馆档案。

只输出以下标签，不要输出 JSON，不要输出 Markdown 代码块，不要输出解释：
<characterTemplate>
开局模板-人物档案正文
</characterTemplate>
<tavernTemplate>
开局模板-酒馆档案正文
</tavernTemplate>

要求：
- 模板正文要像给 AI 的生成规范，不要写最终档案。
- 当前是“模板生成阶段”，不是“开场白阶段”；不要写故事正文，不要写第一天叙事。
- 模板里应明确本次开局需要保留的字段、风格、世界观重点和禁止跑偏事项。
- 人物模板服务于“根据玩家素材整理主角档案”。
- 酒馆模板服务于“根据玩家素材整理酒馆档案”，必须要求最终档案写出八个酒馆区域：${OPENING_TAVERN_REGION_NAMES.join('、')}。
- 酒馆模板必须要求每个区域写 状态、风格、描述、设施倾向，且全部体现玩家填写的酒馆风格和酒馆故事。
- 酒馆模板必须提醒：不要沿用默认区域词，如“木石混合”“橡木与石墙”“深色橡木”“石灶与铁锅”“木梁与粗布”“石壁与木桶”，除非玩家风格本来就是这些。
- 标签内部可以换行；不要省略任一标签。
- 绝对不要输出 <maintext>、<option>、<UpdateVariable>、<Analysis>、<JSONPatch>。

本次开局信息：
时代：${draft.era}
地区/领地：${draft.region || draft.tavern.territory}
开局主题：${draft.theme}

主角：
姓名：${draft.character.name}
性别：${draft.character.gender}
年龄：${draft.character.age}
种族：${draft.character.race}
出身/备注：${draft.character.originNote}
外貌：${draft.character.appearance}
性格：${draft.character.personality}
个人故事：${draft.character.backstory}

酒馆：
名称：${draft.tavern.name}
领地：${draft.tavern.territory}
城市：${draft.tavern.city}
酒馆位置：${draft.tavern.place}
经营状态：${draft.tavern.status}
酒馆风格：${draft.tavern.style}
资金倾向：${draft.tavern.funds}
库存倾向：${draft.tavern.stock}
酒馆故事：${draft.tavern.story}`;
  return parseOpeningTemplates(await runOpeningGeneration(prompt));
}

export async function generateAndWriteOpeningTemplates(draft: OpeningWorkshopDraft) {
  const templates = await generateOpeningTemplates(draft);
  const entries = await saveOpeningTemplates(draft.worldbookName, templates);
  return { ...templates, ...entries };
}

export async function generateOpeningCharacterProfile(
  input: OpeningCharacterInput,
  worldbookName: string,
  tavernInput?: OpeningTavernInput,
): Promise<OpeningGeneratedProfile> {
  const template = await loadTemplateContent(worldbookName, OPENING_CHARACTER_TEMPLATE_ENTRY);
  const tavernContext = tavernInput
    ? `

酒馆登记信息：
酒馆名：${tavernInput.name || '未填写'}
领地：${tavernInput.territory || '未填写'}
城市：${tavernInput.city || '未填写'}
酒馆位置：${tavernInput.place || '未填写'}
经营状态：${tavernInput.status || '未填写'}

人物档案必须把“酒馆名”作为主角当前经营/接手的酒馆名称写进去；不要另起一个不同的酒馆名。`
    : '';
  const prompt = `请根据玩家素材和“人物档案模板”整理普利莫迪亚主角开局档案。只输出以下标签，不要输出 JSON，不要输出 Markdown 代码块，不要输出解释：
<title>短称号</title>
<profile>
完整人物档案
</profile>
<summary>一句话摘要</summary>
<tags>标签1、标签2</tags>

人物档案模板：
${template}
${tavernContext}

玩家素材：
姓名：${input.name}
性别：${input.gender}
年龄：${input.age}
种族：${input.race}
出身/备注：${input.originNote}
外貌：${input.appearance}
性格：${input.personality}
个人故事：${input.backstory}`;
  return parseOpeningProfile(await runOpeningGeneration(prompt), input.name || '主角', '人物档案');
}

export async function generateOpeningTavernProfile(
  input: OpeningTavernInput,
  worldbookName: string,
): Promise<OpeningGeneratedProfile> {
  const template = await loadTemplateContent(worldbookName, OPENING_TAVERN_TEMPLATE_ENTRY);
  const prompt = `请根据玩家素材和“酒馆档案模板”整理普利莫迪亚酒馆开局档案。只输出以下标签，不要输出 JSON，不要输出 Markdown 代码块，不要输出解释：
<title>酒馆短标题</title>
<profile>
完整酒馆档案，必须包含八个区域分段
</profile>
<summary>一句话摘要</summary>
<tags>标签1、标签2</tags>

硬性要求：
- <profile> 里必须有“八大区域”或同等标题，并逐项写出：${OPENING_TAVERN_REGION_NAMES.join('、')}。
- 每个区域必须写：状态、风格、描述、设施倾向。
- 每个区域的风格和描述都要继承玩家的“酒馆风格”“经营状态”“酒馆故事”，不能写成通用默认酒馆。
- 不得沿用默认模板词，如“木石混合”“橡木与石墙”“深色橡木”“石灶与铁锅”“木梁与粗布”“石壁与木桶”，除非玩家填写的酒馆风格本来就是这些。
- 酒馆位置“${input.place || '未指定'}”对应的区域要写得最具体，因为开局会落在那里。

酒馆档案模板：
${template}

玩家素材：
酒馆名：${input.name}
领地：${input.territory}
城市：${input.city}
酒馆位置：${input.place}
经营状态：${input.status}
酒馆风格：${input.style}
资金倾向：${input.funds}
库存倾向：${input.stock}
酒馆故事：${input.story}`;
  return parseOpeningProfile(await runOpeningGeneration(prompt), input.name || '酒馆', '酒馆档案');
}

export async function generateOpeningStory(
  draft: OpeningWorkshopDraft,
  characterProfile: OpeningGeneratedProfile,
  tavernProfile: OpeningGeneratedProfile,
): Promise<OpeningStoryDraft> {
  const prompt = `请根据人物档案、酒馆档案和世界选择，生成普利莫迪亚第一层开场白正文。只输出以下标签，不要输出 JSON，不要输出 Markdown 代码块，不要输出解释：
<maintext>
800-1400字正文，不含其它标签，交代故事背景，结尾不要设置冲突
</maintext>
<sum>一句话摘要</sum>

硬性限制：
- 只写开场白正文，不要初始化变量。
- 绝对不要输出 <UpdateVariable>、<Analysis>、<JSONPatch>。
- 不要写“今天是第几月第几天”这种会覆盖前端变量的断言，除非下面的世界选择明确给出。
- 不要写地图坐标、变量路径、库存、资金、人物羁绊、酒馆区域 JSON。

缺省开场白模板含义：
<maintext>
{{时代}}的{{地区}}，{{主角名}}来到或接手了{{酒馆名}}。正文需要自然交代人物、酒馆、城市、第一天的空气和可行动的起点。
</maintext>
<option>
1.开始我们的故事
</option>

世界选择：
时代：${draft.era}
地区：${draft.region}
主题：${draft.theme}

人物档案：
${characterProfile.profile}

酒馆档案：
${tavernProfile.profile}`;
  return parseOpeningStory(await runOpeningGeneration(prompt));
}

async function runOpeningInitvarGeneration(prompt: string) {
  const result = await runIsolatedOpeningGeneration(
    prompt,
    '你是普利莫迪亚专用开局生成器。当前任务是初始化第 1 层，不是普通回合更新。必须同时生成开场正文和完整初始变量。严格输出用户要求的 XML 标签，不输出解释、Markdown 代码块或额外前后缀。开局变量只能使用 <UpdateVariable><initvar> YAML，不得使用 JSONPatch，不得输出 <Analysis>。',
  );
  const text = coerceGenerationText(result);
  if (!text) throw new Error('AI 没有返回可读取的文本。');
  return text;
}

function parseOpeningStoryWithInitvar(text: string): OpeningStoryDraft {
  const source = stripCodeFence(text);
  const taggedMaintext = extractAnyTaggedBlock(source, ['maintext', '正文']);
  const plainMaintext = taggedMaintext ? '' : extractPlainOpeningText(source);
  const maintext = taggedMaintext || plainMaintext;
  if (!maintext) throw new Error('AI 没有输出 <maintext> 开场正文，也没有可提取的开场正文文本。');
  const sum = extractAnyTaggedBlock(source, ['sum', 'summary', '摘要']);
  const { initvar, initvarYaml } = parseOpeningInitvar(source);
  return {
    maintext: stripOpeningForbiddenBlocks(maintext),
    options: ['开始我们的故事'],
    sum,
    initvar,
    initvarYaml,
    raw: source,
  };
}

function readOpeningInitvarPath(source: unknown, path: string) {
  if (!source || typeof source !== 'object') return '';
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
  return cleanText(value);
}

function setOpeningInitvarPath(source: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let current: Record<string, unknown> = source;
  keys.slice(0, -1).forEach(key => {
    const next = current[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  });
  current[keys[keys.length - 1]] = value;
}

function enforceOpeningDraftFacts(story: OpeningStoryDraft, draft: OpeningWorkshopDraft) {
  if (!story.initvar || typeof story.initvar !== 'object' || Array.isArray(story.initvar)) return;
  const initvar = story.initvar as Record<string, unknown>;
  const tavernTerritory = cleanText(draft.tavern.territory || draft.region);
  const tavernCity = cleanText(draft.tavern.city);
  const tavernPlace = cleanText(draft.tavern.place);
  const tavernName = cleanText(draft.tavern.name);
  const protagonistName = cleanText(draft.character.name);
  const protagonistRace = cleanText(draft.character.race);

  if (draft.era) setOpeningInitvarPath(initvar, '世界.时代', cleanText(draft.era));
  if (tavernTerritory) setOpeningInitvarPath(initvar, '世界.地区', tavernTerritory);
  if (tavernCity) setOpeningInitvarPath(initvar, '世界.当前地点.区域', tavernCity);
  if (tavernPlace) setOpeningInitvarPath(initvar, '世界.当前地点.具体位置', tavernPlace);
  if (tavernName) setOpeningInitvarPath(initvar, '酒馆.名称', tavernName);
  if (tavernTerritory) setOpeningInitvarPath(initvar, '酒馆.所属领地', tavernTerritory);
  if (tavernCity) setOpeningInitvarPath(initvar, '酒馆.所在城市', tavernCity);
  if (draft.tavern.status) setOpeningInitvarPath(initvar, '酒馆.今日营业状态', cleanText(draft.tavern.status));
  if (protagonistName) setOpeningInitvarPath(initvar, '主角.姓名', protagonistName);
  if (protagonistRace) setOpeningInitvarPath(initvar, '主角.种族', protagonistRace);
  if (tavernPlace) setOpeningInitvarPath(initvar, '主角.所在位置', tavernPlace);
  if (draft.character.appearance) setOpeningInitvarPath(initvar, '主角.一句话穿着', cleanText(draft.character.appearance));
}

function assertOpeningStoryMatchesDraft(story: OpeningStoryDraft, draft: OpeningWorkshopDraft) {
  const checks = [
    { label: '主角姓名', expected: draft.character.name, actual: readOpeningInitvarPath(story.initvar, '主角.姓名') },
    { label: '主角种族', expected: draft.character.race, actual: readOpeningInitvarPath(story.initvar, '主角.种族') },
    { label: '酒馆名称', expected: draft.tavern.name, actual: readOpeningInitvarPath(story.initvar, '酒馆.名称') },
    { label: '所在城市', expected: draft.tavern.city, actual: readOpeningInitvarPath(story.initvar, '世界.当前地点.区域') },
    { label: '酒馆位置', expected: draft.tavern.place, actual: readOpeningInitvarPath(story.initvar, '世界.当前地点.具体位置') },
  ];
  const mismatches = checks.filter(item => {
    const expected = cleanText(item.expected);
    if (!expected) return false;
    return cleanText(item.actual) !== expected;
  });
  if (mismatches.length) {
    throw new Error(
      `AI 返回的开局变量与当前登记不一致：${mismatches
        .map(item => `${item.label} 应为“${cleanText(item.expected)}”，实际为“${cleanText(item.actual) || '空'}”`)
        .join('；')}。请重新生成，旧开局内容不会写入楼层。`,
    );
  }
}

const OPENING_INITVAR_SCHEMA_GUIDE = `正式 initvar 顶层必须包含：
世界:
  时代: 字符串
  地区: 字符串
  当前历法:
    年: 数字
    月份序号: 数字
    月份名: 字符串
    季节: 字符串
    日: 数字
    时段: 字符串
    天气: 字符串
    时间: HH:mm 字符串
  当前地点:
    区域: 字符串
    具体位置: 字符串
酒馆:
  名称: 字符串
  声望: 数字
  资金:
    随身钱袋: 铜币/银币/金币/铂金币/秘银币/折算合计铜币
    钱匣: 铜币/银币/金币/铂金币/秘银币/折算合计铜币
    铜币/银币/金币/铂金币/秘银币/折算合计铜币: 两处资金合计
  今日营业状态: 字符串
  所属领地: 字符串
  所在城市: 字符串
  区域: 八大区域对象。必须包含：前门门面区、主厅接待区、柜台酒水区、厨房餐食区、客房、地窖储藏区、后院生活区、马厩交通区。每个区域至少写 状态、风格、描述、设施。
  客房: 客房对象
主角:
  姓名/种族/称号/当前状态/所在位置/一句话穿着
  生命/精力: 当前值/上限/阶段
  烹饪等级: 等级/称号/做菜次数/下级所需次数
库房:
  食材/调料/成品/酒水/杂物
行囊:
  食材/调料/成品/酒水/杂物，开局默认可为空对象
临时状态:
  主角: []
  酒馆: []
  酒馆区域: {}
  人物: {}
人物羁绊: 可为空对象
农田与酒窖:
  农田: {}
  酒窖桶: {}
街坊商铺:
  当前商铺: ""
  商铺: {}

注意：
- 顶层不要包 stat_data。
- 不要输出地图、系统判定、坐标。
- 库房物品用对象记录，至少包含 数量、标签、价格折合铜币；成品/酒水还要有 搭配判定。
- 所有数值都要写具体值，不要留空或写“未知”。`;

export async function generateOpeningStoryWithInitvar(
  draft: OpeningWorkshopDraft,
  characterProfile?: OpeningGeneratedProfile,
  tavernProfile?: OpeningGeneratedProfile,
): Promise<OpeningStoryDraft> {
  const prompt = `请根据本次普利莫迪亚开局登记信息，生成第 1 层开场白和完整初始变量。

你要做两件事：
1. 写一段适合普利莫迪亚的开场正文，交代人物、酒馆、城市、第一天的起点。结尾不要替玩家做决定。
2. 根据同一个开场事实，写完整 <initvar> 初始变量。变量必须和正文一致。

只允许输出以下结构，不要输出解释，不要输出 Markdown 代码块：
<maintext>
开场正文
</maintext>
<option>
1.开始我们的故事
</option>
<UpdateVariable>
<initvar>
世界:
  ...
酒馆:
  ...
主角:
  ...
库房:
  ...
行囊:
  食材: {}
  调料: {}
  成品: {}
  酒水: {}
  杂物: {}
临时状态:
  主角: []
  酒馆: []
  酒馆区域: {}
  人物: {}
人物羁绊: {}
农田与酒窖:
  农田: {}
  酒窖桶: {}
街坊商铺:
  当前商铺: ""
  商铺: {}
</initvar>
</UpdateVariable>

禁止事项：
- 不要输出 JSONPatch。
- 不要输出 <Analysis>。
- 不要把变量写成 JSON。
- 不要输出坐标、地图、系统判定。
- 不要照抄示例省略号，所有叶节点必须有具体值。
- 顶层必须是正常中文：世界、酒馆、主角、库房、行囊、临时状态、人物羁绊、农田与酒窖、街坊商铺。
- 酒馆.区域 的八大区域必须根据“酒馆风格”和“AI 已整理酒馆档案”重写；不得沿用默认模板词，如“木石混合”“橡木与石墙”“深色橡木”“石灶与铁锅”“木梁与粗布”“石壁与木桶”，除非玩家填写的酒馆风格本来就是这些。
- 每个酒馆区域的 描述 必须体现玩家指定的酒馆风格、领地城市和开局故事，不要只写泛用功能说明。
- 主角种族必须严格使用“人物登记 / 种族”的值，不得根据酒馆领地、城市或当地主要种族改写。
- 酒馆领地和城市只影响环境、常见居民、食材与风俗；如果主角种族与当地主要种族不同，就写成外来者、客居者或继承者，不要把主角改成当地种族。

${OPENING_INITVAR_SCHEMA_GUIDE}

本次玩家开局信息：
时代: ${draft.era}
领地/地区: ${draft.region || draft.tavern.territory}
开局主题: ${draft.theme}

主角：
姓名: ${draft.character.name}
性别: ${draft.character.gender}
年龄: ${draft.character.age}
种族: ${draft.character.race}
出身/备注: ${draft.character.originNote}
外貌: ${draft.character.appearance}
性格: ${draft.character.personality}
个人故事: ${draft.character.backstory}

酒馆：
名称: ${draft.tavern.name}
领地: ${draft.tavern.territory}
城市: ${draft.tavern.city}
具体位置: ${draft.tavern.place}
经营状态: ${draft.tavern.status}
酒馆风格: ${draft.tavern.style}
资金倾向: ${draft.tavern.funds}
库存倾向: ${draft.tavern.stock}
酒馆故事: ${draft.tavern.story}

AI 已整理人物档案:
${characterProfile?.profile ? stripOpeningForbiddenBlocks(characterProfile.profile) : '（尚未提供，请仅参考玩家原始人物信息。）'}

AI 已整理酒馆档案:
${tavernProfile?.profile ? stripOpeningForbiddenBlocks(tavernProfile.profile) : '（尚未提供，请仅参考玩家原始酒馆信息。）'}`;

  const story = parseOpeningStoryWithInitvar(await runOpeningInitvarGeneration(prompt));
  enforceOpeningDraftFacts(story, draft);
  assertOpeningStoryMatchesDraft(story, draft);
  return story;
}

export function formatOpeningAssistantMessage(story: OpeningStoryDraft) {
  return `<maintext>\n${story.maintext.trim()}\n</maintext>\n\n<option>\n1.开始我们的故事\n</option>`;
}

function indentBlock(text: string, spaces = 4) {
  const pad = ' '.repeat(spaces);
  return cleanText(text).split('\n').map(line => `${pad}${line}`).join('\n');
}

export function buildGameInfoWorldbookContent(
  draft: OpeningWorkshopDraft,
  bundle: OpeningGenerationBundle,
) {
  return `<PrimordiaGameInfo>
version: 2
createdAt: ${new Date().toISOString()}

玩家原始选择:
  时代: ${draft.era || '未指定'}
  地区: ${draft.region || '未指定'}
  酒馆领地: ${draft.tavern.territory || '未指定'}
  酒馆城市: ${draft.tavern.city || '未指定'}
  酒馆位置: ${draft.tavern.place || '未指定'}
  开局主题: ${draft.theme || '未指定'}
  模块选择: ${draft.moduleChoices.map(choice => choice.entryName).filter(Boolean).join('、') || '无'}

主角原始素材:
  姓名: ${draft.character.name}
  性别: ${draft.character.gender}
  年龄: ${draft.character.age}
  种族: ${draft.character.race}
  出身/备注: ${draft.character.originNote}
  外貌: ${draft.character.appearance}
  性格: ${draft.character.personality}
  个人故事: |-
${indentBlock(draft.character.backstory)}

酒馆原始素材:
  名称: ${draft.tavern.name}
  领地: ${draft.tavern.territory}
  城市: ${draft.tavern.city}
  酒馆位置: ${draft.tavern.place}
  经营状态: ${draft.tavern.status}
  风格: ${draft.tavern.style}
  初始资金倾向: ${draft.tavern.funds}
  初始库存倾向: ${draft.tavern.stock}
  酒馆故事: |-
${indentBlock(draft.tavern.story)}

AI整理后主角档案:
${bundle.characterProfile.profile}

AI整理后酒馆档案:
${bundle.tavernProfile.profile}

开局约束:
  - 以上设定是长期事实，后续叙事应保持一致。
  - 如剧情需要扩展细节，应优先兼容玩家原始选择。
  - 不要在没有剧情依据时否定主角身份、酒馆来历或时代模块。
</PrimordiaGameInfo>`;
}

function buildCharacterArchiveContent(draft: OpeningWorkshopDraft, profile: OpeningGeneratedProfile) {
  return `<PrimordiaOpeningCharacter>
姓名: ${draft.character.name}
称号: ${profile.title}
摘要: ${profile.summary}
标签: ${profile.tags.join('、') || '无'}

${stripOpeningForbiddenBlocks(profile.profile)}
</PrimordiaOpeningCharacter>`;
}

function buildTavernArchiveContent(draft: OpeningWorkshopDraft, profile: OpeningGeneratedProfile) {
  return `<PrimordiaOpeningTavern>
名称: ${draft.tavern.name}
领地: ${draft.tavern.territory || draft.region}
城市: ${draft.tavern.city}
位置: ${draft.tavern.place}
经营状态: ${draft.tavern.status}
资金倾向: ${draft.tavern.funds}
库存倾向: ${draft.tavern.stock}
称号: ${profile.title}
摘要: ${profile.summary}
标签: ${profile.tags.join('、') || '无'}

${stripOpeningForbiddenBlocks(profile.profile)}
</PrimordiaOpeningTavern>`;
}

function openingArchiveSeed(
  entryName: string,
  content: string,
  keys: string[],
  order: number,
): Partial<EditableWorldbookEntry> {
  return {
    enabled: true,
    name: entryName,
    comment: entryName,
    content,
    strategy: {
      type: 'constant',
      keys,
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: { type: 'at_depth', role: 'system', depth: 4, order },
  };
}

export async function writeOpeningProfileEntry(
  worldbookName: string,
  kind: 'character' | 'tavern',
  draft: OpeningWorkshopDraft,
  profile: OpeningGeneratedProfile,
) {
  const targetWorldbook = worldbookName || draft.worldbookName || defaultOpeningWorldbookName();
  if (!targetWorldbook) throw new Error('没有可写入的世界书。');
  const entryName = kind === 'character' ? OPENING_CHARACTER_ENTRY : OPENING_TAVERN_ENTRY;
  const seed = kind === 'character'
    ? openingArchiveSeed(
        OPENING_CHARACTER_ENTRY,
        buildCharacterArchiveContent(draft, profile),
        ['普利莫迪亚', '开局人物档案'],
        70,
      )
    : openingArchiveSeed(
        OPENING_TAVERN_ENTRY,
        buildTavernArchiveContent(draft, profile),
        ['普利莫迪亚', '开局酒馆档案'],
        75,
      );
  return upsertWorldbookEntryByName(targetWorldbook, entryName, seed);
}

export async function resetOpeningProfileEntries(worldbookName: string) {
  const targetWorldbook = worldbookName || defaultOpeningWorldbookName();
  if (!targetWorldbook) throw new Error('没有可写入的世界书。');
  const characterEntry = await upsertWorldbookEntryByName(
    targetWorldbook,
    OPENING_CHARACTER_ENTRY,
    {
      ...openingArchiveSeed(
        OPENING_CHARACTER_ENTRY,
        '<PrimordiaOpeningCharacter status="pending">\n本次开局人物档案待生成。\n</PrimordiaOpeningCharacter>',
        ['普利莫迪亚', '开局人物档案'],
        70,
      ),
      enabled: false,
    },
  );
  const tavernEntry = await upsertWorldbookEntryByName(
    targetWorldbook,
    OPENING_TAVERN_ENTRY,
    {
      ...openingArchiveSeed(
        OPENING_TAVERN_ENTRY,
        '<PrimordiaOpeningTavern status="pending">\n本次开局酒馆档案待生成。\n</PrimordiaOpeningTavern>',
        ['普利莫迪亚', '开局酒馆档案'],
        75,
      ),
      enabled: false,
    },
  );
  const gameInfoEntry = await upsertWorldbookEntryByName(
    targetWorldbook,
    OPENING_GAME_INFO_ENTRY,
    {
      enabled: false,
      name: OPENING_GAME_INFO_ENTRY,
      comment: OPENING_GAME_INFO_ENTRY,
      content: '<PrimordiaGameInfo status="pending">\n本次开局游戏信息待最终确认后写入。\n</PrimordiaGameInfo>',
      strategy: {
        type: 'constant',
        keys: ['普利莫迪亚', '游戏信息'],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: { type: 'at_depth', role: 'system', depth: 4, order: 80 },
    },
  );
  return { characterEntry, tavernEntry, gameInfoEntry };
}

function buildRegionOpeningBlock(draft: OpeningWorkshopDraft, bundle: OpeningGenerationBundle, regionEntryName: string) {
  const regionName = regionEntryName.replace(/^酒馆区域-/, '');
  return `开局酒馆: ${draft.tavern.name || '未命名酒馆'}
所在领地: ${draft.tavern.territory || draft.region || '未指定'}
所在城市: ${draft.tavern.city || '未指定'}
酒馆位置: ${draft.tavern.place || '未指定位置'}
区域: ${regionName}
经营状态: ${draft.tavern.status || '普通'}
酒馆风格: ${draft.tavern.style || '未指定'}

酒馆档案摘录:
${bundle.tavernProfile.profile}`;
}

export async function writeOpeningWorldbook(
  draft: OpeningWorkshopDraft,
  bundle: OpeningGenerationBundle,
): Promise<OpeningWorldbookResult> {
  const worldbookName = draft.worldbookName || defaultOpeningWorldbookName();
  if (!worldbookName) throw new Error('没有可写入的世界书。');

  let resolvedWorldbookName = worldbookName;
  let entries: EditableWorldbookEntry[];
  try {
    const loaded = await loadWorldbookEntriesForEdit(worldbookName);
    resolvedWorldbookName = loaded.worldbookName;
    entries = loaded.entries;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`读取世界书「${worldbookName}」失败：${message}`);
  }

  const characterSeed = openingArchiveSeed(
    OPENING_CHARACTER_ENTRY,
    buildCharacterArchiveContent(draft, bundle.characterProfile),
    ['普利莫迪亚', '开局人物档案'],
    70,
  );
  const tavernSeed = openingArchiveSeed(
    OPENING_TAVERN_ENTRY,
    buildTavernArchiveContent(draft, bundle.tavernProfile),
    ['普利莫迪亚', '开局酒馆档案'],
    75,
  );
  const gameInfoSeed: Partial<EditableWorldbookEntry> = {
    enabled: true,
    content: buildGameInfoWorldbookContent(draft, bundle),
    strategy: {
      type: 'constant',
      keys: ['普利莫迪亚', '游戏信息'],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: { type: 'at_depth', role: 'system', depth: 4, order: 80 },
  };
  const turnContextSeed: Partial<EditableWorldbookEntry> = {
    enabled: true,
    content: [
      '<PRIMORDIA_TURN_CONTEXT status="waiting">',
      '【说明】',
      '这是普利莫迪亚本回合完整发送包的自动覆盖条目。发送新回合前，前端会把本回合发生/待执行内容写入这里。',
      '</PRIMORDIA_TURN_CONTEXT>',
    ].join('\n'),
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: { type: 'at_depth', role: 'user', depth: 0, order: 0 },
  };

  const findEntryIndex = (entryName: string) => entries.findIndex(item => matchesWorldbookEntryName(item, entryName));
  const missingRequiredEntries = [
    { name: OPENING_CHARACTER_ENTRY, seed: characterSeed },
    { name: OPENING_TAVERN_ENTRY, seed: tavernSeed },
    { name: OPENING_GAME_INFO_ENTRY, seed: gameInfoSeed },
    { name: TURN_CONTEXT_WORLDBOOK_ENTRY_NAME, seed: turnContextSeed },
  ].filter(item => findEntryIndex(item.name) < 0);

  if (missingRequiredEntries.length > 0) {
    try {
      const created = await createWorldbookEntriesForEdit(
        resolvedWorldbookName,
        missingRequiredEntries.map(item => ({
          enabled: true,
          content: '',
          ...item.seed,
          name: item.name,
          comment: item.name,
        })),
      );
      entries = (created.worldbook ?? entries).map(cloneOpeningEntry);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`新建开局必需条目失败（${missingRequiredEntries.map(item => item.name).join('、')}）：${message}`);
    }
  }

  const upsertInMemory = (entryName: string, seed: Partial<EditableWorldbookEntry>) => {
    const index = findEntryIndex(entryName);
    if (index < 0) throw new Error(`世界书「${resolvedWorldbookName}」中找不到「${entryName}」。`);
    entries[index] = {
      ...cloneOpeningEntry(entries[index]),
      ...seed,
      uid: entries[index].uid,
      name: entryName,
      comment: entryName,
    } as EditableWorldbookEntry;
    return cloneOpeningEntry(entries[index]);
  };

  const characterEntry = upsertInMemory(OPENING_CHARACTER_ENTRY, characterSeed);
  const tavernEntry = upsertInMemory(OPENING_TAVERN_ENTRY, tavernSeed);
  const entry = upsertInMemory(OPENING_GAME_INFO_ENTRY, gameInfoSeed);
  const turnContextEntry = upsertInMemory(TURN_CONTEXT_WORLDBOOK_ENTRY_NAME, turnContextSeed);

  const templateResults = [];
  for (const entryName of [OPENING_CHARACTER_TEMPLATE_ENTRY, OPENING_TAVERN_TEMPLATE_ENTRY]) {
    const index = findEntryIndex(entryName);
    if (index < 0) {
      templateResults.push({ entryName, found: false, changed: false });
      continue;
    }
    const changed = entries[index].enabled !== false;
    entries[index] = { ...cloneOpeningEntry(entries[index]), enabled: false };
    templateResults.push({ entryName, found: true, changed });
  }

  const regionResults = [];
  for (const entryName of OPENING_REGION_ENTRY_NAMES) {
    const index = findEntryIndex(entryName);
    if (index < 0) {
      regionResults.push({ entryName, found: false, changed: false });
      continue;
    }
    const nextContent = replaceOpeningManagedBlock(entries[index].content || '', buildRegionOpeningBlock(draft, bundle, entryName));
    const changed = nextContent !== entries[index].content;
    entries[index] = { ...cloneOpeningEntry(entries[index]), content: nextContent };
    regionResults.push({ entryName, found: true, changed });
  }

  const moduleResults = [];
  for (const choice of draft.moduleChoices) {
    const group = cleanText(choice.group);
    const entryName = cleanText(choice.entryName);
    if (!group || !entryName) continue;
    const prefix = entryName.startsWith(`${group}-`) ? `${group}-` : `${group}-`;
    let changed = 0;
    let matched = 0;
    let foundTarget = false;
    entries = entries.map(item => {
      const name = getWorldbookEntryName(item);
      if (!name.startsWith(prefix)) return item;
      matched += 1;
      const shouldEnable = name === entryName;
      if (shouldEnable) foundTarget = true;
      if (item.enabled === shouldEnable) return item;
      changed += 1;
      return { ...cloneOpeningEntry(item), enabled: shouldEnable };
    });
    moduleResults.push({ ...choice, prefix, changed, matched, foundTarget });
  }

  try {
    await replaceWorldbookEntriesForEdit(resolvedWorldbookName, entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`保存世界书「${resolvedWorldbookName}」失败：${message}`);
  }

  return {
    entry,
    characterEntry,
    tavernEntry,
    turnContextEntry,
    turnContextBinding: {
      worldbookName: resolvedWorldbookName,
      uid: Number(turnContextEntry.uid),
      entryName: TURN_CONTEXT_WORLDBOOK_ENTRY_NAME,
    },
    moduleResults,
    templateResults,
    regionResults,
  };
}

export function buildOpeningFallbackStory(draft: OpeningWorkshopDraft) {
  const era = normalizeLines(draft.era, '共栖历1303年');
  const region = normalizeLines(draft.region || draft.tavern.territory || draft.tavern.city, '韦斯托利亚');
  const protagonist = normalizeLines(draft.character.name, '克斯');
  const tavern = normalizeLines(draft.tavern.name, '铁壶酒馆');
  const city = normalizeLines(draft.tavern.city, '布拉姆维克');
  const place = normalizeLines(draft.tavern.place, '主厅接待区');
  return {
    maintext: `${era}的${region}，${protagonist}站在${city}的${tavern}里，脚下正是${place}。炉火、木门、账本和一间仍待整理的酒馆一起安静地等着他。属于普利莫迪亚编年录的第一天，就从这间酒馆的门槛开始。`,
    options: ['开始我们的故事'],
    sum: `${protagonist}在${region}·${city}的${tavern}开始了新的酒馆生活。`,
  };
}
