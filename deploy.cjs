/**
 * deploy.cjs — Full deploy pipeline for CondoPlus → Hostinger
 *
 * Steps:
 *  1. Bump CACHE_VERSION in public/sw.js
 *  2. npm run build
 *  3. Upload dist/ via FTP to Hostinger (public_html)
 *
 * Required in .env:
 *   FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_PATH
 */

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 0. Load .env manually (no dotenv dependency needed) ─────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── 1. Bump CACHE_VERSION in public/sw.js ──────────────────────────────────
function bumpSwCacheVersion() {
  const swPath = path.join(__dirname, 'public', 'sw.js');
  let content = fs.readFileSync(swPath, 'utf8');
  const match = content.match(/CACHE_VERSION\s*=\s*['"]condoplus-v(\d+)['"]/);
  if (!match) {
    console.warn('[deploy] CACHE_VERSION pattern not found in sw.js — skipping bump');
    return;
  }
  const currentVersion = parseInt(match[1], 10);
  const nextVersion = currentVersion + 1;
  content = content.replace(
    /CACHE_VERSION\s*=\s*['"]condoplus-v\d+['"]/,
    `CACHE_VERSION = 'condoplus-v${nextVersion}'`
  );
  fs.writeFileSync(swPath, content, 'utf8');
  console.log(`[deploy] CACHE_VERSION bumped: v${currentVersion} → v${nextVersion}`);
}

// ── 2. Build ────────────────────────────────────────────────────────────────
function runBuild() {
  console.log('[deploy] Running npm run build...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('[deploy] Build complete.');
}

// ── 3. FTP Upload ───────────────────────────────────────────────────────────
async function uploadViaFtp() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const remotePath = process.env.FTP_REMOTE_PATH || '/public_html';

  if (!host || !user || !password) {
    console.error('[deploy] FTP credentials missing. Set FTP_HOST, FTP_USER, FTP_PASSWORD in .env');
    process.exit(1);
  }

  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('[deploy] dist/ not found. Run npm run build first.');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log(`[deploy] Connecting to FTP: ${host}`);
    await client.access({ host, user, password, secure: false });

    console.log(`[deploy] Uploading dist/ to ${remotePath} ...`);
    await client.ensureDir(remotePath);
    await client.clearWorkingDir();
    await client.uploadFromDir(distDir);

    console.log('[deploy] Upload complete!');
    console.log(`[deploy] Site live at: https://${host.replace(/^ftp\./, '')}`);
  } finally {
    client.close();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    bumpSwCacheVersion();
    runBuild();
    await uploadViaFtp();
    console.log('\n[deploy] Deploy finalizado com sucesso!');
  } catch (err) {
    console.error('[deploy] Erro no deploy:', err.message || err);
    process.exit(1);
  }
})();
