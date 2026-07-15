// Masthead generator: 1200x240 (@2x of 600x120). Gradient field matching
// the site hero, aso-oke panel + patterned selvedge (gen-weave.js),
// science line-art, IBM Plex wordmark over an ink scrim. Rounded top
// corners baked in.
const fs = require('fs')
const { weave: stripes } = require('./gen-weave.js')

function motifs(tint) {
  const s = `stroke="${tint}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`
  return `
    <g ${s}>
      <path d="M962 78 h28 M968 78 v34 L938 168 a10 10 0 0 0 9 14 h58 a10 10 0 0 0 9 -14 L984 112 v-34"/>
      <path d="M949 148 h54" stroke-opacity="0.8"/>
      <circle cx="968" cy="160" r="4"/>
      <circle cx="986" cy="154" r="3"/>
    </g>
    <g ${s}>
      <ellipse cx="1104" cy="120" rx="52" ry="20" transform="rotate(-28 1104 120)"/>
      <ellipse cx="1104" cy="120" rx="52" ry="20" transform="rotate(28 1104 120)"/>
      <circle cx="1104" cy="120" r="5" fill="${tint}" stroke="none"/>
    </g>
    <g ${s} stroke-opacity="0.75">
      <path d="M868 96 l22 13 v26 l-22 13 l-22 -13 v-26 z"/>
      <path d="M868 104 l14 8 M868 140 l-14 -8"/>
    </g>
    <g fill="${tint}">
      <circle cx="920" cy="70" r="3"/>
      <circle cx="1042" cy="180" r="3"/>
      <path d="M1160 62 h14 M1167 55 v14" stroke="${tint}" stroke-width="3" stroke-linecap="round"/>
    </g>`
}

function masthead({ g0, g1, g2, accent, motifTint }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="240" viewBox="0 0 1200 240">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${g0}"/>
      <stop offset="0.45" stop-color="${g1}"/>
      <stop offset="1" stop-color="${g2}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0E1217" stop-opacity="0.5"/>
      <stop offset="0.72" stop-color="#0E1217" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0E1217" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="rounded"><path d="M0 28 a28 28 0 0 1 28 -28 h1144 a28 28 0 0 1 28 28 v212 h-1200 z"/></clipPath>
  </defs>
  <g clip-path="url(#rounded)">
    <rect width="1200" height="240" fill="url(#bg)"/>
    ${stripes(accent)}
    <rect width="640" height="240" fill="url(#scrim)"/>
    ${motifs(motifTint)}
    <text x="76" y="130" font-family="IBM Plex Sans" font-weight="700" font-size="60" fill="#FFFFFF" letter-spacing="0.5">STAIJA</text>
    <text x="78" y="172" font-family="IBM Plex Sans" font-weight="600" font-size="19" fill="#FFFFFF" fill-opacity="0.92" letter-spacing="3">AFRICA&#8217;S NEXT SCIENTIST-LEADERS</text>
  </g>
</svg>`
}

const variants = {
  violet: { g0: '#6B3FE0', g1: '#8B55FF', g2: '#5EDBE7', accent: '#F0B429', motifTint: 'rgba(255,255,255,0.7)' },
  sky:    { g0: '#8B55FF', g1: '#64B5EE', g2: '#5EDBE7', accent: '#6B3FE0', motifTint: 'rgba(255,255,255,0.72)' },
  gold:   { g0: '#6B3FE0', g1: '#8B55FF', g2: '#5EDBE7', accent: '#F0B429', motifTint: 'rgba(240,180,41,0.85)' },
}
for (const [name, cfg] of Object.entries(variants)) {
  fs.writeFileSync(`masthead-${name}.svg`, masthead(cfg))
}
console.log('svgs written')
