export type InventoryCategory = '食材' | '调料' | '成品' | '杂物' | '酒水';

export type ActionTone = 'green' | 'amber' | 'red' | 'cyan' | 'violet' | 'neutral';

export type EngineLogKind = '结算' | '扣减' | '奖励' | '叙事' | '提示' | '系统';

export interface LocationSnapshot {
  region: string;
  place: string;
  protagonistLocated: string;
  sceneType?: '酒馆' | '街坊' | '商铺' | '地图' | '农田酒窖' | '库房炉台' | '人物互动' | '未知';
  relatedId?: string;
  relatedName?: string;
}

export interface ActionResultBase {
  ok: boolean;
  tone: ActionTone;
  message: string;
  shouldAskAI?: boolean;
  summary?: string;
  narrativeFact?: string;
  aiHint?: string;
  actionType?: string;
  actionTitle?: string;
  pageSuggestion?: string;
  moneyDeltaCopper?: number;
  timeAdvancedMinutes?: number;
  timeChange?: {
    minutes: number;
    from: string;
    to: string;
  };
  inventoryChanges?: Array<{
    id?: string;
    name: string;
    category?: InventoryCategory;
    delta: number;
  }>;
  locationChange?: {
    from: LocationSnapshot;
    to: LocationSnapshot;
  };
  logs?: Array<{ kind: EngineLogKind; text: string }>;
}

export interface ChatSaveEnvelope<TSave> {
  schemaVersion: number;
  savedAt: number;
  save: TSave;
}
