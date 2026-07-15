// Aso-oke band texture, v2 after design review: the cloth is a defined
// panel with a single uniform ground ending exactly at the gold seam;
// motif bands live in a patterned selvedge between the text zone and the
// seam (x 545-700) so the type block stays clear. Motifs are slightly
// stronger now that there are fewer of them.
const W = '#FFFFFF', K = '#0E1217'

function diamondBand(x, w) {
  const cx = x + w / 2, half = Math.min(w / 2 - 3, 9)
  let out = []
  for (let y = 10; y < 240; y += 30) {
    out.push(`<path d="M${cx} ${y} l${half} 12 l-${half} 12 l-${half} -12 z" stroke="${W}" stroke-opacity="0.2" fill="none" stroke-width="2"/>`)
  }
  return out.join('')
}
function triangleBand(x, w) {
  const half = Math.min(w / 2 - 3, 10), cx = x + w / 2
  let out = [], flip = false
  for (let y = 8; y < 240; y += 26) {
    out.push(flip
      ? `<path d="M${cx - half} ${y} h${half * 2} l-${half} 14 z" stroke="${W}" stroke-opacity="0.18" fill="none" stroke-width="2"/>`
      : `<path d="M${cx} ${y} l${half} 14 h-${half * 2} z" stroke="${W}" stroke-opacity="0.18" fill="none" stroke-width="2"/>`)
    flip = !flip
  }
  return out.join('')
}
function zigzagBand(x, w) {
  const amp = Math.min(w / 2 - 2, 7), cx = x + w / 2
  let d = `M${cx - amp} 0`, dir = 1
  for (let y = 0; y <= 240; y += 16) { d += ` L${cx + amp * dir} ${y + 16}`; dir = -dir }
  return `<path d="${d}" stroke="${W}" stroke-opacity="0.19" fill="none" stroke-width="2"/>`
}
function tickBand(x, w) {
  const cx = x + w / 2, half = Math.min(w / 2 - 3, 7)
  let out = [], i = 0
  for (let y = 12; y < 240; y += 20) {
    out.push(i % 3 === 2
      ? `<circle cx="${cx}" cy="${y}" r="2.4" fill="${W}" fill-opacity="0.22"/>`
      : `<path d="M${cx - half} ${y} h${half * 2}" stroke="${W}" stroke-opacity="0.21" stroke-width="2.4"/>`)
    i++
  }
  return out.join('')
}

function weave(accent) {
  const out = []
  // uniform cloth ground: one panel, ending exactly at the gold seam
  out.push(`<rect x="0" y="0" width="704" height="240" fill="${K}" fill-opacity="0.07"/>`)
  // patterned selvedge between text zone and seam
  out.push(diamondBand(552, 28))
  out.push(`<rect x="586" y="0" width="3" height="240" fill="${W}" fill-opacity="0.12"/>`)
  out.push(zigzagBand(596, 20))
  out.push(`<rect x="622" y="0" width="3" height="240" fill="${K}" fill-opacity="0.1"/>`)
  out.push(triangleBand(632, 30))
  out.push(`<rect x="668" y="0" width="3" height="240" fill="${W}" fill-opacity="0.12"/>`)
  out.push(tickBand(678, 20))
  // gold seam
  out.push(`<rect x="704" y="0" width="8" height="240" fill="${accent}" fill-opacity="0.95"/>`)
  out.push(`<rect x="718" y="0" width="3" height="240" fill="#FFFFFF" fill-opacity="0.6"/>`)
  out.push(`<rect x="727" y="0" width="5" height="240" fill="${accent}" fill-opacity="0.55"/>`)
  return out.join('\n    ')
}
module.exports = { weave }
