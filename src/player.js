const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

function clampVolume(volume) {
  const n = Number(volume);
  if (!Number.isFinite(n)) return 0.8;
  return Math.min(1, Math.max(0, n));
}

const LINUX_PLAYERS = [
  {
    cmd: 'paplay',
    // paplay --volume expects 0–65536
    args: (file, volume) => [
      '--volume',
      String(Math.round(clampVolume(volume) * 65536)),
      file,
    ],
  },
  {
    cmd: 'aplay',
    // aplay has no volume control
    args: (file) => [file],
  },
  {
    cmd: 'ffplay',
    // ffplay -volume expects 0–100
    args: (file, volume) => [
      '-nodisp',
      '-autoexit',
      '-loglevel',
      'quiet',
      '-volume',
      String(Math.round(clampVolume(volume) * 100)),
      file,
    ],
  },
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
      return {
        cmd: 'afplay',
        args: (file, volume) => ['-v', String(clampVolume(volume)), file],
      };
    case 'linux':
      return findLinuxPlayer();
    case 'win32':
      // SoundPlayer has no volume API; volume config is ignored on Windows
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
