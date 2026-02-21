const fs = require('fs');
const path = require('path');
const configStore = require('../config-store');

const LOG_FILE = path.join(configStore.CONFIG_DIR, 'hook.log');

function run(args) {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('  暂无日志');
    return;
  }

  const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const count = parseInt(args[0], 10) || 20;
  const tail = lines.slice(-count);

  console.log('');
  console.log(`  最近 ${tail.length} 条日志（${LOG_FILE}）`);
  console.log('');
  for (const line of tail) {
    console.log(`  ${line}`);
  }
  console.log('');
}

module.exports = { run };
