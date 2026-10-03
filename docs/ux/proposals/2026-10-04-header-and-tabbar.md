# Header brand and minimal tab bar (2026-10-04)

**Author:** UXer · **Status:** Proposal, waiting for a PO decision · **Mockups:** [`2026-10-04-header-and-tabbar-mockups.html`](./2026-10-04-header-and-tabbar-mockups.html)

## Problem (PO feedback after PR #86)
1. **The brand disappeared.** PR #86 replaced the tall header (BF monogram, "Borcelle Fitness · Performance
   tracking", and a 2 rem uppercase **GYM STUDIO** wordmark at weight 800) with a 56 px bar that shows only
   the screen title ("Today"). The PO liked the wordmark and wants it back, without losing the space savings.
2. **The bar doesn't feel minimal.** The current `.bottom-tab-bar` has four parts: icon + label per tab, a
   `--brand-soft` pill behind the active tab, a near-opaque `rgba(24,24,25,0.98)` panel, and a border. Together
   they read as a separate heavy block (see the live demo at 375 px).

## Findings
- **Platform guidance**
  - Apple's HIG says a tab bar should be quiet, translucent and short, with 3–5 tabs. Apple shows labels by
    default.
  - Since iOS 26, the system tab bar floats over the content and can shrink while the user scrolls.
  - Large titles that collapse into a small inline title on scroll are the standard iOS way to give a screen
    a strong title without permanently using the space.
- **Material 3** uses 3–5 destinations. Labels are recommended. The active indicator is a pill, and Material
  allows showing the label only on the active item.
- **NN/g**
  - Only a few icons are understood almost everywhere: home, search and the magnifier.
  - Unlabelled icons hurt first-time comprehension. Labels matter most for unusual icons.
  - All four GymStudio icons (home, search, chart, person) are common ones, and the main user is a repeat
    user. Together this lowers the risk of dropping labels, but does not remove it.
- **Fitness apps**
  - Strong, Hevy, Nike Training Club and Apple Fitness all use the standard labelled iOS tab bar. Their
    branding lives in content and onboarding, not in a permanent header.
  - Ladder and Future (coach apps) lean on large, bold titles and very dark, quiet chrome.
  - The common theme is a quiet bar, with the bold type in the content area.
  - This is based on recent public app versions and store screenshots. Check it against current builds
    before quoting it externally.
- **Our constraint:** the screen is used mid-set. Vertical space for the exercise list and the "+" log
  buttons matters more than a hero header. Any brand treatment must not push the first exercise below the fold.

## Options (see the mockups)
| | Option 1: Wordmark + icon-only bar | Option 2: Large title that collapses | Option 3: Floating dock |
|---|---|---|---|
| Header | 56 px: **GYM STUDIO** (19 px, 800, uppercase, −0.05em), then a hairline divider and a "TODAY" subtitle, then the sync dot | About 110 px hero (tagline + 34 px wordmark + screen name), shrinking to a 48 px inline bar on scroll | Same as Option 1 |
| Bar | 4 thin-line icons, no labels, no pill. Active: light brand tint, stroke 2.1 and a 4 px dot. Translucent with blur and a faint hairline | Icons + 10 px labels. Active: tint + bold label. No pill | 228 × 60 px rounded dock floating above the content, blurred, icons only, dot for active |
| Height vs. today | Header the same, bar about 10 px shorter | +55 px until the user scrolls | Content can use the full height, but the dock covers about 80 px of it |
| Effort | S (CSS + one span) | M (scroll-linked state + reduced motion) | S–M (positioning + padding + blur fallback) |
| Main risk | Discoverability without labels | Pushes the workout list down | Covers "+" buttons and set inputs |

## Recommendation: Option 1
1. **It answers both pieces of feedback at zero space cost.**
   - The wordmark comes back in the same 56 px header PR #86 introduced.
   - The bar loses its pill, its labels and its heavy panel, so it is as minimal as it can be.
2. **It is the safest choice for logging mid-set.**
   - Nothing floats over the "+" buttons (unlike Option 3).
   - No hero pushes Day 1 down (unlike Option 2).
3. **The accessibility risk is small and handled.**
   - The four icons are standard ones, and the user is a repeat user.
   - The active state uses colour, stroke weight and a dot, so it is not colour-only.
   - Each tab has an `aria-label`.
   - If future users get confused, we can add the "label on active tab only" variant (Material pattern)
     without a redesign.

If the PO mainly misses the *big* wordmark, Option 2's collapsing hero can be added later, only on the Today
tab, on top of Option 1.

## Implementation notes for the Tech Lead
- **Tokens (new):**
  - `--nav-active: #c99ca1`: lighter brand tint, about 6.9:1 on `--bg-dark`. The existing `--brand`
    `#8d5e63` is only about 3:1 and too dim for icons.
  - `--nav-idle: rgba(243,243,241,0.55)`.
  - Optional `--wordmark-size: 1.19rem`.
- **Header markup:**
  - Keep `<header class="brand-header">`.
  - Render `<span class="wordmark" aria-hidden="true">Gym Studio</span>` and keep the screen title as the
    real `<h1>`, styled as a 0.62rem uppercase subtitle with 0.16em tracking and `var(--muted)`, after a
    1 px `var(--line)` divider. This keeps one meaningful h1 per screen.
  - Reuse the old wordmark styles from before PR #86: weight 800, uppercase, negative tracking.
- **Bar CSS:**
  - Remove `.bottom-tab-bar button.active { background }`.
  - Set `background: rgba(24,24,25,0.72); backdrop-filter: blur(18px)` with an
    `@supports not (backdrop-filter: blur(1px))` fallback to `rgba(24,24,25,0.96)`.
  - Use a top border of `rgba(255,255,255,0.08)`.
  - Icons: 24 px, stroke 1.6 (2.1 when active).
  - Active dot: `::after`, 4 × 4 px, `var(--nav-active)`.
  - Each button keeps a minimum height of at least 48 px (the mockup uses 50 px). Keep `aria-current="page"`.
  - Hide the `<span>` label visually, but keep it for screen readers with a `.visually-hidden` class or move
    it into `aria-label`. Don't delete the text from the DOM without one of these.
- **Safe areas:**
  - Keep `padding-bottom: max(8px, env(safe-area-inset-bottom))` on the bar and
    `padding-top: env(safe-area-inset-top)` on `.phone-frame`.
  - Requires `viewport-fit=cover` in `index.html` if it's not already there.
- **Scroll behaviour:**
  - Option 1 is static: no scroll listeners.
  - If Option 2 is ever added, use an `IntersectionObserver` on a sentinel at the top of `.app-content` to
    toggle a `.collapsed` class. Don't use scroll events.
  - Animate only `transform` and `opacity`, and switch instantly under `prefers-reduced-motion: reduce`.
- **Tests:** update the navigation tests that look up tabs by visible text so they look them up by
  accessible name (`getByRole('button', { name: 'Today' })`).

## How to measure success
- The PO's verdict on the mockups and then on the build: "brand is back" and "bar feels minimal".
- The first exercise row is still visible without scrolling on a 375 × 667 screen (same as or better than
  PR #86).
- No missed taps on tabs in the next QA pass.

## Sources
- Apple HIG, Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Apple HIG, Navigation bars (large titles): https://developer.apple.com/design/human-interface-guidelines/navigation-bars
- Apple HIG, Accessibility (44 pt targets): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Material 3, Navigation bar guidelines: https://m3.material.io/components/navigation-bar/guidelines
- NN/g, Icon usability: https://www.nngroup.com/articles/icon-usability/
- NN/g, Basic patterns for mobile navigation: https://www.nngroup.com/articles/mobile-navigation-patterns/
- WCAG 2.2, 1.4.11 Non-text contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- Hevy: https://www.hevyapp.com/ · Strong: https://www.strong.app/ · Ladder: https://www.joinladder.com/ ·
  Future: https://www.future.co/ · Nike Training Club: https://www.nike.com/ntc-app · Apple Fitness: https://www.apple.com/apple-fitness-plus/
