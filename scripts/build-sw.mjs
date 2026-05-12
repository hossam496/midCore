/**
 * Generates public/sw.js (PWA + Firebase Messaging). Run before vite dev/build.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
  ...process.env,
};

const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const template = fs.readFileSync(
  path.join(__dirname, 'sw', 'medcore-sw.template.js'),
  'utf8'
);
const out = template
  .replace(/__FIREBASE_API_KEY__/g, cfg.apiKey)
  .replace(/__FIREBASE_AUTH_DOMAIN__/g, cfg.authDomain)
  .replace(/__FIREBASE_PROJECT_ID__/g, cfg.projectId)
  .replace(/__FIREBASE_STORAGE_BUCKET__/g, cfg.storageBucket)
  .replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, cfg.messagingSenderId)
  .replace(/__FIREBASE_APP_ID__/g, cfg.appId);

const dest = path.join(root, 'public', 'sw.js');
fs.writeFileSync(dest, out, 'utf8');
console.log('[build-sw] wrote', dest);
if (!cfg.projectId) {
  console.warn(
    '[build-sw] FCM disabled in sw.js: set VITE_FIREBASE_PROJECT_ID (and other VITE_FIREBASE_*) in .env'
  );
}
