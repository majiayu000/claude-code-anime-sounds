const themeLoader = require('../theme-loader');
const configStore = require('../config-store');

function run() {
  const themes = themeLoader.listThemes();
  const current = configStore.get('theme');

  console.log('');
  console.log('  可用主题：');
  console.log('');

  for (const name of themes) {
    const theme = themeLoader.loadTheme(name);
    const marker = name === current ? ' (当前)' : '';
    const display = theme ? theme.displayName : name;
    const desc = theme ? theme.description : '';
    console.log(`  ${name === current ? '▸' : ' '} ${display}${marker}`);
    if (desc) console.log(`    ${desc}`);

    // 显示事件列表
    if (theme && theme.events) {
      const events = Object.keys(theme.events);
      console.log(`    事件：${events.join(', ')}`);
    }
    console.log('');
  }

  if (themes.length === 0) {
    console.log('  暂无主题');
    console.log('');
  }
}

module.exports = { run };
