const merger = require('../settings-merger');
const configStore = require('../config-store');
const themeLoader = require('../theme-loader');

function run() {
  const st = merger.status();
  const config = configStore.load();
  const theme = themeLoader.loadTheme(config.theme);

  console.log('');
  console.log('  anime-sounds 状态');
  console.log('');
  console.log(`  Hooks：${st.installed ? '已安装' : '未安装'}`);
  if (st.installed) {
    console.log(`  事件：${st.events.join(', ')}`);
  }
  console.log(`  主题：${theme ? theme.displayName : config.theme}`);
  console.log(`  语音：${config.voice ? 'on' : 'off'}`);
  console.log(`  音量：${config.volume}`);
  console.log('');
  console.log(`  配置文件：${configStore.CONFIG_FILE}`);
  console.log(`  日志文件：${configStore.CONFIG_DIR}/hook.log`);
  console.log('');
}

module.exports = { run };
