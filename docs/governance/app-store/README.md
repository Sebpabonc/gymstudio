# App Store launch documents (DRAFT)

Prepared by Governancer, 2026-10-31; updated with the PO's answers of 2026-11-01. Tracking issue: #384. **All drafts. Nothing has been submitted, published, signed or accepted.** The PO reviews and submits with his own login. I am not a lawyer. **No lawyer will review these (PO decision 2026-11-01); the PO approves the legal documents himself.** `HIGH RISK` comments mark what a lawyer would normally check.

Repo reminder: this repository is **public**. The PO approved his name and email for public pages. No address or phone, ever (G23).

## PO decisions recorded (2026-11-01)

Owner: Sebastian Pabon, an individual, based in Australia. Contact: js.pabonc979@gmail.com. No human trainer behind the content: "AI trainer" wording. Permission to use blocks 1 to 5 confirmed. 18+. Free at launch. OpenAI stays. Sign in with Apple added. iPhone only. Name "GymStudio". EU out. Retention: inactive accounts 24 months, deleted logs 30 days, feedback 24 months, AI usage 12 months. No lawyer. Domain and mail provider later; personal email for now.

**Launch countries:** Australia; Singapore, Japan, South Korea, India, Hong Kong; all of Latin America; USA. Out: EU, mainland China. UK, Canada and New Zealand were not named, so they are out. **Open:** Hong Kong and Venezuela (OpenAI, G26), Brazil (Portuguese, question 3).

## Index

| File | Purpose | Reader | State |
|---|---|---|---|
| [data-inventory.md](data-inventory.md) | What the app collects, from the code | TL, PO | Complete, with VERIFY items |
| [privacy-policy.en.md](privacy-policy.en.md), [.es](privacy-policy.es.md) | Public policy | Users | PO facts in. Waits for gaps, provider checks, PO approval |
| [consumer-health-data-policy.en.md](consumer-health-data-policy.en.md), [.es](consumer-health-data-policy.es.md) | **New.** US state health-data policy | US users | Waits for gaps, PO approval |
| [terms.en.md](terms.en.md), [.es](terms.es.md) | Public terms; EULA decision at the top of the EN file | Users | PO facts in. Waits for PT, gaps, PO approval |
| [support-page.en.md](support-page.en.md), [.es](support-page.es.md) | Support URL page | Users | PO facts in. Waits for G1, G3, G5, G6 |
| [ai-disclosure.md](ai-disclosure.md) | Exact consent and label copy | TL, UXer, PT | Copy ready; not true until G2 |
| [app-store-connect-answers.md](app-store-connect-answers.md) | Label, age, export, rights, availability, 4.8, manifest | PO, TL | Ready to enter after gaps |
| [review-notes.md](review-notes.md) | Notes for App Review, demo-account procedure | PO, QAer | After gaps |
| [gaps-for-tech-lead.md](gaps-for-tech-lead.md) | App changes required, by severity; G9 has the exact replacement strings | TL, Socialer | Current |
| [questions-for-po.md](questions-for-po.md) | What is still open, in Spanish | PO | 10 items open |

## Launch checklist

Source: `https://developer.apple.com/app-store/review/guidelines/`, read 2026-10-31; the page text I received showed no "last updated" date. Other sources are listed below. Status is one of **ready**, **needs app change**, **needs PO**, **needs PO approval**.

| Guideline | Requirement | Status | Notes |
|---|---|---|---|
| 1.2 | UGC, AI content-creation moderation | ready | Not applicable in my reading: AI text is private |
| 1.3, 2.3.6 | Honest age rating | ready | 18+ by override. Answer the form truthfully (G12) |
| 1.4.1 | Remind users to check with a doctor; no unsupported accuracy claims | needs app change | G20; PT reviews wording |
| 1.5 | Easy contact in app and Support URL | needs app change | Email decided; page and links, G5 |
| 1.6 | Data security | needs app change | RLS, server-side keys good; leaked-password protection, G19 |
| 2.1(a) | Complete app, working URLs, demo account, backend on | needs app change | G5, G6, G7, G10, G18; procedure in review notes |
| 2.1(b), 3.1.1, 3.1.2 | In-app purchase if paid | ready | Free at launch. No external payment exists |
| 2.3, 2.3.1(a) | Accurate metadata, specific notes | needs app change | Listing check below; G9 |
| 2.3.7 | Unique name, 30 characters, keywords | needs PO | New name 21 characters. Availability, question 8 |
| 2.3.8 | Metadata suitable for 4+ | ready | Mockups must show final UI |
| 2.5.1 | Public APIs, shipping OS | needs app change | Xcode 26 and iOS 26 SDK; G15 |
| 2.5.4, 2.5.16 | Background, widget related to app | ready | Live Activity only rest timer; verify on device |
| 4.2 | More than a repackaged website | needs app change | Same web app on Pages. Live Activity and offline help. Moderate risk, depends on device QA |
| 4.8 | Login Services | needs app change | Sign in with Apple decided; G4 builds it |
| 5.1.1(i) | Policy in metadata and in app | needs PO approval | Draft ready; G5 link missing |
| 5.1.1(ii) | Consent, easy withdrawal | needs app change | G2, G3. No withdrawal today |
| 5.1.1(iii), (iv) | Minimisation, no forcing | needs app change | G11 |
| 5.1.1(v) | Account deletion in the app | needs app change | **Not built.** G1 |
| 5.1.2(i) | Explicit permission for third-party AI | needs app change | **Fails today.** G2 |
| 5.1.2(ii), (iii) | No repurposing, profiling | ready | True today; keep it true (G22) |
| 5.1.3 | Health data | needs app change | No HealthKit, no ads; consent G2; check 5.1.3(ii) G13 |
| 5.2 | Rights in content | needs PO | Permission confirmed; public distribution, question 5; G7 |
| Privacy details | App Privacy label | ready | Enter after gaps |
| Upcoming requirements | Xcode 26, iOS 13+ | needs app change | G15 |
| Export | Encryption declaration | needs app change | Add key, G14 |
| DSA | Trader status | ready | EU left out, so not needed at launch. ⚠️ VERIFY the form |
| Availability | Countries | needs PO | Questions 2, 3; G26; `app-store-connect-answers.md` section 10 |
| Technical | Bundle ID, team, capabilities | needs PO | G8, Team ID |
| Legal | Policy, terms, US health policy | needs PO approval | Below |

## Blockers, in order

1. **AI consent is bypassed.** `trainer_explain` and `block_plan` send data to OpenAI with no consent, even after "Not now". (G2) In the US this could also be read as an unauthorised disclosure of health data.
2. Account deletion missing. (G1)
3. No way to withdraw consent. (G3)
4. Sign in with Apple not built. (G4)
5. Privacy, terms, support and US health policy URLs and links missing. (G5)
6. Email provider: new users likely can't confirm. **"Later" can't mean after launch.** (G6, question 4)
7. New-user path unproven; 0 `user_plans` rows in production; private program in the bundle. (G7)
8. Bundle ID and team. (G8)
9. Untrue statements about "the PT" and privacy. (G9, strings ready)
10. Forgot password can't set a new password. (G10)
11. **Countries where OpenAI is not offered:** Hong Kong, Venezuela (G26).

## Laws considered, and what a small free app by an individual still has to meet

Not legal advice. "Read" means I read the official source on 2026-10-31. "Search" means an official-domain page reached through a search excerpt. "Secondary" means law firms or press. "Memory" means unverified background knowledge. Some of these laws may apply less to an owner abroad than the table assumes; the safe working assumption is that they apply, because the app is offered to people in those countries.

**Plain summary.** Being small and free removes only three things: California's CCPA, most other US state privacy laws, and appointed-representative duties in Korea. It does **not** remove the rest. The same common core meets most of them: truthful policy, separate explicit consent for health data and AI, named recipients and countries, easy deletion and withdrawal, a person who answers, breach notices, 18+. That core is what G1, G2, G3 and G5 build.

| Regime | Small free individual app still bound? | What it means here | Source state |
|---|---|---|---|
| **Australia: Privacy Act, APPs** | **Assume yes. Don't rely on the exemption.** Under A$3M turnover is normally exempt, but health service providers are covered at any size. OAIC: a gym or weight-loss clinic "is a health service provider in situations where they collect your health information"; a health service includes "maintaining or improving" physical health. Apps aren't addressed; a fitness app that stores weight and goals is close | APP 1 policy, APP 3 sensitive-information consent, APP 5 notice, APP 8 overseas disclosure, APP 11 security, APP 12-13 access and correction. Notifiable data breaches apply too. The owner lives here, so this is the most reachable regulator | Read: OAIC small-business and health-provider pages. Search: Guide to Health Privacy, NDB. APP text not re-read today (page moved) |
| **Australian Consumer Law** | **Yes.** Applies in trade or commerce; free does not clearly remove it | Misleading claims ("personal trainer", results), guarantees that can't be excluded, unfair standard terms | **Memory.** ACCC pages refused the fetch. ⚠️ VERIFY |
| **Singapore: PDPA** | **Assume yes** | Consent, purpose, access and correction, transfer limitation, breach notice to PDPC within 3 calendar days when 500+ people or significant harm | Search: PDPC, notification regulations. Reach over foreign individuals not confirmed |
| **Japan: APPI** | **Yes** on its face: art. 171 covers supplying a good or service to a person in Japan from abroad | Art. 28: consent to transfer abroad, with information on the foreign system. Art. 2(3) lists medical history as special-care data; whether weight or goals count is unclear | Read: official translation (consolidated 2023; check for newer) |
| **South Korea: PIPA** | **Yes**, but no local representative: thresholds are sales over KRW 1 trillion or 1 million people, or a PIPC order | Art. 23 health is sensitive: separate consent. Art. 28-8: separate consent or notice for transfer abroad, naming items, country, recipient, purpose and period. Short response times (10 days, memory). Korean-language notices: ⚠️ VERIFY | Search: KLRI translation. Thresholds: secondary |
| **India: DPDP Act 2023, Rules 2025** | **Yes** from about May 2027; nothing size-based found | S.3(b) reaches offering goods or services from abroad. S.9 under-18s need verifiable parental consent, so 18+ helps. Rules notified Nov 2025, staged, main duties at 18 months | Search: MeitY Act, PIB. Dates: secondary. Notice-language rule: memory |
| **Hong Kong: PDPO** | Probably reach is limited for an owner outside Hong Kong | Six data protection principles. S.33 transfers apparently not in force | PCPD pages failed to load; newest source 2022. ⚠️ VERIFY. **OpenAI not offered: G26** |
| **China: PIPL** | **Yes**, regardless of size: art. 3 offering services to people in China; art. 53 local representative or agency | **Left out.** Apple's own pages say MIIT "requires that some apps possess a valid Internet Content Provider (ICP) Filing Number" and show the status "ICP Filing Number Missing" with "Your app isn't available in China mainland". "Some apps" is not defined. Also: OpenAI not offered | Read: Apple App Information and statuses pages. PIPL: secondary |
| **USA: Washington MHMDA** | **Yes.** "Small business" (under 100,000 consumers) only got a later start date, now passed. "Regulated entity" reads as a legal entity; a sole individual is unclear, so assume yes | Separate health policy with own link on download page and in app (done as draft). Consent for collection beyond what's necessary, **separate** consent for sharing, not through general terms. 45-day answers, appeal. Backups within 6 months. **Lawsuits by consumers possible** | Read: RCW 19.373, WA AG |
| **USA: Nevada SB 370** | **Yes**; no size exemption. AG only, no private lawsuits | Same policy and consent work | Secondary only; statute refused the fetch. ⚠️ VERIFY |
| **USA: CCPA/CPRA** | **No**, unless over US$25M revenue, or buying, selling or sharing data of 100,000+ Californians, or half of revenue from selling. Keep not selling | Nothing extra now | Read: `oag.ca.gov`. Page gives US$25M without an inflation adjustment; ⚠️ VERIFY current figure |
| **USA: other state privacy laws** | Most have thresholds that a small app wouldn't reach | Check again as users grow. Connecticut has health-data rules; state app-store age laws (Texas, Utah) | Memory. ⚠️ VERIFY |
| **USA: FTC Health Breach Notification Rule** | **Possibly.** Covers vendors of personal health records with "technical capacity to draw information from multiple sources". Manual entry alone may fall outside; adding Apple Health or a device would bring it in. No size exemption | Treat as applying: notify people within 60 days, the FTC too. **An unauthorised disclosure counts as a breach**, so G2 matters before any US launch | Read: FTC guide |
| **USA: FTC Act** | **Yes** | Don't deceive. Privacy promises and health claims must be true | Memory |
| **USA: COPPA** | **Only if a child's data is knowingly collected.** App isn't directed at children; 18+ | Under 13s, on actual knowledge: delete. Policy says so | Read: FTC FAQ |
| **Colombia: Ley 1581** | **Assume yes.** No size exemption known | Sensitive data needs explicit authorisation and telling the person it's optional (art. 6). Policy of treatment. Transfers, art. 26. Answers: 10 and 15 business days (memory), which is why the policy offers 10. Registry (RNBD) probably only for large companies | Art. 6: SIC via search. **Text would not load** (Senado, Función Pública). ⚠️ VERIFY arts. 2, 26 |
| **Mexico: LFPDPPP 2025** | **Assume yes** if treated as in reach; size relief unknown | New law since 21 March 2025; INAI's role passed to Secretaría Anticorrupción y Buen Gobierno. Privacy notice; express written consent for sensitive data (memory) | Secondary (EY, Garrigues). Official text refused. ⚠️ VERIFY |
| **Brazil: LGPD** | **Yes.** Art. 3 reaches offering services to people in Brazil. Small-agent relief (Res. 2/2022) excludes high-risk processing, which the draft tied to sensitive data | Art. 11: consent "specific and highlighted" for health. International transfer rules. Contact channel, or an officer if relief doesn't apply. ⚠️ VERIFY final resolution text | Search: Imprensa Nacional, ANPD. Planalto blocked |
| **Brazil: consumer code (CDC)** | **Yes**; free doesn't clearly remove it | **Art. 31: information in Portuguese.** Art. 51(I): clauses reducing liability are void. Art. 54 §3: clear terms. Art. 101(I): consumer may sue at home. **So NSW law and the AUD 100 cap mean little in Brazil. Portuguese is not offered: question 3** | Article text quoted by the fetch tool while Planalto showed an access-denied page, so it came from memory. ⚠️ VERIFY |
| **Argentina: Ley 25.326** | **Assume yes** | Health is sensitive. Inform before collection. Transfers to countries without adequate protection restricted (art. 12); recipients and US status: ⚠️ VERIFY. Registry for databases "intended for providing reports", probably not this. Reform bill status unknown | Search: Infoleg, AAIP |
| **Chile: Ley 19.628 now; Ley 21.719 next** | **Assume yes** | New law starts **1 Dec 2026**; the government proposed moving it to 1 Dec 2027, approval unconfirmed. **An excerpt says health data collected in "sports" settings has restrictions**: ⚠️ read before launch, may affect a fitness app | Search: BCN excerpts; Economy Ministry page read. Full text wouldn't load |
| **Other Latin America** (Peru, Uruguay, Ecuador, Paraguay, Costa Rica, Panama, Dominican Republic, others) | Unknown; many have general data laws | Common core plus generic policy wording. Not checked individually | **Not verified** |
| **Venezuela, Cuba** | | **OpenAI not offered: G26.** Cuba storefront: ⚠️ VERIFY in App Store Connect | Read: OpenAI list |
| **EU GDPR, DSA, AI Act** | App left out of EU storefronts. **The web app on GitHub Pages stays reachable there**; GDPR depends on targeting. Don't target: no EU prices, language or ads (G26) | Not offered statement in policy | Earlier reads. UK likewise out |

**Spanish versions.** I found no rule requiring it but could not read consumer laws of Colombia, Mexico, Argentina or Chile (language rules unverified). Recommended anyway, and drafted: Spanish prevails for people using the app in Spanish or living in Spanish-speaking countries, English elsewhere. Reason: the contract is then the text the person can read, and unclear standard terms are generally read against the drafter (memory). Cost: Spanish wording binds, so it needs the same care. PO to approve (question 6).

**Clauses a lawyer would normally check, now on the PO:** whether weight, steps, calories and goal notes are health data (we assume yes); consent wording; transfers; liability cap and governing law; "AI trainer" claims; AI-assisted content copyright; national rules on fitness professionals; Terms' age as an App Store override.

## For the PT

Send through the normal review. No medical claims.

1. Health notice (`ai-disclosure.md` section E) and Terms section 4, EN and ES, including the named risk groups, and the "stop if" list.
2. AI text labels and footnote (`ai-disclosure.md` section D).
3. New wording in G9: prompts and "AI trainer" voice. Terms section 1 and support answer "Is a person coaching me?": check they describe the PT agent's role honestly.
4. "AI trainer that learns from every set": §12 of the marketing plan says "rules decide, AI explains". `src/trainer/calibration.ts` does adjust per user with rules. Is "learns" fair, or "adapts to your sets"?
5. "Know what to lift today", "Stop guessing your weights", "tells you why".
6. Fat-loss goal, calories, and `BLOCK_PROMPT`'s "fat loss mainly comes from a calorie deficit and steps": suitable wording.
7. Support page answers: "Is this medical advice?", "How is today's weight chosen?".
8. Beginner note "more days won't speed up results, recovery will" (`profile.plan.beginnerNote`).
9. The existing §14 list in the marketing plan stands.

## Listing check: `docs/marketing/2026-10-18-marketing-plan.md` §8

Character limits are met with the new text (name 21/24, subtitle 29/30, keywords 97/99, promo 134/153). Exact replacements: G9. Against the declarations:

| Listing text | Finding | Fix |
|---|---|---|
| "rules written by a personal trainer" (promo, description, EN and ES) | **False.** No human trainer (PO 2026-11-01). 2.3 and consumer law | G9 |
| "GymStudio: AI Personal Trainer", "AI Personal Trainer that learns from every set" | **Replace** with "AI trainer" (PO). Loads come from rules; AI explains. Keep "and tells you why" | G9; "learns": PT |
| "Works offline; sign in with Google to sync" | **Incomplete.** Offline covers logging only. Email and Apple too | G9 |
| "Answer a few questions and get a 6-week plan" | **Needs account**; no production plan yet (G7) | G9; verify first |
| "Technique cues and posture tips for every exercise" | Library: 227 of 227 active have tips and cues ✓. Own exercises don't | G9 |
| "Big, one-hand set logger", "Hints between sets" | Depends on #381/#382, still WIP | Verify at submission |
| Quote "I moved the load up" | Matches the app's text and the AI Trainer's voice. Rule text, not AI text | Keep; labelled in G20 |
| Medical line ✓ | Keep | Add "AI answers can be wrong" (G9) |
| No AI data-sharing statement | Not required, but useful, and the listing is where the US health policy link belongs | G9 |
| Spanish localisation "Mexico / Spain" | Spain is in the EU, left out | Use Spanish (Mexico) only |
| §0 still lists "Reps left in the tank?" | Removal approved in #380 | Socialer update |
| §7 Pro prices | Not built; don't include until in-app purchase exists ✓ (the plan says so) | |
| §13 "Contact email" | js.pabonc979@gmail.com | Socialer update |
| Label note at §8 end | Mentions Google, history, AI; misses weight, calories, feedback, etc. | Replace with `app-store-connect-answers.md` section 1 |

## Sources read (2026-10-31)

Apple: review guidelines; `app-store/app-privacy-details`; `support/offering-account-deletion-in-your-app`; required-reason API and privacy-manifest documentation; age ratings values and set-up help; DSA trader help; encryption export documentation; Standard EULA `apple.com/legal/internet-services/itunes/dev/stdeula/`; `news/upcoming-requirements`; `support/enrollment/` ("your personal legal name will be listed as the seller"); `help/app-store-connect/reference/app-information/app-information` and `.../app-and-submission-statuses` (ICP); `.../manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store`.
Providers: OpenAI `developers.openai.com/api/docs/guides/your-data` and `.../supported-countries`; Supabase DPA, Auth SMTP, backups, Apple sign-in docs; GitHub Pages limits.
Law, read: `oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business`, `oaic.gov.au/privacy/your-privacy-rights/health-information/what-is-a-health-service-provider`; `japaneselawtranslation.go.jp/en/laws/view/4241/en`; `app.leg.wa.gov/RCW/default.aspx?cite=19.373`; `atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy`; `oag.ca.gov/privacy/ccpa`; `ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0`; `ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions`; `argentina.gob.ar/aaip/datospersonales/responsables/obligaciones`; `economia.gob.cl/2026/09/01/gobierno-propone-ampliar-plazo-para-implementar-nueva-ley-de-proteccion-de-datos-y-institucionalidad.htm`.
Law, could not load: PCPD (Hong Kong), PDPC guidelines PDF, MeitY page, Planalto (Brazil), Senado and Función Pública (Colombia), Cámara de Diputados (Mexico), BCN full text (Chile), Nevada Legislature, ACCC. Those rows rely on search excerpts or secondary sources, as marked.
Code and production metadata: see `data-inventory.md`. Source-level findings are not device tests; QAer verifies.
