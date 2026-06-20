# R2 Wallpaper Upload Script

`scripts/upload-wallpapers-r2.ts` uploads staged wallpaper image files to
Cloudflare R2.

## What It Uploads

The script reads AVIF and WebP files from:

```txt
.generated/wallpapers
```

Each file is uploaded to:

```txt
kanadojo-wallpapers/wallpapers/<filename>
```

The public URL is then:

```txt
https://assets.kanadojo.com/wallpapers/<filename>
```

## Required Setup

Wrangler must be authenticated to the Cloudflare account that owns the active
`kanadojo.com` zone:

```powershell
wrangler login
```

The production bucket and custom domain are:

```txt
Bucket: kanadojo-wallpapers
Domain: assets.kanadojo.com
```

## Command

```powershell
npm run images:upload:r2
```

Use the combined generation and upload command for normal work:

```powershell
npm run images:r2
```

## Cache Headers

Every upload uses:

```txt
Cache-Control: public, max-age=31536000, immutable
```

This keeps repeat wallpaper requests served from browser and Cloudflare cache
instead of repeatedly hitting R2.

The script always passes `--remote` to Wrangler. Without that flag, Wrangler can
write to local simulated R2 storage instead of Cloudflare R2.

## Reruns

The upload is safe to rerun. Existing R2 objects with the same key are replaced.
Because wallpaper URLs are immutable in practice, prefer new filenames for visual
changes that users should see immediately.
