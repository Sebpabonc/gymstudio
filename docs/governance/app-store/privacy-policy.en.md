<!--
DRAFT by Governancer, updated with the PO's answers of 2026-11-01. Not legal advice. Governancer is not a lawyer.
No lawyer will review this (PO decision 2026-11-01): the PO reads and approves it himself. HIGH RISK comments mark what a lawyer would
normally check; README.md lists the laws considered and what could not be verified.
Do not publish until: every [PO approve: …] is approved and its marker removed, every [REQUIRES Gn: …] is delivered and removed, every
[VERIFY: …] is confirmed. Gn refers to gaps-for-tech-lead.md. Facts: data-inventory.md. Links work once G5 publishes the pages.
Public-document rule: name and email approved by the PO; never add a street address or phone.
-->

# GymStudio Privacy Policy

**Last updated:** [PO: publication date]

This policy explains what GymStudio collects, why, who receives it, how long we keep it and how you can control it.
GymStudio is a training app for looking up exercises, following a plan, logging sets and seeing your progress.

## 1. Who is responsible

GymStudio is run by **Seb Pabon**, an individual based in Australia, not a company. He is responsible for your personal data ("we").
Privacy contact: js.pabonc979@gmail.com.
<!-- PO: the App Store shows the legal name on the Apple Developer account as the seller. Check it matches (question 1). -->

## 2. Using GymStudio without an account

You can use the demo or keep workouts on your device without an account. In that case your workouts stay on your device.
When the app downloads the exercise list, our hosting provider receives your IP address as part of the connection. Planned
workouts, goals, measurements, feedback and AI features require an account.

GymStudio is for people aged 18 or older. It is not offered in the European Union.

## 3. What we collect with an account

| Data | Examples | Why we use it |
|---|---|---|
| Account details | Email; password (stored in hashed form by our provider); if you use Google or Apple [REQUIRES G4: Apple], your name, email (Apple lets you hide it), Google's profile picture link and the provider's ID for you | To create your account and sign you in |
| Workout data | Exercises, dates, weights, reps, sets and timing, reps in reserve, plan targets, your notes, exercises you create | To run the app, sync it across devices and show progress |
| Health and fitness data | Body weight, steps and calories you type in; your goal (such as losing fat or gaining muscle), experience, activity level, equipment and any notes you add | To build and adapt your plan and show your progress |
| Plans and recommendations | Your plans, exercise swaps, the loads we recommended and whether you used them | To recommend today's load and adapt it to you |
| AI questions | What you type to the AI, if you turn AI on | To answer you. We do not save your questions or the answers on our servers |
| AI usage counts | Which AI feature, model, amount of text processed, cost, time. Not the content | To apply daily limits and control cost |
| Feedback | Your message, with app version, screen and language | To answer you and improve the app |
| Technical data | IP address, device and browser type, session times, server logs | To keep your account secure and the service working |

We do not use Apple Health, your location, camera, contacts or photos. GymStudio has no ads, no analytics tools and no tracking
across other companies' apps or websites. We do not sell your data. We do not use your health and fitness data for advertising or
marketing.

On your device, the app also stores your data, preferences and session locally so it can work offline. During a rest, the timer
and exercise name can appear on your Lock Screen and Dynamic Island through Live Activities. This stays on your device.

## 4. Why we are allowed to use your data

<!-- HIGH RISK: the bases differ per country (Brazil, Colombia, Korea, Japan, Argentina lean on consent for health data). We treat weight,
steps, calories and goal notes as health data everywhere, which is the safe reading. -->

| Purpose | Basis (where the law asks for one) |
|---|---|
| Provide the account, sync, plan and progress | The contract with you |
| Store and use your health and fitness data | Your explicit consent, which you can withdraw. [REQUIRES G5/G20: consent step in the app] |
| Send data to the AI provider | Your explicit consent, separate from the one above, which you can withdraw. [REQUIRES G2, G3] |
| Store and process your data outside your country | Your consent, or what your local law allows for service providers. See section 6 |
| Security, abuse prevention, limits and cost control, answering feedback | Our legitimate interests |
| Legal obligations | Law |

You are not required to give health data or turn on AI. Without them, the app still logs workouts and gives rule-based plans and
recommendations. Accepting our Terms does not count as consent to these uses.

## 5. AI features

GymStudio's AI features, including the AI trainer's explanations, use **OpenAI** as a third-party provider. They are optional, and nothing
is sent until you turn them on. [REQUIRES G2]

| Feature | What is sent to OpenAI |
|---|---|
| Ask AI | Your question, today's date, your current plan and up to 30 recent workout entries |
| AI Trainer explanation | Exercise name; recommended and previous load; last session's date, weight and reps; estimated one-rep maximum; number of sessions used |
| AI plan personalisation | Your goal, experience, activity level, session length, equipment and notes; your last 14 days of weight, steps and calories; your plan and alternative exercises |

We do not send your name, email or workout notes. [REQUIRES G11: remove the internal user ID from plan personalisation] Avoid
typing names or medical details into notes or questions.

According to OpenAI, data sent through its API is not used to train its models unless the customer opts in, which we have not done
[VERIFY: dashboard], and it may keep it for up to 30 days to monitor abuse, longer where the law requires. OpenAI handles it mainly
in the United States.

The load shown each day is calculated by the app's rules. The AI writes the explanation, and it can personalise a plan only inside
limits set by those rules. The AI trainer is software, not a person. AI answers can be wrong. You can turn AI off at any time in
Profile → Privacy & AI [REQUIRES G3]. Data already sent cannot be recalled, but it follows the retention above.

## 6. Who receives your data

| Recipient | Role | Location |
|---|---|---|
| Supabase | Hosts the database, sign-in, server functions and logs | [VERIFY: region] |
| OpenAI | AI text, only if you turn AI on | United States |
| Google | Only if you sign in with Google, or tap a link that opens Google Images (only the exercise search goes to Google, and Google's own terms apply) | Global |
| Apple [REQUIRES G4] | Sign in with Apple, if you use it; the App Store handles your download under Apple's terms | Global |
| GitHub | Hosts our web app and these pages, and can see visitors' IP addresses | United States |
| [REQUIRES G6: email provider, name] | Sends account emails | [VERIFY] |
| Authorities, courts | When the law requires it | |

Seb Pabon can access stored data when needed to provide support, fix problems or meet legal duties.

### International transfers

<!-- HIGH RISK: every launch country has its own rule: APP 8 (Australia), APPI art. 28 (Japan), PIPA art. 28-8 (Korea), PDPA transfer limitation
(Singapore), LGPD ch. V (Brazil), Ley 1581 art. 26 (Colombia), Ley 25.326 art. 12 (Argentina), Mexico. Named recipient + country + consent is the
common denominator; contracts with providers must be accepted (G19). -->
Your data is stored and processed outside your country, in the places listed above, including the United States and wherever our providers
operate. Their laws may protect your data less than yours does, and they may give you fewer ways to complain. We use providers that commit to data-processing
terms [VERIFY: DPAs accepted for Supabase and OpenAI]. By giving the consents in section 4 you agree to these transfers; you can withdraw at any time, though
the app cannot sync without its hosting provider.

## 7. How long we keep data

| Data | Period |
|---|---|
| Account, workouts, goals, measurements, plans, recommendations | Until you delete them or your account. If an account is not used for **24 months**, we delete it, after warning you by email. [REQUIRES G6, G17] |
| A log or exercise you delete | Removed from view at once; removed from the server after **30 days** [REQUIRES G16] |
| Previous plans | Until you delete your account [PO approve: this period] |
| Feedback | **24 months** [REQUIRES G17] |
| AI usage counts | **12 months** [REQUIRES G17] |
| Server and sign-in logs | [VERIFY: Supabase log period] |
| Backups | Until the backup expires, up to [VERIFY: plan, 7 to 30 days]. Not used except to restore service |
| Data at OpenAI | Up to 30 days, per OpenAI |
| Data on your device | Until you delete the account in the app or remove the app. Signing out does not erase it [see G25] |

## 8. How to delete your account

In the app: **Profile → Delete account**. [REQUIRES G1] This permanently removes your account and all associated data from our
database right away. Copies in backups expire as described above. Data stays on another device until you open the app there or
remove it. Deleting the app alone does not delete your account. If you can't sign in, write to js.pabonc979@gmail.com.

## 9. Your rights

Depending on where you live, you can ask to see your data, get a copy, correct it, delete it, limit or object to how it is used, ask who
received it, and withdraw consent at any time without affecting earlier use. Corrections are available in the app for most data; deletion is too.
For anything else, write to js.pabonc979@gmail.com. We answer within [PO approve: 10 business days], or sooner if your local law sets a shorter period. If
we refuse, we will tell you why and you can ask us to review it. We won't treat you worse for using your rights.

You can also complain to your data protection or consumer authority. Examples: Office of the Australian Information Commissioner (Australia),
Personal Data Protection Commission (Singapore), Personal Information Protection Commission (Japan, South Korea), Data Protection Board (India), Superintendencia
de Industria y Comercio (Colombia), Secretaría Anticorrupción y Buen Gobierno (Mexico), Agencia de Acceso a la Información Pública (Argentina),
Autoridade Nacional de Proteção de Dados (Brazil), your state attorney general or the Federal Trade Commission (United States).

## 10. Children

GymStudio is only for people aged 18 or older. We do not knowingly collect data from younger people. If you think a younger person has an account, write to us
and we will delete it and its data.

## 11. Security

Connections are encrypted. Each person's data is separated in the database by access rules. AI keys and administrator keys are kept
on the server. No system is fully secure. If a breach affects you, we will notify you and the authorities where the law requires.

## 12. United States

If you live in the United States, also read our [Consumer Health Data Privacy Policy](https://sebpabonc.github.io/gymstudio/legal/consumer-health-data.en.html) [REQUIRES G5],
which covers Washington, Nevada and similar state laws. We do not sell your personal data or share it for targeted advertising.

## 13. Changes

If we change this policy, we will update the date, and if a change is important, tell you in the app before it takes effect. If we
want to use your data for a new purpose, we will ask you first.

## 14. Language

This policy exists in English and Spanish. If you use the app in Spanish or live in a Spanish-speaking country, the Spanish version applies. Otherwise, the
English version applies. <!-- PO approve. Brazil: a Portuguese version is needed before launching there (question 3). -->

## 15. Contact

Seb Pabon, js.pabonc979@gmail.com. Support: https://sebpabonc.github.io/gymstudio/legal/support.en.html [REQUIRES G5]
