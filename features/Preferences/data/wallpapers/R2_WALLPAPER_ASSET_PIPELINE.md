# R2 Wallpaper Asset Pipeline

KanaDojo built-in Premium wallpaper images are generated locally, uploaded to
Cloudflare R2, and consumed by the app through the generated wallpaper manifest.

## Runtime Shape

- Source images live in `data/wallpapers-source`.
- Optimized AVIF and WebP files are staged in `.generated/wallpapers`.
- `.generated/` is gitignored and is only a local upload staging area.
- Public delivery uses `https://assets.kanadojo.com/wallpapers/*`.
- The app imports `features/Preferences/data/wallpapers/wallpapers.generated.ts`.
- Premium themes are generated from the manifest in `themeDefinitions.ts`.

## Commands

Generate staged image files and update the TypeScript manifest:

```powershell
npm run images:process
```

Upload staged image files to R2:

```powershell
npm run images:upload:r2
```

Generate and upload in one command:

```powershell
npm run images:r2
```

## Cloudflare Resources

- Cloudflare account: the account that owns the active `kanadojo.com` zone.
- R2 bucket: `kanadojo-wallpapers`.
- Custom domain: `assets.kanadojo.com`.
- Object prefix: `wallpapers/`.
- Cache header: `public, max-age=31536000, immutable`.

## Environment Overrides

The defaults are production-ready, but these env vars can override them:

```txt
WALLPAPER_ASSET_BASE_URL=https://assets.kanadojo.com
WALLPAPER_R2_BUCKET=kanadojo-wallpapers
WALLPAPER_R2_PREFIX=wallpapers
WALLPAPER_STAGING_DIR=.generated/wallpapers
WALLPAPER_R2_CACHE_CONTROL=public, max-age=31536000, immutable
```

## Adding A Wallpaper

1. Add the original image to `data/wallpapers-source`.
2. Use a stable kebab-case filename because it becomes the wallpaper ID.
3. Run `npm run images:r2`.
4. Commit the updated generated manifest.
5. Do not commit `.generated/wallpapers`.

## Source Repair Note

The old `bangkok-riverside-night.jpg` source was corrupt and could not be decoded
by Sharp. It has been replaced with a same-ID WebP source so the generated theme
ID and public R2 URLs stay stable.

## Cache Discipline

Wallpaper URLs are cached for one year and marked immutable. If a wallpaper image
changes visually, prefer a new filename or versioned object path instead of
overwriting an existing object URL.
