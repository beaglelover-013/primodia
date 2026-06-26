import { klona } from 'klona';
import type { OpeningFormData } from '../types';
import { DEFAULT_STAT_DATA } from './defaultInitData';
import { createInitialSave, writeSave } from '../services/saveService';

let isCreatingOpening = false;

function buildStatDataFromForm(formData: OpeningFormData): Record<string, unknown> {
  const base = klona(DEFAULT_STAT_DATA) as Record<string, unknown>;

  const world = (base['世界'] as Record<string, unknown>) || {};
  const tavern = (base['酒馆'] as Record<string, unknown>) || {};
  const player = (base['玩家'] as Record<string, unknown>) || {};
  const basic = (player['基本信息'] as Record<string, unknown>) || {};

  basic['姓名'] = formData.playerName || basic['姓名'] || '待初始化';
  basic['种族'] = formData.playerRace || basic['种族'] || '人类';
  player['基本信息'] = basic;

  tavern['名称'] = formData.tavernName || tavern['名称'] || '铁壶酒馆';
  tavern['所在城市'] = formData.city || tavern['所在城市'] || '布拉姆维克';
  if (formData.tavernStyle) tavern['整体风格'] = formData.tavernStyle;

  world['当前位置'] = `${tavern['所在城市']} · ${tavern['名称']} · 主厅`;

  base['世界'] = world;
  base['酒馆'] = tavern;
  base['玩家'] = player;

  return base;
}

/** 初始化 0 层 MVU 变量 */
export async function initializeGameVariables(formData: OpeningFormData): Promise<boolean> {
  try {
    const stat_data = buildStatDataFromForm(formData);

    await updateVariablesWith(
      vars => {
        if (!vars) vars = {};
        vars.stat_data = stat_data;
        if (!vars.display_data) vars.display_data = {};
        if (!vars.delta_data) vars.delta_data = {};
        return vars;
      },
      { type: 'message', message_id: 0 },
    );

    // 同步引擎侧 chat 存档（经营面板用）
    const engineSave = createInitialSave();
    engineSave.player.name = formData.playerName;
    engineSave.player.race = formData.playerRace;
    engineSave.tavern.name = formData.tavernName;
    engineSave.tavern.city = formData.city;
    if (formData.tavernStyle) engineSave.tavern.style = formData.tavernStyle;
    engineSave.world.currentCity = formData.city;
    engineSave.world.currentLocation = `${formData.city} · ${formData.tavernName} · 主厅`;
    await writeSave(engineSave);

    console.log('✅ [gameInitializer] 0 层变量与引擎存档已初始化');
    return true;
  } catch (error) {
    console.error('❌ [gameInitializer] 初始化变量失败:', error);
    return false;
  }
}

/** 创建开局介绍楼层（1 层） */
export async function createOpeningStoryMessage(formData: OpeningFormData): Promise<boolean> {
  if (isCreatingOpening) {
    console.log('⚠️ [gameInitializer] 正在创建开局楼层，跳过重复调用');
    return false;
  }

  try {
    const existing = getChatMessages(1);
    if (existing?.length) {
      console.log('⚠️ [gameInitializer] 1 层消息已存在，跳过创建');
      setTimeout(() => {
        import('./chronicleUpdater').then(m => m.checkAndUpdateChronicle()).catch(console.error);
      }, 500);
      return true;
    }

    isCreatingOpening = true;

    const tavernName = formData.tavernName || '铁壶酒馆';
    const city = formData.city || '布拉姆维克';
    const playerName = formData.playerName || '你';

    const maintext = `<maintext>
${city}的街巷在雨后泛着湿光。你推开${tavernName}厚重的木门——炉火烧得正旺，麦香与木烟混在一起。

这是属于你的酒馆。灶台上的铁锅还留着昨夜炖菜的余温，长桌旁的空椅子仿佛在等第一位客人。

${playerName}，故事从这里开始。
</maintext>`;

    const option = `<option>
A. 先绕酒馆走一圈，检查各区域状况
B. 去厨房看看库存，考虑今天做什么菜
C. 坐在吧台边，等第一位客人推门进来
</option>`;

    const sum = `<sum>${playerName}在${city}接手${tavernName}，炉火烧旺，等待第一位客人。</sum>`;
    const message = `${maintext}\n\n${sum}\n\n${option}`;

    let layer0Data: Mvu.MvuData = {
      stat_data: buildStatDataFromForm(formData),
      display_data: {},
      delta_data: {},
      initialized_lorebooks: {},
    };

    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: 0 });
      if (mvuData?.stat_data) layer0Data = mvuData;
    } catch {
      try {
        const vars = getVariables({ type: 'message', message_id: 0 });
        if (vars?.stat_data) {
          layer0Data = {
            stat_data: vars.stat_data,
            display_data: vars.display_data || {},
            delta_data: vars.delta_data || {},
            initialized_lorebooks: {},
          };
        }
      } catch {
        /* 使用已构建的 layer0Data */
      }
    }

    await createChatMessages(
      [{ role: 'assistant', message, data: layer0Data }],
      { refresh: 'none' },
    );

    console.log('✅ [gameInitializer] 开局介绍楼层已创建');

    const retryChronicle = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await new Promise(r => setTimeout(r, 500 * (i + 1)));
          const { checkAndUpdateChronicle } = await import('./chronicleUpdater');
          await checkAndUpdateChronicle();
          return;
        } catch (error) {
          if (i === retries - 1) console.error('❌ [gameInitializer] 编年史更新失败:', error);
        }
      }
    };
    void retryChronicle();

    isCreatingOpening = false;
    return true;
  } catch (error) {
    console.error('❌ [gameInitializer] 创建开局楼层失败:', error);
    isCreatingOpening = false;
    return false;
  }
}
