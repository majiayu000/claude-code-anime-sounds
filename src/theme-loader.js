const fs = require('fs');
const path = require('path');

function getThemesDir() {
  return path.join(__dirname, '..', 'themes');
}

function listThemes() {
  const themesDir = getThemesDir();
  if (!fs.existsSync(themesDir)) return [];

  return fs.readdirSync(themesDir).filter((name) => {
    const themeJson = path.join(themesDir, name, 'theme.json');
    return fs.existsSync(themeJson);
  });
}

function loadTheme(themeName) {
  if (!themeName || themeName.includes('/') || themeName.includes('\\') || themeName.includes('..')) {
    return null;
  }
  const themeFile = path.join(getThemesDir(), themeName, 'theme.json');
  if (!fs.existsSync(themeFile)) return null;

  try {
    const raw = fs.readFileSync(themeFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveSound(themeName, event, type = 'se') {
  const theme = loadTheme(themeName);
  if (!theme || !theme.events || !theme.events[event]) return null;

  const entry = theme.events[event];
  const relativePath = entry[type];
  if (!relativePath) return null;

  const fullPath = path.resolve(getThemesDir(), themeName, relativePath);
  const themeRoot = path.resolve(getThemesDir(), themeName);
  if (!fullPath.startsWith(themeRoot + path.sep)) return null;
  return fs.existsSync(fullPath) ? fullPath : null;
}

module.exports = { listThemes, loadTheme, resolveSound, getThemesDir };
