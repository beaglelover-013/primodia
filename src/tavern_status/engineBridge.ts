// engineBridge.ts — 引擎交互桥接模块
// 将旧 script.ts 中的核心引擎函数封装为可被 Vue 组件导入的工具

import { loadSave, writeSave } from './services/saveService';
import { dispatchAction } from './dispatcher';
import type { GameSave } from './engine/saveSchema';
import { requestAINarration, writeAIReplyToChat } from './services/generateService';
import { setOutput } from './composables/useOutput';
import { buildSituationSummary } from './services/situationBuilder';
import { runHealthCheck } from './engine/healthCheck';

// ---- 货币格式化 ----
const COIN_TIERS = [
  { name: '秘银', value: 250_000_000 },
  { name: '铂', value: 500_000 },
  { name: '金', value: 1_000 },
  { name: '银', value: 100 },
  { name: '铜', value: 1 },
] as const;

export function fmtCopper(total: number): string {
  if (!total || total <= 0) return '0铜';
  let rem = total;
  const parts: string[] = [];
  for (const tier of COIN_TIERS) {
    const c = Math.floor(rem / tier.value);
    if (c > 0) {
      parts.push(`${c}${tier.name}`);
      rem -= c * tier.value;
    }
  }
  return parts.join(' ');
}

// ---- HTML 转义 ----
export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Action 日志 ----
let currentSave: GameSave | null = null;
const actionLog: Array<{ time: string; action: string; ok: boolean; msg: string }> = [];

export function loadCurrentSave(): GameSave | null {
  try {
    currentSave = loadSave();
  } catch (e) {
    console.warn('[engineBridge] 加载存档失败', e);
    currentSave = null;
  }
  return currentSave;
}

export function getCurrentSave(): GameSave | null {
  return currentSave;
}

export function getActionLog() {
  return actionLog;
}

function logAction(actionType: string, result: { ok: boolean; message?: string }) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  actionLog.unshift({ time, action: actionType, ok: result.ok, msg: result.message || '' });
  if (actionLog.length > 20) actionLog.length = 20;
}

function dispatchAndLog(save: GameSave, action: { type: string; [k: string]: any }, fn?: (result: any) => void) {
  const result = dispatchAction(save, action as any);
  logAction(action.type, result);
  if (fn) fn(result);
  return result;
}

/** 引擎结算 → 局势摘要 → AI 叙事 → 写入聊天楼层 */
export async function dispatchAndNarrate(
  action: { type: string; [k: string]: any },
  userLabel?: string,
  onOutput?: (title: string, text: string) => void,
): Promise<void> {
  if (!currentSave) {
    loadCurrentSave();
  }
  if (!currentSave) {
    setOutput('提示', '存档未加载。');
    onOutput?.('提示', '存档未加载。');
    return;
  }

  const result = dispatchAndLog(currentSave, action);
  if (!result.ok || !result.shouldAskAI) {
    setOutput(result.ok ? '结果' : '操作失败', result.message);
    onOutput?.(result.ok ? '结果' : '操作失败', result.message);
    return;
  }

  // 写存档
  try {
    await writeSave(currentSave);
  } catch {
    /* 静默 */
  }

  // 请求 AI 叙事
  onOutput?.('⚙️ 等待AI叙事……', result.message);
  const ai = await requestAINarration({ save: currentSave, actionMessage: result.message });
  if (!ai.ok || !ai.reply) {
    onOutput?.('结果', result.message);
    return;
  }

  // 写入聊天楼层
  try {
    await writeAIReplyToChat(ai.reply, userLabel || action.type);
  } catch {
    /* 静默 */
  }

  onOutput?.('✅ 完成', result.message);
}

// 暴露引擎工具

export { buildSituationSummary, runHealthCheck, writeSave };
