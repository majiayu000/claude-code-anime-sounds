const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_MARKER = 'anime-sounds';

/** @type {string | null} */
let settingsPathOverride = null;

function getSettingsPath() {
  return settingsPathOverride || SETTINGS_PATH;
}

/** Test-only: point install/uninstall/status at a temporary settings.json. */
function setSettingsPathForTests(nextPath) {
  settingsPathOverride = nextPath;
}

function loadSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  const raw = fs.readFileSync(settingsPath, 'utf-8');
  return JSON.parse(raw);
}

function saveSettings(settings) {
  const settingsPath = getSettingsPath();
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

const MAX_BACKUPS = 3;

function backup() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) return null;
  const backupPath = settingsPath + '.backup-' + Date.now();
  fs.copyFileSync(settingsPath, backupPath);

  // 清理旧备份，只保留最近 MAX_BACKUPS 份
  const dir = path.dirname(settingsPath);
  const prefix = path.basename(settingsPath) + '.backup-';
  const backups = fs.readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .sort()
    .map((f) => path.join(dir, f));

  while (backups.length > MAX_BACKUPS) {
    fs.unlinkSync(backups.shift());
  }

  return backupPath;
}

// 需要注入 hook 的事件列表
const HOOK_EVENTS = [
  'Stop',
];

function buildHookCommand(event) {
  const hookPath = path.join(__dirname, 'hook.js');
  return {
    type: 'command',
    command: `node "${hookPath}" ${event}`,
    timeout: 5000,
  };
}

function buildHookEntry(event) {
  return {
    hooks: [buildHookCommand(event)],
  };
}

function isAnimeSoundsHook(hook) {
  return Boolean(hook && hook.command && hook.command.includes(HOOK_MARKER));
}

function install() {
  const backupPath = backup();
  const settings = loadSettings();

  if (!settings.hooks) {
    settings.hooks = {};
  }

  let installed = 0;
  let updated = 0;

  for (const event of HOOK_EVENTS) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    // 查找已有的 anime-sounds hook（可能与其它 hook 共用同一 matcher entry）
    const existingIdx = settings.hooks[event].findIndex((entry) =>
      entry.hooks && entry.hooks.some(isAnimeSoundsHook)
    );

    if (existingIdx === -1) {
      settings.hooks[event].push(buildHookEntry(event));
      installed++;
    } else {
      // 只刷新带 HOOK_MARKER 的 hook 对象，保留同 entry 内兄弟 hooks 与 matcher 级字段
      const entry = settings.hooks[event][existingIdx];
      const hookIdx = entry.hooks.findIndex(isAnimeSoundsHook);
      const refreshed = buildHookCommand(event);
      entry.hooks[hookIdx] = {
        ...entry.hooks[hookIdx],
        type: refreshed.type,
        command: refreshed.command,
        timeout: refreshed.timeout,
      };
      updated++;
    }
  }

  saveSettings(settings);

  return { installed, updated, backupPath, total: HOOK_EVENTS.length };
}

function uninstall() {
  const backupPath = backup();
  const settings = loadSettings();

  if (!settings.hooks) {
    return { removed: 0, backupPath };
  }

  let removed = 0;

  for (const event of Object.keys(settings.hooks)) {
    if (!Array.isArray(settings.hooks[event])) continue;

    settings.hooks[event] = settings.hooks[event]
      .map((entry) => {
        if (!entry.hooks || !Array.isArray(entry.hooks)) return entry;

        const kept = entry.hooks.filter((h) => !isAnimeSoundsHook(h));
        const dropped = entry.hooks.length - kept.length;
        if (dropped === 0) return entry;

        removed += dropped;
        // hooks 为空时删除整个 entry；否则保留 matcher 等 entry 级字段
        if (kept.length === 0) return null;
        return { ...entry, hooks: kept };
      })
      .filter(Boolean);

    // 清理空数组
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  // 清理空 hooks 对象
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  saveSettings(settings);

  return { removed, backupPath };
}

function status() {
  const settings = loadSettings();
  if (!settings.hooks) return { installed: false, events: [] };

  const events = [];
  for (const event of HOOK_EVENTS) {
    if (settings.hooks[event]) {
      const has = settings.hooks[event].some((entry) =>
        entry.hooks && entry.hooks.some(isAnimeSoundsHook)
      );
      if (has) events.push(event);
    }
  }

  return { installed: events.length > 0, events };
}

module.exports = {
  install,
  uninstall,
  status,
  SETTINGS_PATH,
  HOOK_EVENTS,
  HOOK_MARKER,
  buildHookEntry,
  setSettingsPathForTests,
};
