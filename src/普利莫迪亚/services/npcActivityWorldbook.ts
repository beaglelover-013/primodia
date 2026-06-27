import { parse } from 'yaml';
import {
  getPrimaryCharacterWorldbookName,
  loadActiveWorldbookEntries,
  loadWorldbookEntryByName,
  loadWorldbookEntry,
  getWorldbookEntryName,
  saveWorldbookEntry,
  upsertWorldbookEntryByName,
  type EditableWorldbookEntry,
  type WorldbookEntryRef,
  type WorldbookEntrySearchItem,
} from './worldbookService';
import { tavernNpcActivityPools, tavernNpcConversationTopics, tavernNpcRestActivities } from '../data/npcActivities';

export interface NpcActivityWorldbookLibrary {
  regions: Record<string, string[]>;
  conversationTopics: string[];
  restBehaviors: string[];
  sourceLabels: string[];
}

export interface NpcActivityWorldbookLoadResult {
  ok: boolean;
  library?: NpcActivityWorldbookLibrary;
  message: string;
  errors: string[];
}

export interface NpcActivityWorldbookStats {
  blockCount: number;
  regionCount: number;
  behaviorCount: number;
  conversationTopicCount: number;
  restBehaviorCount: number;
  regionBehaviorCounts: Array<{ region: string; count: number }>;
  errors: string[];
}

export interface NpcActivityWorldbookBinding extends WorldbookEntryRef {
  entryName: string;
  updatedAt?: number;
}

export const NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME = '【普利莫迪亚｜伪活人化行为库｜自动维护】';

const BLOCK_RE = /<\s*PrimordiaNpcActivities\b[^>]*>([\s\S]*?)<\s*\/\s*PrimordiaNpcActivities\s*>/gi;

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean);
}

function readRegionBehaviors(value: unknown) {
  if (Array.isArray(value)) return stringList(value);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return stringList(record.behaviors ?? record['行为'] ?? record['行为池']);
}

function mergeUnique(base: string[], additions: string[]) {
  const seen = new Set(base);
  const result = [...base];
  additions.forEach(item => {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  });
  return result;
}

function parseActivityBlock(raw: string, sourceLabel: string) {
  const parsed = parse(raw) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') throw new Error(`${sourceLabel}: YAML 内容不是对象。`);

  const regionRoot = parsed.regions ?? parsed['区域'] ?? parsed['区域行为'];
  const regions: Record<string, string[]> = {};
  if (regionRoot && typeof regionRoot === 'object' && !Array.isArray(regionRoot)) {
    Object.entries(regionRoot as Record<string, unknown>).forEach(([regionName, value]) => {
      const behaviors = readRegionBehaviors(value);
      if (behaviors.length) regions[cleanText(regionName)] = behaviors;
    });
  } else {
    const reservedKeys = new Set(['version', 'conversationTopics', '交谈主题', '交谈主题池', 'restBehaviors', '休息行为', '休息类行为']);
    Object.entries(parsed).forEach(([regionName, value]) => {
      if (reservedKeys.has(regionName)) return;
      const behaviors = readRegionBehaviors(value);
      if (behaviors.length) regions[cleanText(regionName)] = behaviors;
    });
  }

  const conversationTopics = stringList(parsed.conversationTopics ?? parsed['交谈主题'] ?? parsed['交谈主题池']);
  const restBehaviors = stringList(parsed.restBehaviors ?? parsed['休息行为'] ?? parsed['休息类行为']);

  if (!Object.keys(regions).length && !conversationTopics.length && !restBehaviors.length) {
    throw new Error(`${sourceLabel}: 没有读到 regions、conversationTopics 或 restBehaviors。`);
  }

  return { regions, conversationTopics, restBehaviors };
}

function emptyLibrary(): NpcActivityWorldbookLibrary {
  return {
    regions: {},
    conversationTopics: [],
    restBehaviors: [],
    sourceLabels: [],
  };
}

function mergeParsedBlock(merged: NpcActivityWorldbookLibrary, parsed: ReturnType<typeof parseActivityBlock>, sourceLabel: string) {
  Object.entries(parsed.regions).forEach(([regionName, behaviors]) => {
    merged.regions[regionName] = mergeUnique(merged.regions[regionName] ?? [], behaviors);
  });
  merged.conversationTopics = mergeUnique(merged.conversationTopics, parsed.conversationTopics);
  merged.restBehaviors = mergeUnique(merged.restBehaviors, parsed.restBehaviors);
  merged.sourceLabels.push(sourceLabel);
}

export function inspectNpcActivityWorldbookContent(content: string, sourceLabel = '行为库条目'): NpcActivityWorldbookStats {
  const errors: string[] = [];
  const merged = emptyLibrary();
  const blocks = [...String(content ?? '').matchAll(BLOCK_RE)];

  blocks.forEach((block, index) => {
    const label = `${sourceLabel}#${index + 1}`;
    try {
      mergeParsedBlock(merged, parseActivityBlock(block[1], label), label);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${label}: 解析失败。`);
    }
  });

  const regionBehaviorCounts = Object.entries(merged.regions)
    .map(([region, behaviors]) => ({ region, count: behaviors.length }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'zh-Hans-CN'));

  return {
    blockCount: blocks.length,
    regionCount: regionBehaviorCounts.length,
    behaviorCount: regionBehaviorCounts.reduce((sum, item) => sum + item.count, 0),
    conversationTopicCount: merged.conversationTopics.length,
    restBehaviorCount: merged.restBehaviors.length,
    regionBehaviorCounts,
    errors,
  };
}

async function loadNpcActivityLibraryFromItems(
  items: Array<Pick<WorldbookEntrySearchItem, 'worldbookName' | 'uid' | 'entry'>>,
  notFoundMessage: string,
): Promise<NpcActivityWorldbookLoadResult> {
  const errors: string[] = [];
  const merged = emptyLibrary();

  for (const item of items) {
    const content = String(item.entry.content ?? '');
    const blocks = [...content.matchAll(BLOCK_RE)];
    if (!blocks.length) continue;

    for (let index = 0; index < blocks.length; index += 1) {
      const sourceLabel = `${item.worldbookName}/${getWorldbookEntryName(item.entry) || item.uid}#${index + 1}`;
      try {
        mergeParsedBlock(merged, parseActivityBlock(blocks[index][1], sourceLabel), sourceLabel);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${sourceLabel}: 解析失败。`);
      }
    }
  }

  if (!merged.sourceLabels.length) {
    return {
      ok: false,
      message: errors.length ? '找到行为库标签，但格式没有成功解析。' : notFoundMessage,
      errors,
    };
  }

  return {
    ok: true,
    library: merged,
    message: `已读取 ${merged.sourceLabels.length} 个行为库块。`,
    errors,
  };
}

export async function loadNpcActivityLibraryFromActiveWorldbooks(): Promise<NpcActivityWorldbookLoadResult> {
  const entries = await loadActiveWorldbookEntries();
  return loadNpcActivityLibraryFromItems(entries, '当前启用世界书里没有找到 <PrimordiaNpcActivities> 行为库标签。');
}

export async function loadNpcActivityLibraryFromBoundWorldbookEntries(
  refs: WorldbookEntryRef[],
): Promise<NpcActivityWorldbookLoadResult> {
  const errors: string[] = [];
  const items: Array<Pick<WorldbookEntrySearchItem, 'worldbookName' | 'uid' | 'entry'>> = [];

  for (const ref of refs) {
    try {
      const entry = await loadWorldbookEntry(ref);
      if (!entry) {
        errors.push(`绑定失效：世界书「${ref.worldbookName}」中找不到 uid=${ref.uid} 的条目。`);
        continue;
      }
      items.push({ worldbookName: ref.worldbookName, uid: ref.uid, entry });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(`读取 ${ref.worldbookName}/${ref.uid} 失败：${reason}`);
    }
  }

  const result = await loadNpcActivityLibraryFromItems(items, '手动绑定的世界书条目里没有找到 <PrimordiaNpcActivities> 行为库标签。');
  return {
    ...result,
    errors: [...errors, ...result.errors],
    message: result.ok ? result.message : errors.length ? errors.join('；') : result.message,
  };
}

export function npcActivityWorldbookTemplate() {
  const regions = Object.entries(tavernNpcActivityPools)
    .map(([region, behaviors]) => `${region}:\n  behaviors: [${behaviors.join(', ')}]`)
    .join('\n');
  return `<PrimordiaNpcActivities>
version: 1

${regions}

conversationTopics: [${tavernNpcConversationTopics.join(', ')}]

restBehaviors: [${tavernNpcRestActivities.join(', ')}]
</PrimordiaNpcActivities>`;
}

function npcActivityWorldbookEntrySeed(content = npcActivityWorldbookTemplate()): Partial<EditableWorldbookEntry> {
  return {
    name: NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME,
    comment: NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME,
    enabled: false,
    content,
    strategy: {
      type: 'selective',
      keys: ['PrimordiaNpcActivities', '伪活人化', '行为库'],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'at_depth',
      role: 'system',
      depth: 4,
      order: 100,
    },
  };
}

export async function ensureNpcActivityWorldbookBinding(worldbookName = ''): Promise<NpcActivityWorldbookBinding> {
  const targetWorldbook = String(worldbookName || getPrimaryCharacterWorldbookName() || '').trim();
  if (!targetWorldbook) throw new Error('没有可写入的角色主世界书，无法自动创建伪活人化行为库条目。');

  const existing = await loadWorldbookEntryByName(targetWorldbook, NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME);
  const entry = existing
    ? existing.enabled
      ? await saveWorldbookEntry(targetWorldbook, { ...existing, enabled: false })
      : existing
    : await upsertWorldbookEntryByName(
        targetWorldbook,
        NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME,
        npcActivityWorldbookEntrySeed(),
      );

  return {
    worldbookName: targetWorldbook,
    uid: Number(entry.uid),
    entryName: NPC_ACTIVITY_WORLDBOOK_ENTRY_NAME,
    updatedAt: Date.now(),
  };
}
