const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.anime-sounds');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULTS = {
  theme: 'kawaii',
  voice: false,
  volume: 0.8,
  debounce: 15,
};

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

function get(key) {
  return load()[key];
}

const ALLOWED_KEYS = new Set(Object.keys(DEFAULTS));

function set(key, value) {
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`未知配置项：${key}`);
  }
  const config = load();
  config[key] = value;
  save(config);
  return config;
}

module.exports = { load, save, get, set, CONFIG_DIR, CONFIG_FILE, DEFAULTS };
