export interface ActiveWorldbook {
  name: string;
  sources: string[];
}

export interface WorldbookEntryRef {
  worldbookName: string;
  uid: number | string;
}

export type EditableWorldbookEntry = Record<string, any> & {
  uid: number;
  name: string;
  enabled: boolean;
  content: string;
};

export interface WorldbookEntrySearchItem extends WorldbookEntryRef {
  worldbookName: string;
  worldbookSources: string[];
  entry: EditableWorldbookEntry;
}

type CharWorldbooks = { primary: string | null; additional: string[] };
type WorldbookRenderOptions = { render?: 'debounced' | 'immediate' };
type WorldbookApiMap = {
  getGlobalWorldbookNames: () => string[];
  getWorldbookNames: () => string[];
  getCharWorldbookNames: (characterName: 'current') => CharWorldbooks;
  getChatWorldbookName: (chatName: 'current') => string | null;
  getWorldbook: (worldbookName: string) => Promise<EditableWorldbookEntry[]>;
  replaceWorldbook: (
    worldbookName: string,
    worldbook: EditableWorldbookEntry[],
    options?: WorldbookRenderOptions,
  ) => Promise<void>;
  createWorldbookEntries: (
    worldbookName: string,
    entries: Partial<EditableWorldbookEntry>[],
    options?: WorldbookRenderOptions,
  ) => Promise<{ worldbook: EditableWorldbookEntry[]; new_entries: EditableWorldbookEntry[] }>;
};

function getRuntimeRecord(): Record<string, any> {
  return globalThis as Record<string, any>;
}

function getTavernHelperRecord(): Record<string, any> | null {
  const runtime = getRuntimeRecord();
  try {
    if (runtime.TavernHelper && typeof runtime.TavernHelper === 'object') return runtime.TavernHelper;
  } catch {
    /* ignore inaccessible host object */
  }
  try {
    const windowRecord = runtime.window as Record<string, any> | undefined;
    if (windowRecord?.TavernHelper && typeof windowRecord.TavernHelper === 'object') return windowRecord.TavernHelper;
  } catch {
    /* ignore inaccessible host object */
  }
  try {
    const parentRecord = runtime.parent as Record<string, any> | undefined;
    if (parentRecord && parentRecord !== runtime && parentRecord.TavernHelper && typeof parentRecord.TavernHelper === 'object') {
      return parentRecord.TavernHelper;
    }
  } catch {
    /* cross-frame access can be blocked */
  }
  return null;
}

function getHostFunction<K extends keyof WorldbookApiMap>(name: K): WorldbookApiMap[K] | null {
  const runtime = getRuntimeRecord();
  const helper = getTavernHelperRecord();
  const direct = runtime[name];
  if (typeof direct === 'function') return direct.bind(runtime) as WorldbookApiMap[K];
  const helperFn = helper?.[name];
  if (typeof helperFn === 'function') return helperFn.bind(helper) as WorldbookApiMap[K];
  return null;
}

function requireHostFunction<K extends keyof WorldbookApiMap>(name: K, label: string): WorldbookApiMap[K] {
  const fn = getHostFunction(name);
  if (!fn) throw new Error(`当前环境没有提供世界书${label}接口（未找到 ${name} / TavernHelper.${name}）。`);
  return fn;
}

export function getPrimaryCharacterWorldbookName() {
  const getCharWorldbookNames = getHostFunction('getCharWorldbookNames');
  if (!getCharWorldbookNames) return '';
  try {
    return String(getCharWorldbookNames('current')?.primary || '').trim();
  } catch {
    return '';
  }
}

function uniquePush(map: Map<string, ActiveWorldbook>, name: string | null | undefined, source: string) {
  const clean = String(name ?? '').trim();
  if (!clean) return;
  const existing = map.get(clean);
  if (existing) {
    if (!existing.sources.includes(source)) existing.sources.push(source);
    return;
  }
  map.set(clean, { name: clean, sources: [source] });
}

function cloneEntry(entry: EditableWorldbookEntry): EditableWorldbookEntry {
  let cloned: EditableWorldbookEntry;
  try {
    cloned = structuredClone(entry);
  } catch {
    cloned = JSON.parse(JSON.stringify(entry));
  }
  const displayName = getWorldbookEntryName(cloned);
  if (displayName && !String(cloned.name ?? '').trim()) cloned.name = displayName;
  return cloned;
}

function readEntryUid(entry: Partial<EditableWorldbookEntry> | null | undefined) {
  const value = (entry as Record<string, unknown> | null | undefined)?.uid;
  const uid = Number(value);
  return Number.isFinite(uid) ? uid : null;
}

export function getWorldbookEntryName(entry: Partial<EditableWorldbookEntry> | null | undefined) {
  return collectWorldbookEntryNames(entry)[0] ?? '';
}

export function matchesWorldbookEntryName(entry: Partial<EditableWorldbookEntry> | null | undefined, entryName: string) {
  const target = String(entryName || '').trim();
  if (!target) return false;
  const names = collectWorldbookEntryNames(entry);
  return names.some(name => name === target || normalizeWorldbookLookupName(name) === normalizeWorldbookLookupName(target));
}

function collectWorldbookEntryNames(entry: Partial<EditableWorldbookEntry> | null | undefined) {
  const record = (entry ?? {}) as Record<string, any>;
  const strategy = record.strategy && typeof record.strategy === 'object' ? record.strategy as Record<string, any> : {};
  const values = [
    record.name,
    record.comment,
    record.title,
    ...(Array.isArray(record.key) ? record.key : []),
    ...(Array.isArray(record.keys) ? record.keys : []),
    ...(Array.isArray(strategy.keys) ? strategy.keys : []),
  ];
  return values
    .map(value => String(value || '').trim())
    .filter(Boolean);
}

function normalizeWorldbookEntrySeed(entryName: string, seed: Partial<EditableWorldbookEntry>) {
  const cleanName = String(entryName || seed.name || seed.comment || '新的设定条目').trim();
  const record = seed as Record<string, any>;
  const strategy = record.strategy && typeof record.strategy === 'object' ? record.strategy : {};
  const secondary = strategy.keys_secondary && typeof strategy.keys_secondary === 'object' ? strategy.keys_secondary : {};
  const position = record.position && typeof record.position === 'object' ? record.position : {};
  const positionType = position.type || 'at_depth';

  return {
    enabled: seed.enabled ?? true,
    content: seed.content ?? '',
    ...seed,
    name: cleanName,
    comment: cleanName,
    strategy: {
      type: strategy.type || (Array.isArray(strategy.keys) && strategy.keys.length ? 'selective' : 'constant'),
      keys: Array.isArray(strategy.keys)
        ? strategy.keys
        : Array.isArray(record.keys)
          ? record.keys
          : [],
      keys_secondary: {
        logic: secondary.logic || 'and_any',
        keys: Array.isArray(secondary.keys) ? secondary.keys : [],
      },
      scan_depth: strategy.scan_depth ?? 'same_as_global',
    },
    position: positionType === 'at_depth'
      ? {
          type: 'at_depth',
          role: position.role || 'system',
          depth: Number.isFinite(Number(position.depth)) ? Number(position.depth) : 4,
          order: Number.isFinite(Number(position.order)) ? Number(position.order) : 100,
        }
      : {
          ...position,
          type: positionType,
        },
  } as Partial<EditableWorldbookEntry>;
}

function normalizeWorldbookLookupName(name: string) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[《》「」『』[\]()（）【】_＿：:·・、，,。.．\-\s]/g, '');
}

function worldbookNameCandidates(input: string) {
  const clean = String(input || '').trim();
  const candidates = new Set<string>();
  if (clean) {
    candidates.add(clean);
    candidates.add(clean.normalize('NFKC'));
    candidates.add(clean.replace(/_/g, '·'));
    candidates.add(clean.replace(/_/g, '：'));
    candidates.add(clean.replace(/_/g, ' '));
  }
  const normalized = normalizeWorldbookLookupName(clean);
  for (const name of getKnownWorldbookNames()) {
    const knownNormalized = normalizeWorldbookLookupName(name);
    if (
      name === clean ||
      knownNormalized === normalized ||
      (normalized && knownNormalized.includes(normalized)) ||
      (knownNormalized && normalized.includes(knownNormalized))
    ) {
      candidates.add(name);
    }
  }
  return [...candidates].filter(Boolean);
}

async function getReadableWorldbook(worldbookName: string) {
  const getWorldbook = requireHostFunction('getWorldbook', '读取');
  const attempts: string[] = [];
  let lastError: unknown = null;
  for (const name of worldbookNameCandidates(worldbookName)) {
    if (attempts.includes(name)) continue;
    attempts.push(name);
    try {
      return { worldbookName: name, entries: await getWorldbook(name) };
    } catch (error) {
      lastError = error;
    }
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError || '未知错误');
  const known = getKnownWorldbookNames();
  const suffix = known.length ? ` 已知世界书：${known.slice(0, 12).join(' / ')}${known.length > 12 ? ' ...' : ''}` : '';
  throw new Error(`无法读取世界书「${worldbookName}」：${reason}。已尝试：${attempts.join(' / ') || '无'}。${suffix}`);
}

function resolveKnownWorldbookName(input: string) {
  const clean = String(input || '').trim();
  if (!clean) return clean;
  const knownNames = getKnownWorldbookNames();
  if (knownNames.includes(clean)) return clean;
  const normalized = normalizeWorldbookLookupName(clean);
  return knownNames.find(name => normalizeWorldbookLookupName(name) === normalized) ?? clean;
}

export function resolveWorldbookName(input: string) {
  return resolveKnownWorldbookName(input);
}

function replaceManagedBlock(content: string, block: string, marker = 'PrimordiaOpening') {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const wrapped = `${start}\n${block.trim()}\n${end}`;
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  const source = String(content ?? '').trim();
  if (pattern.test(source)) return source.replace(pattern, wrapped);
  return source ? `${source}\n\n${wrapped}` : wrapped;
}

export function getKnownWorldbookNames(): string[] {
  const names = new Set<string>();
  const getWorldbookNames = getHostFunction('getWorldbookNames');
  if (getWorldbookNames) {
    try {
      for (const name of getWorldbookNames() ?? []) {
        const clean = String(name || '').trim();
        if (clean) names.add(clean);
      }
    } catch {
      /* fall back to active worldbooks */
    }
  }
  for (const book of getActiveWorldbookNames()) names.add(book.name);
  return [...names];
}

export function isWorldbookApiAvailable() {
  return Boolean(getHostFunction('getWorldbook') && getHostFunction('replaceWorldbook'));
}

export function canCreateWorldbookEntry() {
  return Boolean(getHostFunction('createWorldbookEntries'));
}

export async function loadWorldbookEntriesForEdit(worldbookName: string) {
  const loaded = await getReadableWorldbook(worldbookName);
  return { worldbookName: loaded.worldbookName, entries: loaded.entries.map(cloneEntry) };
}

export async function replaceWorldbookEntriesForEdit(worldbookName: string, entries: EditableWorldbookEntry[]) {
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  const loaded = await getReadableWorldbook(worldbookName);
  await replaceWorldbook(loaded.worldbookName, entries.map(cloneEntry), { render: 'debounced' });
}

export async function createWorldbookEntriesForEdit(
  worldbookName: string,
  entries: Partial<EditableWorldbookEntry>[],
) {
  const createWorldbookEntries = requireHostFunction('createWorldbookEntries', '条目新建');
  const loaded = await getReadableWorldbook(worldbookName);
  return createWorldbookEntries(loaded.worldbookName, entries, { render: 'debounced' });
}

export function getActiveWorldbookNames(): ActiveWorldbook[] {
  const books = new Map<string, ActiveWorldbook>();

  const getCharWorldbookNames = getHostFunction('getCharWorldbookNames');
  if (getCharWorldbookNames) {
    try {
      const charBooks = getCharWorldbookNames('current');
      uniquePush(books, charBooks.primary, '角色主世界书');
      for (const name of charBooks.additional ?? []) uniquePush(books, name, '角色附加世界书');
    } catch {
      /* ignore unavailable host API */
    }
  }

  const getChatWorldbookName = getHostFunction('getChatWorldbookName');
  if (getChatWorldbookName) {
    try {
      uniquePush(books, getChatWorldbookName('current'), '聊天世界书');
    } catch {
      /* ignore unavailable host API */
    }
  }

  const getGlobalWorldbookNames = getHostFunction('getGlobalWorldbookNames');
  if (getGlobalWorldbookNames) {
    try {
      for (const name of getGlobalWorldbookNames() ?? []) uniquePush(books, name, '全局世界书');
    } catch {
      /* ignore unavailable host API */
    }
  }

  return [...books.values()];
}

export async function loadActiveWorldbookEntries(): Promise<WorldbookEntrySearchItem[]> {
  requireHostFunction('getWorldbook', '读取');
  const items: WorldbookEntrySearchItem[] = [];
  const failures: string[] = [];

  for (const book of getActiveWorldbookNames()) {
    try {
      const loaded = await getReadableWorldbook(book.name);
      for (const entry of loaded.entries ?? []) {
        const uid = readEntryUid(entry);
        if (uid == null) continue;
        items.push({
          worldbookName: loaded.worldbookName,
          worldbookSources: book.sources,
          uid,
          entry: cloneEntry(entry),
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${book.name}: ${reason}`);
      console.warn(`[Primordia] 读取启用世界书失败: ${book.name}`, error);
    }
  }

  if (!items.length && failures.length) {
    throw new Error(`读取当前启用世界书失败：${failures.slice(0, 5).join('；')}`);
  }

  return items;
}

export async function loadAllWorldbookEntries(): Promise<WorldbookEntrySearchItem[]> {
  requireHostFunction('getWorldbook', '读取');
  const items: WorldbookEntrySearchItem[] = [];
  const failures: string[] = [];

  for (const name of getKnownWorldbookNames()) {
    try {
      const loaded = await getReadableWorldbook(name);
      for (const entry of loaded.entries ?? []) {
        const uid = readEntryUid(entry);
        if (uid == null) continue;
        items.push({
          worldbookName: loaded.worldbookName,
          worldbookSources: ['全部世界书'],
          uid,
          entry: cloneEntry(entry),
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${name}: ${reason}`);
      console.warn(`[Primordia] 读取世界书失败: ${name}`, error);
    }
  }

  if (!items.length && failures.length) {
    throw new Error(`读取世界书失败：${failures.slice(0, 5).join('；')}`);
  }

  return items;
}

export async function loadWorldbookEntry(ref: WorldbookEntryRef): Promise<EditableWorldbookEntry | null> {
  const { entries } = await getReadableWorldbook(ref.worldbookName);
  const entry = entries.find(item => Number(item.uid) === Number(ref.uid));
  return entry ? cloneEntry(entry) : null;
}

export async function loadWorldbookEntryByName(worldbookName: string, entryName: string): Promise<EditableWorldbookEntry | null> {
  const cleanName = String(entryName || '').trim();
  if (!worldbookName || !cleanName) return null;
  const { entries } = await getReadableWorldbook(worldbookName);
  const entry = entries.find(item => matchesWorldbookEntryName(item, cleanName));
  return entry ? cloneEntry(entry) : null;
}

export function validateWorldbookEntry(entry: unknown): asserts entry is EditableWorldbookEntry {
  if (!entry || typeof entry !== 'object') throw new Error('条目不是有效对象。');
  const record = entry as Record<string, unknown>;
  if (!Number.isFinite(Number(record.uid))) throw new Error('条目缺少 uid。');
  if (typeof record.name !== 'string' && typeof record.comment !== 'string') throw new Error('条目缺少 name/comment。');
  if (typeof record.enabled !== 'boolean') throw new Error('条目缺少 enabled。');
  if (typeof record.content !== 'string') throw new Error('条目缺少 content。');
}

export async function saveWorldbookEntry(worldbookName: string, editedEntry: EditableWorldbookEntry) {
  requireHostFunction('getWorldbook', '读取');
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  validateWorldbookEntry(editedEntry);

  const { worldbookName: resolvedName, entries } = await getReadableWorldbook(worldbookName);
  const index = entries.findIndex(entry => entry.uid === editedEntry.uid);
  if (index < 0) throw new Error(`世界书「${resolvedName}」中找不到 uid=${editedEntry.uid} 的条目。`);

  const nextEntries = entries.map(entry => (entry.uid === editedEntry.uid ? cloneEntry(editedEntry) : entry));
  await replaceWorldbook(resolvedName, nextEntries, { render: 'debounced' });
  return cloneEntry(nextEntries[index]);
}

export async function upsertWorldbookEntryByName(
  worldbookName: string,
  entryName: string,
  seed: Partial<EditableWorldbookEntry>,
) {
  requireHostFunction('getWorldbook', '读取');
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  const { worldbookName: resolvedName, entries } = await getReadableWorldbook(worldbookName);
  const cleanName = String(entryName || '').trim();
  const index = entries.findIndex(entry => matchesWorldbookEntryName(entry, cleanName));
  if (index >= 0) {
    const nextEntry = normalizeWorldbookEntrySeed(cleanName, {
      ...cloneEntry(entries[index]),
      ...seed,
      uid: entries[index].uid,
    }) as EditableWorldbookEntry;
    validateWorldbookEntry(nextEntry);
    const nextEntries = entries.map((entry, entryIndex) => (entryIndex === index ? cloneEntry(nextEntry) : entry));
    await replaceWorldbook(resolvedName, nextEntries, { render: 'debounced' });
    return cloneEntry(nextEntry);
  }

  const createWorldbookEntries = requireHostFunction('createWorldbookEntries', '条目新建');
  const result = await createWorldbookEntries(
    resolvedName,
    [
      normalizeWorldbookEntrySeed(cleanName, seed),
    ],
    { render: 'debounced' },
  );
  const entry = result.new_entries?.[0];
  if (!entry) throw new Error(`世界书「${resolvedName}」创建「${cleanName}」失败。`);
  return cloneEntry(entry);
}

export async function setWorldbookEntryEnabledByName(worldbookName: string, entryName: string, enabled: boolean) {
  requireHostFunction('getWorldbook', '读取');
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  const { worldbookName: resolvedName, entries } = await getReadableWorldbook(worldbookName);
  const cleanName = String(entryName || '').trim();
  if (!resolvedName || !cleanName) return { found: false, changed: false, entry: null as EditableWorldbookEntry | null };
  const index = entries.findIndex(entry => matchesWorldbookEntryName(entry, cleanName));
  if (index < 0) return { found: false, changed: false, entry: null as EditableWorldbookEntry | null };
  const current = entries[index];
  if (current.enabled === enabled) return { found: true, changed: false, entry: cloneEntry(current) };
  const nextEntry = { ...cloneEntry(current), enabled };
  const nextEntries = entries.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry));
  await replaceWorldbook(resolvedName, nextEntries, { render: 'debounced' });
  return { found: true, changed: true, entry: cloneEntry(nextEntry) };
}

export async function replaceWorldbookEntryManagedBlock(
  worldbookName: string,
  entryName: string,
  block: string,
  marker = 'PrimordiaOpening',
) {
  requireHostFunction('getWorldbook', '读取');
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  const { worldbookName: resolvedName, entries } = await getReadableWorldbook(worldbookName);
  const cleanName = String(entryName || '').trim();
  if (!resolvedName || !cleanName) return { found: false, changed: false, entry: null as EditableWorldbookEntry | null };
  const index = entries.findIndex(entry => matchesWorldbookEntryName(entry, cleanName));
  if (index < 0) return { found: false, changed: false, entry: null as EditableWorldbookEntry | null };
  const nextEntry = {
    ...cloneEntry(entries[index]),
    content: replaceManagedBlock(entries[index].content || '', block, marker),
  };
  const nextEntries = entries.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry));
  await replaceWorldbook(resolvedName, nextEntries, { render: 'debounced' });
  return { found: true, changed: true, entry: cloneEntry(nextEntry) };
}

export async function toggleWorldbookEntriesByPrefix(
  worldbookName: string,
  prefix: string,
  enabledEntryName: string,
) {
  requireHostFunction('getWorldbook', '读取');
  const replaceWorldbook = requireHostFunction('replaceWorldbook', '写入');
  const { worldbookName: resolvedName, entries } = await getReadableWorldbook(worldbookName);
  const cleanPrefix = String(prefix || '').trim();
  const cleanEnabledName = String(enabledEntryName || '').trim();
  if (!cleanPrefix || !cleanEnabledName) return { changed: 0, matched: 0, foundTarget: false };

  let changed = 0;
  let matched = 0;
  let foundTarget = false;
  const nextEntries = entries.map(entry => {
    const name = getWorldbookEntryName(entry);
    if (!name.startsWith(cleanPrefix)) return entry;
    matched += 1;
    const shouldEnable = name === cleanEnabledName;
    if (shouldEnable) foundTarget = true;
    if (entry.enabled === shouldEnable) return entry;
    changed += 1;
    return { ...entry, enabled: shouldEnable };
  });

  if (changed > 0) await replaceWorldbook(resolvedName, nextEntries, { render: 'debounced' });
  return { changed, matched, foundTarget };
}

export async function createAndBindWorldbookEntry(worldbookName: string, seed: Partial<EditableWorldbookEntry>) {
  const createWorldbookEntries = requireHostFunction('createWorldbookEntries', '条目新建');
  const loaded = await getReadableWorldbook(worldbookName);
  const entryName = String(seed.name || seed.comment || '新的设定条目').trim();
  const result = await createWorldbookEntries(
    loaded.worldbookName,
    [
      normalizeWorldbookEntrySeed(entryName, seed),
    ],
    { render: 'debounced' },
  );
  const entry = result.new_entries?.[0];
  if (!entry) throw new Error('条目创建失败。');
  return cloneEntry(entry);
}

export function stringifyEntryJson(entry: EditableWorldbookEntry) {
  return JSON.stringify(entry, null, 2);
}
