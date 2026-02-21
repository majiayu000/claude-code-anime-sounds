# claude-code-anime-sounds

Anime-themed sound effects for Claude Code hooks. Hear cute or epic sounds when Claude Code completes tasks, sends notifications, or finishes subagent work.

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
```

## Commands

```
anime-sounds install              # Inject hooks into Claude Code settings
anime-sounds uninstall            # Remove hooks
anime-sounds theme kawaii|battle  # Switch theme
anime-sounds theme                # Show current theme
anime-sounds list                 # List available themes
anime-sounds config voice on|off  # Toggle voice lines
anime-sounds config volume 0.7    # Set volume (0.0 - 1.0)
anime-sounds test [event]         # Preview sounds
anime-sounds help                 # Show help
```

## Themes

### Kawaii (default)

Cute anime sound effects for a cozy coding vibe.

| Event | Sound | Voice |
|-------|-------|-------|
| Stop | Celebration chime | やったー！ |
| Notification | Cute bell | せんぱい！ |
| SubagentStop | Summon return | - |

### Battle

Epic battle sounds to fuel your coding energy.

| Event | Sound | Voice |
|-------|-------|-------|
| Stop | Victory fanfare | 任務完了！ |
| Notification | Battle alert | 警報！ |
| SubagentStop | Reinforcement arrival | - |

## Hook Events

| Event | When |
|-------|------|
| `Stop` | Claude Code finishes a task |
| `Notification` | Claude Code sends a notification |
| `SubagentStop` | A subagent completes its work |

## Configuration

Config is stored at `~/.anime-sounds/config.json`:

```json
{
  "theme": "kawaii",
  "voice": false,
  "volume": 0.8
}
```

## Platform Support

| Platform | Player | Status |
|----------|--------|--------|
| macOS | afplay | Fully supported |
| Linux | paplay (PulseAudio) | Supported |
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
    "Stop": { "se": "se/stop.mp3", "voice": "voice/stop.mp3" },
    "Notification": { "se": "se/notification.mp3" },
    "SubagentStop": { "se": "se/subagent-stop.mp3" }
  }
}
```

## License

MIT
