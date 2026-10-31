# App Store Connect answers (DRAFT)

Governancer, 2026-10-31. For the PO to enter with his own login, after approval. Answers assume the gaps in `gaps-for-tech-lead.md` are closed. Not legal advice.

## 1. App Privacy (nutrition label)

Source: `https://developer.apple.com/app-store/app-privacy-details/`, read 2026-10-31. "Collect" means "transmitting data off the device in a way that allows you and/or your third-party partners
to access it for a period longer than what is necessary to service the transmitted request in real time." Personal data counts as linked. Third-party partners must be declared. Facts: `data-inventory.md`.

**Do you or your partners collect data? Yes. Tracking? No, for all types.** No ATT prompt needed.

| Apple type | Collected | What | Linked | Purposes |
|---|---|---|---|---|
| Contact Info: **Email Address** | Yes | Account email | Yes | App Functionality |
| Contact Info: **Name** | Yes | From Google (and Apple, if used). `full_name` | Yes | App Functionality |
| Health & Fitness: **Health** | Yes | Body weight, calories, goal notes ("any other user provided health or medical data") | Yes | App Functionality, Product Personalization |
| Health & Fitness: **Fitness** | Yes | Workouts, sets, steps, goal, experience, activity level | Yes | App Functionality, Product Personalization |
| User Content: **Customer Support** | Yes | Feedback form | Yes | App Functionality |
| User Content: **Other User Content** | Yes | Workout notes, own exercises, AI questions (OpenAI may keep them up to 30 days) | Yes | App Functionality |
| Identifiers: **User ID** | Yes | Account UUID | Yes | App Functionality |
| Usage Data: **Product Interaction** | Yes | Recommendation accepted, kept or ignored, AI feature usage, screen name in feedback | Yes | App Functionality, Product Personalization |
| Other Data: **Other Data Types** | Yes (judgement call) | IP address and device type held with the session (`auth.sessions`), for security | Yes | App Functionality |

**Answer No to:** Phone, Physical Address, Other Contact Info; Financial Info (No while free; Purchases changes if Pro ships); Location (no geolocation; IP is not used for location); Sensitive Info (Apple lists Health separately, see note);
Contacts; Emails or Text Messages; Photos or Videos; Audio; Gameplay; Browsing History; Search History (exercise search stays on the device; Google Images is user-initiated outside the app's collection); Device ID; Purchases; Advertising Data; Other Usage Data;
Crash, Performance, Other Diagnostic Data (no monitoring today, see G22); Surroundings; Body.

**Notes**
- Feedback does not qualify for the optional-disclosure exemption: Apple requires "the user's name or account name is prominently displayed in the submission form". It isn't.
- "Analytics" is not ticked: no one analyses behaviour across users today. Migration 031 says recommendations can be "evaluated from data", and marketing plan §10 tracks "% of sessions where the recommended load was used". **If anyone does that, tick Analytics for Product Interaction and Fitness, and check 5.1.2(ii) and 5.1.3(i).**
- Guests and demo: nothing beyond the connection; the label describes the account experience.
- Sensitive Info: Apple's page gives a type with no definition in what I read. ⚠️ VERIFY in the form, in case notes such as injuries should tick it.

## 2. Age rating

Sources: `https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions`, `https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating`, read 2026-10-31. Apple's own pages did not show exact form wording, and I could not confirm any AI or chatbot capability question; a third-party source mentions one. ⚠️ VERIFY in the form.

| Item | Answer | Why |
|---|---|---|
| Parental controls | No | None |
| Age assurance | No | A checkbox doesn't "confirm an individual's age" |
| **Unrestricted web access** | **No, only after G12.** Today the answer would be Yes = **16+** | Google Images opens in an in-app browser |
| User-generated content | No | Notes and feedback are private, no "broad distribution" |
| Messaging and chat | No | "Users can directly communicate with one another": no. AI chat isn't user to user. Answer any AI question truthfully: yes |
| Advertising | No | None |
| Social media | No | None |
| **Medical or treatment information** | **None** | App declines diagnosis; AI says see a professional. If you'd read "guidance around the management of… health and wellness" to include plans: Infrequent = 13+. Lawyer/PT opinion welcome |
| **Health or wellness topics** | **Yes** | Training, goals, fat-loss, "self-care or lifestyle recommendations" = 9+ |
| Violence, sexuality, nudity, mature themes, profanity, horror, alcohol, gambling, contests, loot boxes, weapons | None | |
| Made for Kids | No | |

**Result:** calculated about 9+. **Override:** "If a EULA has minimum age requirements above Apple's calculated rating, you must override to a rating that adheres to the requirements." So if the Terms say 16, choose **16+**; if 18, choose **18+** (PO question 5). The override applies in all regions, and the content descriptors still reflect the answers.
Age Suitability URL: optional, skip. Region rules (for example, Texas age-verification law reported by a secondary source): ⚠️ VERIFY with lawyer.

## 3. Export compliance

Source: `https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations`, read 2026-10-31.

**Answer: uses only exempt encryption.** Add `ITSAppUsesNonExemptEncryption` = `NO` in both Info.plist files (G14). Apple: built-in encryption is "exempt", such as "HTTPS connections using URLSession". The app uses HTTPS through the WebView and system stack. Grep found no CryptoKit or CommonCrypto in app Swift. Web `crypto.randomUUID()` only creates IDs. `pgcrypto` runs on the server. Apple's page says nothing about France; ⚠️ VERIFY if the form asks. The app also doesn't store passwords itself.

## 4. Content rights

"Does your app contain, show, or access third-party content?"

- **Exercise catalogue, plans, cues:** drafted by the PT agent, approved by PO. Own content. ⚠️ Copyright position of AI-assisted text: lawyer.
- **Blocks 1 to 5, `origin: 'coach'`:** in the public bundle (G7). Rights unknown; PO question 10. **Remove or license before answering.**
- **Google Images links:** "access" third-party content. After G12 they open in Safari, outside the app. **Answer No after G7 and G12.** Otherwise Yes, with rights you don't hold.
- **AI output:** generated per request; not third-party content that you're licensing per se. Mention in notes.
- **Icons and fonts:** system fonts in `styles.css` (Arial etc.); `docs/reference/branding.png` source unknown. PO confirms the final icon.

## 5. EU Digital Services Act trader status

Source: `https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/`, and upcoming requirements, read 2026-10-31.

- Applies if distributed in the EU. Apple: non-traders' consumers are told consumer rights don't apply; apps without verified status were removed from Feb 17, 2025. Declaring is required.
- Self-assessment factors: revenue (IAP, paid apps, ads), commercial practices such as promotion, VAT, professional capacity. "A hobbyist with no intent to commercialize may not be a trader."
- **Assessment:** with Pro and a marketing plan in place, **probably trader**, even if free on day one. Lawyer confirms.
- **Effect:** individuals give an address or P.O. Box, phone, email, verified and **shown publicly on the EU product page**. Organisations show the D-U-N-S address.
- **PO decision** (question 16): accept, use a company or P.O. box, or exclude the 27 EU countries at launch.

## 6. Sign in with Apple (guideline 4.8)

Apple: apps using "a third-party or social login service (such as… Google Sign-In…) to set up or authenticate the user's primary account… must also offer as an equivalent option another login service" that limits data to name and email, lets users keep their email private, and doesn't collect interactions for advertising without consent.

**GymStudio uses Google (`src/auth/`) to set up the primary account, so 4.8 applies.** Email and password does not fix it: it's the app's own account system, not a login service with private-email support.

| Option | Work | Consequences |
|---|---|---|
| **A. Add Sign in with Apple (recommended, and issue #384's plan)** | Supabase Apple provider. Native (`signInWithIdToken`, needs an approved plugin since Capacitor has none installed) needs no secret rotation. Web OAuth needs a new client secret about every 6 months. Enable capability, entitlements file (none exists today), Team ID, key, Services ID if web | Name comes only on first authorization: capture it. Register email source for relay addresses (ties to G6). Add token revocation to G1. Update policy, label already covers Name. Equal prominence |
| **B. Hide Google in the native app** | `isNativeApp()` in `LoginScreen` | 4.8 not triggered. Email-only on iOS. Google users, including possibly the PO, need a password, and G10 must work. Listing's "sign in with Google" must go |

PO decides (question 8). Nothing here is verified on a device.

## 7. Account deletion

5.1.1(v): "If your app supports account creation, you must also offer account deletion within the app." Support flow: `https://developer.apple.com/support/offering-account-deletion-in-your-app/`. **Not built.** Design: G1. Guests: there is no server account; removing the app removes the data; say so on the support page. App Store Connect has no field for it, but reviewers test it (review notes).

## 8. Health and AI rules

| Rule | Text | GymStudio |
|---|---|---|
| 1.4.1 | "Apps should remind users to check with a doctor in addition to using the app and before making medical decisions." | Listing has it. In-app only "not medical advice" in chat. G20 |
| 1.4.1 | "Apps must clearly disclose data and methodology to support accuracy claims relating to health measurements" | No health measurement claims; keep e1RM labelled "estimated". Don't claim accuracy |
| 5.1.3(i) | Fitness data may not be used or disclosed "for advertising, marketing, or other use-based data mining purposes other than improving health management, or for the purpose of health research, and then only with permission." | No ads. OpenAI use: coaching, with permission (G2). **Marketing must not use user fitness data**; real-data examples need consent (marketing §12) |
| 5.1.3(ii) | No false HealthKit data, and "may not store personal health information in iCloud." | No HealthKit, iCloud or CloudKit. Backup of WebView storage: ⚠️ VERIFY (G13) |
| 5.1.2(i) | third-party AI disclosure and "explicit permission" | **Fails today.** G2. Copy: `ai-disclosure.md` |
| 5.1.2(ii) | "may not be repurposed without further consent" | Training a future model or analytics on user data needs new consent |
| 5.1.1(ii) | withdraw consent | **Fails today.** G3 |
| 5.1.1(i) | privacy policy link in metadata and in app | **Missing.** G5 |
| 1.2 | "AI content creation apps" need moderation tools | Not applicable in my reading: AI text is private, not published. The gateway restricts to fitness and caps question length. Lawyer not needed; Tech Lead confirm |
| 2.3 | Metadata including privacy information must be accurate | See listing check in `README.md` |

## 9. Privacy manifest

Sources: `https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api` and related JSON, read 2026-10-31: "For each executable or dynamic library in an app that uses a required reason API, the bundle… needs to include a privacy manifest file"; third-party SDKs report their own.

**Scan (source, 2026-10-31):** no `UserDefaults`, boot-time, file-timestamp, disk-space or active-keyboard API in `ios/App/App/*.swift`, `RestTimerWidget`, `Shared`, `@capacitor/ios` (Capacitor, Cordova), `@capacitor/app`, `@capacitor/browser`. Capacitor and Cordova ship empty manifests; App and Browser have none. WebKit and ActivityKit are Apple frameworks. **So: no required-reason declarations needed.** Confirm with Xcode → Archive → Generate Privacy Report (G13).

If a later scan finds `UserDefaults` in the app, the reason is `CA92.1` (app only), and `1C8F.1` if an App Group is added for the widget. For rest timing, `35F9.1`. Don't declare them without a real use.

**`ios/App/App/PrivacyInfo.xcprivacy`** (add to the App target's resources):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyAccessedAPITypes</key><array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <!-- One dict per type. Keep in sync with section 1. -->
    <dict>
      <key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypeFitness</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
        <string>NSPrivacyCollectedDataTypePurposeProductPersonalization</string>
      </array>
    </dict>
    <!-- Same shape, both purposes: NSPrivacyCollectedDataTypeHealth, NSPrivacyCollectedDataTypeProductInteraction.
         Same shape, App Functionality only: NSPrivacyCollectedDataTypeEmailAddress, NSPrivacyCollectedDataTypeName,
         NSPrivacyCollectedDataTypeUserID, NSPrivacyCollectedDataTypeCustomerSupport,
         NSPrivacyCollectedDataTypeOtherUserContent, NSPrivacyCollectedDataTypeOtherDataTypes. -->
  </array>
</dict>
</plist>
```

**`ios/App/RestTimerWidget/PrivacyInfo.xcprivacy`** (Widget target): the widget collects nothing, has no network and no required-reason API, so all empty: `NSPrivacyTracking` false, and empty `NSPrivacyTrackingDomains`, `NSPrivacyAccessedAPITypes`, `NSPrivacyCollectedDataTypes`. Apple requires a manifest only when such an API is used, so this is optional and defensive.
