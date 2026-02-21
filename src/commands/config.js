const configStore = require('../config-store');

function run(args) {
  const key = args[0];
  const value = args[1];

  if (!key) {
    // 显示所有配置
    const config = configStore.load();
    console.log('');
    console.log('  当前配置：');
    console.log('');
    console.log(`  theme    = ${config.theme}`);
    console.log(`  voice    = ${config.voice ? 'on' : 'off'}`);
    console.log(`  volume   = ${config.volume}`);
    console.log(`  debounce = ${config.debounce}s`);
    console.log('');
    console.log('  用法：anime-sounds config <key> <value>');
    console.log('  示例：anime-sounds config voice on');
    console.log('        anime-sounds config volume 0.7');
    console.log('');
    return;
  }

  if (!value) {
    const config = configStore.load();
    if (key in config) {
      const display = typeof config[key] === 'boolean'
        ? (config[key] ? 'on' : 'off')
        : config[key];
      console.log(`  ${key} = ${display}`);
    } else {
      console.error(`  未知配置项：${key}`);
      process.exit(1);
    }
    return;
  }

  switch (key) {
    case 'voice': {
      const bool = value === 'on' || value === 'true' || value === '1';
      configStore.set('voice', bool);
      console.log(`  voice = ${bool ? 'on' : 'off'}`);
      break;
    }
    case 'volume': {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) {
        console.error('  音量范围：0.0 - 1.0');
        process.exit(1);
      }
      configStore.set('volume', num);
      console.log(`  volume = ${num}`);
      break;
    }
    case 'theme': {
      // 重定向到 theme 命令
      require('./theme').run([value]);
      break;
    }
    case 'debounce': {
      const secs = parseInt(value, 10);
      if (isNaN(secs) || secs < 0 || secs > 300) {
        console.error('  防抖范围：0 - 300（秒）');
        process.exit(1);
      }
      configStore.set('debounce', secs);
      console.log(`  debounce = ${secs}s`);
      break;
    }
    default:
      console.error(`  未知配置项：${key}`);
      console.error('  可用配置项：voice, volume, theme, debounce');
      process.exit(1);
  }
}

module.exports = { run };
