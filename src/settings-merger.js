const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_MARKER = 'anime-sounds';

function getHookCommand() {
  // 获取 hook.js 的绝对路径
  const hookPath = path.join(__dirname, 'hook.js');
  return `node "${hookPath}"`;
}

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

function backup() {
  if (!fs.existsSync(SETTINGS_PATH)) return null;
  const backupPath = SETTINGS_PATH + '.backup-' + Date.now();
  fs.copyFileSync(SETTINGS_PATH, backupPath);
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

  for (const event of HOOK_EVENTS) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    // 检查是否已安装（幂等）
    const existing = settings.hooks[event].find((entry) =>
      entry.hooks && entry.hooks.some((h) => h.command && h.command.includes(HOOK_MARKER))
    );

    if (!existing) {
      settings.hooks[event].push(buildHookEntry(event));
      installed++;
    }
  }

  saveSettings(settings);

  return { installed, backupPath, total: HOOK_EVENTS.length };
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
