const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

const LINUX_PLAYERS = [
  { cmd: 'paplay', args: (file) => [file] },
  { cmd: 'aplay', args: (file) => [file] },
  { cmd: 'ffplay', args: (file) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', file] },
];

function findLinuxPlayer() {
  for (const p of LINUX_PLAYERS) {
    const result = spawnSync('which', [p.cmd], { stdio: 'ignore' });
    if (result.status === 0) return p;
  }
  return null;
}

function getPlayer() {
  switch (process.platform) {
    case 'darwin':
      return { cmd: 'afplay', args: (file, volume) => ['-v', String(volume), file] };
    case 'linux':
      return findLinuxPlayer();
    case 'win32':
      return {
        cmd: 'powershell',
        args: (file) => {
          const safe = file.replace(/'/g, "''");
          return [
            '-NoProfile', '-NonInteractive', '-Command',
            `(New-Object System.Media.SoundPlayer '${safe}').PlaySync()`,
          ];
        },
      };
    default:
      return null;
  }
}

function play(filePath, volume = 0.8) {
  if (!filePath || !fs.existsSync(filePath)) return;

  const player = getPlayer();
  if (!player) return;

  try {
    const args = player.args(filePath, volume);
    const child = spawn(player.cmd, args, {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  } catch {
    // 静默失败，不影响 Claude Code
  }
}

function playSync(filePath, volume = 0.8) {
  if (!filePath || !fs.existsSync(filePath)) return Promise.resolve();

  const player = getPlayer();
  if (!player) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const args = player.args(filePath, volume);
      const child = spawn(player.cmd, args, { stdio: 'ignore' });
      child.on('close', resolve);
      child.on('error', resolve);
    } catch {
      resolve();
    }
  });
}

module.exports = { play, playSync };
