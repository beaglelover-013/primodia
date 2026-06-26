const SAME_FLOOR_BODY_CLASS = 'primordia-same-floor-active';
const SAME_FLOOR_STYLE_ID = 'primordia-same-floor-style';
const BOOT_MESSAGE_ID = 0;
const NATIVE_GENERATION_TIMEOUT_MS = 180_000;
const FRONTEND_LOADER_PLACEHOLDER = '【普利莫迪亚前端加载脚本已在本次生成前临时屏蔽。】';

export interface NativeNarrativeTurnOptions {
  createUserMessage?: boolean;
  userMessageData?: Record<string, any>;
  userMessageExtra?: Record<string, any>;
  onStreamingText?: (text: string) => void;
}

export interface NativeNarrativeTurnResult {
  assistantMessage: ChatMessage;
  userMessageId?: number;
  streamedText: string;
}

function stopEventListeners(stops: EventOnReturn[]) {
  stops.forEach(stop => {
    const maybeFunction = stop as unknown as () => void;
    if (typeof maybeFunction === 'function') maybeFunction();
    else stop.stop();
  });
  stops.length = 0;
}

function getParentDocument(): Document | undefined {
  try {
    const parentDocument = window.parent?.document;
    return parentDocument && parentDocument !== document ? parentDocument : undefined;
  } catch {
    return undefined;
  }
}

function hideDisplayedFloor(messageId: number) {
  if (messageId === BOOT_MESSAGE_ID || typeof retrieveDisplayedMessage !== 'function') return;
  try {
    retrieveDisplayedMessage(messageId).closest('.mes').css('display', 'none');
  } catch (error) {
    console.warn(`[primordia] 隐藏楼层 #${messageId} 失败:`, error);
  }
}

function hideAllNonBootFloors() {
  const lastMessageId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
  for (let messageId = 1; messageId <= lastMessageId; messageId += 1) hideDisplayedFloor(messageId);
}

function restoreAllNonBootFloors() {
  if (typeof retrieveDisplayedMessage !== 'function') return;
  const lastMessageId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
  for (let messageId = 1; messageId <= lastMessageId; messageId += 1) {
    retrieveDisplayedMessage(messageId).closest('.mes').css('display', '');
  }
}

function isFrontendLoaderMessage(message: string | undefined) {
  if (!message) return false;
  return /\$\(('|")body\1\)\.load\(/.test(message) || /<body>\s*<script>[\s\S]*?\.load\(/.test(message);
}

async function maskFrontendLoaderMessagesForGeneration() {
  if (typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function' || typeof setChatMessages !== 'function') {
    return undefined;
  }

  const lastMessageId = getLastMessageId();
  const messages = getChatMessages(`0-${Math.max(0, lastMessageId)}`, { role: 'all', hide_state: 'all' });
  const bootMessage = messages.find(message => message.message_id === BOOT_MESSAGE_ID && isFrontendLoaderMessage(message.message));
  const leakedScriptMessages = messages.filter(
    message => message.message_id !== BOOT_MESSAGE_ID && isFrontendLoaderMessage(message.message),
  );

  const updates: Array<Partial<ChatMessage> & { message_id: number }> = [];
  if (bootMessage) {
    updates.push({
      message_id: BOOT_MESSAGE_ID,
      message: FRONTEND_LOADER_PLACEHOLDER,
    });
  }
  for (const message of leakedScriptMessages) {
    updates.push({
      message_id: message.message_id,
      is_hidden: true,
      message: FRONTEND_LOADER_PLACEHOLDER,
      extra: {
        ...(message.extra ?? {}),
        primordia: {
          ...(message.extra?.primordia ?? {}),
          maskedFrontendLoaderLeak: true,
          maskedAt: Date.now(),
        },
      },
    });
  }

  if (updates.length > 0) await setChatMessages(updates, { refresh: 'none' });

  return async () => {
    if (!bootMessage || typeof setChatMessages !== 'function') return;
    await setChatMessages(
      [
        {
          message_id: BOOT_MESSAGE_ID,
          message: bootMessage.message,
        },
      ],
      { refresh: 'none' },
    );
  };
}

export function canMountSameFloorApp() {
  return typeof getCurrentMessageId !== 'function' || getCurrentMessageId() === BOOT_MESSAGE_ID;
}

export function activateSameFloorMode(): () => void {
  const parentDocument = getParentDocument();
  const body = parentDocument?.body;

  if (parentDocument?.head && body) {
    let style = parentDocument.getElementById(SAME_FLOOR_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = parentDocument.createElement('style');
      style.id = SAME_FLOOR_STYLE_ID;
      style.textContent = `
        body.${SAME_FLOOR_BODY_CLASS} #chat .mes[mesid]:not([mesid="${BOOT_MESSAGE_ID}"]) {
          display: none !important;
        }
      `;
      parentDocument.head.append(style);
    }
    body.classList.add(SAME_FLOOR_BODY_CLASS);
  }

  hideAllNonBootFloors();

  const stops: EventOnReturn[] = [];
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    stops.push(
      eventOn(tavern_events.USER_MESSAGE_RENDERED, hideDisplayedFloor),
      eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, hideDisplayedFloor),
      eventOn(tavern_events.MORE_MESSAGES_LOADED, hideAllNonBootFloors),
      eventOn(tavern_events.CHAT_CHANGED, hideAllNonBootFloors),
    );
  }

  console.info('[primordia] 已启用原生楼层隐藏式同楼层模式');

  return () => {
    stopEventListeners(stops);
    body?.classList.remove(SAME_FLOOR_BODY_CLASS);
    parentDocument?.getElementById(SAME_FLOOR_STYLE_ID)?.remove();
    restoreAllNonBootFloors();
  };
}

function setNativeTextareaValue(textarea: HTMLTextAreaElement, value: string, parentDocument: Document) {
  const ParentTextArea = parentDocument.defaultView?.HTMLTextAreaElement;
  const setter = ParentTextArea ? Object.getOwnPropertyDescriptor(ParentTextArea.prototype, 'value')?.set : undefined;
  if (setter) setter.call(textarea, value);
  else textarea.value = value;

  const EventConstructor = parentDocument.defaultView?.Event ?? Event;
  textarea.dispatchEvent(new EventConstructor('input', { bubbles: true }));
  textarea.dispatchEvent(new EventConstructor('change', { bubbles: true }));
}

function submitThroughNativeComposer(userText: string): boolean {
  const parentDocument = getParentDocument();
  if (!parentDocument) return false;

  const textarea = parentDocument.querySelector<HTMLTextAreaElement>('#send_textarea');
  const sendButton = parentDocument.querySelector<HTMLElement>('#send_but');
  if (!textarea || !sendButton || sendButton.matches(':disabled, .disabled')) return false;

  setNativeTextareaValue(textarea, userText, parentDocument);
  sendButton.click();
  return true;
}

function requestNativeRegeneration(): boolean {
  const parentDocument = getParentDocument();
  const regenerateButton = parentDocument?.querySelector<HTMLElement>('#option_regenerate');
  if (!regenerateButton || regenerateButton.matches(':disabled, .disabled')) return false;
  regenerateButton.click();
  return true;
}

async function readChatMessage(messageId: number, role: ChatMessage['role']): Promise<ChatMessage> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const message = getChatMessages(messageId, { role })[0];
    if (message) return message;
    await new Promise(resolve => window.setTimeout(resolve, 50));
  }
  throw new Error(`原生楼层 #${messageId} 尚未写入聊天记录。`);
}

async function stampNativeUserMessage(messageId: number, options: NativeNarrativeTurnOptions) {
  const current = getChatMessages(messageId, { role: 'user' })[0];
  if (!current) return;
  await setChatMessages(
    [
      {
        message_id: messageId,
        data: options.userMessageData ?? current.data,
        extra: {
          ...(current.extra ?? {}),
          ...(options.userMessageExtra ?? {}),
        },
      },
    ],
    { refresh: 'none' },
  );
}

export async function runNativeNarrativeTurn(
  userText: string,
  options: NativeNarrativeTurnOptions = {},
): Promise<NativeNarrativeTurnResult> {
  if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
    throw new Error('当前环境没有提供 ST 原生消息事件。');
  }

  const createUserMessage = options.createUserMessage !== false;
  const baselineMessageId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
  const stops: EventOnReturn[] = [];
  let userMessageId = createUserMessage
    ? undefined
    : getChatMessages(`0-${Math.max(0, baselineMessageId)}`, { role: 'user' }).at(-1)?.message_id;
  let streamedText = '';
  let userStampPromise: Promise<void> = Promise.resolve();
  let timeoutId = 0;
  let restoreFrontendLoaderMessages: (() => Promise<void>) | undefined;

  try {
    restoreFrontendLoaderMessages = await maskFrontendLoaderMessagesForGeneration();

    const assistantMessage = await new Promise<ChatMessage>((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        callback();
      };

      const resolveAssistant = (messageId: number) => {
        void readChatMessage(messageId, 'assistant').then(
          message => finish(() => resolve(message)),
          error => finish(() => reject(error)),
        );
      };

      stops.push(
        eventOn(tavern_events.MESSAGE_SENT, messageId => {
          if (!createUserMessage || messageId <= baselineMessageId) return;
          userMessageId = messageId;
          hideDisplayedFloor(messageId);
          userStampPromise = stampNativeUserMessage(messageId, options);
        }),
        eventOn(tavern_events.MESSAGE_RECEIVED, messageId => {
          if (messageId <= baselineMessageId && createUserMessage) return;
          hideDisplayedFloor(messageId);
          resolveAssistant(messageId);
        }),
        eventOn(tavern_events.GENERATION_ENDED, messageId => {
          if (messageId <= baselineMessageId && createUserMessage) return;
          resolveAssistant(messageId);
        }),
        eventOn(tavern_events.GENERATION_STOPPED, () => {
          finish(() => reject(new Error('原生生成已停止。')));
        }),
        eventOn(tavern_events.STREAM_TOKEN_RECEIVED, token => {
          streamedText += token;
          options.onStreamingText?.(streamedText);
        }),
      );

      timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error('等待 ST 原生回复超时。')));
      }, NATIVE_GENERATION_TIMEOUT_MS);

      void (async () => {
        if (createUserMessage) {
          if (submitThroughNativeComposer(userText)) return;
          await createChatMessages(
            [
              {
                role: 'user',
                message: userText,
                data: options.userMessageData,
                extra: options.userMessageExtra,
              },
            ],
            { refresh: 'none' },
          );
          userMessageId = getLastMessageId();
          await triggerSlash('/trigger await=false');
          return;
        }

        if (requestNativeRegeneration()) return;
        await triggerSlash('/regenerate await=false');
      })().catch(error => finish(() => reject(error)));
    });

    await userStampPromise;
    return { assistantMessage, userMessageId, streamedText };
  } finally {
    window.clearTimeout(timeoutId);
    stopEventListeners(stops);
    await restoreFrontendLoaderMessages?.();
  }
}
