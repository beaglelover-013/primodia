// tavern_status — 普利莫迪亚 MVU 前端主入口
// 1. 注册 MVU Schema  2. 引擎桥接  3. 挂载 Vue（含开局流程）

import { waitUntil } from 'async-wait-until';
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from './schema';
import App from './界面/状态栏/App.vue';
import './界面/状态栏/global.css';
import { loadCurrentSave } from './engineBridge';

$(() => {
  registerMvuSchema(Schema);
  console.info('[tavern_status] MVU Schema 已注册');
});

loadCurrentSave();

$(async () => {
  try {
    await waitGlobalInitialized('Mvu');
  } catch {
    console.warn('[tavern_status] MVU not available');
  }
  if (typeof Mvu !== 'undefined' && Mvu?.events?.VARIABLE_UPDATE_ENDED) {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      loadCurrentSave();
    });
  }
  console.info('[tavern_status] 引擎桥接已就绪');
});

$(async () => {
  await waitGlobalInitialized('Mvu');

  const lastId = getLastMessageId();
  if (lastId > 0) {
    try {
      await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'), { timeout: 8000 });
    } catch {
      console.warn('[tavern_status] 等待 stat_data 超时，仍挂载界面（请检查 MVU 脚本与 [initvar] 条目）');
    }
    loadCurrentSave();
  }

  createApp(App).use(createPinia()).mount('#app');
  console.info('[tavern_status] Vue 应用已挂载');
});
