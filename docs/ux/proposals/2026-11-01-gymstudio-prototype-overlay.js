/* GymStudio prototype overlay. Runs on top of the real app in demo mode and only adds what the proposal changes.
   Nothing here is production code. New rules marked "example" need the PT. */
(function () {
  const DATA = /*DATA*/null;
  const TXT = {
    es: {
      pill: 'Qué cambió', title: 'Prototipo sobre la app actual', intro: 'Esta es tu app real en modo demo. Solo agregué lo marcado con línea punteada. Nada se guarda en tu cuenta.', mark: 'Marcar lo nuevo', replay: 'Ver el primer uso otra vez', close: 'Cerrar',
      w_tag: 'Entrena con intención', w_title: 'El peso de hoy, y por qué.', w_body: 'Un plan de 6 semanas que no cambia solo. Cinco preguntas y empiezas hoy.', w_cta: 'Armar mi plan', w_login: 'Ya tengo cuenta',
      hi: 'Hola. Con cinco preguntas te armo el plan.', notice: 'No es consejo médico. Si tienes una lesión, consulta a un profesional.',
      qs: [['¿Qué quieres lograr?', ['Ganar músculo', 'Perder grasa', 'Ganar fuerza', 'Forma general']], ['¿Cuál es tu experiencia?', ['Principiante', 'Intermedio', 'Avanzado']], ['¿Cuántos días a la semana?', ['3 días', '4 días', '5 días', '6 días']], ['¿Dónde entrenas?', ['Gimnasio completo', 'Gimnasio básico', 'En casa']], ['¿Cuánto dura tu sesión?', ['45 min', '60 min', '75 min', '90 min']]],
      replies: ['Listo.', 'Ajusto el punto de partida.', 'Reparto los músculos en esos días.', 'Solo ejercicios que puedas hacer ahí.', 'Perfecto.'],
      n_title: '¿Te aviso los días de entreno?', n_body: 'Un aviso ese día, con lo que te toca. Puedes apagarlo en Tú.', n_yes: 'Sí, avísame', n_no: 'Más tarde',
      a_title: 'Guarda tu plan', a_body: 'Tu plan está listo. Crea la cuenta para guardarlo y empezar hoy.', a_btn: 'Continuar', a_sim: 'Simulado. No crea ninguna cuenta.',
      i_title: '¿Quieres explicaciones con IA?', i_body: 'Las reglas siempre eligen tu peso. La IA solo lo explica y responde preguntas. Si aceptas, tu historial se envía a OpenAI.', i_yes: 'Sí, activar IA', i_no: 'No, sin IA', i_note: 'Sin IA la app funciona igual. Se cambia en Tú.',
      p_title: 'Tu plan está listo', p_body: 'Empieza hoy, no el próximo lunes. Este plan no cambia solo: tú decides cada cambio.', p_cta: 'Ver el entreno de hoy', weeks: '6 semanas',
      why: 'Por qué este peso', short: 'Tengo poco tiempo', machine: 'Máquina ocupada', done: 'Hecho', plates: 'Discos',
      tip_today: 'Cada peso dice por qué. Y si hoy cambia algo, usa estas dos salidas: tu plan sigue igual.', tip_log: 'Este es el motivo de tu peso. Cambia si la última vez cambia.', tip_prog: 'Aquí ves lo que levantaste de verdad, sin puntajes.', ok: 'Entendido',
      s_title: '¿Cuánto tiempo tienes?', s_body: 'Solo cambia hoy. Tu plan sigue igual.', s_45: '45 minutos', s_30: '30 minutos', s_rule: 'Regla de ejemplo, la real la decide el PT: quita los últimos ejercicios del día.', s_done: 'Hoy quitas {n} ejercicios. Tu plan no cambió.', s_tag: 'Hoy no',
      m_title: '¿Qué máquina está ocupada?', m_pick: 'En vez de {x}', m_body: 'Del catálogo aprobado: misma zona y mismo movimiento. Solo cambia hoy.', m_none: 'No hay alternativas para este ejercicio.', m_tag: 'Hoy: {x}', cancel: 'Cancelar',
      pl_title: 'Discos por lado', pl_body: 'Para {kg} kg, con barra de {bar} kg:', pl_less: 'Menos que la barra sola.',
      win: 'Tu momento de hoy', winUp: 'Subiste en {x}', winTop: 'Tu serie más pesada en {x}', before: 'Antes: {v}',
      del: 'Borrar mi cuenta', del_title: '¿Borrar tu cuenta?', del_body: 'Se borran tu perfil, tu plan y tu historial de entrenos. No se puede deshacer.', del_sim: 'Simulado: no borra nada.', del_ok: 'Sí, borrar todo', sim: 'Simulado. No se borró nada.',
      changes: [
        ['Primer uso', 'Preguntas tipo chat, luego cuenta, IA con un “no” real, y el entreno de hoy.', 'Fitbod hace 11 preguntas y pide cuenta antes de mostrar un entreno.'],
        ['Hoy', 'El porqué del peso a la vista, y dos salidas: poco tiempo y máquina ocupada.', 'Fitbod tiene salidas, pero no un porqué por ejercicio.'],
        ['Registrar', 'El porqué encima de la serie, calculadora de discos en barra y sin el botón de Google.', 'Fitbod tiene la calculadora, pero no el porqué.'],
        ['Al terminar', 'Un logro con tus números, encima del resumen que ya tienes.', 'Fitbod muestra confeti genérico.'],
        ['Progreso', 'Una ayuda corta. Se oculta “+x kg/semana”.', 'Una ayuda por función, como Fitbod.'],
        ['Tú', 'Borrar cuenta, diciendo qué se borra.', 'Fitbod lo esconde abajo y no lo dice.'],
      ],
      keep: 'Sin tocar: Hoy, Ejercicios, Progreso, Tú, Big Done, técnica, descanso y superseries son los que están en producción hoy. Los pesos son de la demo; poco tiempo, máquina ocupada y borrar cuenta son simulados.',
    },
    en: {
      pill: 'What changed', title: 'Prototype on the current app', intro: 'This is your real app in demo mode. I only added what has a dotted outline. Nothing is saved to your account.', mark: 'Mark what’s new', replay: 'See the first run again', close: 'Close',
      w_tag: 'Train with intent', w_title: 'Today’s weight, and why.', w_body: 'A 6-week plan that doesn’t change by itself. Five questions and you start today.', w_cta: 'Build my plan', w_login: 'I have an account',
      hi: 'Hi. Five questions and your plan is ready.', notice: 'This is not medical advice. If you have an injury, see a professional.',
      qs: [['What do you want to achieve?', ['Gain muscle', 'Lose fat', 'Build strength', 'General fitness']], ['What’s your experience?', ['Beginner', 'Intermediate', 'Advanced']], ['How many days a week?', ['3 days', '4 days', '5 days', '6 days']], ['Where do you train?', ['Full gym', 'Basic gym', 'At home']], ['How long is your session?', ['45 min', '60 min', '75 min', '90 min']]],
      replies: ['Got it.', 'I’ll set your starting point.', 'I’ll spread your muscles across those days.', 'Only exercises you can do there.', 'Perfect.'],
      n_title: 'Remind you on training days?', n_body: 'One reminder that day, with what’s planned. Turn it off in You.', n_yes: 'Yes, remind me', n_no: 'Later',
      a_title: 'Save your plan', a_body: 'Your plan is ready. Create an account to save it and start today.', a_btn: 'Continue', a_sim: 'Simulated. No account is created.',
      i_title: 'Do you want AI explanations?', i_body: 'Rules always choose your weight. AI only explains it and answers questions. If you accept, your history is sent to OpenAI.', i_yes: 'Yes, turn on AI', i_no: 'No AI', i_note: 'Without AI the app works the same. Change it in You.',
      p_title: 'Your plan is ready', p_body: 'It starts today, not next Monday. This plan doesn’t change by itself: you decide every change.', p_cta: 'See today’s workout', weeks: '6 weeks',
      why: 'Why this weight', short: 'Short on time', machine: 'Machine taken', done: 'Done', plates: 'Plates',
      tip_today: 'Every weight says why. If today changes, use these two exits: your plan stays the same.', tip_log: 'This is the reason for your weight. It changes when your last session does.', tip_prog: 'This is what you really lifted, with no scores.', ok: 'Got it',
      s_title: 'How much time do you have?', s_body: 'Only today changes. Your plan stays the same.', s_45: '45 minutes', s_30: '30 minutes', s_rule: 'Example rule, the PT decides the real one: drops the last exercises of the day.', s_done: 'Today you drop {n} exercises. Your plan didn’t change.', s_tag: 'Not today',
      m_title: 'Which machine is taken?', m_pick: 'Instead of {x}', m_body: 'From the approved catalogue: same area and same movement. Only today changes.', m_none: 'No alternatives for this exercise.', m_tag: 'Today: {x}', cancel: 'Cancel',
      pl_title: 'Plates per side', pl_body: 'For {kg} kg, with a {bar} kg bar:', pl_less: 'Less than the bar alone.',
      win: 'Your moment today', winUp: 'You moved up on {x}', winTop: 'Your heaviest set on {x}', before: 'Before: {v}',
      del: 'Delete my account', del_title: 'Delete your account?', del_body: 'This deletes your profile, your plan and your workout history. It can’t be undone.', del_sim: 'Simulated: deletes nothing.', del_ok: 'Yes, delete everything', sim: 'Simulated. Nothing was deleted.',
      changes: [
        ['First run', 'Chat-style questions, then account, AI with a real “no”, and today’s workout.', 'Fitbod asks 11 questions and requires an account before showing a workout.'],
        ['Today', 'The reason for the weight in view, and two exits: short on time and machine taken.', 'Fitbod has exits, but no per-exercise reason.'],
        ['Log', 'The reason above the set, a plate calculator on barbell lifts, and no Google button.', 'Fitbod has the calculator, but not the reason.'],
        ['Finish', 'An achievement with your numbers, above the summary you already have.', 'Fitbod shows generic confetti.'],
        ['Progress', 'One short tip. Hides “+x kg/week”.', 'One tip per feature, like Fitbod.'],
        ['You', 'Delete account, saying what is deleted.', 'Fitbod hides it low down and doesn’t say.'],
      ],
      keep: 'Untouched: Today, Exercises, Progress, You, Big Done, technique, rest and supersets are what’s live today. Weights come from the demo; short on time, machine taken and delete account are simulated.',
    },
  };
  const lang = () => (document.documentElement.lang === 'es' ? 'es' : 'en');
  const t = () => TXT[lang()];
  const fill = (s, o) => { for (const k in o) s = s.replace('{' + k + '}', o[k]); return s; };
  const num = n => (lang() === 'es' ? String(n).replace('.', ',') : String(n));
  const state = { first: null, tips: {}, sheet: null, cut: [], swaps: {}, mark: true };

  /* ---------- styles ---------- */
  const style = document.createElement('style');
  style.textContent = `
  .gsx-new { position: relative; }
  body.gsx-mark .gsx-new { outline: 1px dashed rgba(201,156,161,.7); outline-offset: 3px; }
  .gsx-why { display: block; width: 100%; background: rgba(141,94,99,.18); border-radius: 14px; padding: 10px 12px; margin: 8px 0; font: 400 14px/19px var(--font-ui); color: var(--text); }
  .gsx-why b { display: block; font-size: 12px; line-height: 16px; font-weight: 600; color: #c99ca1; margin-bottom: 2px; }
  .gsx-exits { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
  .gsx-exits button, .gsx-opt { min-height: 48px; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: var(--text); font: 600 13px/18px var(--font-ui); padding: 6px 10px; cursor: pointer; }
  .gsx-tip { display: flex; gap: 10px; align-items: flex-start; background: var(--panel-strong); border-radius: 14px; padding: 10px 12px; margin: 8px 0; font: 400 13px/18px var(--font-ui); color: var(--text); }
  .gsx-tip span { flex: 1; min-width: 0; }
  .gsx-tip button { background: none; border: 0; color: #c99ca1; font: 600 13px/18px var(--font-ui); min-height: 32px; cursor: pointer; }
  .gsx-tag { display: inline-block; margin-top: 4px; font: 600 12px/16px var(--font-ui); color: #e5c07b; }
  article.gsx-cut { opacity: .45; }
  .workout-tool[title*="Google"] { display: none !important; }
  .gsx-win { background: rgba(165,220,174,.13); border-radius: 18px; padding: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 2px; font: 400 14px/19px var(--font-ui); color: var(--text); }
  .gsx-win small { font: 600 12px/16px var(--font-ui); color: #a5dcae; }
  .gsx-win strong { font-size: 26px; line-height: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .gsx-win em { font-style: normal; font-size: 13px; line-height: 18px; color: var(--muted); }
  .gsx-pill { position: fixed; right: max(12px, env(safe-area-inset-right, 0px)); bottom: calc(96px + env(safe-area-inset-bottom, 0px)); z-index: 60; width: 44px; height: 44px; padding: 0; border-radius: 22px; border: 1px dashed rgba(201,156,161,.7); background: rgba(15,15,16,.92); color: #c99ca1; font: 700 17px/22px var(--font-ui); cursor: pointer; }
  .gsx-scrim { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,.6); display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
  .gsx-sheet { width: 100%; max-width: 480px; max-height: 88%; overflow-y: auto; background: #18181a; border: 1px solid var(--line); border-radius: 22px 22px 0 0; padding: 16px 16px calc(20px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 10px; font: 400 15px/20px var(--font-ui); color: var(--text); }
  .gsx-sheet h3 { font: 600 17px/22px var(--font-ui); margin: 0; }
  .gsx-sheet p { margin: 0; }
  .gsx-cap { font-size: 13px; line-height: 18px; color: var(--muted); }
  .gsx-btn { min-height: 52px; width: 100%; border: 0; border-radius: 14px; background: linear-gradient(120deg,#8d5e63,#6c4a4e); color: #fff; font: 600 15px/20px var(--font-ui); cursor: pointer; padding: 8px 14px; }
  .gsx-btn.alt { background: var(--panel); border: 1px solid var(--line); color: var(--text); }
  .gsx-btn.quiet { background: none; color: var(--muted); min-height: 44px; }
  .gsx-btn.danger { background: rgba(217,146,146,.16); border: 1px solid rgba(217,146,146,.4); color: #efb4b4; }
  .gsx-row { border-top: 1px solid var(--line); padding-top: 8px; }
  .gsx-row b { font-weight: 600; }
  .gsx-switch { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; }
  .gsx-bar { display: flex; align-items: center; justify-content: center; gap: 2px; min-height: 96px; background: var(--panel); border-radius: 14px; padding: 8px; overflow: hidden; }
  .gsx-plate { display: grid; place-items: center; border-radius: 4px; font: 600 11px/14px var(--font-ui); color: #111; width: 26px; flex: none; }
  .gsx-rod { height: 8px; width: 56px; background: #8a8a8a; border-radius: 2px; flex: none; }
  .gsx-first { position: fixed; inset: 0; z-index: 80; background: #0f0f10; color: var(--text); font: 400 15px/21px var(--font-ui); display: flex; justify-content: center; }
  .gsx-first > div { width: 100%; max-width: 480px; height: 100%; overflow-y: auto; padding: calc(24px + env(safe-area-inset-top, 0px)) 20px calc(24px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 12px; }
  .gsx-first .end { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
  .gsx-first h2 { font: 700 28px/34px var(--font-ui); letter-spacing: -.02em; margin: 0; }
  .gsx-tagl { font-size: 13px; color: var(--muted); }
  .gsx-word { font: 800 33px/36px var(--font-ui); letter-spacing: -.03em; text-transform: uppercase; }
  .gsx-prog { display: grid; grid-template-columns: repeat(5,1fr); gap: 4px; }
  .gsx-prog i { height: 4px; border-radius: 2px; background: var(--panel-strong); display: block; }
  .gsx-prog i.on { background: #c99ca1; }
  .gsx-me { align-self: flex-end; background: rgba(141,94,99,.2); border-radius: 14px; padding: 6px 12px; }
  .gsx-opt { text-align: left; font-weight: 500; font-size: 15px; width: 100%; }
  .gsx-weeks { display: grid; grid-template-columns: repeat(6,1fr); gap: 4px; }
  .gsx-weeks i { height: 8px; border-radius: 4px; background: var(--panel-strong); display: block; }
  .gsx-weeks i:first-child { background: #c99ca1; }
  .gsx-card { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
  .gsx-sheet button:focus-visible, .gsx-first button:focus-visible, .gsx-pill:focus-visible, .gsx-new button:focus-visible { outline: 2px solid #c99ca1; outline-offset: 2px; }`;
  document.head.appendChild(style);
  document.body.classList.add('gsx-mark');

  /* ---------- first run ---------- */
  let firstEl = null;
  function closeFirst() { state.first = null; if (firstEl) { firstEl.remove(); firstEl = null; } }
  function paintFirst() {
    if (!state.first) return;
    if (!firstEl) { firstEl = document.createElement('section'); firstEl.className = 'gsx-first'; firstEl.setAttribute('aria-label', 'First run'); document.body.appendChild(firstEl); }
    const x = t(); const f = state.first; let html = '';
    if (f.step === 'welcome') {
      html = `<span class="gsx-tagl">${x.w_tag}</span><span class="gsx-word">Gym Studio</span><div class="end"><h2>${x.w_title}</h2><p class="gsx-cap">${x.w_body}</p><button class="gsx-btn" data-g="f" data-v="q">${x.w_cta}</button><button class="gsx-btn quiet" data-g="f" data-v="done">${x.w_login}</button></div>`;
    } else if (f.step === 'q') {
      const n = f.a.length; let chat = `<p>${x.hi}</p>`;
      f.a.forEach((a, i) => { chat += `<p>${x.qs[i][0]}</p><div class="gsx-me">${x.qs[i][1][a]}</div><p>${x.replies[i]}</p>`; });
      html = `<div class="gsx-prog">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>${chat}<p><b>${x.qs[n][0]}</b></p>${x.qs[n][1].map((o, i) => `<button class="gsx-opt" data-g="ans" data-v="${i}">${o}</button>`).join('')}<p class="gsx-cap">${x.notice}</p>`;
    } else if (f.step === 'n') {
      html = `<div class="end"><h2>${x.n_title}</h2><p class="gsx-cap">${x.n_body}</p><button class="gsx-btn" data-g="f" data-v="a">${x.n_yes}</button><button class="gsx-btn alt" data-g="f" data-v="a">${x.n_no}</button></div>`;
    } else if (f.step === 'a') {
      html = `<div class="end"><h2>${x.a_title}</h2><p class="gsx-cap">${x.a_body}</p><button class="gsx-btn" data-g="f" data-v="i">${x.a_btn}</button><p class="gsx-cap">${x.a_sim}</p></div>`;
    } else if (f.step === 'i') {
      html = `<div class="end"><h2>${x.i_title}</h2><p class="gsx-cap">${x.i_body}</p><button class="gsx-btn alt" data-g="f" data-v="p">${x.i_yes}</button><button class="gsx-btn alt" data-g="f" data-v="p">${x.i_no}</button><p class="gsx-cap">${x.i_note}</p></div>`;
    } else if (f.step === 'p') {
      const a = f.a; html = `<div class="end"><h2>${x.p_title}</h2><div class="gsx-card"><b>${x.qs[0][1][a[0]]}</b><div class="gsx-weeks"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="gsx-cap">${x.weeks} · ${x.qs[2][1][a[2]]} · ${x.qs[3][1][a[3]]} · ${x.qs[4][1][a[4]]}</span></div><p class="gsx-cap">${x.p_body}</p><button class="gsx-btn" data-g="f" data-v="done">${x.p_cta}</button></div>`;
    }
    firstEl.innerHTML = `<div>${html}</div>`;
    const sc = firstEl.firstChild; sc.scrollTop = sc.scrollHeight;
  }

  /* ---------- sheets ---------- */
  let sheetEl = null;
  function closeSheet() { state.sheet = null; if (sheetEl) { sheetEl.remove(); sheetEl = null; } }
  function openSheet(k, extra) { state.sheet = Object.assign({ k }, extra || {}); paintSheet(); }
  const cards = () => [...document.querySelectorAll('.day-exercises > article, .day-exercises article[data-exercise-card]')].filter((a, i, l) => l.indexOf(a) === i);
  const nameOf = a => (a.querySelector('.planned-exercise-main-name') || {}).textContent || '';
  function platesFor(kg, bar) {
    let side = (kg - bar) / 2; const out = [];
    for (const p of [25, 20, 15, 10, 5, 2.5, 1.25]) { while (side >= p - 1e-6) { out.push(p); side -= p; } }
    return out;
  }
  const PCOL = { 25: '#d98c8c', 20: '#8fb3d9', 15: '#e5c07b', 10: '#a5dcae', 5: '#e8e8e4', 2.5: '#c9a0dc', 1.25: '#bdbdb8' };
  function paintSheet() {
    const s = state.sheet; if (!s) return; const x = t(); let h = '';
    if (s.k === 'notes') {
      h = `<h3>${x.title}</h3><p class="gsx-cap">${x.intro}</p>${x.changes.map(c => `<div class="gsx-row"><b>${c[0]}</b><div>${c[1]}</div><div class="gsx-cap">${c[2]}</div></div>`).join('')}<p class="gsx-cap gsx-row">${x.keep}</p><label class="gsx-switch gsx-row"><span>${x.mark}</span><input id="gsx-mark" type="checkbox" ${state.mark ? 'checked' : ''}></label><button class="gsx-btn alt" data-g="replay">${x.replay}</button><button class="gsx-btn quiet" data-g="close">${x.close}</button>`;
    } else if (s.k === 'short') {
      h = `<h3>${x.s_title}</h3><p class="gsx-cap">${x.s_body}</p><button class="gsx-btn alt" data-g="cut" data-v="2">${x.s_45}</button><button class="gsx-btn alt" data-g="cut" data-v="4">${x.s_30}</button><p class="gsx-cap">${x.s_rule}</p><button class="gsx-btn quiet" data-g="close">${x.cancel}</button>`;
    } else if (s.k === 'machine') {
      h = `<h3>${x.m_title}</h3>${cards().map(a => `<button class="gsx-opt" data-g="pick" data-v="${a.dataset.exerciseCard}">${nameOf(a)}</button>`).join('')}<button class="gsx-btn quiet" data-g="close">${x.cancel}</button>`;
    } else if (s.k === 'alts') {
      const list = DATA.alts[s.id] || []; const card = cards().find(a => a.dataset.exerciseCard === s.id);
      h = `<h3>${fill(x.m_pick, { x: card ? nameOf(card) : '' })}</h3><p class="gsx-cap">${x.m_body}</p>${list.map(a => `<button class="gsx-opt" data-g="swap" data-v="${a.id}">${a[lang()]}</button>`).join('') || `<p class="gsx-cap">${x.m_none}</p>`}<button class="gsx-btn quiet" data-g="close">${x.cancel}</button>`;
    } else if (s.k === 'plates') {
      const bar = 20; const ps = platesFor(s.kg, bar);
      const draw = ps.slice().reverse().map(p => `<span class="gsx-plate" style="background:${PCOL[p]};height:${Math.round(34 + p * 2)}px">${num(p)}</span>`).join('');
      h = `<h3>${x.pl_title}</h3><p class="gsx-cap">${fill(x.pl_body, { kg: num(s.kg), bar })}</p>${s.kg < bar ? `<p class="gsx-cap">${x.pl_less}</p>` : `<div class="gsx-bar">${draw}<span class="gsx-rod"></span></div><p>${ps.map(num).join(' + ')} kg</p>`}<button class="gsx-btn quiet" data-g="close">${x.close}</button>`;
    } else if (s.k === 'del') {
      h = `<h3>${x.del_title}</h3><p>${x.del_body}</p><button class="gsx-btn danger" data-g="delok">${x.del_ok}</button><p class="gsx-cap">${x.del_sim}</p><button class="gsx-btn quiet" data-g="close">${x.cancel}</button>`;
    } else if (s.k === 'toast') {
      h = `<p>${s.msg}</p><button class="gsx-btn quiet" data-g="close">${x.close}</button>`;
    }
    if (!sheetEl) { sheetEl = document.createElement('div'); sheetEl.className = 'gsx-scrim'; document.body.appendChild(sheetEl); }
    sheetEl.innerHTML = `<div class="gsx-sheet" role="dialog" aria-modal="true">${h}</div>`;
  }

  /* ---------- enhancing the real app ---------- */
  function ensure(parent, before, key, build) {
    let el = parent.querySelector(':scope > [data-gsx="' + key + '"]');
    if (!el) { el = document.createElement('div'); el.dataset.gsx = key; el.className = 'gsx-new'; parent.insertBefore(el, before); }
    const html = build(); if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    return el;
  }
  const whyText = (last, lastReps, today, reps) => {
    const r = DATA.reasons;
    if (today > last) return r.up[lang()].replace('{reps}', lastReps).replace('{weight}', num(last)).replace('{todayTarget}', reps);
    if (today === last) return r.kept[lang()].replace('{weight}', num(today));
    return '';
  };
  function parseVal(s) { const m = (s || '').replace(',', '.').match(/([\d.]+)\s*[×x]\s*(\d+)/); return m ? { kg: +m[1], reps: +m[2] } : null; }

  function lastBench() {
    try {
      const h = JSON.parse(localStorage.getItem('gym-studio.demo.history')).filter(e => e.exerciseId === 'barbell-bench-press' && e.dayKey === 'upper-a' && e.date < '2026-11-02').sort((a, b) => (a.date < b.date ? -1 : 1));
      const e = h[h.length - 1]; return e && e.sets[0] ? e.sets[0] : null;
    } catch (e) { return null; }
  }
  function enhanceToday() {
    const start = document.querySelector('.start-workout-button'); if (!start || !start.parentElement) return;
    const parent = start.parentElement; const x = t();
    const before = start.nextSibling;
    const first = cards().find(a => a.dataset.exerciseCard === 'barbell-bench-press' && a === cards()[0]);
    ensure(parent, before, 'today', () => {
      const prev = first ? lastBench() : null;
      const why = prev ? `<div class="gsx-why"><b>${x.why} · ${nameOf(first)} · ${num(85)} kg</b>${whyText(prev.weight, prev.reps, 85, 6)}</div>` : '';
      const tip = state.tips.today ? '' : `<div class="gsx-tip"><span>${x.tip_today}</span><button data-g="tip" data-v="today">${x.ok}</button></div>`;
      return `${why}<div class="gsx-exits"><button data-g="sheet" data-v="short">${x.short}</button><button data-g="sheet" data-v="machine">${x.machine}</button></div>${tip}`;
    });
    cards().forEach(a => {
      const id = a.dataset.exerciseCard;
      a.classList.toggle('gsx-cut', state.cut.includes(id));
      const label = state.cut.includes(id) ? x.s_tag : state.swaps[id] ? fill(x.m_tag, { x: state.swaps[id][lang()] }) : '';
      const host = a.querySelector('.planned-exercise-name-wrap'); if (!host) return;
      let tag = host.querySelector('.gsx-tag');
      if (label) { if (!tag) { tag = document.createElement('span'); tag.className = 'gsx-tag'; tag.style.display = 'block'; host.appendChild(tag); } if (tag.textContent !== label) tag.textContent = label; } else if (tag) tag.remove();
    });
  }
  function enhanceLogger() {
    const card = document.querySelector('article.workout-mode-current'); if (!card) return;
    const x = t();
    const lastEl = card.querySelector('.effortless-last');
    const last = lastEl && parseVal(lastEl.textContent.replace(/\s*kg\s*/g, ''));
    const doneBtn = [...card.querySelectorAll('button')].find(b => /^(Done|Hecho) · /.test(b.textContent.trim()));
    const today = doneBtn && parseVal(doneBtn.textContent.replace(/\s*kg\s*/g, ''));
    let anchor = lastEl || doneBtn;
    while (anchor && anchor.parentElement !== card) anchor = anchor.parentElement;
    if (anchor) {
      ensure(card, anchor, 'why', () => {
        const tip = state.tips.log ? '' : `<div class="gsx-tip"><span>${x.tip_log}</span><button data-g="tip" data-v="log">${x.ok}</button></div>`;
        const wt = last && today ? whyText(last.kg, last.reps, today.kg, today.reps) : '';
        const why = wt ? `<div class="gsx-why"><b>${x.why}</b>${wt}</div>` : '';
        return tip + why;
      });
    }
    const tools = card.querySelector('.workout-exercise-tools');
    if (tools && /barbell/.test(card.dataset.exerciseCard || '')) {
      let b = tools.querySelector('.gsx-plates');
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'workout-tool gsx-plates gsx-new'; b.dataset.g = 'plates'; b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 12h18M7 7v10M10 5v14M14 5v14M17 7v10"/></svg><span></span>'; tools.appendChild(b); }
      const sp = b.querySelector('span'); if (sp.textContent !== x.plates) sp.textContent = x.plates;
      b.dataset.kg = today ? today.kg : '';
    }
  }
  function enhanceFinish() {
    const box = document.querySelector('.workout-completed-content'); if (!box) return;
    const metrics = box.querySelector('.workout-completed-metrics'); if (!metrics) return;
    const x = t(); let best = null;
    box.querySelectorAll('.workout-completed-insights li').forEach(li => {
      const strong = li.querySelector('strong'); const name = strong ? [...strong.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').split(' · ')[0].trim() : '';
      const m = li.textContent.replace(/,(\d)/g, '.$1').match(/([\d.]+) kg × (\d+) (?:vs|frente a|contra) ([\d.]+) kg × (\d+)/);
      if (!m) return; const up = +m[1] > +m[3];
      const item = { name, kg: +m[1], reps: m[2], beforeKg: +m[3], beforeReps: m[4], up };
      if (!best || (up && !best.up) || (up === best.up && item.kg > best.kg)) best = item;
    });
    if (!best) return;
    ensure(box, metrics, 'win', () => `<div class="gsx-win"><small>${x.win}</small><span>${fill(best.up ? x.winUp : x.winTop, { x: best.name })}</span><strong>${num(best.kg)} kg × ${best.reps}</strong><em>${fill(x.before, { v: num(best.beforeKg) + ' kg × ' + best.beforeReps })}</em></div>`);
  }
  function enhanceProgress() {
    const root = document.querySelector('.progress-v3'); if (!root) return; const x = t();
    root.querySelectorAll('*').forEach(e => { if (!e.children.length && /kg\s*\/\s*(week|semana)/i.test(e.textContent)) e.style.display = 'none'; });
    const tabs = root.querySelector('.pv3-tabs');
    if (tabs && tabs.parentElement) {
      if (state.tips.prog) { const o = tabs.parentElement.querySelector(':scope > [data-gsx="ptip"]'); if (o) o.remove(); }
      else ensure(tabs.parentElement, tabs.nextSibling, 'ptip', () => `<div class="gsx-tip"><span>${x.tip_prog}</span><button data-g="tip" data-v="prog">${x.ok}</button></div>`);
    }
  }
  function enhanceYou() {
    if (!document.querySelector('.active-tab-you')) return;
    const surf = document.querySelector('.screen-surface'); if (!surf) return;
    const hasReal = [...surf.querySelectorAll('button')].some(b => !b.dataset.g && /delete (my )?account|borrar (mi )?cuenta/i.test(b.textContent));
    if (hasReal) return;
    ensure(surf, null, 'del', () => `<button class="gsx-btn danger" data-g="sheet" data-v="del">${t().del}</button>`);
  }
  function pill() {
    let p = document.querySelector('.gsx-pill');
    if (!p) { p = document.createElement('button'); p.type = 'button'; p.className = 'gsx-pill'; p.dataset.g = 'sheet'; p.dataset.v = 'notes'; document.body.appendChild(p); }
    p.textContent = '?'; p.setAttribute('aria-label', t().pill); p.hidden = !!document.querySelector('.workout-mode-active');
  }
  let busy = false;
  function enhance() {
    if (busy) return; busy = true;
    try { enhanceToday(); enhanceLogger(); enhanceFinish(); enhanceProgress(); enhanceYou(); pill(); } catch (e) { console.error('gsx', e); }
    busy = false;
  }

  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-g]'); if (!b) return;
    const g = b.dataset.g, v = b.dataset.v, x = t();
    if (g === 'f') { if (v === 'done') { closeFirst(); enhance(); return; } if (v === 'q') state.first.a = []; state.first.step = v; paintFirst(); return; }
    if (g === 'ans') { state.first.a.push(+v); if (state.first.a.length === 5) state.first.step = 'n'; paintFirst(); return; }
    if (g === 'tip') { state.tips[v] = 1; enhance(); return; }
    if (g === 'sheet') { openSheet(v); return; }
    if (g === 'close') { closeSheet(); return; }
    if (g === 'replay') { closeSheet(); state.first = { step: 'welcome', a: [] }; paintFirst(); return; }
    if (g === 'cut') { const list = cards().map(a => a.dataset.exerciseCard); const n = Math.min(+v, Math.max(0, list.length - 2)); state.cut = list.slice(list.length - n); enhance(); openSheet('toast', { msg: fill(x.s_done, { n }) }); return; }
    if (g === 'pick') { openSheet('alts', { id: v }); return; }
    if (g === 'swap') { const id = state.sheet.id; state.swaps[id] = (DATA.alts[id] || []).find(a => a.id === v); closeSheet(); enhance(); return; }
    if (g === 'plates') { ev.preventDefault(); ev.stopPropagation(); openSheet('plates', { kg: +b.dataset.kg || 20 }); return; }
    if (g === 'delok') { openSheet('toast', { msg: x.sim }); return; }
  }, true);
  document.addEventListener('change', ev => { if (ev.target.id === 'gsx-mark') { state.mark = ev.target.checked; document.body.classList.toggle('gsx-mark', state.mark); } });

  let queued = false;
  function schedule() { if (queued) return; queued = true; setTimeout(() => { queued = false; enhance(); if (state.first) paintFirst(); if (state.sheet && state.sheet.lang !== lang()) { state.sheet.lang = lang(); paintSheet(); } }, 30); }
  /* The demo generator also logs today. Clear today once, so the prototype opens on a workout to start. */
  function clearToday() {
    try {
      const raw = localStorage.getItem('gym-studio.demo.history');
      if (!raw) { setTimeout(clearToday, 100); return; }
      const h = JSON.parse(raw); const keep = h.filter(e => e.date < '2026-11-02');
      if (keep.length !== h.length) { localStorage.setItem('gym-studio.demo.history', JSON.stringify(keep)); location.reload(); }
    } catch (e) {}
  }
  function boot() {
    const root = document.getElementById('root'); if (!root) { setTimeout(boot, 50); return; }
    clearToday();
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true, characterData: true });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    state.first = { step: 'welcome', a: [] }; paintFirst(); schedule();
  }
  boot();
  window.__gsx = { state, enhance };
})();
