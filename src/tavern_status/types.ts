/** 开局表单数据 */
export interface OpeningFormData {
  playerName: string;
  playerRace: string;
  tavernName: string;
  city: string;
  tavernStyle: string;
}

/** 从 MVU 读取的界面展示数据 */
export interface PrimordiaGameData {
  world: Record<string, unknown>;
  tavern: Record<string, unknown>;
  player: Record<string, unknown>;
  inventory: Record<string, unknown>;
  roles: Record<string, unknown>;
}

export type GamePhase = 'opening' | 'game';
