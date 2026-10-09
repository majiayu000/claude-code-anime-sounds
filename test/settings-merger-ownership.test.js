'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/settings-merger.js'), 'utf8');

// Exercise the actual merger with an in-memory filesystem. No real settings,
// backups, hook execution, or home-directory access are needed by these tests.
function fixture(settings, sourceDir = '/tools/claude-code-anime-sounds/src', paths = path.posix) {
  const fixtureDir = paths.resolve('/fixtures/settings-merger');
  const settingsPath = paths.join(fixtureDir, 'settings.json');
  const files = new Map([[settingsPath, JSON.stringify(settings)]]);
  const checkPath = (file) => {
    assert.equal(paths.dirname(file), fixtureDir, 'all file access must stay in the fixture');
    return file;
  };
  const memoryFs = {
    existsSync: (file) => file === fixtureDir || files.has(checkPath(file)),
    readFileSync: (file) => {
      assert.ok(files.has(checkPath(file)), 'fixture file must exist');
      return files.get(file);
    },
    writeFileSync: (file, contents) => files.set(checkPath(file), contents),
    copyFileSync: (from, to) => files.set(checkPath(to), memoryFs.readFileSync(from)),
    readdirSync: (dir) => {
      assert.equal(dir, fixtureDir);
      return [...files.keys()].map((file) => paths.basename(file));
    },
    unlinkSync: (file) => files.delete(checkPath(file)),
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    __dirname: sourceDir,
    require: (name) => {
      if (name === 'fs') return memoryFs;
      if (name === 'path') return paths;
      if (name === 'os') return { homedir: () => paths.resolve('/unused-home') };
      throw new Error(`Unexpected module: ${name}`);
    },
  }, { filename: 'settings-merger.js' });
  const merger = module.exports;
  merger.setSettingsPathForTests(settingsPath);
  return { merger, read: () => JSON.parse(files.get(settingsPath)) };
}

const hook = (command, extra = {}) => ({ type: 'command', command, ...extra });
const legacyCommand = 'node "/old/claude-code-anime-sounds/src/hook.js" Stop';
const unrelated = [
  hook('echo anime-sounds audit-only', { timeout: 123 }),
  hook('sh /custom/anime-sounds-wrapper.sh --quiet', { timeout: 9000 }),
  hook('node "/tools/audit.js" --name anime-sounds'),
  hook('node "/tools/anime-sounds-audit/src/hook.js" Stop'),
  hook('node "/tools/claude-code-anime-sounds/src/hook.js.backup" Stop'),
  hook(`echo '${legacyCommand}'`),
  hook(`${legacyCommand} && echo audit`),
  hook(`${legacyCommand} --audit`),
  { type: 'prompt', prompt: 'Mention anime-sounds only as text' },
];

test('substring mentions are not installed hooks; install/uninstall preserves their full config', () => {
  const settings = {
    model: 'keep-model',
    env: { KEEP: 'yes' },
    hooks: {
      Stop: [{ matcher: 'scope', customKeep: true, hooks: unrelated }],
      PreToolUse: [{ matcher: 'Bash', hooks: [hook('echo anime-sounds pre-tool-audit')] }],
    },
  };
  const { merger, read } = fixture(settings);
  assert.equal(merger.status().installed, false);
  const installed = merger.install();
  assert.equal(installed.installed, 1);
  assert.equal(installed.updated, 0);
  assert.deepEqual(read().hooks.Stop[0], settings.hooks.Stop[0]);
  assert.equal(merger.status().installed, true);
  assert.equal(merger.uninstall().removed, 1);
  assert.deepEqual(read(), settings);
  assert.equal(merger.status().installed, false);
});

test('update collapses genuine duplicates while retaining colliding siblings and entry metadata', () => {
  const sibling = hook('echo keep-second', { timeout: 321 });
  const settings = {
    model: 'keep-model',
    env: { KEEP: 'yes' },
    hooks: {
      Stop: [
        { matcher: '', customKeep: true, hooks: [
          ...unrelated,
          hook(legacyCommand, { timeout: 10, extraField: 'first' }),
          hook('node "/old/second/anime-sounds/src/hook.js" Stop'),
        ] },
        { matcher: 'second', customKeep: { nested: true }, hooks: [
          hook('node "/old/third/claude-code-anime-sounds/src/hook.js" Stop'),
          sibling,
        ] },
      ],
      PreToolUse: [{ matcher: 'Bash', hooks: [hook('echo anime-sounds pre-tool-audit')] }],
    },
  };
  const { merger, read } = fixture(settings);
  const result = merger.install();
  assert.equal(result.updated, 1);
  assert.equal(result.installed, 0);
  const first = read();
  assert.deepEqual(first.hooks.Stop[0], {
    matcher: '', customKeep: true, hooks: [
      hook('node "/tools/claude-code-anime-sounds/src/hook.js" Stop', {
        timeout: 5000, extraField: 'first',
      }),
      ...unrelated,
    ],
  });
  assert.deepEqual(first.hooks.Stop[1], {
    matcher: 'second', customKeep: { nested: true }, hooks: [sibling],
  });
  assert.equal(merger.install().updated, 1);
  assert.deepEqual(read(), first, 'repeated install must be structurally idempotent');
  assert.equal(merger.uninstall().removed, 1);
  assert.deepEqual(read(), {
    ...settings,
    hooks: {
      ...settings.hooks,
      Stop: [
        { matcher: '', customKeep: true, hooks: unrelated },
        { matcher: 'second', customKeep: { nested: true }, hooks: [sibling] },
      ],
    },
  });
});

test('direct uninstall removes only genuine hooks across events', () => {
  const { merger, read } = fixture({
    model: 'keep-model',
    hooks: {
      Stop: [{ matcher: '', hooks: [hook(legacyCommand), ...unrelated] }],
      PreToolUse: [{ matcher: 'Bash', customKeep: true, hooks: [
        hook(legacyCommand), hook('echo anime-sounds pre-tool-audit'),
      ] }],
    },
  });
  assert.equal(merger.uninstall().removed, 2);
  assert.deepEqual(read(), {
    model: 'keep-model',
    hooks: {
      Stop: [{ matcher: '', hooks: unrelated }],
      PreToolUse: [{ matcher: 'Bash', customKeep: true,
        hooks: [hook('echo anime-sounds pre-tool-audit')] }],
    },
  });
});

for (const command of [
  legacyCommand,
  'node "/old/path with spaces/claude-code-anime-sounds/src/hook.js" Stop',
  'node "/usr/local/lib/node_modules/claude-code-anime-sounds/src/hook.js" Stop',
  'node "/opt/homebrew/Cellar/anime-sounds/1.0.0/libexec/lib/node_modules/claude-code-anime-sounds/src/hook.js" Stop',
  'node "C:\\old path\\node_modules\\claude-code-anime-sounds\\src\\hook.js" Stop',
  'node "/old/anime-sounds/src/hook.js" Stop',
]) {
  test(`legacy generated command remains recognized: ${command}`, () => {
    const { merger, read } = fixture({ hooks: { Stop: [{ hooks: [hook(command)] }] } });
    assert.equal(merger.status().installed, true);
    assert.equal(merger.install().updated, 1);
    assert.equal(read().hooks.Stop[0].hooks.length, 1);
    assert.equal(read().hooks.Stop[0].hooks[0].command,
      'node "/tools/claude-code-anime-sounds/src/hook.js" Stop');
    assert.equal(merger.uninstall().removed, 1);
    assert.deepEqual(read(), {});
  });
}

for (const [sourceDir, paths] of [
  ['/tools/renamed checkout/src', path.posix],
  ['C:\\tools\\renamed checkout\\src', path.win32],
]) {
  test(`current generated command works without a marker in its path: ${sourceDir}`, () => {
    const original = { model: 'keep-model' };
    const { merger, read } = fixture(original, sourceDir, paths);
    assert.equal(merger.install().installed, 1);
    const first = read();
    assert.equal(merger.status().installed, true);
    assert.equal(merger.install().updated, 1);
    assert.deepEqual(read(), first);
    assert.equal(merger.uninstall().removed, 1);
    assert.deepEqual(read(), original);
  });
}
