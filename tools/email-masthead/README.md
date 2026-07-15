# Email masthead generator

Parametric SVG generator for the transactional-email masthead PNGs under
`public/email/masthead-{violet,sky,gold}-v1.png`. See `gen-masthead.js`
for the composition and `gen-weave.js` for the aso-oke band texture.

Rendering needs `rsvg-convert` (librsvg) and IBM Plex Sans Bold visible
to fontconfig. Download the TTF and point a scratch fontconfig at it:

```bash
mkdir -p /tmp/masthead-fonts
curl -sfL -o /tmp/masthead-fonts/IBMPlexSans-Bold.ttf \
  "https://github.com/IBM/plex/raw/master/packages/plex-sans/fonts/complete/ttf/IBMPlexSans-Bold.ttf"
printf '%s\n' '<?xml version="1.0"?>' '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">' \
  '<fontconfig><dir>/tmp/masthead-fonts</dir><cachedir>/tmp/masthead-fc-cache</cachedir></fontconfig>' \
  > /tmp/masthead-fonts.conf

node gen-masthead.js
for v in violet sky gold; do
  FONTCONFIG_FILE=/tmp/masthead-fonts.conf rsvg-convert -w 1200 -h 240 \
    "masthead-$v.svg" -o "masthead-$v-v1.png"
done
```

Email asset filenames are versioned and must never be overwritten once an
email referencing them has been sent. A design change means a new `-v2`
suffix, new references in `functions/src/emailTemplates.ts`, and leaving
the old files in place.
