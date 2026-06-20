/**
 * Upload staged wallpaper assets to Cloudflare R2.
 *
 * Run after `npm run images:process`.
 *
 * Required external setup:
 * - Wrangler authenticated to the Cloudflare account that owns kanadojo.com.
 * - R2 bucket exists and is connected to assets.kanadojo.com.
 */
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const STAGING_DIR = process.env.WALLPAPER_STAGING_DIR || '.generated/wallpapers';
const R2_BUCKET = process.env.WALLPAPER_R2_BUCKET || 'kanadojo-wallpapers';
const R2_PREFIX = (process.env.WALLPAPER_R2_PREFIX || 'wallpapers').replace(
  /^\/|\/$/g,
  '',
);
const CACHE_CONTROL =
  process.env.WALLPAPER_R2_CACHE_CONTROL ||
  'public, max-age=31536000, immutable';

const SUPPORTED_EXTENSIONS = new Set(['.avif', '.webp']);

function getExtension(file: string): string {
  const lastDot = file.lastIndexOf('.');
  return lastDot === -1 ? '' : file.slice(lastDot).toLowerCase();
}

async function getWallpaperFiles(): Promise<string[]> {
  try {
    const entries = await readdir(STAGING_DIR);
    return entries
      .filter(file => SUPPORTED_EXTENSIONS.has(getExtension(file)))
      .sort();
  } catch {
    console.error(`Wallpaper staging directory not found: ${STAGING_DIR}`);
    console.error('Run `npm run images:process` before uploading to R2.');
    process.exit(1);
  }
}

function runWrangler(args: string[]): void {
  const windowsWranglerScript =
    process.env.WRANGLER_PS1_PATH || 'C:\\nvm4w\\nodejs\\wrangler.ps1';
  const usePowerShellWrapper =
    process.platform === 'win32' && existsSync(windowsWranglerScript);
  const command =
    process.platform === 'win32'
      ? usePowerShellWrapper
        ? 'powershell.exe'
        : 'cmd.exe'
      : 'wrangler';
  const commandArgs = (() => {
    if (process.platform !== 'win32') return args;
    if (usePowerShellWrapper) {
      return [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        windowsWranglerScript,
        ...args,
      ];
    }

    const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;
    return ['/d', '/s', '/c', ['wrangler', ...args].map(quote).join(' ')];
  })();

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const files = await getWallpaperFiles();

  if (files.length === 0) {
    console.log(`No staged wallpaper files found in ${STAGING_DIR}.`);
    return;
  }

  console.log(`Uploading ${files.length} wallpaper file(s) to R2...`);
  console.log(`Bucket: ${R2_BUCKET}`);
  console.log(`Prefix: ${R2_PREFIX}`);
  console.log(`Cache-Control: ${CACHE_CONTROL}`);

  for (const file of files) {
    const localPath = join(STAGING_DIR, file);
    const fileStat = await stat(localPath);
    const objectKey = `${R2_PREFIX}/${file}`;

    console.log(`\n${file} (${fileStat.size} bytes) -> ${objectKey}`);
    runWrangler([
      'r2',
      'object',
      'put',
      `${R2_BUCKET}/${objectKey}`,
      '--file',
      localPath,
      '--cache-control',
      CACHE_CONTROL,
      '--remote',
    ]);
  }

  console.log('\nR2 wallpaper upload complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
