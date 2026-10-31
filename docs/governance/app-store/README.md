# App Store launch documents (DRAFT)

Prepared by Governancer, 2026-10-31. Tracking issue: #384. **All drafts. Nothing has been submitted, published, signed or accepted.** The PO reviews and submits with his own login. I am not a lawyer; a lawyer must review the legal documents before publishing.

Repo reminder: this repository is **public**, so what is committed here is public (G23).

## Index

| File | Purpose | Reader | State |
|---|---|---|---|
| [data-inventory.md](data-inventory.md) | What the app collects, from the code | TL, lawyer | Complete, with VERIFY items |
| [privacy-policy.en.md](privacy-policy.en.md), [.es](privacy-policy.es.md) | Public policy | Users | Needs PO facts, gaps, lawyer |
| [terms.en.md](terms.en.md), [.es](terms.es.md) | Public terms; EULA decision at the top of the EN file | Users | Needs PO facts, PT, lawyer |
| [support-page.en.md](support-page.en.md), [.es](support-page.es.md) | Support URL page | Users | Needs PO facts, G1, G3 |
| [ai-disclosure.md](ai-disclosure.md) | Exact consent and label copy | TL, UXer, PT | Copy ready; not true until G2 |
| [app-store-connect-answers.md](app-store-connect-answers.md) | Label, age, export, rights, DSA, 4.8, manifest | PO, TL | Ready to enter after gaps |
| [review-notes.md](review-notes.md) | Notes for App Review, demo-account procedure | PO, QAer | After gaps |
| [gaps-for-tech-lead.md](gaps-for-tech-lead.md) | App changes required, by severity | TL | Current |
| [questions-for-po.md](questions-for-po.md) | Facts and decisions, in Spanish | PO | Waiting for answers |

## Launch checklist

Source: `https://developer.apple.com/app-store/review/guidelines/`, read 2026-10-31; the page text I received showed no "last updated" date. Other sources are listed below. Status is one of **ready**, **needs app change**, **needs PO**, **needs lawyer**.

| Guideline | Requirement | Status | Notes |
|---|---|---|---|
| 1.2 | UGC, AI content-creation moderation | ready | Not applicable in my reading: AI text is private |
| 1.3, 2.3.6 | Honest age rating | needs PO | Minimum age; answers drafted. Today's in-app Google Images would give 16+ (G12) |
| 1.4.1 | Remind users to check with a doctor; no unsupported accuracy claims | needs app change | G20; PT reviews wording |
| 1.5 | Easy contact in app and Support URL | needs PO | Email, G5 |
| 1.6 | Data security | needs app change | RLS, server-side keys good; leaked-password protection, G19 |
| 2.1(a) | Complete app, working URLs, demo account, backend on | needs app change | G5, G6, G7, G10, G18; procedure in review notes |
| 2.1(b), 3.1.1, 3.1.2 | In-app purchase if paid | needs PO | Recommendation: free at launch. No external payment exists |
| 2.3, 2.3.1(a) | Accurate metadata, specific notes | needs app change | Listing check below; G9 |
| 2.3.7 | Unique name, 30 characters, keywords | needs PO | 30 and 97/99 characters OK; availability; spelling |
| 2.3.8 | Metadata suitable for 4+ | ready | Mockups must show final UI |
| 2.5.1 | Public APIs, shipping OS | needs app change | Xcode 26 and iOS 26 SDK; G15 |
| 2.5.4, 2.5.16 | Background, widget related to app | ready | Live Activity only rest timer; verify on device |
| 4.2 | More than a repackaged website | needs app change | Same web app on Pages. Live Activity and offline help. Moderate risk, depends on device QA |
| 4.8 | Login Services | needs app change | G4, PO choice |
| 5.1.1(i) | Policy in metadata and in app | needs lawyer | Draft ready; G5 link missing |
| 5.1.1(ii) | Consent, easy withdrawal | needs app change | G2, G3. No withdrawal today |
| 5.1.1(iii), (iv) | Minimisation, no forcing | needs app change | G11 |
| 5.1.1(v) | Account deletion in the app | needs app change | **Not built.** G1 |
| 5.1.2(i) | Explicit permission for third-party AI | needs app change | **Fails today.** G2 |
| 5.1.2(ii), (iii) | No repurposing, profiling | ready | True today; keep it true (G22) |
| 5.1.3 | Health data | needs app change | No HealthKit, no ads; consent G2; check 5.1.3(ii) G13 |
| 5.2 | Rights in content | needs PO | Blocks 1 to 5 (`coach`); G7 |
| Privacy details | App Privacy label | ready | Enter after gaps |
| Upcoming requirements | Xcode 26, iOS 13+ | needs app change | G15 |
| Export | Encryption declaration | needs app change | Add key, G14 |
| DSA | Trader status | needs PO | Probably trader; public contact details |
| Technical | Bundle ID, team, capabilities | needs PO | G8, Team ID |
| Legal | Policy, terms | needs lawyer | Below |

## Blockers, in order

1. **AI consent is bypassed.** `trainer_explain` and `block_plan` send data to OpenAI with no consent, even after "Not now". (G2) New.
2. Account deletion missing. (G1)
3. No way to withdraw consent. (G3) New.
4. Login option. (G4)
5. Privacy, terms and support URLs and links missing. (G5)
6. Email provider: new users likely can't confirm. (G6) New.
7. New-user plan unproven; 0 `user_plans` rows in production; private program in the bundle. (G7)
8. Bundle ID and team. (G8)
9. Untrue statements about "the PT" and privacy. (G9) New.
10. Forgot password can't set a new password. (G10) New.

## Laws considered: for lawyer review

Not legal advice. "Read" means the official or stated source was read on 2026-10-31. Others are from background knowledge and need checking. **The PO's country and markets are unknown** (question 2 and 3).

| Regime | Why it may apply | Key points for the lawyer | Source state |
|---|---|---|---|
| **EU/UK GDPR** | Users there | Art. 9 health data, explicit consent; Art. 27 representative (the exemption excludes large-scale special-category data; occasional only); Art. 8 age; Ch. V transfers; Art. 7(1) proof of consent | Art. 9, 27 read at gdpr-info.eu (not official); EUR-Lex wouldn't load |
| **Australia, Privacy Act and APPs** | Owner's possible location | Small business under A$3M exempt, **except health service providers**, defined around services relating to physical health: does a fitness app count? APP 1, 3 (sensitive), 5, 8, 11-13. Australian Consumer Law: misleading claims, guarantees | `oaic.gov.au` small-business and quick-reference pages read |
| **Colombia, Ley 1581 de 2012** | Spanish-speaking market; marketing plan | Sensitive data: prohibited unless explicit authorisation (art. 6); person must be told they needn't give it; policy of treatment; art. 26 transfers; registry (RNBD) threshold; minors | Art. 6 and SIC concepts via SIC search results. **Art. 5 and 26 not read** (tool couldn't load the text) |
| **US: Washington MHMDA and similar** | US users | Small businesses covered; consumer health data; separate policy link on homepage; separate consent; deletion from backups; private right of action. Nevada similar, unread | `atg.wa.gov` read |
| **US: CCPA** | California users | Thresholds ($25M; 100k consumers; 50% from selling) likely not met. Other states similar, unread | `oag.ca.gov` read |
| **Mexico (LFPDPPP)** | Named in marketing plan | Unread | Not checked |
| **EU AI Act** | AI text to EU users | Transparency duties | Not checked |
| **EU DSA** | App Store distribution | Trader status | Apple's page read |
| **FTC Act, state consumer laws** | US | Claims | Not checked |

**Specific lawyer items:** whether weight, steps, calories and goal notes are health or sensitive data; legal bases; transfers; Art. 27 representative; consumer-health policy; minimum age; liability limits and governing law; AI-assisted content copyright; trader status; whether Terms' minimum age must be treated as a EULA requirement; "personal trainer" and "AI Personal Trainer" claims; national rules on fitness professionals.

## For the PT

Send through the normal review. No medical claims.

1. Health notice (`ai-disclosure.md` section E) and Terms section 4, EN and ES, including the named risk groups, and the "stop if" list.
2. AI text labels and footnote (`ai-disclosure.md` section D).
3. "Rules written by a personal trainer" and any "PT" or "Designed by the PT" text: **who actually wrote it** (G9, PO question 9). If an AI agent did, rewording needed: for example, "rules from training guidelines, reviewed by the owner" (wording for PO, PT and lawyer).
4. "AI Personal Trainer" and "learns from every set": §12 of the marketing plan says "rules decide, AI explains". Is "adapts to your sets" more accurate? What does per-user calibration really do?
5. "Know what to lift today", "Stop guessing your weights", "tells you why".
6. Fat-loss goal, calories, and `BLOCK_PROMPT`'s "fat loss mainly comes from a calorie deficit and steps": suitable wording, and risk for vulnerable users or minors.
7. Support page answers: "Is this medical advice?", "How is today's weight chosen?".
8. Beginner note "more days won't speed up results, recovery will" (`profile.plan.beginnerNote`).
9. The existing §14 list in the marketing plan stands.

## Listing check: `docs/marketing/2026-10-18-marketing-plan.md` §8

Character limits are met (name 30/24, subtitle 29/30, keywords 97/99, promo 145/148). Against the declarations:

| Listing text | Finding | Fix |
|---|---|---|
| "rules written by a personal trainer" (promo, description, EN and ES) | **Conflict.** The PT is an AI agent; no human qualification on record (`.claude/agents/pt-fitness-expert.md`). 2.3 and consumer law | PO answer 9; reword or get real review |
| "GymStudio: AI Personal Trainer", "AI Personal Trainer that learns from every set" | **Risky.** Loads come from deterministic rules; AI explains (`ai-gateway/index.ts` `TRAINER_PROMPT`; §12 of the same plan). A user who declines AI still sees rule text, so "AI" is optional | PT + TL: e.g. "Smart Gym Plan & Log". "Learns" only if calibration supports it |
| "Works offline; sign in with Google to sync" | **Incomplete.** Offline covers logging only. Sign-in, plans, AI need network. Also email and possibly Apple | "Log offline; sign in to sync" |
| "Answer a few questions and get a 6-week plan" | **Needs account**, and start date is next Monday; 8 templates exist, 3 to 6 days ✓, but no production plan has ever been published (G7) | Add "with a free account"; verify first |
| "Technique cues and posture tips for every exercise" | Library: 227 of 227 active have tips and cues ✓. Own exercises don't | "every exercise in the library" |
| "Big, one-hand set logger", "Hints between sets" | Depends on #381/#382, still WIP | Verify at submission |
| Example "I moved the load up" | First person suggests a person; AI-written sentence unlabelled (G20) | PT, TL |
| Medical line ✓ | Keep | Add "AI answers can be wrong" |
| No AI data-sharing statement | Not required in listing, but describing it helps | Optional one line: "AI is optional and uses OpenAI" |
| §0 still lists "Reps left in the tank?" | Removal approved in #380 | Socialer update |
| §7 Pro prices | Not built; don't include until in-app purchase exists ✓ (the plan says so) | |
| §13 "Contact email", "Check name availability" | Same as PO questions | |
| Label note at §8 end | Mentions Google, history, AI; misses weight, calories, feedback, etc. | Replace with `app-store-connect-answers.md` section 1 |

## Sources read (2026-10-31)

Apple: review guidelines; `app-store/app-privacy-details`; `support/offering-account-deletion-in-your-app`; required-reason API and privacy-manifest documentation; age ratings values and set-up help; DSA trader help; encryption export documentation; Standard EULA `apple.com/legal/internet-services/itunes/dev/stdeula/`; `news/upcoming-requirements`.
Providers: OpenAI `developers.openai.com/api/docs/guides/your-data` (`openai.com/enterprise-privacy` and terms refused the fetch: OpenAI's minimum age is unverified); Supabase DPA, Auth SMTP, backups, Apple sign-in docs; GitHub Pages limits.
Law: OAIC, Washington AG, California AG, gdpr-info.eu, SIC search results.
Code and production metadata: see `data-inventory.md`. Source-level findings are not device tests; QAer verifies.
