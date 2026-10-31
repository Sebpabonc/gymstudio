# AI disclosure and consent copy (DRAFT)

Governancer, 2026-10-31; updated 2026-11-01. Rule: Apple 5.1.2(i): "You must clearly disclose where personal data will be shared with third parties, including with
third-party AI, and obtain explicit permission before doing so." Read 2026-10-31 at
`https://developer.apple.com/app-store/review/guidelines/`. UXer checks placement; PT checks D and E; PO approves A and G (no lawyer, his decision); Tech Lead builds (G2, G3, G5, G9, G20). Wording rule: "AI trainer" / "entrenador con IA", never "personal trainer" (G9). US and Korean rules want sharing consent separate from collection: keep A and the F measurements row as two separate steps, neither inside the Terms step G. Stored with version and time.

**Today:** only the chat asks. `trainer_explain` and `block_plan` send data without asking, even after "Not now" (see `data-inventory.md` section 5). The copy below
is not true until G2 is done. Keys below are proposals; both dictionaries must have the same keys.

## A. Main AI permission (blocking sheet)

**Where:** the first time any AI feature would run: opening Ask AI, tapping Generate my plan, or the first AI Trainer sentence. For the last one, show it once on entering
Workout mode; until answered, show the rule-based sentence. Existing users see it again with this new version. Not pre-selected; both buttons equal weight.

| Key | EN | ES |
|---|---|---|
| `ai.permission.title` | Allow AI features? | ¿Permitir funciones de IA? |
| `ai.permission.body` | To explain your loads, personalise your plan and answer questions, GymStudio sends some of your training data to **OpenAI**, an AI company in the United States. | Para explicar tus cargas, personalizar tu plan y responder preguntas, GymStudio envía parte de tus datos de entrenamiento a **OpenAI**, una empresa de IA en Estados Unidos. |
| `ai.permission.sentTitle` | What is sent | Qué se envía |
| `ai.permission.sent1` | Your questions | Tus preguntas |
| `ai.permission.sent2` | Your plan and recent workouts: exercises, weights, reps, dates | Tu plan y entrenamientos recientes: ejercicios, pesos, repeticiones, fechas |
| `ai.permission.sent3` | When you generate a plan: your goal, experience, activity level, equipment, your goal notes, and your last 14 days of body weight, steps and calories | Cuando generas un plan: tu objetivo, experiencia, nivel de actividad, equipo, tus notas del objetivo y tu peso corporal, pasos y calorías de los últimos 14 días |
| `ai.permission.notSent` | Never sent: your name, email or workout notes. | Nunca se envían: tu nombre, correo ni notas de entrenamiento. |
| `ai.permission.provider` | OpenAI says it doesn't use this data to train its models and may keep it for up to 30 days for safety. AI is optional. Without it, the app still works with rule-based reasons and plans. You can turn it off any time in Profile → Privacy & AI. | OpenAI dice que no usa estos datos para entrenar sus modelos y que puede guardarlos hasta 30 días por seguridad. La IA es opcional. Sin ella, la app sigue funcionando con motivos y planes basados en reglas. Puedes desactivarla cuando quieras en Perfil → Privacidad e IA. |
| `ai.permission.policy` | Privacy Policy | Política de privacidad |
| `ai.permission.allow` | Allow AI | Permitir IA |
| `ai.permission.decline` | Not now | Ahora no |

Depends on: G11 (no user ID sent), G19 (OpenAI settings). Replaces `ai.consent.body` (unused) and `help.ai.consent` ("Nothing else" must go).
Store: version, choice, timestamp, on the server.

## B. Declined state

**Where:** Ask AI tab if AI is off. Replaces `ai.declinedMessage`.

| EN | ES |
|---|---|
| AI is off. Your data is not sent to OpenAI. You can turn it on in Profile → Privacy & AI. [Turn on AI] | La IA está desactivada. Tus datos no se envían a OpenAI. Puedes activarla en Perfil → Privacidad e IA. [Activar IA] |

## C. Settings: Profile → Privacy & AI

| Key | EN | ES |
|---|---|---|
| `privacy.ai.toggle` | AI features (OpenAI) | Funciones de IA (OpenAI) |
| `privacy.ai.help` | When on, your questions, plan and recent training data are sent to OpenAI to explain loads, personalise plans and answer you. | Cuando está activa, tus preguntas, tu plan y tus datos recientes de entrenamiento se envían a OpenAI para explicar cargas, personalizar planes y responderte. |
| `privacy.ai.offConfirm` | AI is off. Nothing more will be sent. Data already sent can't be recalled and is kept by OpenAI for up to 30 days. | La IA está desactivada. No se enviará nada más. Los datos ya enviados no se pueden recuperar y OpenAI los guarda hasta 30 días. |
| `privacy.links` | Privacy Policy · Terms · Support | Política de privacidad · Términos · Soporte |
| `privacy.delete` | Delete account | Borrar cuenta |

## D. AI labels

**Where:** directly on AI text. Today the rule sentence and AI sentence look identical (`trainerWhy`).

| Where | EN | ES |
|---|---|---|
| AI Trainer sentence, when AI-written | Written by AI. Check it, you decide. | Escrito por IA. Revísalo, tú decides. |
| Plan with `source: 'ai'` (existing `profile.plan.aiBadge`) | Personalised by AI. Check it before you start. | Personalizado con IA. Revísalo antes de empezar. |
| Ask AI footnote (existing `ai.disclaimer`) | AI answers can be wrong. Not medical advice. Check with a doctor about pain or health issues. | Las respuestas de la IA pueden tener errores. No es consejo médico. Consulta a un médico si tienes dolor o problemas de salud. |

## E. Health notice <!-- PT -->

**Where:** first run (once, before the first plan or log) and in Profile → Privacy & AI. **PT must approve.**

| EN | ES |
|---|---|
| **Train safely.** GymStudio is not medical advice. Check with a doctor before starting a program, especially if you have a health condition, an injury or are pregnant. Stop if you feel pain, dizziness or chest discomfort. Weights are suggestions: you decide what you lift. | **Entrena con seguridad.** GymStudio no es consejo médico. Consulta a un médico antes de empezar un programa, sobre todo si tienes una condición de salud, una lesión o estás embarazada. Detente si sientes dolor, mareo o molestia en el pecho. Los pesos son sugerencias: tú decides qué levantas. |

## F. Point-of-entry notes

| Where | EN | ES |
|---|---|---|
| Goal notes field (`training_goals.notes`) | If AI is on, these notes are sent to OpenAI when you generate a plan. Don't include medical details or names. | Si la IA está activa, estas notas se envían a OpenAI al generar un plan. No incluyas detalles médicos ni nombres. |
| Ask AI placeholder | Don't include names or medical details. | No incluyas nombres ni detalles médicos. |
| Generate my plan, AI off | This plan uses the app's rules. Turn on AI in Profile to personalise it. | Este plan usa las reglas de la app. Activa la IA en Perfil para personalizarlo. |
| Measurements, first use (health-data consent, sensitive data) | Weight, steps and calories are optional health data. We store them in your account to show your progress and build your plan. You don't have to give them. [Allow] [Not now] | El peso, los pasos y las calorías son datos de salud opcionales. Los guardamos en tu cuenta para mostrar tu progreso y crear tu plan. No estás obligado a darlos. [Permitir] [Ahora no] |

## G. Sign-up

Before the account is created, all sign-in methods, unticked. <!-- HIGH RISK; PO approves -->

| EN | ES |
|---|---|
| ☐ I am 18 or older and I accept the Terms and Privacy Policy. | ☐ Tengo 18 años o más y acepto los Términos y la Política de privacidad. |

Replace `login.benefit3` and `login.privacyBody` (G9):

| Key | EN | ES |
|---|---|---|
| `login.benefit3` | Your data is separated from other users' data. | Tus datos están separados de los de otros usuarios. |
| `login.privacyBody` | Signed out, your workouts stay on this device. With an account, they are stored with our hosting provider, Supabase, and only sent to OpenAI if you turn on AI. Read the Privacy Policy. | Sin sesión, tus entrenamientos se quedan en este dispositivo. Con una cuenta, se guardan con nuestro proveedor de alojamiento, Supabase, y solo se envían a OpenAI si activas la IA. Lee la Política de privacidad. |

## H. What must change in the app

1. Client gate + server check on every AI call (G2).
2. Server-side consent record, version, re-consent for existing users (G2).
3. Profile → Privacy & AI: toggle, links, delete (G1, G3, G5).
4. New sheet A, states B, C, labels D, health notice E, notes F, sign-up G.
5. Named columns in `block_plan`, no `user_id` (G11).
6. Remove the "Nothing else" text. Fix "40 questions" (G9).
7. **If the provider or data sent ever changes:** new consent version, new copy, policy update, label update.
