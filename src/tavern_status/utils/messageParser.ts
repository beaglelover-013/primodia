/**
 * 消息解析 — 支持普利莫迪亚 <NARRATIVE> 与通用 <maintext>/<option>
 */

export interface ParsedOption {
  id: string;
  text: string;
}

function stripThinkingBlocks(content: string): string {
  if (!content) return '';
  let cleaned = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');
  const thinkingStart = cleaned.search(/<thinking>/i);
  if (thinkingStart !== -1) cleaned = cleaned.substring(0, thinkingStart);
  const redactedStart = cleaned.search(/<think>/i);
  if (redactedStart !== -1) cleaned = cleaned.substring(0, redactedStart);
  return cleaned;
}

function extractLastTag(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = content.match(regex);
  if (!matches?.length) return '';
  const last = matches[matches.length - 1];
  const inner = last.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return inner?.[1]?.trim() ?? '';
}

/** 叙事正文：优先 NARRATIVE，其次 maintext */
export function parseNarrative(messageContent: string): string {
  if (!messageContent) return '';
  const cleaned = stripThinkingBlocks(messageContent);
  const narrative = extractLastTag(cleaned, 'NARRATIVE');
  if (narrative) return narrative;
  return extractLastTag(cleaned, 'maintext');
}

export function parseMaintext(messageContent: string): string {
  return parseNarrative(messageContent);
}

export function parseOptions(messageContent: string): ParsedOption[] {
  if (!messageContent) return [];
  const cleaned = stripThinkingBlocks(messageContent);

  const withId: ParsedOption[] = [];
  const optionWithIdRegex = /<option id="([^"]+)">([^<]+)<\/option>/g;
  let match: RegExpExecArray | null;
  while ((match = optionWithIdRegex.exec(cleaned)) !== null) {
    withId.push({ id: match[1], text: match[2].trim() });
  }
  if (withId.length > 0) return withId;

  const optionMatch = cleaned.match(/<option>([\s\S]*?)<\/option>/i);
  if (!optionMatch) return [];

  const optionText = optionMatch[1].trim();
  const lines = optionText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const optionPattern = /^[A-Z]\.\s*/;
  const hasLetterPrefix = lines.some(line => optionPattern.test(line));

  if (hasLetterPrefix) {
    const options: ParsedOption[] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (optionPattern.test(line)) {
        if (current.length > 0) {
          const text = current.join('\n');
          const id = text.match(/^([A-Z])\./)?.[1] ?? String.fromCharCode(65 + options.length);
          options.push({ id, text: text.replace(/^[A-Z]\.\s*/, '').trim() });
          current = [];
        }
        current.push(line);
      } else if (current.length > 0) {
        current.push(line);
      }
    }
    if (current.length > 0) {
      const text = current.join('\n');
      const id = text.match(/^([A-Z])\./)?.[1] ?? String.fromCharCode(65 + options.length);
      options.push({ id, text: text.replace(/^[A-Z]\.\s*/, '').trim() });
    }
    return options;
  }

  return lines.map((line, index) => ({
    id: String.fromCharCode(65 + index),
    text: line,
  }));
}

export function parseSum(messageContent: string): string {
  return extractLastTag(stripThinkingBlocks(messageContent), 'sum');
}

export interface LatestMessagePayload {
  maintext: string;
  options: ParsedOption[];
  messageId?: number;
  userMessageId?: number;
  fullMessage?: string;
}

export function loadFromLatestMessage(): LatestMessagePayload {
  try {
    const lastMessageId = getLastMessageId();
    if (lastMessageId < 0) return { maintext: '', options: [] };

    const assistantMessages = getChatMessages(-1, { role: 'assistant' });
    const latest =
      assistantMessages?.length > 0
        ? assistantMessages[assistantMessages.length - 1]
        : getChatMessages(lastMessageId)?.[0];

    if (!latest?.message) return { maintext: '', options: [] };

    const messageContent = latest.message;
    let userMessageId: number | undefined;
    if (latest.message_id > 0) {
      const userMessages = getChatMessages(latest.message_id - 1, { role: 'user' });
      if (userMessages?.length) userMessageId = userMessages[0].message_id;
    }

    return {
      maintext: parseNarrative(messageContent),
      options: parseOptions(messageContent),
      messageId: latest.message_id,
      userMessageId,
      fullMessage: messageContent,
    };
  } catch (error) {
    console.error('❌ [messageParser] 加载最新消息失败:', error);
    return { maintext: '', options: [] };
  }
}
