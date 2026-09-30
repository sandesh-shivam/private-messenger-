import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export const rootDir = process.cwd();
export const dataFile = process.env.DATA_FILE_PATH || path.join(rootDir, 'data.json');
export const backupFile = `${dataFile}.bak`;
export const tempFile = `${dataFile}.tmp`;

export const loadStore = () => {
  const tryParse = (filepath) => {
    if (!fs.existsSync(filepath)) return null;
    try {
      const raw = fs.readFileSync(filepath, 'utf-8');
      if (!raw || !raw.trim()) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const primary = tryParse(dataFile);
  if (primary) return primary;

  // Fallback to backup if main file is corrupted or missing
  const backup = tryParse(backupFile);
  if (backup) {
    console.warn(`[WARN] Primary data store corrupted or missing. Restored from backup: ${backupFile}`);
    try {
      fs.copyFileSync(backupFile, dataFile);
    } catch {}
    return backup;
  }

  return null;
};

export const saveStore = (store) => {
  const content = JSON.stringify(store, null, 2);
  try {
    // 1. Write atomically to temp file
    fs.writeFileSync(tempFile, content, 'utf-8');

    // 2. Backup existing valid data file
    if (fs.existsSync(dataFile)) {
      try {
        fs.copyFileSync(dataFile, backupFile);
      } catch {}
    }

    // 3. Atomically replace data file
    fs.renameSync(tempFile, dataFile);
  } catch (err) {
    console.error('[ERROR] Failed atomic save, falling back to direct write:', err);
    try {
      fs.writeFileSync(dataFile, content, 'utf-8');
    } catch (fallbackErr) {
      console.error('[CRITICAL] Direct save also failed:', fallbackErr);
    }
  }
};

export const seedStore = async () => {
  const now = new Date().toISOString();
  const users = [
    {
      id: 'u_admin',
      username: 'admin',
      displayName: 'Admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      enabled: true,
      online: false,
      lastSeen: null,
      sessionId: null,
      initials: 'AD',
      showLastSeen: true,
      publicKey: null
    },
    {
      id: 'u_vishal',
      username: 'vishal',
      displayName: 'Vishal',
      passwordHash: await bcrypt.hash('pass123!', 10),
      role: 'user',
      enabled: true,
      online: false,
      lastSeen: now,
      sessionId: null,
      initials: 'VI',
      showLastSeen: true,
      publicKey: null
    },
    {
      id: 'u_kashish',
      username: 'kashish',
      displayName: 'Kashish',
      passwordHash: await bcrypt.hash('pass123!', 10),
      role: 'user',
      enabled: true,
      online: false,
      lastSeen: now,
      sessionId: null,
      initials: 'KA',
      showLastSeen: true,
      publicKey: null
    }
  ];
  const store = { users, messages: [], nextUserId: 3, nextMessageId: 1 };
  saveStore(store);
  return store;
};

export const ensureStore = async () => {
  const existing = loadStore();
  if (existing) return existing;
  return seedStore();
};

export const safeUser = (u) => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  enabled: u.enabled,
  online: u.online,
  lastSeen: u.lastSeen,
  initials: u.initials,
  showLastSeen: u.showLastSeen,
  publicKey: u.publicKey || null
});

export const findUser = (store, key, value) => store.users.find((u) => u[key] === value);

export const getPairKey = (a, b) => [a, b].sort().join('__');

export const createUserId = (store) => `u_${String(store.nextUserId++).padStart(3, '0')}`;

export const createMessageId = (store) => `m_${String(store.nextMessageId++).padStart(5, '0')}`;

export const fmtLastSeen = (iso) => {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export const initialsFromName = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || 'U';
  const b = parts[1]?.[0] || parts[0]?.[1] || 'X';
  return (a + b).toUpperCase();
};
