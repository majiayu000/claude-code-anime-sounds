const merger = require('../settings-merger');

function run() {
  const st = merger.status();
  if (st.installed) {
    console.log('anime-sounds hooks 已安装，事件：' + st.events.join(', '));
    console.log('如需重新安装，请先运行: anime-sounds uninstall');
    return;
  }

  const result = merger.install();

  console.log('');
  console.log('  🎵 anime-sounds hooks 安装成功！');
  console.log('');
  console.log(`  已注入 ${result.installed} 个 hook 事件：${merger.HOOK_EVENTS.join(', ')}`);
  if (result.backupPath) {
    console.log(`  备份已保存：${result.backupPath}`);
  }
  console.log('');
  console.log('  运行 anime-sounds test 试听音效');
  console.log('  运行 anime-sounds list 查看可用主题');
  console.log('');
}

module.exports = { run };
