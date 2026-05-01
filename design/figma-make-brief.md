Redesign STAIJA — a nonprofit nurturing Africa's next generation of
scientist-leaders. We run two flagship programs: StepUp Scholars (a
Nigeria-based research program for high-school and gap-year students)
and Dynamerge (a pan-African virtual summer boot camp). The site also
hosts events, stories, donations, an application flow, and authentication.
Authenticated dashboards (applicant, student, admin) are out of scope
for this pass — design only the public-facing surfaces plus auth.

# Brand essence

Editorial gravitas meets warm community. Scholarly without being
stuffy, optimistic without being saccharine, African-rooted without
being decorative. References: the layout discipline of Stripe, the
editorial rhythm of MIT Tech Review, the human warmth of charity:water,
the African-modern textures of 54Kibo or Selasi — not pan-African-cliché
mudcloth or kente patterns.

# Audience

Primary: ambitious Nigerian and pan-African high-school and gap-year
students (15–20). Phone-first, often on slow connections, skeptical
of programs that overpromise. They need to see specificity: real
names, real labs, real outputs.

Secondary: parents, school counsellors, university partners, donors,
volunteers, and prospective mentors.

# Brand identity (already set — work within this)

The existing logo is a wordmark on a horizontal gradient running
violet → sky blue. The gradient stops are:

- Brand Violet: #8B55FF
- Brand Sky:    #69B9ED
- Brand Gradient: linear-gradient(90deg, #8B55FF 0%, #69B9ED 100%)

Treat the gradient as a brand asset, not a hero wash. Use it for:
the logo, one accent moment per page (e.g. donate amount selector,
the apply CTA banner on program pages, the active state of a primary
button), and inverted dark sections. Do NOT use it as a full-bleed
hero background — that's the current site's mistake. Hero backgrounds
should be paper or ink; the gradient appears as a tighter accent
within them.

# Visual system (one system across every page — no exceptions)

Type

- Display: Playfair Display, used for H1s and pull-quotes only. Tight
  tracking, large sizes (clamp 40–72px). Italic for accents.
- UI / body: Inter, 400/500/600. Body 16/26, large body 18/30.
- Eyebrows: Inter, 12px, +0.12em tracking, uppercase, used sparingly.

Color

- Ink (near-black, primary text):    #0E1217
- Paper (warm off-white, primary bg): #FAF7F2
- Brand Violet:                       #8B55FF
- Brand Sky:                          #69B9ED
- Brand Gradient: linear-gradient(90deg, #8B55FF, #69B9ED)
- Primary CTA fill: Brand Violet (#8B55FF). Hover: shift toward
  Brand Sky by ~15% (a single, gentle hue shift).
- Surface tints for hero washes: 6% Brand Violet over Paper, OR 6%
  Ink over Paper. No other gradient hero washes.
- Dark surface (footer, inverted bands, occasional CTAs): #0E1217.
  When the gradient is used inverted on dark, it appears as a
  single pill or border highlight, not a flood fill.

Spacing & layout

- One container: 1200px max, 24px gutter mobile, 48px desktop.
- 8px base grid. Section vertical rhythm: 96px desktop, 64px mobile.
- Cards: 16px radius, 1px hairline border in 8% ink, no drop shadows
  except on the single hovered/active card.

Buttons (one system — never mix)

- Primary: Brand Violet fill, white text, 14px, 600 weight, 12px
  radius, 44px tall, sentence-case (not uppercase). Hover lifts 1px
  and shifts toward Brand Sky.
- Secondary: ink-on-paper outline, same metrics.
- Tertiary: text link with 2px underline offset.
- One button on the page may use the Brand Gradient as fill — the
  single most important action (e.g. "Donate" on Donate, "Apply now"
  on a program page). Never two on the same page.

Imagery

- Real photography of African students, labs, fieldwork, classrooms.
  Warm tones that sit well next to the violet→sky gradient.
- No stock illustrations of figures with floating gears, lightbulbs,
  or generic "education" iconography.
- Where photography is unavailable, use abstract editorial spreads
  (lab glassware, notebook pages, soil, circuit boards) tinted with
  6% Brand Violet. No mascots, no flat geometric Africa silhouettes.

Motion (motion-v)

- Hero text fades up 12px on mount, 320ms ease-out.
- Section content stagger-fades on scroll-in, 80ms stagger.
- Card hover: 1px lift + border shift, 160ms.
- Brand gradient on the primary CTA may slowly drift its angle
  (e.g. 90deg → 110deg) on hover, 400ms — sparingly, no looping.
- No parallax, no looping background animations. Respect
  prefers-reduced-motion.

# Page-by-page briefs

Every page uses the same chrome (header, footer) and component
vocabulary.

## Home (/)

Goal: in 8 seconds, a 16-year-old understands what STAIJA is, that
it is real, and what their next step is.

1. Header (sticky, paper bg, 1px hairline on scroll).
2. Hero. Left: H1 ("Africa's next scientist-leaders start here.")
   + one-line dek + two CTAs (gradient-fill primary "Apply to
     StepUp", outline secondary "Explore programs"). Right: a real
     photograph of a Nigerian student in a lab or fieldwork setting,
     full-bleed to the container edge, 6% violet wash overlay. The
     gradient appears only on the primary CTA, not in the background.
3. Impact strip. 4 stats, eyebrow + number + caption ("Scholars
   trained · 240 · across 18 Nigerian states").
4. Programs split. Two large portrait cards side-by-side (StepUp,
   Dynamerge), each with program name in Playfair, one-sentence
   pitch, eligibility chip, CTA. Cards use the gradient as a 4px
   top border, not a fill.
5. Featured story. Editorial-magazine layout: large image left,
   pull-quote right in Playfair italic, byline + read-more link.
6. Upcoming events teaser. Three event cards (date block, title,
   location, type chip). "View all events" link.
7. Partners strip. Logos in monochrome ink, 6 across, hairline.
8. Newsletter. Single input + button on a paper-tinted band.
9. Footer (dark surface, 4 columns: brand, programs, organization,
   social).

## Program detail — StepUp Scholars (/programs/stepup-scholars)

Same template as Dynamerge.

1. Hero: program name (Playfair), one-sentence pitch, eligibility
   chip, "Apply" CTA, key stats inline (cohort size, duration,
   stipend), background photograph of a past cohort with a 6%
   violet wash.
2. Why this program. Three feature blocks — Research, Mentorship,
   Community — each with a real photo, not an icon.
3. What you'll do. A 4–6 step timeline with date markers and
   one-paragraph descriptions per step. The connecting timeline
   line uses the brand gradient.
4. Who it's for. Eligibility checklist + a line on inclusivity.
5. Mentors. Grid of 6–9 mentor faces with name, title, institution.
6. FAQ accordion, 6–8 items.
7. Apply CTA banner. The page's gradient moment: full-width band
   with the brand gradient as fill, white headline, white outline
   button.

## Program detail — Dynamerge (/programs/dynamerge)

Same template. Stats lean pan-African ("Students from 12 countries,
4 weeks, fully virtual").

## Get Involved (/get-involved)

Three paths in a tab pattern: Volunteer / Mentor, Partner, Intern.
Each tab loads its apply form anchored on the page (no separate
route). Form fields, eligibility, expected commitment, what success
looks like.

## Donate (/donate)

Reference**: design/refs/donate-peacock.webp** — Monthly/Annual
segmented toggle above tier cards, "BEST VALUE" badge on the
featured tier, gold-bordered selected state. Apply STAIJA's Brand
Violet to the toggle's active state and the selected-card border.

1. Story-led hero: a single sentence and a photograph of a specific
   scholar with a one-line attribution ("₦25,000 funded Aisha's
   first research stipend.").
2. Tier picker. One-time / Monthly toggle. Three tier cards
   (₦5,000 · ₦25,000 · ₦100,000) with concrete impact descriptions
   ("funds one workshop seat", "covers a research stipend for a
   month", "sponsors a full StepUp cohort placement"). Custom
   amount input below. The selected tier uses the brand gradient
   as a 2px border + a subtle gradient inner shadow — this is the
   page's gradient moment.
3. Donor receipt preview: small card showing what the donor will
   get (tax receipt, impact report cadence, opt-in for annual
   report listing).
4. Transparency: "Where the money goes" — donut chart with 4
   segments and a one-line caption per segment.
5. FAQ for donors.

## About (/about)

1. Hero: mission statement as a 2-sentence Playfair pull-quote on
   paper background.
2. Story: 3-paragraph history with founding year, founders, key
   moments.
3. Leadership grid: 6–10 photos with name, title, one-line bio.
4. Board + Advisors: smaller grid, names + affiliations only.
5. Partners + Funders: monochrome logo grid.
6. Press: 3–4 logos with quote excerpts.

## Stories (/blog)

Keep filter pattern (Program: All/StepUp/Dynamerge, Topic:
All/Research/Stories/News, search). Improve:

1. Featured story: large editorial card spanning two columns.
2. Filter bar: chips for program + topic, search input
   right-aligned. The active filter chip uses the brand gradient
   as fill.
3. Story grid: 3 columns desktop, 1 mobile. Cards: image (16:10),
   eyebrow with program tag + topic + date, headline (Playfair),
   2-line dek, byline. Cards are entirely clickable — drop the
   per-card "Read more" and "Donate" buttons. Single donate prompt
   at the page bottom.
4. Pagination at 9 per page.

## Story detail (/blog/:slug — add this route)

Editorial article layout: title, dek, hero photo, byline + reading
time, prose with pull-quotes, related stories at the bottom.

## Events (/events)

1. Hero: short statement on what events are for.
2. Tabs: Upcoming / Past.
3. Event cards: large date block on left (day + month), title,
   location, type chip, RSVP button on right. List, not grid.
4. Real loading state: 3 skeleton rows, not a "Loading events…"
   string. Real empty state: an illustration + a sentence + a CTA
   to subscribe to the newsletter.

## Event detail (/events/:id)

Hero photo, date + location bar, description, agenda, speakers
grid, RSVP form anchored.

## Contact (/contact)

Two columns: form on the left (name, email, subject, message),
contact details on the right (email, Lagos office address with
small map embed, social links). Submit replaces the form with a
confirmation state in place — no navigation.

## Login (/login) and Signup (/signup)

**Reference: design/refs/auth-origin.webp** — Two-column with form
left on white paper, dark product panel right. Swap the dark product
panel for a photograph of a Nigerian student in lab/fieldwork; keep
the form column as-is.

Auth is part of the brand surface — design as marketing-grade pages.

- Header + footer present, same as marketing pages.
- Two-column layout at desktop widths: form card on the left,
  full-bleed photography panel on the right (a Nigerian student
  in a lab, classroom, or fieldwork). The photo panel has a soft
  6% violet wash, not the full gradient.
- The form card sits on Paper, uses the same hairline border and
  16px radius as the rest of the system. Card title in Playfair
  ("Sign in to STAIJA" / "Join STAIJA"). Inputs in Inter.
- Primary submit button uses the brand gradient as fill — auth is
  one of the moments where the gradient earns its place.
- Keep "Continue with Google" as a secondary outlined option.
- Mobile: single column, photo panel hidden, paper background.

# Component library (must define)

- Header (sticky, links + auth buttons, mobile drawer)
- Footer (dark surface, 4 columns + newsletter)
- Hero (with optional photo right, photo full-bleed, or paper-only)
- Stat strip (4 stats, optional eyebrow)
- Program card (large, portrait, used on home — gradient top border)
- Story card (image + eyebrow + headline + dek + byline)
- Event card (date block + content + CTA)
- Person card (photo, name, title, optional link)
- Tier card (amount, label, impact line, gradient-bordered selected
  state)
- FAQ accordion
- Filter chip + chip group (gradient-filled active)
- Form fields (text, email, password, textarea, select, checkbox)
- Skeleton loaders (text, card, avatar)
- Empty state (illustration + headline + CTA)
- Toast / inline alert
- Modal
- Pagination
- CTA banner (gradient-fill, used once per page max)

# Tone

Direct, specific, generous. Lead with the student's outcome, never
the program's adjectives. Cut "powerful," "innovative," "world-class."
Use names, numbers, places. Contractions are fine.

# Constraints

- Mobile-first. Every page must work at 360px before any other width.
- Stack: Vue 3 + Vite, Tailwind for styling, @iconify/vue for icons,
  motion-v for animation. Generate Vue 3 SFCs with
  <script setup lang="ts">.
- Currency: Nigerian Naira (₦). Don't switch to USD.
- Accessibility: WCAG AA contrast on all text, focus rings on all
  interactive elements (use Brand Violet at 60% for the focus
  outline), aria-labels on icon-only buttons, semantic landmarks,
  prefers-reduced-motion respected.
- Performance: hero photos lazy-load below the fold, no
  background-video heroes, fonts limited to Playfair + Inter.

# What not to do

- No full-bleed gradient hero washes (the current Donate / Login /
  Signup mistake). The gradient is precious — one moment per page.
- No purple variants other than the logo gradient stops. Don't
  introduce indigo, lavender, or magenta.
- No stock illustrations of figures with floating gears or
  lightbulbs.
- No uppercase buttons mixed with sentence-case buttons.
- No "Coming soon" placeholder pages — design real empty states.
- No mascots, no flat geometric Africa-shape motifs, no kente
  patterns.
