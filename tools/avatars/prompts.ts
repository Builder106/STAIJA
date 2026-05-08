/**
 * Source-of-truth prompts for STAIJA avatar portraits.
 *
 * **Architecture pivot (2026-05-06):** dropped the layered-parts model
 * (head + hair + eyes + mouth + glasses combined per-render) because
 * diffusion image models can't reliably produce isolated body parts on
 * transparent backgrounds — every "isolated eye" prompt came back with
 * surrounding face context. Switched to whole-portrait avatars: each
 * prompt below produces a complete head/shoulders illustration, the
 * Dicebear style picks one per scholar from the seeded PRNG, done.
 *
 * Trade-off: lost the 1200-combo combinatorics (5 skin × 5 hair × 2 eyes
 * × 2 mouth × 3 glasses × 4 bg). Gained: editorial cohesion, generation
 * pipeline that actually works with diffusion, every avatar reads as a
 * deliberate illustration instead of an algorithmic mash-up.
 *
 * Each prompt is augmented at generation time with a shared style anchor
 * + framing spec — keep prompt text focused on the subject (hair, skin,
 * gender presentation, accessories), not the style.
 *
 * Diversity goals across the set:
 *   - Skin tones span warm-medium to deep brown (no single shade dominates)
 *   - Gender presentations: ~3 femme, ~3 masc, ~3 androgynous, 1 hijab
 *   - Hair textures: bald, fade, TWA, afro, locs, braids, twists, bantu
 *     knots, hijab, gele
 *   - Some with glasses, some without
 *   - Mostly neutral expression, a couple with soft smiles
 */

export interface AvatarPrompt {
  /** File slug. Output lands at raw/{name}.png and traced/{name}.svg. */
  name: string
  /** Subject-only prompt. The generator wraps this with the style anchor. */
  prompt: string
  /** Anything to suppress beyond the shared negatives. */
  extraNegative?: string
}

// Style anchor applied to every prompt. Front-loaded so the model
// reads the style direction before the subject description — this
// matters because for some subjects (notably hijab and gele portraits)
// the model's subject-specific training prior fights flat-vector
// styling and a trailing style anchor loses the tug-of-war. The first
// pass had "soft shading allowed" here, which got mistranslated as
// "render fully" on photo-heavy subject priors. Reverted to strict
// flat-vector with one tightly-scoped exception (a single tonal step
// for cheek dimension, no gradients, no soft transitions).
export const STYLE_ANCHOR =
  'STRICT FLAT 2D VECTOR ILLUSTRATION, editorial poster style, NOT 3D, NOT photorealistic, NOT rendered, bold clean solid color shapes only, at most one tonal step for cheek dimension (no gradients, no soft transitions, no smooth shading), harmonious limited palette, simple outline definition where needed, head and shoulders crop, subject perfectly centered, plain solid background (paper white or single subtle brand-color wash), square 1024x1024 canvas, no text, no logos, no watermarks'

export const NEGATIVE_BASE =
  '3D render, photorealistic skin, beauty photography, retouched portrait, smooth gradient skin, hyperreal, octane render, cinema 4D, pixar style, disney 3D, soft cloth simulation, fabric texture, realistic shadows, depth of field, bokeh, caricature, exaggerated proportions, anime, manga, cartoon-cute chibi, gradient mesh, drop shadow, photographic background, multiple subjects, body below shoulders, hands visible, props, busy background, signature, watermark, low resolution, blurry'

export const PROMPTS: AvatarPrompt[] = [
  {
    name: 'portrait-bald',
    prompt: `Portrait of a young African male STEM scholar, age 17-20, bald (clean-shaven head), medium-deep brown skin tone #5C341B with subtle warmer cheek lighting from upper-left, calm neutral expression, plain warm-brown crew-neck t-shirt, no jewelry, no glasses. Front-facing, head and shoulders only, eye-line at 40% from canvas top. Soft cream/paper background #F1F5F9`,
  },
  {
    name: 'portrait-afro-medium',
    prompt: `Portrait of a young African woman STEM scholar, age 17-20, voluminous natural afro hairstyle, hair color black-brown #1A0F08 with subtle texture, warm medium-brown skin #7B4923, small gold stud earrings, soft confident smile, plain charcoal crew-neck t-shirt, no glasses. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
    extraNegative: 'heavy makeup, false eyelashes, glamour styling',
  },
  {
    name: 'portrait-locs',
    prompt: `Portrait of a young African man STEM scholar, age 17-20, shoulder-length freeform locs (dreadlocks), hair color black-brown #1A0F08, deep warm brown skin tone #46271A, neutral focused expression, plain navy crew-neck t-shirt, no glasses, no jewelry. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
  },
  {
    name: 'portrait-braids-long',
    prompt: `Portrait of a young African woman STEM scholar, age 17-20, long box braids parted in the center hanging past the shoulders, braids in black-brown #1A0F08, medium brown skin tone #6B3E25, small simple gold hoops, neutral self-assured expression, plain forest-green crew-neck t-shirt, no glasses. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
    extraNegative: 'heavy makeup, false eyelashes',
  },
  {
    name: 'portrait-hijab',
    prompt: `Portrait of a young Muslim African woman scholar, age 17-20, modest deep emerald-green hijab #3D5A4A fully covering hair, ears, and neck, draping naturally over shoulders. Medium-deep brown skin #5C341B visible only on the face. Subtle inner-fold ring of slightly darker green #2D4337 around the face. Soft warm smile, no jewelry, no glasses. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
    extraNegative: 'hair visible, sheer fabric, fashion makeup',
  },
  {
    name: 'portrait-gele',
    prompt: `Portrait of a young Nigerian woman scholar, age 17-20, wearing a tall structured traditional Nigerian gele headwrap in brand-violet #8B55FF with a slightly lighter top fold #A878FF and a darker headband stripe #6B3FE0. Decorative small gold dots #FFD700 scattered across the gele in a loose Ankara-inspired pattern. Deep brown skin tone #46271A. Confident neutral expression. Plain off-white blouse with rounded neckline. No glasses, simple gold studs only. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
    extraNegative: 'casual headwrap, beanie, generic turban',
  },
  {
    name: 'portrait-twa-glasses',
    prompt: `Portrait of a young African scholar, age 17-20, androgynous gender-neutral presentation, very short cropped TWA (teeny weeny afro) natural hair, hair color black-brown #1A0F08, warm medium-brown skin #6B3E25, modern thick-frame square eyeglasses in matte black #181818 with subtle white highlight on lens upper edge, calm neutral expression, plain heather-grey crew-neck t-shirt under a slate-grey lab coat collar. Front-facing, head and shoulders only. Soft brand-sky-tinted background, very pale #E0F4F7`,
    extraNegative: 'overtly feminine styling, overtly masculine styling, makeup',
  },
  {
    name: 'portrait-twists-puff',
    prompt: `Portrait of a young African woman STEM scholar, age 17-20, two-strand twists pulled up into a high natural puff at the crown of the head, twists in black-brown #1A0F08, deep warm brown skin tone #46271A, soft engaged smile, plain mustard-yellow crew-neck t-shirt, simple silver studs, no glasses. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
    extraNegative: 'heavy makeup, false eyelashes, glamour styling',
  },
  {
    name: 'portrait-fade-glasses',
    prompt: `Portrait of a young African man STEM scholar, age 17-20, low fade haircut (very short on sides, slightly longer on top), hair color black-brown #1A0F08, deep brown skin tone #3A2114, round wire-frame eyeglasses in warm brass #C8A24A with thin frames, neutral focused expression, plain white crew-neck t-shirt under a navy blazer collar. Front-facing, head and shoulders only. Soft cream/paper background #F1F5F9`,
  },
  {
    name: 'portrait-bantu',
    prompt: `Portrait of a young African scholar, age 17-20, gender-neutral presentation, hair styled in bantu knots (multiple small twisted knots arranged in a grid pattern across the scalp), hair color black-brown #1A0F08, warm medium-deep brown skin tone #5C341B, soft confident expression, plain dusty-rose crew-neck t-shirt, no glasses, no visible jewelry. Front-facing, head and shoulders only. Soft brand-violet-tinted background, very pale #F0E8FF`,
    extraNegative: 'cornrows, dreadlocks, single bun',
  },
]
