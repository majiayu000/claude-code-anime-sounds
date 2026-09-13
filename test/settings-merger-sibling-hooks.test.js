'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const merger = require('../src/settings-merger');

function assertEqual(actual, expected, message) {
  assert.deepStrictEqual(actual, expected, message);
}

function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anime-sounds-settings-'));
  const settingsPath = path.join(tmpDir, 'settings.json');
  merger.setSettingsPathForTests(settingsPath);

  const staleAnimeCmd = 'node "/old/path/claude-code-anime-sounds/src/hook.js" Stop';
  const siblingCmd = 'node "/tools/vibeguard/hook.js"';

  // Fixture: Stop matcher entry with anime-sounds + sibling (vibeguard) + matcher field
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        hooks: {
          Stop: [
            {
              matcher: '',
              hooks: [
                {
                  type: 'command',
                  command: staleAnimeCmd,
                  timeout: 1000,
                  extraField: 'keep-me',
                },
                {
                  type: 'command',
                  command: siblingCmd,
                  timeout: 3000,
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ) + '\n'
  );

  // Re-install should refresh only the anime-sounds command, keep sibling + matcher
  const updateResult = merger.install();
  assertEqual(updateResult.updated, 1, 'expected one updated hook');
  assertEqual(updateResult.installed, 0, 'should not append a new entry when marker exists');

  let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assertEqual(settings.hooks.Stop.length, 1, 'Stop should still have one matcher entry');
  const entry = settings.hooks.Stop[0];
  assertEqual(entry.matcher, '', 'matcher-level field must be preserved');
  assertEqual(entry.hooks.length, 2, 'sibling hook must remain');

  const animeHook = entry.hooks.find((h) => h.command && h.command.includes(merger.HOOK_MARKER));
  const siblingHook = entry.hooks.find((h) => h.command === siblingCmd);
  assert.ok(animeHook, 'anime-sounds hook must remain');
  assert.ok(siblingHook, 'sibling hook must remain');
  assert.ok(animeHook.command !== staleAnimeCmd, 'anime-sounds command path must be refreshed');
  assert.ok(animeHook.command.includes('hook.js'), 'refreshed command should point at hook.js');
  assertEqual(animeHook.timeout, 5000, 'timeout should refresh to current default');
  assertEqual(animeHook.extraField, 'keep-me', 'non-conflicting hook fields should be preserved');
  assertEqual(siblingHook.timeout, 3000, 'sibling hook must be untouched');

  // Uninstall should remove only anime-sounds command, keep sibling entry
  const uninstallResult = merger.uninstall();
  assertEqual(uninstallResult.removed, 1, 'expected one anime-sounds command removed');

  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assertEqual(settings.hooks.Stop.length, 1, 'entry remains while sibling hooks exist');
  assertEqual(settings.hooks.Stop[0].matcher, '', 'matcher preserved after uninstall');
  assertEqual(settings.hooks.Stop[0].hooks.length, 1, 'only sibling remains');
  assertEqual(settings.hooks.Stop[0].hooks[0].command, siblingCmd);

  // First-time install (no marker) still appends via buildHookEntry
  delete settings.hooks.Stop;
  settings.hooks.PreToolUse = [
    {
      hooks: [{ type: 'command', command: 'echo other', timeout: 1 }],
    },
  ];
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  const freshResult = merger.install();
  assertEqual(freshResult.installed, 1, 'first-time install should append a new Stop entry');
  assertEqual(freshResult.updated, 0, 'first-time install should not count as update');

  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assert.ok(Array.isArray(settings.hooks.Stop), 'Stop hooks array created');
  assertEqual(settings.hooks.Stop.length, 1, 'one new Stop matcher entry');
  assertEqual(settings.hooks.Stop[0].hooks.length, 1, 'new entry has single anime-sounds hook');
  assert.ok(
    settings.hooks.Stop[0].hooks[0].command.includes(merger.HOOK_MARKER),
    'new entry command includes marker'
  );
  assertEqual(
    settings.hooks.PreToolUse[0].hooks[0].command,
    'echo other',
    'unrelated events untouched'
  );

  // Uninstall of sole anime-sounds entry removes the entry entirely
  const soleRemove = merger.uninstall();
  assertEqual(soleRemove.removed, 1);
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assert.strictEqual(settings.hooks.Stop, undefined, 'empty Stop entry should be removed');
  assert.ok(settings.hooks.PreToolUse, 'unrelated events remain');

  // Duplicate marked hooks in one entry (manual merge leftovers) collapse to one
  const staleDupA = 'node "/old/a/claude-code-anime-sounds/src/hook.js" Stop';
  const staleDupB = 'node "/old/b/claude-code-anime-sounds/src/hook.js" Stop';
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        hooks: {
          Stop: [
            {
              matcher: '',
              hooks: [
                {
                  type: 'command',
                  command: staleDupA,
                  timeout: 1000,
                  extraField: 'from-first',
                },
                {
                  type: 'command',
                  command: siblingCmd,
                  timeout: 3000,
                },
                {
                  type: 'command',
                  command: staleDupB,
                  timeout: 2000,
                },
              ],
            },
            {
              hooks: [
                {
                  type: 'command',
                  command: 'node "/old/c/claude-code-anime-sounds/src/hook.js" Stop',
                  timeout: 900,
                },
              ],
            },
          ],
        },
      },
      null,
      2
    ) + '\n'
  );

  const collapseResult = merger.install();
  assertEqual(collapseResult.updated, 1, 'duplicate marked hooks should update once');
  assertEqual(collapseResult.installed, 0, 'should not append when marked hooks exist');

  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assertEqual(settings.hooks.Stop.length, 1, 'sole-marked duplicate entry should be removed');
  const collapsed = settings.hooks.Stop[0];
  assertEqual(collapsed.matcher, '', 'matcher preserved after collapse');
  assertEqual(collapsed.hooks.length, 2, 'one refreshed anime-sounds + sibling');
  const markedHooks = collapsed.hooks.filter(
    (h) => h.command && h.command.includes(merger.HOOK_MARKER)
  );
  assertEqual(markedHooks.length, 1, 'all marked duplicates must collapse to one');
  assert.ok(markedHooks[0].command !== staleDupA, 'collapsed command path must be refreshed');
  assert.ok(markedHooks[0].command !== staleDupB, 'collapsed command path must be refreshed');
  assertEqual(markedHooks[0].timeout, 5000, 'collapsed hook uses current timeout');
  assertEqual(markedHooks[0].extraField, 'from-first', 'fields from first marked hook kept');
  assert.ok(
    collapsed.hooks.some((h) => h.command === siblingCmd),
    'sibling hook must survive collapse'
  );

  // Cleanup temp dir (best-effort)
  for (const name of fs.readdirSync(tmpDir)) {
    fs.unlinkSync(path.join(tmpDir, name));
  }
  fs.rmdirSync(tmpDir);
  merger.setSettingsPathForTests(null);

  console.log('ok - settings-merger preserves sibling hooks on install/uninstall');
}

run();
