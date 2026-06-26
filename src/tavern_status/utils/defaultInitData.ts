import { parse } from 'yaml';
import initvarRaw from '../世界书/变量/initvar.yaml?raw';

/** initvar.yaml 解析后的默认 stat_data（开局写入 0 层） */
export const DEFAULT_STAT_DATA: Record<string, unknown> = parse(initvarRaw) as Record<string, unknown>;
