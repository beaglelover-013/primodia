import { getBaseMvuData } from './variableReader';
import { parseNarrative, parseOptions, parseSum } from './messageParser';

export type RequestType = 'option' | 'custom';

export interface RequestData {
  type: RequestType;
  content: string;
}

function removeThinkingTags(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');
  const thinkingStart = cleaned.search(/<thinking>/i);
  if (thinkingStart !== -1) cleaned = cleaned.substring(0, thinkingStart);
  const redactedStart = cleaned.search(/<think>/i);
  if (redactedStart !== -1) cleaned = cleaned.substring(0, redactedStart);
  return cleaned.trim();
}

function extractLastTag(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches = text.match(regex);
  if (!matches?.length) return '';
  const last = matches[matches.length - 1];
  const inner = last.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return inner?.[1]?.trim() ?? '';
}

function validateMessage(text: string): boolean {
  const narrative = extractLastTag(text, 'NARRATIVE') || extractLastTag(text, 'maintext');
  return narrative.length > 0;
}

function buildRequestPrompt(request: RequestData): string {
  if (request.type === 'option') {
    return `我选择：${request.content}`;
  }
  return request.content;
}

function extractMaintextFromStream(fullText: string): string {
  const cleaned = removeThinkingTags(fullText);
  const narrative = cleaned.match(/<NARRATIVE>([\s\S]*?)(?:<\/NARRATIVE>|$)/i);
  if (narrative?.[1]) return narrative[1].trim();
  const maintext = cleaned.match(/<maintext>([\s\S]*?)(?:<\/maintext>|$)/i);
  return maintext?.[1]?.trim() ?? '';
}

export async function handleUnifiedRequest(
  request: RequestData,
  callbacks: {
    onDisableOptions?: () => void;
    onShowGenerating?: () => void;
    onHideGenerating?: () => void;
    onEnableOptions?: () => void;
    onError?: (error: string) => void;
    onRefreshStory?: () => void;
    onStreamingUpdate?: (text: string) => void;
  },
): Promise<boolean> {
  let userMessageId: number | null = null;
  let streamOff: EventOnReturn | undefined;

  try {
    callbacks.onDisableOptions?.();
    callbacks.onShowGenerating?.();

    const prompt = buildRequestPrompt(request);
    const mvu_data = await getBaseMvuData();

    await createChatMessages([{ role: 'user', message: prompt, data: mvu_data }], { refresh: 'none' });
    userMessageId = getLastMessageId();

    if (typeof eventOn !== 'undefined' && iframe_events?.STREAM_TOKEN_RECEIVED_FULLY) {
      streamOff = eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (fullText: string) => {
        const snippet = extractMaintextFromStream(fullText);
        if (snippet) callbacks.onStreamingUpdate?.(snippet);
      });
    }

    const result = await generate({
      user_input: prompt,
      should_stream: true,
    });

    streamOff?.();

    const cleanedResult = removeThinkingTags(result);
    if (!cleanedResult || !validateMessage(cleanedResult)) {
      if (userMessageId !== null) {
        await deleteChatMessages([userMessageId], { refresh: 'none' });
      }
      callbacks.onHideGenerating?.();
      callbacks.onEnableOptions?.();
      callbacks.onError?.('生成的消息缺少叙事正文（NARRATIVE 或 maintext）');
      return false;
    }

    const narrativeBody =
      extractLastTag(cleanedResult, 'NARRATIVE') || extractLastTag(cleanedResult, 'maintext');
    const optionBody = extractLastTag(cleanedResult, 'option');
    const sumBody = extractLastTag(cleanedResult, 'sum');
    const updateVariable = extractLastTag(cleanedResult, 'UpdateVariable');

    let finalMessage = `<maintext>${narrativeBody}</maintext>`;
    if (optionBody) finalMessage += `\n\n<option>${optionBody}</option>`;
    if (sumBody) finalMessage += `\n\n<sum>${sumBody}</sum>`;
    if (updateVariable) finalMessage += `\n\n<UpdateVariable>${updateVariable}</UpdateVariable>`;

    await waitGlobalInitialized('Mvu');
    let finalData = await getBaseMvuData();

    if (typeof Mvu !== 'undefined') {
      try {
        const parsed = await Mvu.parseMessage(finalMessage, finalData);
        if (parsed) finalData = parsed;
      } catch (err) {
        console.warn('⚠️ [requestHandler] MVU 解析失败', err);
      }
    }

    await createChatMessages([{ role: 'assistant', message: finalMessage, data: finalData }], { refresh: 'none' });

    const assistantId = getLastMessageId();
    if (typeof Mvu !== 'undefined') {
      try {
        await Mvu.replaceMvuData(finalData, { type: 'message', message_id: assistantId });
      } catch (err) {
        console.warn('⚠️ [requestHandler] replaceMvuData 失败', err);
      }
    }

    setTimeout(async () => {
      const { checkAndUpdateChronicle } = await import('./chronicleUpdater');
      await checkAndUpdateChronicle();
    }, 500);

    callbacks.onHideGenerating?.();
    setTimeout(() => callbacks.onRefreshStory?.(), 300);
    callbacks.onEnableOptions?.();
    return true;
  } catch (error) {
    console.error('❌ [requestHandler] 请求失败:', error);
    if (userMessageId !== null) {
      try {
        await deleteChatMessages([userMessageId], { refresh: 'none' });
      } catch {
        /* 忽略 */
      }
    }
    streamOff?.();
    callbacks.onHideGenerating?.();
    callbacks.onEnableOptions?.();
    callbacks.onError?.(error instanceof Error ? error.message : '生成失败');
    return false;
  }
}

/** 供 StoryPage 刷新用 */
export { parseNarrative, parseOptions, parseSum };
