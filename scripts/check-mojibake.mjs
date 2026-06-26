import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['src/普利莫迪亚', 'docs/普利莫迪亚变量-成品'];
const EXTENSIONS = new Set(['.ts', '.vue', '.js', '.yaml', '.yml', '.txt', '.md']);
const ALLOWLIST = new Set([path.normalize('src/普利莫迪亚/utils/legacyMojibake.ts')]);

const HIGH_CONFIDENCE_PATTERNS = [
  /�/,
  /[ÃÂâ][\u0080-\u00ffA-Za-z0-9]{1,12}/,
  /(?:涓栫晫|涓昏|閰掗|琛楀|褰撳墠|鍦扮偣|鎵€|鏃堕棿|鍘嗘硶|鍟嗛摵|璧勯噾|澹版湜|搴撴埧)/,
  /(?:浣庤皟|姝ｅ父|鐑椆|閫氬)/,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) walk(full, files);
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function classify(file) {
  const relative = path.normalize(path.relative(ROOT, file));
  if (ALLOWLIST.has(relative)) return '兼容旧路径别名';
  if (relative.includes(`${path.sep}docs${path.sep}`)) return '模板或文档';
  if (relative.endsWith('.vue')) return '疑似用户可见文案';
  return '源码文案或解析字段';
}

const findings = [];
for (const target of TARGETS) {
  for (const file of walk(path.join(ROOT, target))) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!HIGH_CONFIDENCE_PATTERNS.some(pattern => pattern.test(line))) return;
      const relative = path.normalize(path.relative(ROOT, file));
      findings.push({
        file: relative,
        line: index + 1,
        category: classify(file),
        text: line.trim().slice(0, 180),
      });
    });
  }
}

if (!findings.length) {
  console.log('未发现高置信乱码。');
  process.exit(0);
}

const visibleFindings = findings.filter(item => item.category !== '兼容旧路径别名');
for (const item of findings) {
  console.log(`${item.file}:${item.line} [${item.category}] ${item.text}`);
}

if (visibleFindings.length) {
  console.error(`发现 ${visibleFindings.length} 条疑似真实乱码，请修复后再提交。`);
  process.exit(1);
}

console.log(`仅发现 ${findings.length} 条已集中管理的旧乱码兼容别名。`);
