# GymStudio rollout and monetization plan (DRAFT)

Status: draft by Socialer, 2026-10-10. Nothing here has been posted, sent or bought. Every fitness claim needs
PT approval and every decision below needs PO approval. Decisions are marked **[PO]**.

## 0. What we can honestly say the app does today

Grounded in `AGENTS.md`, `README.md`, `src/` and the latest UXer proposals (Progress v3, 2026-10-10):

- **PT-designed 6-week training blocks**, plus personal plans built from PT templates (`src/plans/`).
- **AI Trainer engine** (`src/trainer/engine.ts`): deterministic rules (approved by the PT) recalculate today's
  load from your recent sets and explain why. The engine decides; the language model only explains
  (`src/ai/`). Invariants guard against 0 kg, impossible weights and over-large jumps.
- **Progress v3**: strength trends, muscle-volume insights, lift detail, PRs, consistency (`src/progress/`).
- **Bilingual EN/ES** UI toggle.
- **Offline-first**: works without network; Google sign-in syncs history to Supabase.
- **Web app** (GitHub Pages) and **iOS** via Capacitor (not yet on TestFlight/App Store).
- Demo mode: `?demo=1`.

Not built (do not market): Android store app, payments/paywall, social features, coach marketplace, wearables.

**Tech Lead check before Phase 0:** training blocks are owner-only (migration 028). Confirm what a new friend
sees on day one (a personal plan from a PT template?) — this is the single biggest onboarding risk.

## 1. Phased rollout

| Phase | Who / size | Channel | Duration | Entry criteria | Exit criteria |
|---|---|---|---|---|---|
| **0 Friends beta** | 5–15 people you know who train 3+ days/week; mix EN/ES, beginner→intermediate, at least 3 iPhone users | Web link (installable to home screen) + personal WhatsApp message from you | 4 weeks (covers most of a 6-week block's learning curve) | QAer week-flow pass; new-user plan works; feedback form live; privacy note written | ≥70% activation; ≥50% still logging in week 4; no open P1 bugs; ≥5 qualitative interviews done |
| **1 Wider beta** | 50–200 users: friends-of-friends, 1–2 gym partners, waitlist | TestFlight public link (iOS) + web | 6 weeks (one full block) | Phase 0 exit met; TestFlight build approved by Apple beta review; crash reporting on | Week-4 retention ≥30%; crash-free sessions ≥99%; NPS ≥30; pricing test answered (see §5) |
| **2 Public launch** | Open | App Store (EN + ES listing) + web | ongoing | Phase 1 exit met; paywall built; privacy policy + terms; App Store screenshots approved by PT/PO | — |

**Phase 0 how-to**
- Invite: a short personal message (draft below) + link + "reply here with anything weird". Onboard in person or a
  10-minute call for the first 5: sign in with Google, pick plan, log first workout together.
- Feedback loop: weekly 3-question form (§5), a shared WhatsApp group "GymStudio beta" (you moderate), 15-minute
  interview at week 2 and week 4. Triage weekly with Tech Lead → issues.
- Draft invite (EN): "I've been building a gym app that plans your training and adjusts your weights from your
  last sessions. Would you test it for 4 weeks? It's free, takes no extra time in the gym, and I want brutal
  feedback." (ES): "Estoy creando una app de gimnasio que planifica tu entrenamiento y ajusta tus pesos según tus
  últimas sesiones. ¿La pruebas 4 semanas? Es gratis y quiero feedback sincero."

## 2. Positioning and target user

**Target:** Spanish- and English-speaking gym-goers (beginner to intermediate) who want a structured plan
and don't want to guess weights — people who would otherwise copy a program into Notes or pay a trainer.

**Line:** "Train with an AI Personal Trainer that learns from every set." / "Entrena con un entrenador personal
con IA que aprende de cada serie."

**Differentiation**
- Plan + load recommendations + reasons in one app (loggers like Hevy/Strong log; they don't tell you today's weight).
- PT-written blocks with transparent, rule-based progression ("why this weight") instead of a black box.
- Native-quality Spanish from day one (most competitors are English-first with machine-feeling translations).
- Price room: sits between cheap loggers (~$24–30/yr) and premium AI coaches (~$300–350/yr).

**Honest weaknesses**
- No Android app; no Apple Watch; small exercise media library (illustrations parked).
- Program variety is limited (a few PT blocks) vs. Boostcamp's large library.
- Unknown brand, no reviews, single developer team — trust must come from the product and the PT.
- Recommendations are only as good as logged data; new users get conservative starts.

## 3. Competitor pricing benchmarks (US, as reported; verify in-store before using publicly)

| App | Model | Price | Source (accessed 2026-10-10) |
|---|---|---|---|
| Hevy | Freemium logger | Pro ~$2.99/mo, $23.99/yr, $74.99 lifetime (one source says $8.99/mo) | [SensAI 2026](https://www.sensai.fit/pt/blog/hevy-review-2026), [Subger](https://subger.com/en/deal/hevy-pro) |
| Strong | Freemium logger (3 free templates) | $4.99/mo, $29.99/yr, $99.99 lifetime | [SensAI](https://www.sensai.fit/es/blog/strong-app-review-2026), [App Pricing Lab](https://apppricinglab.com/iap/apple/464254577) |
| Fitbod | Trial (3 workouts / 7 days), then paid | $15.99/mo, $95.99/yr | [App Store](https://apps.apple.com/app/id1041517543), [SensAI](https://www.sensai.fit/blog/fitbod-review-2026) |
| Alpha Progression | Freemium; progression recs are Pro | ~$12.99/mo, $79.99/yr, 14-day trial (annual) | [fitnessdrum 2026](https://fitnessdrum.com/alpha-progression-app-review/) |
| Boostcamp | Freemium program library | Pro $11.99/mo or $59.99/yr, 7-day trial | [Boostcamp](https://www.boostcamp.app/best/budget), [App Pricing Lab](https://apppricinglab.com/iap/apple/1529354455) |
| RP Hypertrophy | Paid only (monthly/6-mo/annual) | ~$299.99/yr (one source) | [SensAI comparison](https://www.sensai.fit/blog/juggernaut-ai-vs-rp-hypertrophy-vs-alpha-progression-2026) |
| JuggernautAI | Paid only, trial | $34.99/mo, ~$349.99/yr | [App Pricing Lab](https://apppricinglab.com/iap/apple/1515756471), [GarageGymReviews](https://garagegymreviews.com/juggernautai-review) |

Pattern: logging is free everywhere; people pay for **the plan and the progression brain**.

## 4. Monetization

**Options**
1. *Freemium + one Pro subscription* — free logging/history/basic progress; Pro = AI Trainer recommendations,
   full PT blocks, Progress v3 insights, AI explanations. Pros: matches market, low friction, free users spread
   the app. Cons: free tier must stay useful but not cannibalise Pro.
2. *Hard paywall after trial* (Fitbod/Juggernaut style). Pros: higher ARPU per install. Cons: weak for an unknown
   brand with no reviews; hurts word of mouth among friends.
3. *Lifetime purchase* only. Pros: easy sell. Cons: no recurring revenue while LLM costs are recurring.
4. *Add-ons later*: PT-plan marketplace (paid blocks from certified trainers, revenue share) or human coaching
   check-in. Pros: higher-value tier. Cons: needs content ops, trainer vetting, legal; not built.

**Recommendation (draft):** Option 1. Free tier = unlimited logging, exercise library, history, one starter
block, basic progress. **GymStudio Pro = AI Trainer loads + reasons, all PT blocks/personal plan, Progress v3
insights.** Price test: **$7.99/mo or $49.99/yr** (positioned between loggers and AI coaches), 7-day free trial on
annual, annual shown as default. Consider regional pricing for Latin America (App Store price tiers by country).
Friends-beta users get Pro free for life or 12 months as thanks **[PO]**. Marketplace/coaching = Phase 3 idea only.

**App Store fees:** Apple's Small Business Program charges 15% instead of 30% for developers under $1M/yr
proceeds (enrol before launch). Implications: net ≈ $42.49 per $49.99 annual; web payments (Stripe ~3%+fee) are
cheaper but in-app purchase is required for unlocking features inside the iOS app (US rules on external links
have changed recently — Tech Lead to confirm current policy before design). Also budget LLM cost per Pro user.

## 5. Unit economics sketch (ALL numbers are assumptions, not data)

| Assumption | Low | Mid | High |
|---|---|---|---|
| Installs/month after launch | 300 | 1,000 | 3,000 |
| Free→paid conversion (by month 2) | 2% | 4% | 7% |
| Annual share of payers | 50% | 60% | 70% |
| Blended net revenue per payer/month (after 15%) | $3.50 | $4.00 | $4.50 |
| Monthly churn of monthly payers | 15% | 10% | 7% |
| LLM + infra cost per active Pro/month | $0.50 | $0.30 | $0.15 |

Mid case: 1,000 installs × 4% = 40 new payers/month → after 12 months roughly 300–400 active payers →
~$1.2–1.6k/month net. Takeaway: profitability depends on retention and distribution, not price. Replace these
with beta data after Phase 1. Supabase/Apple Developer ($99/yr) fixed costs are small at this size.

## 6. Beta metrics and feedback instruments

- **Activation:** % of invited who log a first workout within 7 days (target ≥70% Phase 0).
- **Retention:** week-1 and week-4 (≥1 logged workout that week). **Sessions/week** per active user (target ≥2.5).
- **Trainer trust:** % of recommended loads accepted vs. edited (needs Tech Lead to count read-only; no new
  tracking without PO approval and a privacy note).
- **Crash-free sessions** (needs crash reporting in iOS build — Tech Lead).
- **NPS** at week 4: "How likely are you to recommend GymStudio to a gym friend?" 0–10.
- **Willingness to pay** (Phase 1): "Would you pay $49.99/yr? $29.99? Nothing?" + Van Westendorp-lite question.

**Feedback form (Google Form or Tally, EN/ES, ≤2 min, weekly):** 1) Did you train with GymStudio this week? How
many times? 2) Was today's recommended weight right / too light / too heavy? 3) What annoyed you most?
4) (week 4) NPS + one thing you'd pay for. No health data collected.

## 7. First 8 weeks of marketing (drafts only)

| Week | Activity |
|---|---|
| 1 | Phase 0 invites; capture real screens with QAer; set up handles (PO creates accounts) |
| 2 | 3 Reels/TikToks (9:16, 7–12 s, captioned EN+ES): "Your last set decides today's weight", "Why this weight?", "Week view" |
| 3 | Founder story post ("I built the app I needed"); collect beta quotes **with written permission only** |
| 4 | Phase 0 review; fix list; waitlist page (web) |
| 5 | Gym partnership pitch drafts for 1–2 local gyms/trainers (free Pro for members in beta) |
| 6 | Launch TestFlight public link; referral: "invite a gym partner, both get 1 month Pro" (needs build) |
| 7 | Weekly "progress explained" carousel series (PT-approved examples using demo data) |
| 8 | Phase 1 mid-review; App Store screenshot + listing drafts EN/ES |

Music: royalty-free/licensed only (e.g. platform libraries) — licence noted per asset. No paid ads before Phase 2.

## 8. Legal and fitness-claims guardrails

- No medical, injury-prevention, body-transformation or "guaranteed gains" claims. No before/after photos.
- Every example of a load recommendation or progress result must be PT-approved and come from demo or consented data.
- No fake reviews, user counts or ratings; testimonials only with written consent and real names/handles agreed.
- Privacy policy and terms before Phase 1 (App Store requires a privacy policy and nutrition labels); data
  deletion path for users; health-adjacent data handled carefully (GDPR for EU friends).
- Subscription copy must state price, period, auto-renewal and how to cancel (App Store rules).

## Decisions for the PO

1. Phase 0 list: who are your 5–15 people, and do you onboard them in person? **[PO]**
2. Free vs Pro split as proposed (AI Trainer + full blocks + insights in Pro)? **[PO]**
3. Test price $7.99/mo / $49.99/yr with 7-day trial, and Latin America regional pricing? **[PO]**
4. Thank-you for friends beta: lifetime Pro or 12 months? **[PO]**
5. Social handles: create (you, with your login) now or after Phase 0? **[PO]**
6. Approve Tech Lead work before Phase 0/1: new-user plan check, crash reporting, privacy policy, paywall later. **[PO]**
