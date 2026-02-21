# claude-code-anime-sounds

Anime-themed sound effects for Claude Code hooks. Hear cute or epic sounds when Claude Code completes tasks.

## Features

- **Multi-theme support**: Switch between `kawaii` (cute) and `battle` (epic) themes
- **Optional voice lines**: Japanese voice clips for key events
- **Zero dependencies**: Pure Node.js, no npm packages needed
- **Non-blocking**: Sound playback runs detached, never slows down Claude Code
- **Safe merging**: Installs alongside existing hooks (vibeguard, remem, etc.) without conflicts

## Install

```bash
# npm
npm install -g claude-code-anime-sounds

# or clone and link
git clone https://github.com/anthropics/claude-code-anime-sounds.git
cd claude-code-anime-sounds
npm link
```

Then inject hooks into Claude Code:

```bash
anime-sounds install
```

## Uninstall

```bash
anime-sounds uninstall
npm uninstall -g claude-code-anime-sounds
rm -rf ~/.anime-sounds
```

## Commands

```
anime-sounds install              # Inject hooks into Claude Code settings
anime-sounds uninstall            # Remove hooks
anime-sounds status               # Show install status and config
anime-sounds theme kawaii|battle   # Switch theme
anime-sounds theme                # Show current theme
anime-sounds list                 # List available themes
anime-sounds config voice on|off  # Toggle voice lines
anime-sounds config volume 0.7    # Set volume (0.0 - 1.0)
anime-sounds test [event]         # Preview sounds
anime-sounds logs [n]             # Show recent n log entries (default 20)
anime-sounds --version            # Show version
anime-sounds help                 # Show help
```
## Themes

### Kawaii (default)

Cute anime sound effects for a cozy coding vibe.

| Event | Sound | Voice |
|-------|-------|-------|
| Stop | Celebration chime | やったー！ |

### Battle

Epic battle sounds to fuel your coding energy.

| Event | Sound | Voice |
|-------|-------|-------|
| Stop | Victory fanfare | 任務完了！ |

## Configuration

Config is stored at `~/.anime-sounds/config.json`:

```json
{
  "theme": "kawaii",
  "voice": false,
  "volume": 0.8
}
```

## Files

| Path | Description |
|------|-------------|
| `~/.anime-sounds/config.json` | User config |
| `~/.anime-sounds/hook.log` | Hook execution log (auto-rotated at 512KB) |
| `~/.claude/settings.json` | Claude Code settings (hooks injected here) |

## Platform Support

| Platform | Player | Status |
|----------|--------|--------|
| macOS | afplay | Fully supported |
| Linux | paplay → aplay → ffplay | Supported (auto-detects available player) |
| Windows | PowerShell SoundPlayer | Basic support |

## Creating Custom Themes

1. Create a directory under `themes/your-theme/`
2. Add a `theme.json` with event mappings
3. Place sound files in `se/` and optionally `voice/`

```json
{
  "name": "your-theme",
  "displayName": "Your Theme",
  "description": "Description here",
  "events": {
    "Stop": { "se": "se/stop.mp3", "voice": "voice/stop.mp3" }
  }
}
```

## Troubleshooting

**Sounds not playing**
- Check install status: `anime-sounds status`
- Check logs: `anime-sounds logs`
- Test manually: `anime-sounds test Stop`
- Linux: ensure `paplay`, `aplay`, or `ffplay` is installed

**Hook not triggering**
- Verify `~/.claude/settings.json` contains `anime-sounds` hook entries
- Re-run `anime-sounds install`

## License

MIT
