const LEGACY_PATH_ALIASES: Record<string, string[]> = {
  '库房': ['搴撴埧'],
  '世界.当前历法': ['涓栫晫.褰撳墠鍘嗘硶'],
  '世界.当前历法.时间': ['涓栫晫.褰撳墠鍘嗘硶.鏃堕棿'],
  '世界.当前地点': ['涓栫晫.褰撳墠鍦扮偣'],
  '世界.当前地点.区域': ['涓栫晫.褰撳墠鍦扮偣.鍖哄煙'],
  '世界.当前地点.具体位置': ['涓栫晫.褰撳墠鍦扮偣.鍏蜂綋浣嶇疆'],
  '世界.当前地点.地点': ['涓栫晫.褰撳墠鍦扮偣.鍦扮偣'],
  '主角.所在位置': ['涓昏.鎵€鍦ㄤ綅缃?'],
  '酒馆.资金铜币': ['閰掗.璧勯噾閾滃竵'],
  '酒馆.声望': ['閰掗.澹版湜'],
  '街坊商铺.商铺': ['琛楀潑鍟嗛摵.鍟嗛摵'],
  '街坊商铺.当前商铺': ['琛楀潑鍟嗛摵.褰撳墠鍟嗛摵'],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function legacyPathAliases(...paths: string[]) {
  const merged: string[] = [];
  const seen = new Set<string>();
  paths.forEach(path => {
    [path, ...(LEGACY_PATH_ALIASES[path] ?? [])].forEach(alias => {
      if (!seen.has(alias)) {
        seen.add(alias);
        merged.push(alias);
      }
    });
  });
  return merged;
}

export function hasLegacyCompatiblePathReference(message: string, paths: string[]) {
  const text = message || '';
  return legacyPathAliases(...paths).some(path => {
    const dotted = escapeRegExp(path);
    const pointer = `/${path.split('.').map(escapeRegExp).join('/')}`;
    return (
      new RegExp(`["']?path["']?\\s*:\\s*["']${pointer}(?:/|["'])`, 'i').test(text) ||
      new RegExp(`${dotted}(?:\\.|\\b)`).test(text)
    );
  });
}
