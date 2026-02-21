const COMMANDS = {
  install: () => require('./commands/install').run(),
  uninstall: () => require('./commands/uninstall').run(),
  theme: (args) => require('./commands/theme').run(args),
  list: () => require('./commands/list').run(),
  config: (args) => require('./commands/config').run(args),
  test: (args) => require('./commands/test').run(args),
  status: () => require('./commands/status').run(),
  logs: (args) => require('./commands/logs').run(args),
};

function showHelp() {
  console.log('');
  console.log('  anime-sounds - 二次元音效 for Claude Code');
  console.log('');
  console.log('  用法：anime-sounds <command> [options]');
  console.log('');
  console.log('  命令：');
  console.log('    install              注入 hooks 到 Claude Code settings');
  console.log('    uninstall            移除 hooks');
  console.log('    theme [name]         查看/切换主题');
  console.log('    list                 列出可用主题');
  console.log('    config [key] [val]   查看/修改配置');
  console.log('    test [event]         试听音效');
  console.log('    status              查看安装状态');
  console.log('    logs [n]            查看最近 n 条日志（默认 20）');
  console.log('    help                 显示帮助');
  console.log('');
  console.log('  示例：');
  console.log('    anime-sounds install');
  console.log('    anime-sounds theme battle');
  console.log('    anime-sounds config voice on');
  console.log('    anime-sounds test Stop');
  console.log('');
}

function run(argv) {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    const pkg = require('../package.json');
    console.log(pkg.version);
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    console.error(`  未知命令：${command}`);
    showHelp();
    process.exit(1);
  }

  const result = handler(args.slice(1));

  // 支持 async 命令（如 test）
  if (result && typeof result.then === 'function') {
    result.catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
  }
}

module.exports = { run };
