# Play a sound when Claude Code finishes a task

`claude-code-anime-sounds` installs a sound hook for Claude Code's **Stop** event.
The bundled kawaii and battle themes both map Stop to a sound and an optional
voice clip. It does not currently install a Codex adapter or notifications for
every Claude event.

## Set up the source installation

Follow [Install](../README.md#install), then choose a theme and install the hook:

```bash
anime-sounds list
anime-sounds theme kawaii
anime-sounds install
anime-sounds status
```

`install` writes its managed hook entries into `~/.claude/settings.json`, alongside
existing hook entries, and reports any settings backup it creates. `status` shows
whether its managed entries are installed and which theme is selected. Hook
installation is distinct from confirming that a real Stop event played a sound.

## Test playback, then the real Stop event

```bash
anime-sounds test Stop
```

This command plays audio. If playback works, run a normal Claude Code task and
check the hook log afterwards:

```bash
anime-sounds logs 20
```

A real hook can be skipped because of the debounce window or `stop_hook_active`.
The default debounce is 15 seconds. The log distinguishes these skips from an
undefined event or missing sound; avoid treating every silent event as a broken
hook install.

Optional controls:

```bash
anime-sounds config voice on
anime-sounds config volume 0.5
anime-sounds config debounce 15
```

Voice is off by default. Review [platform/player support](../README.md#platform-support):
Windows playback currently does not apply the volume setting, and Linux needs an
available supported audio player.

## Custom theme files are loaded from the installation

Themes are directories under the installed project's `themes/` directory, each
with `theme.json` and its audio files. The user configuration directory
`~/.anime-sounds/` stores settings and logs, not the theme library.

Start from the [custom-theme example](../README.md#creating-custom-themes). Map
`Stop` to a file inside that theme directory; a missing file or an event that is
not mapped does not play a sound. Add only audio you have permission to distribute.
Then verify discovery with `anime-sounds list`, select it with `theme`, and test Stop.

## Remove the managed hook without deleting other integrations

```bash
anime-sounds uninstall
```

The managed entries are removed from Claude settings; other sibling hook entries
are preserved. Source installation does not imply an npm-published package or a
working Homebrew release: the Homebrew file in this repo is still a template.

For more agent adapters, the independent [PeonPing project](https://github.com/PeonPing/peon-ping)
documents its own integrations. This project's installed scope remains the Claude
Code Stop hook described above.

[README](../README.md) · [Troubleshooting](../README.md#troubleshooting) ·
[MIT license](../LICENSE) · [Support](https://github.com/majiayu000/claude-code-anime-sounds/issues)
