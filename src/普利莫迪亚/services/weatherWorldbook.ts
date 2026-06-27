import { parse } from 'yaml';
import { PRIMORDIA_WEATHER_TEMPLATE_BY_MONTH, type PrimordiaWeatherEntry } from '../data/weather';
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

export interface WeatherWorldbookLibrary {
  months: Record<string, PrimordiaWeatherEntry[]>;
  sourceLabels: string[];
}

export interface WeatherWorldbookLoadResult {
  ok: boolean;
  library?: WeatherWorldbookLibrary;
  message: string;
  errors: string[];
}

export interface WeatherWorldbookStats {
  blockCount: number;
  monthCount: number;
  weatherCount: number;
  monthWeatherCounts: Array<{ month: string; count: number }>;
  errors: string[];
}

export interface WeatherWorldbookBinding extends WorldbookEntryRef {
  entryName: string;
  updatedAt?: number;
}

export const WEATHER_WORLDBOOK_ENTRY_NAME = '【普利莫迪亚｜天气池｜自动维护】';

const BLOCK_RE = /<\s*PrimordiaWeatherPool\b[^>]*>([\s\S]*?)<\s*\/\s*PrimordiaWeatherPool\s*>/gi;

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

function parseWeatherLine(value: unknown): PrimordiaWeatherEntry | null {
  if (typeof value === 'string') {
    const match = value.match(/^(.+?)[：:](.+)$/);
    if (!match) return null;
    const name = match[1].replace(/^\s*-\s*/, '').trim();
    const description = match[2].trim();
    return name && description ? { name, description } : null;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const name = cleanText(record.name ?? record['名称'] ?? record['天气']);
    const description = cleanText(record.description ?? record.text ?? record['描述'] ?? record['正文']);
    return name && description ? { name, description } : null;
  }

  return null;
}

function readWeatherList(value: unknown) {
  const source =
    Array.isArray(value)
      ? value
      : value && typeof value === 'object'
        ? ((value as Record<string, unknown>).weathers ??
          (value as Record<string, unknown>)['天气'] ??
          (value as Record<string, unknown>)['天气列表'])
        : [];
  if (!Array.isArray(source)) return [];
  return source.map(parseWeatherLine).filter((entry): entry is PrimordiaWeatherEntry => Boolean(entry));
}

function emptyLibrary(): WeatherWorldbookLibrary {
  return {
    months: {},
    sourceLabels: [],
  };
}

function mergeUnique(base: PrimordiaWeatherEntry[], additions: PrimordiaWeatherEntry[]) {
  const seen = new Set(base.map(item => `${item.name}\n${item.description}`));
  const result = [...base];
  additions.forEach(item => {
    const key = `${item.name}\n${item.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });
  return result;
}

function parseWeatherBlock(raw: string, sourceLabel: string) {
  const parsed = parse(raw) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') throw new Error(`${sourceLabel}: YAML 内容不是对象。`);

  const months: Record<string, PrimordiaWeatherEntry[]> = {};
  Object.entries(parsed).forEach(([monthName, value]) => {
    if (monthName === 'version') return;
    const entries = readWeatherList(value);
    if (entries.length) months[cleanText(monthName)] = entries;
  });

  if (!Object.keys(months).length) {
    throw new Error(`${sourceLabel}: 没有读到月份天气列表。请使用“月份名: - 天气名：描述”的格式。`);
  }

  return { months };
}

function mergeParsedBlock(merged: WeatherWorldbookLibrary, parsed: ReturnType<typeof parseWeatherBlock>, sourceLabel: string) {
  Object.entries(parsed.months).forEach(([monthName, entries]) => {
    merged.months[monthName] = mergeUnique(merged.months[monthName] ?? [], entries);
  });
  merged.sourceLabels.push(sourceLabel);
}

export function inspectWeatherWorldbookContent(content: string, sourceLabel = '天气池条目'): WeatherWorldbookStats {
  const errors: string[] = [];
  const merged = emptyLibrary();
  const blocks = [...String(content ?? '').matchAll(BLOCK_RE)];

  blocks.forEach((block, index) => {
    const label = `${sourceLabel}#${index + 1}`;
    try {
      mergeParsedBlock(merged, parseWeatherBlock(block[1], label), label);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${label}: 解析失败。`);
    }
  });

  const monthWeatherCounts = Object.entries(merged.months)
    .map(([month, entries]) => ({ month, count: entries.length }))
    .sort((a, b) => a.month.localeCompare(b.month, 'zh-Hans-CN'));

  return {
    blockCount: blocks.length,
    monthCount: monthWeatherCounts.length,
    weatherCount: monthWeatherCounts.reduce((sum, item) => sum + item.count, 0),
    monthWeatherCounts,
    errors,
  };
}

async function loadWeatherLibraryFromItems(
  items: Array<Pick<WorldbookEntrySearchItem, 'worldbookName' | 'uid' | 'entry'>>,
  notFoundMessage: string,
): Promise<WeatherWorldbookLoadResult> {
  const errors: string[] = [];
  const merged = emptyLibrary();

  for (const item of items) {
    const content = String(item.entry.content ?? '');
    const blocks = [...content.matchAll(BLOCK_RE)];
    if (!blocks.length) continue;

    for (let index = 0; index < blocks.length; index += 1) {
      const sourceLabel = `${item.worldbookName}/${getWorldbookEntryName(item.entry) || item.uid}#${index + 1}`;
      try {
        mergeParsedBlock(merged, parseWeatherBlock(blocks[index][1], sourceLabel), sourceLabel);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${sourceLabel}: 解析失败。`);
      }
    }
  }

  if (!merged.sourceLabels.length) {
    return {
      ok: false,
      message: errors.length ? '找到天气池标签，但格式没有成功解析。' : notFoundMessage,
      errors,
    };
  }

  return {
    ok: true,
    library: merged,
    message: `已读取 ${merged.sourceLabels.length} 个天气池块。`,
    errors,
  };
}

export async function loadWeatherLibraryFromActiveWorldbooks(): Promise<WeatherWorldbookLoadResult> {
  const entries = await loadActiveWorldbookEntries();
  return loadWeatherLibraryFromItems(entries, '当前启用世界书里没有找到 <PrimordiaWeatherPool> 天气池标签。');
}

export async function loadWeatherLibraryFromBoundWorldbookEntries(
  refs: WorldbookEntryRef[],
): Promise<WeatherWorldbookLoadResult> {
  const errors: string[] = [];
  const items: Array<Pick<WorldbookEntrySearchItem, 'worldbookName' | 'uid' | 'entry'>> = [];

  for (const ref of refs) {
    try {
      const entry = await loadWorldbookEntry(ref);
      if (!entry) {
        errors.push(`绑定失效：世界书“${ref.worldbookName}”中找不到 uid=${ref.uid} 的条目。`);
        continue;
      }
      items.push({ worldbookName: ref.worldbookName, uid: ref.uid, entry });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(`读取 ${ref.worldbookName}/${ref.uid} 失败：${reason}`);
    }
  }

  const result = await loadWeatherLibraryFromItems(items, '手动绑定的世界书条目里没有找到 <PrimordiaWeatherPool> 天气池标签。');
  return {
    ...result,
    errors: [...errors, ...result.errors],
    message: result.ok ? result.message : errors.length ? errors.join('；') : result.message,
  };
}

function formatWeatherTemplate(months: Record<string, PrimordiaWeatherEntry[]>, onlyMonth?: string) {
  const entries = Object.entries(months).filter(([month]) => !onlyMonth || month === onlyMonth);
  const body = entries
    .map(([month, weathers]) => {
      const lines = weathers.map(item => `  - ${item.name}：${item.description}`).join('\n');
      return `${month}:\n${lines}`;
    })
    .join('\n\n');
  return `<PrimordiaWeatherPool>\n${body}\n</PrimordiaWeatherPool>`;
}

export function weatherWorldbookFormatTemplate() {
  return `<PrimordiaWeatherPool>\n绿涨月:\n  - 霜涨细雨：暮春细雨让石板和木檐微微返潮，空气里有湿润的草木气味。\n  - 薄云暖光：云层遮住刺眼日光，空气温和，适合赶路和集市。\n</PrimordiaWeatherPool>`;
}

export function fullWeatherWorldbookTemplate() {
  return formatWeatherTemplate(PRIMORDIA_WEATHER_TEMPLATE_BY_MONTH);
}

export function monthWeatherWorldbookTemplate(monthName: string) {
  const template = formatWeatherTemplate(PRIMORDIA_WEATHER_TEMPLATE_BY_MONTH, monthName);
  return template.includes(`${monthName}:`) ? template : weatherWorldbookFormatTemplate();
}

function weatherWorldbookEntrySeed(content = fullWeatherWorldbookTemplate()): Partial<EditableWorldbookEntry> {
  return {
    name: WEATHER_WORLDBOOK_ENTRY_NAME,
    comment: WEATHER_WORLDBOOK_ENTRY_NAME,
    enabled: false,
    content,
    strategy: {
      type: 'selective',
      keys: ['PrimordiaWeatherPool', '天气池', '天气库'],
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

export async function ensureWeatherWorldbookBinding(worldbookName = ''): Promise<WeatherWorldbookBinding> {
  const targetWorldbook = String(worldbookName || getPrimaryCharacterWorldbookName() || '').trim();
  if (!targetWorldbook) throw new Error('没有可写入的角色主世界书，无法自动创建天气池条目。');

  const existing = await loadWorldbookEntryByName(targetWorldbook, WEATHER_WORLDBOOK_ENTRY_NAME);
  const entry = existing
    ? existing.enabled
      ? await saveWorldbookEntry(targetWorldbook, { ...existing, enabled: false })
      : existing
    : await upsertWorldbookEntryByName(
        targetWorldbook,
        WEATHER_WORLDBOOK_ENTRY_NAME,
        weatherWorldbookEntrySeed(),
      );

  return {
    worldbookName: targetWorldbook,
    uid: Number(entry.uid),
    entryName: WEATHER_WORLDBOOK_ENTRY_NAME,
    updatedAt: Date.now(),
  };
}
