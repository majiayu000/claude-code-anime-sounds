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

/**
 * Collapse every marked anime-sounds command in an entry into one refreshed
 * hook, while retaining unrelated sibling hooks and matcher-level fields.
 * Returns true when at least one marked hook was present.
 */
function collapseMarkedHooksInEntry(entry, event) {
  if (!entry.hooks || !Array.isArray(entry.hooks)) return false;

  const firstMarked = entry.hooks.find(isAnimeSoundsHook);
  if (!firstMarked) return false;

  const refreshed = buildHookCommand(event);
  const siblings = entry.hooks.filter((h) => !isAnimeSoundsHook(h));
  entry.hooks = [
    {
      ...firstMarked,
      type: refreshed.type,
      command: refreshed.command,
      timeout: refreshed.timeout,
    },
    ...siblings,
  ];
  return true;
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

    // 查找所有含 anime-sounds 的 matcher entry（可能与其它 hook 共用）
    const markedEntryIndexes = [];
    for (let i = 0; i < settings.hooks[event].length; i++) {
      const entry = settings.hooks[event][i];
      if (entry.hooks && entry.hooks.some(isAnimeSoundsHook)) {
        markedEntryIndexes.push(i);
      }
    }

    if (markedEntryIndexes.length === 0) {
      settings.hooks[event].push(buildHookEntry(event));
      installed++;
    } else {
      // 在首个 marked entry 内折叠/刷新全部 marked hooks，保留兄弟 hooks
      const primaryIdx = markedEntryIndexes[0];
      collapseMarkedHooksInEntry(settings.hooks[event][primaryIdx], event);

      // 其它 entry 上的重复 marked hooks 剥离；仅剩 marked 时删除该 entry
      for (let i = markedEntryIndexes.length - 1; i >= 1; i--) {
        const idx = markedEntryIndexes[i];
        const entry = settings.hooks[event][idx];
        const kept = entry.hooks.filter((h) => !isAnimeSoundsHook(h));
        if (kept.length === 0) {
          settings.hooks[event].splice(idx, 1);
        } else {
          entry.hooks = kept;
        }
      }
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
