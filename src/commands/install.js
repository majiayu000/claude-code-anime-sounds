const merger = require('../settings-merger');

function run() {
  const result = merger.install();

  console.log('');
  if (result.installed > 0) {
    console.log('  🎵 anime-sounds hooks 安装成功！');
  } else if (result.updated > 0) {
    console.log('  🎵 anime-sounds hooks 已更新！');
  } else {
    console.log('  🎵 anime-sounds hooks 已是最新');
  }
  console.log('');
  console.log(`  hook 事件：${merger.HOOK_EVENTS.join(', ')}`);
  if (result.backupPath) {
    console.log(`  备份已保存：${result.backupPath}`);
  }
  console.log('');
  console.log('  运行 anime-sounds test 试听音效');
  console.log('  运行 anime-sounds list 查看可用主题');
  console.log('');
}

module.exports = { run };
