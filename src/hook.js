#!/usr/bin/env node

// Claude Code Hook 入口
// 被 Claude Code hooks 调用，读取 stdin JSON，播放对应音效
// 任何错误静默退出，不影响 Claude Code

const fs = require('fs');
const path = require('path');
const configStore = require('./config-store');
const themeLoader = require('./theme-loader');
const player = require('./player');

const LOG_FILE = path.join(configStore.CONFIG_DIR, 'hook.log');
const DEBOUNCE_FILE = path.join(configStore.CONFIG_DIR, 'last-played');

const MAX_LOG_SIZE = 512 * 1024; // 512KB

function log(msg) {
  try {
    // 日志文件超过上限时截断保留后半部分
    if (fs.existsSync(LOG_FILE)) {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size > MAX_LOG_SIZE) {
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.split('\n');
        fs.writeFileSync(LOG_FILE, lines.slice(Math.floor(lines.length / 2)).join('\n'));
      }
    }
    const ts = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `${ts} ${msg}\n`);
  } catch {}
}

function shouldPlay(debounceMs) {
  try {
    const ts = parseInt(fs.readFileSync(DEBOUNCE_FILE, 'utf-8'), 10);
    return Date.now() - ts > debounceMs;
  } catch {
    return true;
  }
}

function markPlayed() {
  try {
    fs.writeFileSync(DEBOUNCE_FILE, String(Date.now()));
  } catch {}
}

function main() {
  // 安全网：3 秒后强制退出，防止阻塞 Claude Code
  setTimeout(() => process.exit(0), 3000);

  try {
    let input = '';
    let data = {};

    try {
      input = fs.readFileSync(0, 'utf-8');
    } catch {}

    const eventArg = process.argv[2];
    let event = eventArg;

    if (input.trim()) {
      try {
        data = JSON.parse(input);
        event = data.hook_event_name || data.hook_event || eventArg;
      } catch {}
    }

    if (!event) {
      process.exit(0);
    }

    // stop_hook_active: hook 反馈循环，跳过
    if (data.stop_hook_active) {
      log(`event=${event} skipped (stop_hook_active)`);
      process.exit(0);
    }

    const config = configStore.load();
    const debounceMs = (config.debounce || 15) * 1000;

    // 时间防抖
    if (!shouldPlay(debounceMs)) {
      log(`event=${event} skipped (debounce)`);
      process.exit(0);
    }

    const themeName = config.theme;
    const volume = config.volume;

    const sePath = themeLoader.resolveSound(themeName, event, 'se');
    const voicePath = config.voice ? themeLoader.resolveSound(themeName, event, 'voice') : null;

    if (!sePath && !voicePath) {
      log(`event=${event} no sound found`);
      process.exit(0);
    }

    markPlayed();

    if (sePath) {
      player.play(sePath, volume);
    }
    if (voicePath) {
      player.play(voicePath, volume);
    }

    log(`event=${event} played`);
  } catch (err) {
    log(`error: ${err.message}`);
  }

  process.exit(0);
}

main();
