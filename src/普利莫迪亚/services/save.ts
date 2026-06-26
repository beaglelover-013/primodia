export const PRIMORDIA_CHAT_SAVE_KEY = 'primordiaGameSave';
export const PRIMORDIA_CHAT_SAVE_VERSION = 1;

export interface ChatSaveMeta {
  schemaVersion: number;
  savedAt: number;
  lastMessageId?: number;
  currentMessageId?: number;
  branchBaseMessageId?: number | null;
}

export function normalizeChatSaveMeta(value: unknown): ChatSaveMeta | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const schemaVersion = Math.floor(Number(record.schemaVersion) || 0);
  if (schemaVersion > PRIMORDIA_CHAT_SAVE_VERSION) return null;
  return {
    schemaVersion: PRIMORDIA_CHAT_SAVE_VERSION,
    savedAt: Math.floor(Number(record.savedAt) || Date.now()),
    lastMessageId: typeof record.lastMessageId === 'number' ? record.lastMessageId : undefined,
    currentMessageId: typeof record.currentMessageId === 'number' ? record.currentMessageId : undefined,
    branchBaseMessageId:
      typeof record.branchBaseMessageId === 'number' ? record.branchBaseMessageId : record.branchBaseMessageId === null ? null : undefined,
  };
}

