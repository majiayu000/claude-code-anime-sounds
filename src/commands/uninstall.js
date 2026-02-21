const merger = require('../settings-merger');

function run() {
  const st = merger.status();
  if (!st.installed) {
    console.log('anime-sounds hooks 未安装，无需卸载。');
    return;
  }

  const result = merger.uninstall();

  console.log('');
  console.log('  🔇 anime-sounds hooks 已卸载');
  console.log('');
  console.log(`  已移除 ${result.removed} 个 hook 条目`);
  if (result.backupPath) {
    console.log(`  备份已保存：${result.backupPath}`);
  }
  console.log('');
}

module.exports = { run };
