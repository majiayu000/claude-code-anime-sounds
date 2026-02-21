const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_MARKER = 'anime-sounds';

function loadSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveSettings(settings) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

const MAX_BACKUPS = 3;

function backup() {
  if (!fs.existsSync(SETTINGS_PATH)) return null;
  const backupPath = SETTINGS_PATH + '.backup-' + Date.now();
  fs.copyFileSync(SETTINGS_PATH, backupPath);

  // 清理旧备份，只保留最近 MAX_BACKUPS 份
  const dir = path.dirname(SETTINGS_PATH);
  const prefix = path.basename(SETTINGS_PATH) + '.backup-';
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

function buildHookEntry(event) {
  const hookPath = path.join(__dirname, 'hook.js');
  return {
    hooks: [
      {
        type: 'command',
        command: `node "${hookPath}" ${event}`,
        timeout: 5000,
      },
    ],
  };
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

    // 查找已有的 anime-sounds hook
    const existingIdx = settings.hooks[event].findIndex((entry) =>
      entry.hooks && entry.hooks.some((h) => h.command && h.command.includes(HOOK_MARKER))
    );

    const newEntry = buildHookEntry(event);

    if (existingIdx === -1) {
      settings.hooks[event].push(newEntry);
      installed++;
    } else {
      // 路径可能变了（包更新），替换为最新的
      settings.hooks[event][existingIdx] = newEntry;
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

    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter((entry) =>
      !(entry.hooks && entry.hooks.some((h) => h.command && h.command.includes(HOOK_MARKER)))
    );
    removed += before - settings.hooks[event].length;

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
        entry.hooks && entry.hooks.some((h) => h.command && h.command.includes(HOOK_MARKER))
      );
      if (has) events.push(event);
    }
  }

  return { installed: events.length > 0, events };
}

module.exports = { install, uninstall, status, SETTINGS_PATH, HOOK_EVENTS };
