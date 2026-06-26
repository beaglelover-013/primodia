import type { PrimordiaGameData } from '../types';

let mvuInitialized = false;
let mvuInitPromise: Promise<void> | null = null;

type Value = string | number | boolean | Record<string, unknown> | unknown[] | null | undefined;

function pick<T extends Value>(obj: unknown, path: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') return fallback;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    if (Array.isArray(cur) && cur.length > 0) cur = cur[0];
    cur = (cur as Record<string, unknown>)[p];
  }
  if (Array.isArray(cur) && cur.length > 0) return (cur[0] as T) ?? fallback;
  return (cur as T) ?? fallback;
}

function hasStatDataContent(stat_data: unknown): boolean {
  return !!stat_data && typeof stat_data === 'object' && Object.keys(stat_data as object).length > 0;
}

async function ensureMvuInitialized(): Promise<void> {
  if (mvuInitialized) return;
  if (mvuInitPromise) return mvuInitPromise;
  mvuInitPromise = (async () => {
    try {
      await waitGlobalInitialized('Mvu');
      mvuInitialized = true;
      console.log('✅ [variableReader] MVU 初始化完成');
    } catch (error) {
      console.warn('⚠️ [variableReader] 等待 MVU 初始化失败:', error);
      mvuInitialized = true;
    }
  })();
  return mvuInitPromise;
}

/** 从最新 assistant → latest → 0 层读取 MVU 数据 */
export async function getGameMvuData(): Promise<{
  stat_data: Record<string, unknown>;
  display_data?: Record<string, unknown>;
}> {
  await ensureMvuInitialized();

  try {
    const assistantMessages = getChatMessages(-1, { role: 'assistant' });
    if (assistantMessages?.length) {
      const latestAssistant = assistantMessages[assistantMessages.length - 1];
      const messageId = latestAssistant.message_id;
      try {
        const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
        if (mvuData?.stat_data && hasStatDataContent(mvuData.stat_data)) {
          return mvuData;
        }
      } catch {
        /* 继续回退 */
      }
      if (latestAssistant.data?.stat_data && hasStatDataContent(latestAssistant.data.stat_data)) {
        return {
          stat_data: latestAssistant.data.stat_data,
          display_data: latestAssistant.data.display_data,
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ [variableReader] 读取 assistant 消息失败', err);
  }

  try {
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    if (mvuData?.stat_data && hasStatDataContent(mvuData.stat_data)) return mvuData;
  } catch {
    /* 继续 */
  }

  try {
    const variables = getVariables({ type: 'message', message_id: 'latest' });
    if (variables?.stat_data && hasStatDataContent(variables.stat_data)) {
      return { stat_data: variables.stat_data, display_data: variables.display_data };
    }
  } catch {
    /* 继续 */
  }

  try {
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 0 });
    if (mvuData?.stat_data && hasStatDataContent(mvuData.stat_data)) return mvuData;
  } catch {
    /* 继续 */
  }

  try {
    const variables = getVariables({ type: 'message', message_id: 0 });
    if (variables?.stat_data && hasStatDataContent(variables.stat_data)) {
      return { stat_data: variables.stat_data, display_data: variables.display_data };
    }
  } catch {
    /* 继续 */
  }

  return { stat_data: {} };
}

export async function readPrimordiaGameData(): Promise<PrimordiaGameData> {
  const m = await getGameMvuData();
  const stat = m.stat_data || {};
  return {
    world: (pick(stat, '世界', {}) as Record<string, unknown>) || {},
    tavern: (pick(stat, '酒馆', {}) as Record<string, unknown>) || {},
    player: (pick(stat, '玩家', {}) as Record<string, unknown>) || {},
    inventory: (pick(stat, '库存', {}) as Record<string, unknown>) || {},
    roles: (pick(stat, '角色', {}) as Record<string, unknown>) || {},
  };
}

/** 请求处理器用：获取写入 user/assistant 消息的基础 MVU 数据 */
export async function getBaseMvuData(): Promise<Mvu.MvuData> {
  const data = await getGameMvuData();
  return {
    stat_data: data.stat_data || {},
    display_data: data.display_data || {},
    delta_data: {},
    initialized_lorebooks: {},
  };
}
