<!--
DRAFT by Governancer, 2026-10-31. Not legal advice. Lawyer review required before publishing.
Do not publish until: every [PO: …] is filled, every [REQUIRES Gn: …] is delivered and the marker removed,
every [VERIFY: …] is confirmed. Gn refers to gaps-for-tech-lead.md. Facts: data-inventory.md.
Paragraphs marked LAWYER need specific review.
-->

# GymStudio Privacy Policy

**Last updated:** [PO: publication date]

This policy explains what GymStudio collects, why, who receives it, how long we keep it and how you can control it.
GymStudio is a training app for looking up exercises, following a plan, logging sets and seeing your progress.

## 1. Who is responsible

[PO: full legal name or company name], [PO: country and postal address, if it must be published], is responsible for your
personal data ("we"). Privacy contact: [PO: privacy email].

<!-- LAWYER: EU/UK representative (GDPR Art. 27) if EU/UK users are targeted and no EU/UK establishment. -->
[PO/LAWYER: EU/UK representative details, if required.]

## 2. Using GymStudio without an account

You can use the demo or keep workouts on your device without an account. In that case your workouts stay on your device.
When the app downloads the exercise list, our hosting provider receives your IP address as part of the connection. Planned
workouts, goals, measurements, feedback and AI features require an account.

## 3. What we collect with an account

| Data | Examples | Why we use it |
|---|---|---|
| Account details | Email; password (stored in hashed form by our provider); if you use Google [REQUIRES G4: or Apple], your name, email, profile picture link and the provider's ID for you | To create your account and sign you in |
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

<!-- LAWYER: confirm legal bases per country. Weight, steps, calories and goal notes are treated here as health data. -->

| Purpose | Basis (where the law asks for one) |
|---|---|
| Provide the account, sync, plan and progress | The contract with you |
| Store and use your health and fitness data | Your explicit consent, which you can withdraw. [REQUIRES G5/G20: consent step in the app] |
| Send data to the AI provider | Your explicit consent, which you can withdraw. [REQUIRES G2, G3] |
| Security, abuse prevention, limits and cost control, answering feedback | Our legitimate interests |
| Legal obligations | Law |

You are not required to give health data or turn on AI. Without them, the app still logs workouts and gives rule-based plans and
recommendations.

## 5. AI features

GymStudio's AI features use **OpenAI** as a third-party provider. They are optional, and nothing is sent until you turn them on.
[REQUIRES G2]

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
limits set by those rules. AI answers can be wrong. You can turn AI off at any time in Profile → Privacy & AI [REQUIRES G3]. Data
already sent cannot be recalled, but it follows the retention above.

## 6. Who receives your data

| Recipient | Role | Location |
|---|---|---|
| Supabase | Hosts the database, sign-in, server functions and logs | [VERIFY: region] |
| OpenAI | AI text, only if you turn AI on | United States |
| Google | Only if you sign in with Google, or tap a link that opens Google Images (only the exercise search goes to Google, and Google's own terms apply) | Global |
| [REQUIRES G4: Apple] | Sign in with Apple, if you use it; the App Store handles your download under Apple's terms | Global |
| GitHub | Hosts our web app and these pages, and can see visitors' IP addresses | United States |
| [REQUIRES G6: email provider, name] | Sends account emails | [VERIFY] |
| Authorities, courts | When the law requires it | |

The owner of GymStudio can access stored data when needed to provide support, fix problems or meet legal duties.

### International transfers

<!-- LAWYER: transfer mechanism per country: GDPR Ch. V, APP 8, Ley 1581 art. 26. -->
Your data may be processed outside your country, including in the United States, where laws may differ. We rely on the providers'
data-processing terms, including the European Commission's Standard Contractual Clauses where they apply. [VERIFY: DPAs accepted
for Supabase and OpenAI]

## 7. How long we keep data

| Data | Period |
|---|---|
| Account, workouts, goals, measurements, plans, recommendations | Until you delete them or your account. [PO: inactive accounts deleted after N months, with notice] [REQUIRES G17 if a period is chosen] |
| A log or exercise you delete | Removed from view at once; removed from the server after [PO: N days] [REQUIRES G16] |
| Previous plans | [PO: period, or until account deletion] |
| AI usage counts, feedback | [PO: period, or until account deletion] |
| Server and sign-in logs | [VERIFY: Supabase log period] |
| Backups | Until the backup expires, up to [VERIFY: plan, 7 to 30 days]. Not used except to restore service |
| Data at OpenAI | Up to 30 days, per OpenAI |
| Data on your device | Until you delete the account in the app or remove the app. Signing out does not erase it [see G25] |

## 8. How to delete your account

In the app: **Profile → Delete account**. [REQUIRES G1] This permanently removes your account and all associated data from our
database right away. Copies in backups expire as described above. Data stays on another device until you open the app there or
remove it. Deleting the app alone does not delete your account. If you can't sign in, write to [PO: privacy email].

## 9. Your rights

Depending on where you live, you can ask to see your data, get a copy, correct it, delete it, limit or object to how it is used, and
withdraw consent at any time without affecting earlier use. Corrections are available in the app for most data; deletion is too.
For anything else, write to [PO: privacy email]. We answer within the legal period, normally [PO/LAWYER: 30 days; check 10/15 business
days in Colombia]. We won't treat you worse for using your rights.

You can complain to your data protection authority, such as your EU authority; the Office of the Australian Information
Commissioner; or Colombia's Superintendencia de Industria y Comercio. <!-- LAWYER: list only those that apply. -->

## 10. Children

GymStudio is for people aged [PO: minimum age, 16 or 18] or older. We do not knowingly collect data from younger people. If you
think a younger person has an account, write to us and we will delete it.

## 11. Security

Connections are encrypted. Each person's data is separated in the database by access rules. AI keys and administrator keys are kept
on the server. No system is fully secure. If a breach affects you, we will notify you and the authorities where the law requires.

## 12. US state notices

<!-- LAWYER: Washington My Health My Data Act and similar state laws (e.g. Nevada) may require a separate consumer health data
policy linked on the homepage and separate consent, with no small-business exemption. CCPA thresholds are probably not met. -->
[LAWYER: state-specific section and separate consumer health data policy, if US users are included.]

## 13. Changes

If we change this policy, we will update the date, and if a change is important, tell you in the app before it takes effect. If we
want to use your data for a new purpose, we will ask you first.

## 14. Contact

[PO: legal name], [PO: privacy email]. Support: [PO: support URL].
