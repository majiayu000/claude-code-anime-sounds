const configStore = require('../config-store');
const themeLoader = require('../theme-loader');

function run(args) {
  const themeName = args[0];

  if (!themeName) {
    // 显示当前主题
    const config = configStore.load();
    const theme = themeLoader.loadTheme(config.theme);
    console.log('');
    console.log(`  当前主题：${config.theme}`);
    if (theme) {
      console.log(`  ${theme.displayName} - ${theme.description}`);
    }
    console.log('');
    console.log('  切换主题：anime-sounds theme <name>');
    console.log('  查看可用：anime-sounds list');
    console.log('');
    return;
  }

  const available = themeLoader.listThemes();
  if (!available.includes(themeName)) {
    console.error(`  主题 "${themeName}" 不存在。可用主题：${available.join(', ')}`);
    process.exit(1);
  }

  configStore.set('theme', themeName);
  const theme = themeLoader.loadTheme(themeName);

  console.log('');
  console.log(`  🎨 已切换到主题：${themeName}`);
  if (theme) {
    console.log(`  ${theme.displayName} - ${theme.description}`);
  }
  console.log('');
}

module.exports = { run };
