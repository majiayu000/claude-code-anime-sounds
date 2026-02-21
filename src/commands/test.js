const configStore = require('../config-store');
const themeLoader = require('../theme-loader');
const player = require('../player');

async function run(args) {
  const config = configStore.load();
  const themeName = config.theme;
  const theme = themeLoader.loadTheme(themeName);

  if (!theme) {
    console.error(`  主题 "${themeName}" 加载失败`);
    process.exit(1);
  }

  const targetEvent = args[0];
  const events = targetEvent ? [targetEvent] : Object.keys(theme.events);

  console.log('');
  console.log(`  🎵 试听主题：${theme.displayName}`);
  console.log(`  音量：${config.volume}  语音：${config.voice ? 'on' : 'off'}`);
  console.log('');

  for (const event of events) {
    if (!theme.events[event]) {
      console.log(`  ⚠ 事件 "${event}" 在主题中未定义`);
      continue;
    }

    const sePath = themeLoader.resolveSound(themeName, event, 'se');
    const voicePath = config.voice ? themeLoader.resolveSound(themeName, event, 'voice') : null;

    if (!sePath && !voicePath) {
      console.log(`  ⚠ ${event} - 音效文件不存在`);
      continue;
    }

    console.log(`  ▸ ${event}`);

    if (sePath) {
      await player.playSync(sePath, config.volume);
    }
    if (voicePath) {
      await player.playSync(voicePath, config.volume);
    }

    // 事件之间间隔 500ms
    if (events.indexOf(event) < events.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log('');
}

module.exports = { run };
