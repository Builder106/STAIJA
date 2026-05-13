# Self-hosted web fonts

These woff2 files back the `@font-face` block in [`src/styles/fonts.css`](../../src/styles/fonts.css). They were downloaded from `fonts.gstatic.com` once and committed so the production site doesn't have to round-trip through Google's CDN on every cold load.

## Regeneration

Run from the repo root. Requires `curl` and `sed`.

```bash
# 1. Fetch the Google Fonts stylesheet with a modern UA so it serves
#    woff2 URLs (an older UA gets woff, which is larger).
curl -sL \
  -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap' \
  -o /tmp/staija-fonts.css

# 2. Download each unique woff2 URL into public/fonts/.
grep -oE 'https://fonts.gstatic.com/[^)]*\.woff2' /tmp/staija-fonts.css \
  | sort -u \
  | while IFS= read -r url; do
      curl -sL "$url" -o "public/fonts/$(basename "$url")"
    done

# 3. Rewrite the CSS to point at the local files, then splice the
#    result into the bottom of src/styles/fonts.css below the
#    "Self-hosted web fonts (generated)" marker line. The fallback
#    @font-face blocks above the marker are hand-maintained — don't
#    overwrite them.
sed -E \
  's|https://fonts\.gstatic\.com/[^)]*/([^/]+\.woff2)|/fonts/\1|g' \
  /tmp/staija-fonts.css \
  > /tmp/staija-fonts-rewritten.css
# Then manually replace everything after the marker comment in
# src/styles/fonts.css with the contents of the rewritten file.
```

## When to regenerate

- A new font weight is added to the design.
- Google ships a new version of one of the families (rare; tracked by the `v<n>` path segment in URLs).
- Stale woff2 files are removed accidentally.

If a preload link in [`index.html`](../../index.html) 404s after regen, the file hash for IBM Plex Sans 700 latin has changed — find the new hash in the rewritten CSS and update the `<link rel="preload" href="...">` to match.
