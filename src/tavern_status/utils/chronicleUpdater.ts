import { parseSum } from './messageParser';

const CHRONICLE_ENTRY_NAME = '编年史';

function getWorldbookName(): string {
  try {
    const char = getCharData('current');
    if (char?.name) return char.name;
  } catch {
    /* 回退 */
  }
  return '普利莫迪亚';
}

function findLatestSumMessage(startId: number): { messageId: number; sum: string } | null {
  for (let id = startId; id >= 0; id--) {
    try {
      const messages = getChatMessages(id);
      const msg = messages?.[0];
      if (!msg?.message) continue;
      const sum = parseSum(msg.message);
      if (sum) return { messageId: id, sum };
    } catch {
      continue;
    }
  }
  return null;
}

async function updateChronicleInWorldbook(messageId: number, sumContent: string): Promise<void> {
  const worldbookName = getWorldbookName();
  const entryNumber = Math.floor(messageId / 2) + 1;
  const entries = await getWorldbook(worldbookName);
  const chronicleIndex = entries.findIndex(e => e.name === CHRONICLE_ENTRY_NAME || e.comment === CHRONICLE_ENTRY_NAME);
  if (chronicleIndex < 0) {
    console.warn(`⚠️ [chronicleUpdater] 世界书「${worldbookName}」中未找到「${CHRONICLE_ENTRY_NAME}」条目`);
    return;
  }

  const entry = klona(entries[chronicleIndex]);
  const line = `${entryNumber}. ${sumContent}`;
  const existing = entry.content || '';

  const lineRegex = new RegExp(`^${entryNumber}\\.\\s`, 'm');
  if (lineRegex.test(existing)) {
    entry.content = existing.replace(new RegExp(`^${entryNumber}\\.\\s.*$`, 'm'), line);
  } else {
    entry.content = existing ? `${existing.trim()}\n${line}` : line;
  }

  entries[chronicleIndex] = entry;
  await replaceWorldbook(worldbookName, entries, { render: 'debounced' });
  console.log(`✅ [chronicleUpdater] 已更新编年史 #${entryNumber}`);
}

/** 从最新楼层提取 sum 并写入世界书编年史 */
export async function checkAndUpdateChronicle(): Promise<void> {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return;

    const found = findLatestSumMessage(lastId);
    if (!found) return;

    await updateChronicleInWorldbook(found.messageId, found.sum);
  } catch (error) {
    console.error('❌ [chronicleUpdater] 更新编年史失败:', error);
  }
}
