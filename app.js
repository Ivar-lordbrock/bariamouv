/* BariaMouv — app.js
 * Application 100 % front-end (aucun serveur) : l'état vit en mémoire et se
 * sauvegarde dans localStorage. Rendu par gabarits HTML + délégation
 * d'événements (attributs data-action pour les clics, data-input pour la saisie).
 *
 * Plan : utilitaires · stockage & état · exercices · ateliers · navigation & modales
 *        · vues (accueil, exercices, ateliers, composer, historique) · réglages
 *        · mode séance (chrono, sons, voix) · actions · démarrage
 */
(() => {
  'use strict';

  const { CATEGORIES, PHASES, VIDEOS, EXERCISES, DEFAULT_WORKOUTS } = window.BM_DATA;
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const catOf = (id) => CAT[id] || { id, label: 'Autre', long: 'Autre', emoji: '🏷️', color: '#64748b' };

  /* ================= Utilitaires ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const plural = (n, one, many) => `${n} ${n > 1 ? many || one + 's' : one}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const setText = (sel, txt) => { const el = $(sel); if (el && el.textContent !== txt) el.textContent = txt; };

  const fmtClock = (sec) => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
  const fmtSec = (sec) => (sec < 60 ? `${sec} s` : sec % 60 ? `${Math.floor(sec / 60)} min ${sec % 60}` : `${sec / 60} min`);
  const fmtDur = (sec) => {
    if (sec < 60) return `${Math.round(sec)} s`;
    const m = Math.round(sec / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
  };
  const speakSec = (sec) => {
    if (sec < 60) return `${sec} secondes`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m === 1 ? 'une minute' : `${m} minutes`}${s ? ' ' + s : ''}`;
  };
  const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtHour = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
  const weekStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

  const ICONS = {
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>',
    next: '<path d="M5 5v14l10-7z" fill="currentColor"/><path d="M19 5v14"/>',
    prev: '<path d="M19 19V5L9 12z" fill="currentColor"/><path d="M5 5v14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/>',
    star: '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  };
  const icon = (name, cls = 'w-6 h-6') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ================= Stockage & état ================= */
  const NS = 'bariamouv.v1.';
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(NS + k); return v == null ? fb : JSON.parse(v); } catch { return fb; } },
    set(k, v) {
      try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; }
      catch { toast('⚠️ Mémoire du téléphone pleine : supprime des photos ou exporte tes données.'); return false; }
    },
    del(k) { try { localStorage.removeItem(NS + k); } catch { /* stockage indisponible */ } },
  };

  const DEFAULT_SETTINGS = {
    theme: 'auto', bigText: false, phase: 1, weeklyGoal: 3,
    sound: true, voice: true, voiceURI: '', voiceRate: 1, vibrate: true, prep: 10, switchTime: 5, restBetween: 60, accepted: false,
  };

  const S = {
    settings: { ...DEFAULT_SETTINGS, ...store.get('settings', {}) },
    overrides: store.get('overrides', {}), // modifications des exercices du livret (catégorie, favori, masqué…)
    custom: store.get('custom', []), // exercices ajoutés par l'utilisateur
    workouts: store.get('workouts', null),
    history: store.get('history', []),
    view: 'home',
    lib: { q: '', cat: 'all', seated: false, fav: false, phase: false },
    builder: null, // { id, open }
    picker: null, // { q, cat }
    form: null, // formulaire d'exercice en cours
    checkin: null, // questionnaire avant séance
    player: null, // séance en cours
  };

  const saveSettings = () => store.set('settings', S.settings);
  const saveWorkouts = () => store.set('workouts', S.workouts);
  const saveHistory = () => store.set('history', S.history);

  /* ================= Exercices ================= */
  let exCache = null;
  function EX() {
    if (!exCache) {
      const all = EXERCISES.map((e) => ({ ...e, ...(S.overrides[e.id] || {}), builtin: true }))
        .concat(S.custom.map((e) => ({ ...e, builtin: false })));
      exCache = { all, map: new Map(all.map((e) => [e.id, e])) };
    }
    return exCache;
  }
  const getEx = (id) => EX().map.get(id);
  const visibleEx = () => EX().all.filter((e) => !e.hidden);

  function updateExercise(id, patch) {
    const e = getEx(id);
    if (!e) return;
    if (e.builtin) {
      S.overrides[id] = { ...(S.overrides[id] || {}), ...patch };
      store.set('overrides', S.overrides);
    } else {
      const i = S.custom.findIndex((c) => c.id === id);
      S.custom[i] = { ...S.custom[i], ...patch };
      store.set('custom', S.custom);
    }
    exCache = null;
  }

  // Tri automatique : propose une catégorie à partir du nom, de l'objectif et des consignes.
  // Les familles spécifiques (étirement, mobilité…) pèsent plus lourd que les zones du corps.
  const CAT_RULES = [
    ['souplesse', 3, ['etir', 'souplesse', 'stretch', 'assoupl']],
    ['mobilite', 3, ['mobilit', 'rotation', 'articul', 'poignet', 'nuque']],
    ['equilibre', 2, ['equilibre', 'unipodal', 'proprio', 'coordination', 'cerceau']],
    ['abdo', 2, ['abdo', 'gainage', 'planche', 'pont', 'bassin', 'sangle', 'lombaire', 'allonge', 'quatre pattes']],
    // « endurance » seul est exclu : le livret parle aussi d'« endurance musculaire » (renforcement).
    ['cardio', 2, ['marche', 'cardio', 'step', 'velo', 'aerobie', 'natation', 'aquagym', 'danse', 'elliptique', 'essouffl']],
    ['haut', 1, ['bras', 'epaule', 'pector', 'triceps', 'biceps', 'dos\\b', 'dorsa', 'pompe', 'haltere', 'elastique', 'ballon', 'buste']],
    ['bas', 1, ['jambe', 'cuisse', 'quadri', 'fessier', 'mollet', 'genou', 'squat', 'fente', 'ischio', 'talon', 'tibia', 'cheville']],
  ].map(([cat, w, kws]) => [cat, w, kws.map((k) => new RegExp('\\b' + k))]);

  function suggestCategory(text) {
    const t = norm(text);
    let best = null, score = 0;
    for (const [cat, w, res] of CAT_RULES) {
      const s = res.reduce((n, re) => n + (re.test(t) ? w : 0), 0);
      if (s > score) { score = s; best = cat; }
    }
    return best;
  }

  function compressImage(file, max = 640, quality = 0.75) {
    // Ré-encodage via canvas : image légère pour localStorage, et sans métadonnées (GPS…).
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
      img.src = url;
    });
  }

  /* ================= Ateliers ================= */
  const itemFromEx = (e) => ({
    uid: uid(), exId: e.id, mode: e.mode, sets: e.sets, reps: e.reps, duration: e.duration, rest: e.rest, restAfter: S.settings.restBetween,
  });
  const getWorkout = (id) => S.workouts.find((w) => w.id === id);

  function seedWorkouts() {
    return DEFAULT_WORKOUTS.map((w) => ({
      id: w.id, name: w.name, emoji: w.emoji, createdAt: Date.now(),
      items: w.items.map(getEx).filter(Boolean).map(itemFromEx),
    }));
  }

  // Dosage effectif d'un élément d'atelier (version allégée : −1 série, −30 %, pauses +25 %).
  function dose(it, light) {
    const d = { mode: it.mode, sets: it.sets, reps: it.reps, duration: it.duration, rest: it.rest, restAfter: it.restAfter ?? S.settings.restBetween };
    if (light) {
      d.sets = Math.max(1, d.sets - 1);
      d.reps = Math.max(3, Math.round(d.reps * 0.7));
      d.duration = Math.max(10, Math.round((d.duration * 0.7) / 5) * 5);
      d.rest = Math.round((d.rest * 1.25) / 5) * 5;
      d.restAfter = Math.round((d.restAfter * 1.25) / 5) * 5;
    }
    return d;
  }

  function doseText(d, e) {
    if (d.mode === 'time') return `${d.sets} × ${fmtSec(d.duration)}${e.perSide ? ` par ${e.side || 'côté'}` : ''}`;
    return `${d.sets} × ${d.reps} rép.${e.per ? ' ' + e.per : ''}`;
  }

  // Durée estimée : ~4 s par répétition (7 s quand elle se fait des deux côtés).
  function estimate(items, light = false) {
    let t = S.settings.prep;
    const list = items.filter((it) => getEx(it.exId));
    list.forEach((it, i) => {
      const e = getEx(it.exId), d = dose(it, light);
      const sides = d.mode === 'time' && e.perSide ? 2 : 1;
      const work = d.mode === 'time'
        ? d.duration * sides + (sides - 1) * S.settings.switchTime
        : d.reps * (/jambe|pied|sens|bras|cote/.test(norm(e.per)) ? 7 : 4);
      t += d.sets * work + (d.sets - 1) * d.rest + (i < list.length - 1 ? d.restAfter : 0);
    });
    return t;
  }

  const aboveCount = (items) => items.filter((it) => (getEx(it.exId)?.phase || 1) > S.settings.phase).length;

  function createWorkout(exIds = []) {
    const w = {
      id: 'w-' + uid(), name: `Ma séance du ${fmtShort.format(Date.now())}`, emoji: '🧩', createdAt: Date.now(), fresh: true,
      items: exIds.map(getEx).filter(Boolean).map(itemFromEx),
    };
    S.workouts.unshift(w);
    saveWorkouts();
    return w;
  }

  /* ================= Navigation, modales, notifications ================= */
  // Une seule entrée d'historique couvre « quelque chose est ouvert par-dessus »
  // (modale ou séance) : le bouton Retour d'Android ferme au lieu de quitter l'appli.
  // La fermeture est différée d'un instant : si une autre fenêtre s'ouvre aussitôt
  // (confirmation, sélecteur…), elle réutilise la même entrée au lieu de se battre avec history.back().
  let overlayEntry = !!history.state?.bmOverlay, ignorePop = 0, popTimer = null, modalOpen = false, modalOnClose = null;

  function pushOverlay() {
    if (popTimer) { clearTimeout(popTimer); popTimer = null; }
    if (!overlayEntry) { overlayEntry = true; history.pushState({ bmOverlay: 1 }, ''); }
  }
  function popOverlay() {
    if (!overlayEntry || popTimer) return;
    popTimer = setTimeout(() => {
      popTimer = null;
      if (modalOpen || S.player || !overlayEntry) return;
      overlayEntry = false;
      ignorePop++;
      history.back();
    }, 80);
  }

  function openModal(inner, { onClose = null, label = 'Fenêtre' } = {}) {
    const root = $('#modal-root');
    const wasOpen = modalOpen;
    const scroll = wasOpen ? root.querySelector('.modal-sheet')?.scrollTop || 0 : 0;
    root.innerHTML = `<div class="modal-backdrop fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center ${wasOpen ? 'no-anim' : ''}" data-action="modal-backdrop">
      <div class="modal-sheet w-full max-w-md bg-card rounded-t-[1.75rem] sm:rounded-[1.75rem] max-h-[94dvh] overflow-y-auto overscroll-contain shadow-2xl" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1">${inner}</div>
    </div>`;
    modalOnClose = onClose;
    modalOpen = true;
    document.body.classList.add('overflow-hidden');
    pushOverlay();
    const sheet = root.querySelector('.modal-sheet');
    // Ré-affichage de la même fenêtre (réglage modifié…) : on garde la position de défilement.
    if (wasOpen) sheet.scrollTop = scroll; else sheet.focus({ preventScroll: true });
  }

  function closeModal({ fromPop = false } = {}) {
    if (!modalOpen) return;
    modalOpen = false;
    $('#modal-root').innerHTML = '';
    const cb = modalOnClose;
    modalOnClose = null;
    if (!S.player) {
      document.body.classList.remove('overflow-hidden');
      if (!fromPop) popOverlay();
    }
    cb?.();
  }

  // Petite boîte de dialogue à choix ; résout l'id du bouton choisi (ou null si fermée).
  let choiceResolve = null;
  function choose({ title, message = '', choices }) {
    return new Promise((resolve) => {
      choiceResolve?.(null);
      choiceResolve = resolve;
      openModal(`<div class="p-5">
        <h2 class="text-xl font-black">${esc(title)}</h2>
        ${message ? `<p class="text-muted mt-2 leading-relaxed">${message}</p>` : ''}
        <div class="grid gap-2 mt-5">${choices.map((c) => `<button class="btn ${c.kind === 'primary' ? 'btn-primary' : c.kind === 'danger' ? 'btn-danger' : 'btn-ghost'}" data-action="choice" data-id="${esc(c.id)}">${c.label}</button>`).join('')}</div>
      </div>`, { label: title, onClose: () => { const r = choiceResolve; choiceResolve = null; r?.(null); } });
    });
  }
  const confirmBox = async (title, message, label = 'Confirmer', danger = true) =>
    (await choose({ title, message, choices: [{ id: 'ok', label, kind: danger ? 'danger' : 'primary' }, { id: 'no', label: 'Annuler' }] })) === 'ok';

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  const ROUTES = { accueil: 'home', exercices: 'library', ateliers: 'workouts', historique: 'history', atelier: 'builder' };
  function route() {
    let v = ROUTES[location.hash.slice(1)] || 'home';
    if (v === 'builder' && !S.builder) { v = 'workouts'; history.replaceState(history.state, '', '#ateliers'); }
    if (S.view === 'builder' && v !== 'builder') leaveBuilder();
    const changed = S.view !== v;
    S.view = v;
    render();
    if (changed) window.scrollTo(0, 0);
  }
  function go(hash) {
    if (overlayEntry) {
      // Une fenêtre vient de se fermer : on remplace son entrée d'historique au lieu d'en empiler une nouvelle.
      if (popTimer) { clearTimeout(popTimer); popTimer = null; }
      overlayEntry = false;
      history.replaceState(null, '', hash);
      route();
    } else if (location.hash === hash) route();
    else location.hash = hash;
  }

  function render() {
    const v = S.view;
    $('#view').innerHTML = VIEWS[v]();
    $$('#tabbar [data-view]').forEach((a) => {
      const on = a.dataset.view === v || (v === 'builder' && a.dataset.view === 'workouts');
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#tabbar').hidden = v === 'builder';
    $('#phase-badge').textContent = `Phase ${S.settings.phase}`;
    if (v === 'builder') bindSortable($('#builder-list'));
  }

  /* ================= Vue : accueil ================= */
  const RULES = [
    ['💧', "Bois par <b>petites gorgées</b>, avant et après l'effort, jamais de grandes quantités d'un coup."],
    ['🍽️', 'Évite de faire ta séance <b>juste après un repas</b>.'],
    ['🌬️', "<b>Expire pendant l'effort</b> et ne bloque jamais ta respiration : cela protège ta paroi abdominale."],
    ['🗣️', "<b>Test de la parole</b> : tu dois pouvoir parler pendant l'effort."],
    ['🦴', "<b>Aucune douleur articulaire</b> : réduis l'amplitude ou passe l'exercice."],
    ['📈', "<b>Progresse lentement</b> : +2 répétitions ou +5 secondes quand c'est facile, pas plus."],
    ['🍬', 'Si tu fais des hypoglycémies, garde une <b>collation adaptée</b> à portée, selon les conseils de ta diététicienne.'],
    ['🛑', '<b>Arrête-toi</b> en cas de vertige, malaise, douleur thoracique ou abdominale, nausées ou essoufflement inhabituel.'],
  ];

  function viewHome() {
    const now = Date.now(), ws = weekStart(now);
    const week = S.history.filter((h) => h.startedAt >= ws);
    const days = new Set(week.map((h) => (new Date(h.startedAt).getDay() + 6) % 7));
    const today = (new Date().getDay() + 6) % 7;
    const goal = S.settings.weeklyGoal;
    const minutes = Math.round(week.reduce((a, h) => a + (h.activeSec || 0), 0) / 60);
    const lastW = S.history.length ? getWorkout(S.history[0].workoutId) : null;
    const w = lastW && lastW.items.length ? lastW : S.workouts.find((x) => x.items.length);
    const hour = new Date().getHours();
    const left = Math.max(0, goal - week.length);
    const phase = PHASES[S.settings.phase];

    return `
    <section class="pt-1">
      <p class="text-sm text-muted font-bold">${esc(cap(fmtLong.format(now)))}</p>
      <h1 class="text-[1.75rem] font-black leading-tight">${hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour'} 👋</h1>
      <p class="text-muted font-semibold">On bouge à ton rythme aujourd'hui ?</p>
    </section>

    ${w ? `<section class="card hero p-5 mt-4">
      <p class="text-sm font-bold opacity-90">${lastW === w ? 'Reprendre ta dernière séance' : 'Séance suggérée'}</p>
      <h2 class="text-2xl font-black mt-1 leading-tight">${esc(w.emoji || '🧩')} ${esc(w.name)}</h2>
      <p class="text-sm font-bold opacity-90 mt-0.5">${plural(w.items.length, 'exercice')} · ~${fmtDur(estimate(w.items))}</p>
      <button class="btn btn-light btn-lg w-full mt-4" data-action="launch" data-id="${esc(w.id)}">${icon('play', 'w-5 h-5')} Lancer la séance</button>
      <div class="grid grid-cols-2 gap-2 mt-2">
        <a class="btn btn-glass btn-sm" href="#ateliers">Choisir un atelier</a>
        <button class="btn btn-glass btn-sm" data-action="new-workout">Composer ma séance</button>
      </div>
    </section>` : `<section class="card p-5 mt-4 text-center">
      <div class="text-5xl">🧩</div>
      <h2 class="text-xl font-black mt-2">Compose ta première séance</h2>
      <p class="text-muted text-sm mt-1">Pioche dans ta bibliothèque d'exercices en quelques touches.</p>
      <button class="btn btn-primary w-full mt-4" data-action="new-workout">${icon('plus', 'w-5 h-5')} Composer ma séance</button>
    </section>`}

    <section class="card p-4 mt-4">
      <div class="flex items-center justify-between">
        <h2 class="font-black text-lg">Cette semaine</h2>
        <span class="text-sm font-bold text-muted">${week.length} / ${goal} séances</span>
      </div>
      <div class="grid grid-cols-7 gap-1 mt-3">
        ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => `<div class="flex flex-col items-center gap-1">
          <div class="day-dot ${days.has(i) ? 'is-done' : ''} ${i === today ? 'is-today' : ''}">${days.has(i) ? icon('check', 'w-4 h-4') : ''}</div>
          <span class="text-xs font-bold text-muted">${l}</span></div>`).join('')}
      </div>
      <div class="progress mt-4"><div style="width:${Math.min(100, (week.length / goal) * 100)}%"></div></div>
      <p class="text-sm text-muted font-semibold mt-2">${left === 0 ? 'Objectif atteint 🎉' : `Encore ${plural(left, 'séance')} pour ton objectif`} · ${minutes} min actives</p>
    </section>

    <details class="card p-4 mt-4" ${S.history.length ? '' : 'open'}>
      <summary class="flex items-center justify-between font-black text-lg">🛡️ Mes règles d'or ${icon('chevron', 'w-5 h-5 text-muted')}</summary>
      <ul class="rules mt-3 space-y-3 text-[15px]">${RULES.map(([e, t]) => `<li><span>${e}</span><span>${t}</span></li>`).join('')}</ul>
    </details>

    <button class="card p-4 mt-4 w-full text-left flex items-center gap-3" data-action="open-settings">
      <span class="w-12 h-12 rounded-2xl bg-brand/15 text-brand grid place-items-center font-black text-lg shrink-0">P${S.settings.phase}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-black">Ma phase : ${esc(phase.label)}</span>
        <span class="block text-sm text-muted font-semibold">${esc(phase.desc)}</span>
      </span>
      ${icon('chevronRight', 'w-5 h-5 text-muted')}
    </button>

    <details class="card p-4 mt-4">
      <summary class="flex items-center justify-between font-black text-lg">🎬 Vidéos de mon livret ${icon('chevron', 'w-5 h-5 text-muted')}</summary>
      <ul class="mt-2">${VIDEOS.map((vd) => `<li><a class="flex items-center gap-3 py-2.5" href="${esc(vd.url)}" target="_blank" rel="noopener">
        <span class="tag" style="--c:${catOf(vd.cat).color}">${catOf(vd.cat).emoji}</span>
        <span class="flex-1 font-bold">${esc(vd.title)}</span>${icon('external', 'w-4 h-4 text-muted')}</a></li>`).join('')}</ul>
    </details>

    <p class="text-xs text-muted text-center mt-6 px-4 leading-relaxed">BariaMouv ne remplace pas l'avis de ton équipe médicale. En cas de doute, demande conseil à ton chirurgien, ton médecin ou ton enseignant APA.</p>`;
  }

  /* ================= Vue : exercices ================= */
  const POS = { assis: '🪑 Assis', debout: '🧍 Debout', sol: '🧘 Au sol' };
  const exThumb = (e, cls = 'thumb') => (e.img
    ? `<img class="${cls}" src="${esc(e.img)}" alt="" loading="lazy">`
    : `<span class="${cls} thumb-ph" aria-hidden="true">${catOf(e.cat).emoji}</span>`);
  const catTag = (id) => { const c = catOf(id); return `<span class="tag" style="--c:${c.color}">${c.emoji} ${esc(c.label)}</span>`; };
  const phaseTag = (e) => (e.phase > S.settings.phase ? `<span class="tag tag-warn">⚠️ Phase ${e.phase}</span>` : '');

  function exCard(e) {
    return `<button class="ex-card" data-action="ex-open" data-id="${esc(e.id)}">
      ${exThumb(e)}
      <span class="min-w-0 flex-1">
        <span class="block font-black leading-tight">${esc(e.name)}${e.fav ? ' ⭐' : ''}</span>
        <span class="block text-sm text-muted font-semibold mt-0.5">${esc(doseText(e, e))}</span>
        <span class="flex flex-wrap gap-1 mt-1.5">${catTag(e.cat)}<span class="tag tag-neutral">${POS[e.position] || ''}</span>${phaseTag(e)}${e.builtin ? '' : '<span class="tag tag-neutral">Perso</span>'}</span>
      </span>
    </button>`;
  }

  function filterEx(f, ignoreCat = false) {
    const q = norm(f.q).trim();
    return visibleEx().filter((e) => (ignoreCat || f.cat === 'all' || e.cat === f.cat)
      && (!f.seated || e.position === 'assis')
      && (!f.fav || e.fav)
      && (!f.phase || e.phase <= S.settings.phase)
      && (!q || norm([e.name, e.objective, catOf(e.cat).label, (e.equipment || []).join(' '), e.position].join(' ')).includes(q)));
  }

  function catChips(f, action) {
    const base = filterEx(f, true);
    return `<div class="chips-row">
      <button class="chip ${f.cat === 'all' ? 'is-on' : ''}" data-action="${action}" data-cat="all">Tous <span class="count">${base.length}</span></button>
      ${CATEGORIES.map((c) => `<button class="chip ${f.cat === c.id ? 'is-on' : ''}" data-action="${action}" data-cat="${c.id}">${c.emoji} ${esc(c.label)} <span class="count">${base.filter((e) => e.cat === c.id).length}</span></button>`).join('')}
    </div>`;
  }

  function libChips() {
    const f = S.lib;
    return `${catChips(f, 'lib-cat')}
    <div class="chips-row mt-1.5">
      <button class="chip ${f.seated ? 'is-on' : ''}" data-action="lib-flag" data-flag="seated">🪑 Assis</button>
      <button class="chip ${f.fav ? 'is-on' : ''}" data-action="lib-flag" data-flag="fav">⭐ Favoris</button>
      <button class="chip ${f.phase ? 'is-on' : ''}" data-action="lib-flag" data-flag="phase">✅ Adapté à ma phase</button>
    </div>`;
  }

  const emptyState = (emoji, title, text) => `<div class="text-center py-12 text-muted"><div class="text-5xl mb-3">${emoji}</div><p class="font-black text-ink">${title}</p><p class="text-sm mt-1">${text}</p></div>`;

  function libList() {
    const list = filterEx(S.lib);
    if (!list.length) return emptyState('🔍', 'Aucun exercice trouvé', 'Modifie la recherche ou les filtres.');
    if (S.lib.cat !== 'all' || S.lib.q.trim()) return `<div class="space-y-2 mt-4">${list.map(exCard).join('')}</div>`;
    // Vue « triée » : un bloc par catégorie.
    return CATEGORIES.map((c) => {
      const items = list.filter((e) => e.cat === c.id);
      return items.length ? `<h2 class="cat-head" style="--c:${c.color}"><span class="dot"></span><span class="font-black text-lg flex-1">${c.emoji} ${esc(c.long)}</span><span class="text-sm text-muted font-bold">${items.length}</span></h2>
        <div class="space-y-2">${items.map(exCard).join('')}</div>` : '';
    }).join('');
  }

  function viewLibrary() {
    return `
    <div class="pt-1">
      <h1 class="text-[1.75rem] font-black leading-tight">Exercices</h1>
      <p class="text-sm text-muted font-semibold">${plural(visibleEx().length, 'exercice')}, triés par catégorie</p>
    </div>
    <label class="search mt-3">${icon('search', 'w-5 h-5')}<input type="search" data-input="lib-q" value="${esc(S.lib.q)}" placeholder="Rechercher (genou, ballon, étirement…)" enterkeyhint="search" autocomplete="off" aria-label="Rechercher un exercice"></label>
    <div id="lib-chips" class="mt-3">${libChips()}</div>
    <div id="lib-list">${libList()}</div>
    <button class="fab" data-action="ex-new" aria-label="Ajouter un exercice">${icon('plus', 'w-7 h-7')}</button>`;
  }

  function refreshLibrary() {
    if (S.view !== 'library') return;
    $('#lib-chips').innerHTML = libChips();
    $('#lib-list').innerHTML = libList();
  }

  function openExercise(id) {
    const e = getEx(id);
    if (!e) return;
    const ph = e.phase > S.settings.phase;
    openModal(`
      <div class="relative">
        ${e.img ? `<img src="${esc(e.img)}" alt="Illustration : ${esc(e.name)}" class="w-full max-h-[42dvh] object-contain bg-white rounded-t-[1.75rem]">` : `<div class="h-32 grid place-items-center text-6xl bg-card2 rounded-t-[1.75rem]">${catOf(e.cat).emoji}</div>`}
        <button class="icon-btn absolute top-3 right-3 bg-card/90 shadow" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
      </div>
      <div class="p-5 space-y-5">
        <div>
          <div class="flex flex-wrap gap-1.5">${catTag(e.cat)}<span class="tag tag-neutral">${POS[e.position] || ''}</span><span class="tag tag-neutral">Phase ${e.phase} · ${esc(PHASES[e.phase]?.label || '')}</span></div>
          <h2 class="text-2xl font-black mt-2 leading-tight">${esc(e.name)}</h2>
          ${e.objective ? `<p class="text-muted font-semibold mt-1">${esc(e.objective)}</p>` : ''}
        </div>

        ${ph ? `<div class="warn text-sm"><b>⚠️ Prévu à partir de la phase ${e.phase}.</b> Tu es en phase ${S.settings.phase} : demande l'accord de ton équipe avant de l'intégrer à tes séances.</div>` : ''}

        <div class="grid grid-cols-2 gap-2">
          <div class="note"><div class="section-title !mb-1">Par défaut</div><div class="font-black">${esc(doseText(e, e))}</div><div class="text-sm text-muted font-semibold">repos ${fmtSec(e.rest)}</div></div>
          <div class="note"><div class="section-title !mb-1">Livret</div><div class="text-sm font-bold leading-snug">${esc(e.dosage || '—')}</div></div>
        </div>

        ${e.steps?.length ? `<div><h3 class="section-title">Consignes</h3><ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
        ${e.note ? `<div class="note text-[15px]">📝 ${esc(e.note)}</div>` : ''}
        ${e.tip ? `<div class="tip text-[15px]"><b class="text-brand">💡 Parcours bariatrique</b><p class="mt-1">${esc(e.tip)}</p></div>` : ''}
        ${e.progression?.length ? `<div><h3 class="section-title">Progression du livret</h3><ol class="steps">${e.progression.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}

        <div>
          <h3 class="section-title">Catégorie · touche pour reclasser</h3>
          <div class="flex flex-wrap gap-2">${CATEGORIES.map((c) => `<button class="chip ${c.id === e.cat ? 'is-on' : ''}" data-action="ex-setcat" data-id="${esc(e.id)}" data-cat="${c.id}">${c.emoji} ${esc(c.label)}</button>`).join('')}</div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-primary col-span-2" data-action="ex-add" data-id="${esc(e.id)}">${icon('plusCircle', 'w-5 h-5')} Ajouter à un atelier</button>
          <button class="btn btn-ghost" data-action="ex-fav" data-id="${esc(e.id)}">${e.fav ? '★ Favori' : `${icon('star', 'w-5 h-5')} Favori`}</button>
          <button class="btn btn-ghost" data-action="ex-edit" data-id="${esc(e.id)}">${icon('edit', 'w-5 h-5')} Modifier</button>
          ${e.sheet && e.builtin ? `<button class="btn btn-ghost" data-action="ex-sheet" data-id="${esc(e.id)}">${icon('file', 'w-5 h-5')} Fiche</button>` : ''}
          ${e.video ? `<a class="btn btn-ghost" href="${esc(e.video)}" target="_blank" rel="noopener">${icon('video', 'w-5 h-5')} Vidéo</a>` : ''}
          <button class="btn btn-danger col-span-2" data-action="ex-remove" data-id="${esc(e.id)}">${e.builtin ? `${icon('eyeOff', 'w-5 h-5')} Masquer de la bibliothèque` : `${icon('trash', 'w-5 h-5')} Supprimer`}</button>
        </div>
      </div>`, { label: e.name });
  }

  function openSheet(id) {
    const e = getEx(id);
    openModal(`<div class="p-4">
      <div class="flex items-center justify-between gap-2 mb-3">
        <h2 class="font-black text-lg">Fiche d'origine · ${esc(e.name)}</h2>
        <button class="icon-btn" data-action="ex-open" data-id="${esc(e.id)}" aria-label="Retour">${icon('back')}</button>
      </div>
      <img src="${esc(e.sheet)}" alt="Page du livret" class="w-full rounded-2xl bg-white">
      <a class="btn btn-ghost w-full mt-3" href="${esc(e.sheet)}" target="_blank" rel="noopener">${icon('external', 'w-5 h-5')} Ouvrir en grand (zoom)</a>
    </div>`, { label: "Fiche d'origine" });
  }

  function openAddToWorkout(exId) {
    const e = getEx(exId);
    openModal(`<div class="p-5">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-xl font-black">Ajouter « ${esc(e.name)} »</h2>
        <button class="icon-btn" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
      </div>
      <p class="text-muted text-sm font-semibold mt-1">Dans quel atelier ?</p>
      <div class="grid gap-2 mt-4">
        <button class="btn btn-primary" data-action="add-to-new" data-ex="${esc(exId)}">${icon('plus', 'w-5 h-5')} Nouvel atelier</button>
        ${S.workouts.map((w) => `<button class="pick-row" data-action="add-to" data-w="${esc(w.id)}" data-ex="${esc(exId)}">
          <span class="w-11 h-11 rounded-xl bg-card2 grid place-items-center text-xl shrink-0">${esc(w.emoji || '🧩')}</span>
          <span class="flex-1 min-w-0"><span class="block font-black truncate">${esc(w.name)}</span><span class="block text-sm text-muted">${plural(w.items.length, 'exercice')}</span></span>
          <span class="pick-badge">${icon('plus', 'w-5 h-5')}</span></button>`).join('')}
      </div>
    </div>`, { label: 'Ajouter à un atelier' });
  }

  function openExerciseForm(id = null) {
    const src = id ? getEx(id) : {
      name: '', cat: '', objective: '', position: 'assis', phase: 1, mode: 'reps', sets: 2, reps: 10, duration: 30, rest: 45,
      perSide: false, side: 'côté', per: '', steps: [], note: '', tip: '', video: '', img: '',
    };
    S.form = { id, img: src.img || '', catTouched: !!id };
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
    openModal(`<form class="p-5 space-y-4" data-submit="ex-save" novalidate>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-xl font-black">${id ? "Modifier l'exercice" : 'Nouvel exercice'}</h2>
        <button type="button" class="icon-btn" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
      </div>

      <div class="flex items-center gap-3">
        <div id="f-img-prev" class="w-24 h-24 rounded-2xl bg-card2 overflow-hidden grid place-items-center text-3xl shrink-0">${src.img ? `<img src="${esc(src.img)}" alt="" class="w-full h-full object-cover">` : '📷'}</div>
        <label class="btn btn-ghost flex-1">${icon('camera', 'w-5 h-5')} Photo<input type="file" accept="image/*" class="sr-only" data-input="f-img"></label>
      </div>

      <label class="block"><span class="label">Nom de l'exercice *</span>
        <input name="name" class="input" required maxlength="70" value="${esc(src.name)}" data-input="f-suggest" placeholder="Ex. : Squat sur chaise"></label>

      <label class="block"><span class="label">Catégorie</span>
        <select name="cat" class="input" data-input="f-cat">${opt('', '— Choisir —', src.cat)}${CATEGORIES.map((c) => opt(c.id, `${c.emoji} ${c.label}`, src.cat)).join('')}</select>
        <span id="f-cat-hint" class="block text-sm text-brand font-bold mt-1.5"></span></label>

      <label class="block"><span class="label">Objectif</span>
        <input name="objective" class="input" maxlength="120" value="${esc(src.objective)}" data-input="f-suggest" placeholder="Ex. : Renforcer les cuisses"></label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block"><span class="label">Position</span>
          <select name="position" class="input">${Object.entries(POS).map(([k, l]) => opt(k, l, src.position)).join('')}</select></label>
        <label class="block"><span class="label">Phase</span>
          <select name="phase" class="input">${[1, 2, 3].map((p) => opt(p, `${p} · ${PHASES[p].label}`, src.phase)).join('')}</select></label>
      </div>

      <div><span class="label">Type d'effort</span>
        <div class="seg" role="radiogroup">
          <label class="contents"><input type="radio" name="mode" value="reps" class="sr-only peer/reps" data-input="f-mode" ${src.mode !== 'time' ? 'checked' : ''}><span class="seg-opt">🔁 Répétitions</span></label>
          <label class="contents"><input type="radio" name="mode" value="time" class="sr-only" data-input="f-mode" ${src.mode === 'time' ? 'checked' : ''}><span class="seg-opt">⏱️ Durée</span></label>
        </div></div>

      <div class="grid grid-cols-2 gap-3">
        <label class="block"><span class="label">Séries</span><input name="sets" type="number" inputmode="numeric" min="1" max="10" class="input" value="${src.sets}"></label>
        <label class="block" data-mode="reps"><span class="label">Répétitions</span><input name="reps" type="number" inputmode="numeric" min="1" max="100" class="input" value="${src.reps}"></label>
        <label class="block" data-mode="time"><span class="label">Durée (secondes)</span><input name="duration" type="number" inputmode="numeric" min="5" max="1800" class="input" value="${src.duration}"></label>
        <label class="block"><span class="label">Repos entre séries (s)</span><input name="rest" type="number" inputmode="numeric" min="0" max="600" class="input" value="${src.rest}"></label>
      </div>
      <label class="block" data-mode="reps"><span class="label">Précision (facultatif)</span>
        <input name="per" class="input" maxlength="30" value="${esc(src.per)}" placeholder="Ex. : par jambe"></label>
      <label class="check-row" data-mode="time"><input type="checkbox" name="perSide" ${src.perSide ? 'checked' : ''}><span>Chaque côté (droite puis gauche, enchaînés)</span></label>

      <label class="block"><span class="label">Consignes (une par ligne)</span>
        <textarea name="steps" class="input" rows="4" data-input="f-suggest" placeholder="Assis au bord de la chaise…">${esc((src.steps || []).join('\n'))}</textarea></label>
      <label class="block"><span class="label">Remarque / variante</span><textarea name="note" class="input" rows="2">${esc(src.note)}</textarea></label>
      <label class="block"><span class="label">Conseil bariatrique</span><textarea name="tip" class="input" rows="2">${esc(src.tip)}</textarea></label>
      <label class="block"><span class="label">Lien vidéo (facultatif)</span><input name="video" type="url" class="input" value="${esc(src.video)}" placeholder="https://…"></label>

      <button class="btn btn-primary btn-lg w-full" type="submit">${icon('check', 'w-5 h-5')} Enregistrer</button>
    </form>`, { label: 'Exercice', onClose: () => { S.form = null; } });
    syncFormMode();
  }

  function syncFormMode() {
    const form = $('form[data-submit="ex-save"]');
    if (!form) return;
    const mode = form.elements.mode.value;
    $$('[data-mode]', form).forEach((el) => { el.hidden = el.dataset.mode !== mode; });
    $$('.seg-opt', form).forEach((el) => { el.classList.toggle('is-on', el.previousElementSibling.checked); });
  }

  function saveExerciseForm(form) {
    const f = form.elements;
    const name = f.name.value.trim();
    if (!name) { f.name.focus(); toast('Donne un nom à ton exercice.'); return; }
    const num = (el, a, b, d) => { const n = parseInt(el.value, 10); return Number.isFinite(n) ? clamp(n, a, b) : d; };
    const text = [name, f.objective.value, f.steps.value].join(' ');
    const data = {
      name, cat: f.cat.value || suggestCategory(text) || 'bas',
      objective: f.objective.value.trim(), position: f.position.value, phase: +f.phase.value,
      mode: f.mode.value, sets: num(f.sets, 1, 10, 2), reps: num(f.reps, 1, 100, 10), duration: num(f.duration, 5, 1800, 30), rest: num(f.rest, 0, 600, 45),
      per: f.per.value.trim(), perSide: f.perSide.checked,
      steps: f.steps.value.split('\n').map((s) => s.trim()).filter(Boolean),
      note: f.note.value.trim(), tip: f.tip.value.trim(), video: /^https?:\/\//.test(f.video.value.trim()) ? f.video.value.trim() : '',
      img: S.form.img,
    };
    const id = S.form.id;
    if (id) {
      updateExercise(id, data);
    } else {
      const e = { id: 'perso-' + uid(), ...data, setsMax: Math.max(3, data.sets), repsMax: Math.max(20, data.reps), durationMax: Math.max(60, data.duration), side: 'côté', equipment: [], progression: [] };
      S.custom.push(e);
      if (!store.set('custom', S.custom)) { S.custom.pop(); return; }
      exCache = null;
    }
    closeModal();
    render();
    toast(id ? 'Exercice modifié ✓' : `Ajouté dans « ${catOf(data.cat).label} » ✓`);
  }

  /* ================= Vue : ateliers ================= */
  function catDots(items) {
    const counts = {};
    items.forEach((it) => { const c = getEx(it.exId)?.cat; if (c) counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).map(([c, n]) => `<span class="tag" style="--c:${catOf(c).color}">${catOf(c).emoji} ${n}</span>`).join('');
  }

  function workoutCard(w) {
    const above = aboveCount(w.items);
    return `<article class="card p-4">
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-2xl grid place-items-center text-2xl bg-brand/10 shrink-0">${esc(w.emoji || '🧩')}</div>
        <div class="flex-1 min-w-0">
          <h3 class="font-black text-lg leading-tight">${esc(w.name)}</h3>
          <p class="text-sm text-muted font-semibold">${plural(w.items.length, 'exercice')}${w.items.length ? ` · ~${fmtDur(estimate(w.items))}` : ''}</p>
          <div class="flex flex-wrap gap-1 mt-2">${catDots(w.items)}</div>
        </div>
        <button class="icon-btn -mr-2 -mt-1" data-action="w-menu" data-id="${esc(w.id)}" aria-label="Plus d'options">${icon('more')}</button>
      </div>
      ${above ? `<p class="warn text-sm mt-3 !py-2">⚠️ ${plural(above, 'exercice')} au-delà de ta phase actuelle</p>` : ''}
      <div class="grid grid-cols-[1fr_auto] gap-2 mt-3">
        <button class="btn btn-primary" data-action="launch" data-id="${esc(w.id)}">${icon('play', 'w-5 h-5')} Lancer</button>
        <button class="btn btn-ghost" data-action="edit-workout" data-id="${esc(w.id)}">${icon('edit', 'w-5 h-5')} Modifier</button>
      </div>
    </article>`;
  }

  function viewWorkouts() {
    return `
    <div class="flex items-end justify-between gap-3 pt-1">
      <div>
        <h1 class="text-[1.75rem] font-black leading-tight">Mes ateliers</h1>
        <p class="text-sm text-muted font-semibold">Tes séances sur-mesure, prêtes à lancer</p>
      </div>
      <button class="btn btn-primary btn-sm shrink-0" data-action="new-workout">${icon('plus', 'w-5 h-5')} Nouveau</button>
    </div>
    <div class="space-y-3 mt-4">${S.workouts.length ? S.workouts.map(workoutCard).join('') : emptyState('🧩', 'Aucun atelier', 'Compose ta première séance avec le bouton « Nouveau ».')}</div>`;
  }

  /* ================= Vue : composer une séance ================= */
  const EMOJIS = ['🧩', '🌅', '🪑', '💪', '🦵', '❤️', '🚶', '🧘', '🌙', '⭐', '🎯', '🌿'];

  function stepper(label, it, field, display) {
    return `<div class="stepper"><span>${label}</span><div class="flex items-center gap-1.5">
      <button type="button" data-action="b-step" data-uid="${it.uid}" data-field="${field}" data-delta="-1" aria-label="Diminuer ${label}">−</button>
      <output>${display}</output>
      <button type="button" data-action="b-step" data-uid="${it.uid}" data-field="${field}" data-delta="1" aria-label="Augmenter ${label}">+</button>
    </div></div>`;
  }

  function builderItem(it, i, n) {
    const e = getEx(it.exId);
    if (!e) return '';
    const open = S.builder.open === it.uid;
    return `<li class="b-item card" data-uid="${it.uid}">
      <div class="flex items-center gap-1.5 p-1.5 pr-1">
        <span class="drag-handle" data-drag role="button" aria-label="Glisser pour déplacer">${icon('grip', 'w-5 h-5')}</span>
        ${exThumb(e, 'thumb-sm')}
        <button class="flex-1 min-w-0 text-left py-1 pl-1" data-action="b-toggle" data-uid="${it.uid}" aria-expanded="${open}">
          <span class="block font-black leading-tight line-clamp-2">${i + 1}. ${esc(e.name)}</span>
          <span class="block text-sm text-muted font-semibold">${esc(doseText(it, e))} · repos ${fmtSec(it.rest)}${e.phase > S.settings.phase ? ' · ⚠️' : ''}</span>
        </button>
        <button class="icon-btn" data-action="b-toggle" data-uid="${it.uid}" aria-label="Régler">${icon(open ? 'chevron' : 'chevronRight', 'w-5 h-5')}</button>
      </div>
      ${open ? `<div class="px-3 pb-3 pt-1 space-y-3 border-t border-line">
        <div class="seg mt-2">
          <button type="button" class="${it.mode === 'reps' ? 'is-on' : ''}" data-action="b-mode" data-uid="${it.uid}" data-mode="reps">🔁 Répétitions</button>
          <button type="button" class="${it.mode === 'time' ? 'is-on' : ''}" data-action="b-mode" data-uid="${it.uid}" data-mode="time">⏱️ Durée</button>
        </div>
        ${stepper('Séries', it, 'sets', it.sets)}
        ${it.mode === 'time' ? stepper(e.perSide ? `Durée / ${e.side || 'côté'}` : 'Durée', it, 'duration', fmtSec(it.duration)) : stepper('Répétitions', it, 'reps', it.reps)}
        ${stepper('Repos entre séries', it, 'rest', fmtSec(it.rest))}
        ${i < n - 1 ? stepper('Pause après', it, 'restAfter', fmtSec(it.restAfter ?? S.settings.restBetween)) : ''}
        ${e.dosage ? `<p class="text-sm text-muted font-semibold">📋 Livret : ${esc(e.dosage)}</p>` : ''}
        ${e.phase > S.settings.phase ? `<p class="warn text-sm !py-2">⚠️ Exercice prévu à partir de la phase ${e.phase}.</p>` : ''}
        <div class="grid grid-cols-3 gap-2">
          <button type="button" class="btn btn-ghost btn-sm" data-action="b-move" data-uid="${it.uid}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>${icon('up', 'w-4 h-4')} Monter</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="b-move" data-uid="${it.uid}" data-dir="1" ${i === n - 1 ? 'disabled' : ''}>${icon('down', 'w-4 h-4')} Descendre</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="b-remove" data-uid="${it.uid}">${icon('trash', 'w-4 h-4')} Retirer</button>
        </div>
      </div>` : ''}
    </li>`;
  }

  function viewBuilder() {
    const w = getWorkout(S.builder.id);
    if (!w) return '';
    const n = w.items.length;
    return `
    <div class="flex items-center gap-1 -ml-2 pt-0.5">
      <a href="#ateliers" class="icon-btn" aria-label="Retour aux ateliers">${icon('back')}</a>
      <h1 class="text-xl font-black">Composer ma séance</h1>
    </div>
    <label class="block mt-2"><span class="label">Nom de l'atelier</span>
      <input class="input text-lg font-black" data-input="w-name" value="${esc(w.name)}" maxlength="60"></label>
    <div class="chips-row mt-2">${EMOJIS.map((em) => `<button class="emoji-btn ${w.emoji === em ? 'is-on' : ''}" data-action="w-emoji" data-emoji="${em}" aria-label="Icône ${em}">${em}</button>`).join('')}</div>

    <div class="flex items-center justify-between mt-4">
      <h2 class="font-black text-lg">${plural(n, 'exercice')}</h2>
      ${n ? `<span class="text-sm text-muted font-bold">⏱ ~${fmtDur(estimate(w.items))}</span>` : ''}
    </div>
    ${n ? '<p class="text-xs text-muted font-semibold mt-0.5">Glisse ⠿ pour réordonner · touche un exercice pour régler séries, répétitions et repos.</p>' : ''}
    <ul id="builder-list" class="space-y-2 mt-3">${w.items.map((it, i) => builderItem(it, i, n)).join('')}</ul>
    <button class="add-dashed w-full mt-3" data-action="open-picker">${icon('plus', 'w-5 h-5')} Ajouter des exercices</button>
    ${aboveCount(w.items) ? `<p class="warn text-sm mt-3">⚠️ Cet atelier contient des exercices prévus pour une phase plus avancée que la tienne (phase ${S.settings.phase}).</p>` : ''}

    <div class="builder-bar fixed bottom-0 inset-x-0 z-20 pt-6">
      <div class="mx-auto max-w-md px-4 grid grid-cols-[auto_1fr] gap-2">
        <a href="#ateliers" class="btn btn-outline">${icon('check', 'w-5 h-5')} Terminé</a>
        <button class="btn btn-primary" data-action="launch" data-id="${esc(w.id)}" ${n ? '' : 'disabled'}>${icon('play', 'w-5 h-5')} Lancer la séance</button>
      </div>
    </div>`;
  }

  function openBuilder(id) {
    S.builder = { id, open: null };
    go('#atelier');
  }

  function leaveBuilder() {
    const w = S.builder && getWorkout(S.builder.id);
    if (w) {
      // Un nouvel atelier laissé vide ne pollue pas la liste.
      if (w.fresh && !w.items.length) S.workouts = S.workouts.filter((x) => x !== w);
      delete w.fresh;
      saveWorkouts();
    }
    S.builder = null;
  }

  function builderWorkout() { return S.builder && getWorkout(S.builder.id); }

  function refreshBuilder() {
    if (S.view !== 'builder') return;
    $('#view').innerHTML = viewBuilder();
    bindSortable($('#builder-list'));
  }

  // Réordonner au doigt (Pointer Events : souris, tactile et stylet ; le glisser-déposer HTML5 ne marche pas au doigt).
  function bindSortable(list) {
    if (!list) return;
    list.addEventListener('pointerdown', (ev) => {
      const handle = ev.target.closest('[data-drag]');
      const item = handle?.closest('[data-uid]');
      if (!item) return;
      ev.preventDefault();
      const pid = ev.pointerId, baseY = ev.clientY + window.scrollY, baseTop = item.offsetTop;
      item.classList.add('dragging');
      try { handle.setPointerCapture(pid); } catch { /* pointeur déjà relâché */ }
      const mid = (el) => el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2;
      const move = (e) => {
        if (e.pointerId !== pid) return;
        if (e.clientY < 90) window.scrollBy(0, -10);
        else if (e.clientY > window.innerHeight - 150) window.scrollBy(0, 10);
        const y = e.clientY + window.scrollY;
        // On déplace toujours les voisins, jamais l'élément saisi : le sortir du DOM ferait perdre le pointeur.
        let prev = item.previousElementSibling, next = item.nextElementSibling;
        while (prev && y < mid(prev)) { list.insertBefore(prev, item.nextElementSibling); prev = item.previousElementSibling; }
        while (next && y > mid(next)) { list.insertBefore(next, item); next = item.nextElementSibling; }
        item.style.transform = `translateY(${y - baseY - (item.offsetTop - baseTop)}px)`;
      };
      const end = (e) => {
        if (e.pointerId !== pid) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        item.classList.remove('dragging');
        item.style.transform = '';
        const w = builderWorkout();
        const order = $$(':scope > [data-uid]', list).map((el) => el.dataset.uid);
        const before = w.items.map((it) => it.uid).join();
        w.items.sort((a, b) => order.indexOf(a.uid) - order.indexOf(b.uid));
        if (before !== order.join()) { saveWorkouts(); buzz(15); }
        refreshBuilder();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  }

  function stepField(it, field, dir) {
    const v = it[field] ?? S.settings.restBetween;
    const big = (x) => (x >= 120 ? 30 : x >= 60 ? 15 : 5);
    const rules = {
      sets: [1, 10, () => 1],
      reps: [1, 100, () => 1],
      duration: [5, 1800, (x) => big(x)],
      rest: [0, 600, (x) => big(x)],
      restAfter: [0, 600, (x) => big(x)],
    };
    const [min, max, step] = rules[field];
    it[field] = clamp(v + dir * step(dir > 0 ? v : v - 1), min, max);
  }

  /* ================= Sélecteur d'exercices ================= */
  function pickList() {
    const w = builderWorkout();
    const list = filterEx({ ...S.picker, seated: false, fav: false, phase: false });
    if (!list.length) return emptyState('🔍', 'Aucun exercice', 'Essaie une autre recherche.');
    return list.map((e) => {
      const n = w.items.filter((it) => it.exId === e.id).length;
      return `<button class="pick-row ${n ? 'is-on' : ''}" data-action="pick-toggle" data-id="${esc(e.id)}" aria-pressed="${!!n}">
        ${exThumb(e, 'thumb-sm')}
        <span class="flex-1 min-w-0">
          <span class="block font-black leading-tight">${esc(e.name)}${e.fav ? ' ⭐' : ''}</span>
          <span class="block text-sm text-muted font-semibold">${esc(doseText(e, e))}</span>
          <span class="flex gap-1 mt-1">${catTag(e.cat)}${phaseTag(e)}</span>
        </span>
        <span class="pick-badge">${n ? icon('check', 'w-5 h-5') : icon('plus', 'w-5 h-5')}</span>
      </button>`;
    }).join('');
  }

  function pickDoneLabel() { const n = builderWorkout().items.length; return `Terminé · ${plural(n, 'exercice')}`; }

  function openPicker() {
    S.picker = { q: '', cat: 'all' };
    openModal(`<div class="flex flex-col h-[90dvh]">
      <div class="p-4 pb-2 border-b border-line">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black">Ajouter des exercices</h2>
          <button class="icon-btn" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
        </div>
        <label class="search mt-2">${icon('search', 'w-5 h-5')}<input type="search" data-input="pick-q" placeholder="Rechercher…" autocomplete="off" aria-label="Rechercher"></label>
        <div id="pick-chips" class="mt-2.5">${catChips(S.picker, 'pick-cat')}</div>
      </div>
      <div id="pick-list" class="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2">${pickList()}</div>
      <div class="p-3 border-t border-line"><button id="pick-done" class="btn btn-primary btn-lg w-full" data-action="modal-close">${pickDoneLabel()}</button></div>
    </div>`, { label: 'Ajouter des exercices', onClose: () => { S.picker = null; refreshBuilder(); } });
  }

  function refreshPicker(chips = false) {
    const list = $('#pick-list');
    if (!S.picker || !list) return;
    const top = list.scrollTop;
    list.innerHTML = pickList();
    list.scrollTop = top;
    if (chips) $('#pick-chips').innerHTML = catChips(S.picker, 'pick-cat');
    setText('#pick-done', pickDoneLabel());
  }

  /* ================= Vue : historique ================= */
  const ENERGY = [
    { e: '😫', l: 'Épuisé' }, { e: '😕', l: 'Fatigué' }, { e: '😐', l: 'Moyen' }, { e: '🙂', l: 'Bien' }, { e: '💪', l: 'En forme' },
  ];
  const RPE = ['Repos', 'Très très facile', 'Très facile', 'Facile', 'Modéré', 'Un peu difficile', 'Difficile', 'Difficile', 'Très difficile', 'Très très difficile', 'Maximal'];
  const rpeColor = (r) => (r <= 2 ? '#16a34a' : r <= 4 ? '#0d9488' : r <= 6 ? '#d97706' : r <= 8 ? '#ea580c' : '#dc2626');

  function viewHistory() {
    const H = S.history;
    if (!H.length) {
      return `<div class="pt-1"><h1 class="text-[1.75rem] font-black leading-tight">Historique</h1></div>
        ${emptyState('📈', 'Aucune séance pour l\'instant', 'Tes séances terminées apparaîtront ici, avec ton effort ressenti.')}
        <a href="#ateliers" class="btn btn-primary w-full">${icon('play', 'w-5 h-5')} Lancer ma première séance</a>`;
    }
    const now = Date.now();
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const rated = H.filter((h) => h.rpe != null);
    const avg = rated.length ? (rated.reduce((a, h) => a + h.rpe, 0) / rated.length).toFixed(1).replace('.', ',') : '—';
    const totalSec = H.reduce((a, h) => a + (h.activeSec || 0), 0);

    // 8 dernières semaines (minutes actives)
    const ws = weekStart(now);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = weekStart(ws - (7 - i) * 7 * 86400000 + 43200000); // +12 h : robuste aux changements d'heure
      const end = i === 7 ? Infinity : weekStart(ws - (6 - i) * 7 * 86400000 + 43200000);
      const list = H.filter((h) => h.startedAt >= start && h.startedAt < end);
      return { start, min: Math.round(list.reduce((a, h) => a + (h.activeSec || 0), 0) / 60), n: list.length, current: i === 7 };
    });
    const maxMin = Math.max(10, ...weeks.map((w) => w.min));

    let lastMonth = '';
    const items = H.map((h) => {
      const m = cap(fmtMonth.format(h.startedAt));
      const head = m !== lastMonth ? `<h2 class="section-title mt-6">${esc(m)}</h2>` : '';
      lastMonth = m;
      return head + historyItem(h);
    }).join('');

    return `
    <div class="pt-1"><h1 class="text-[1.75rem] font-black leading-tight">Historique</h1>
      <p class="text-sm text-muted font-semibold">Tes séances, enregistrées sur ce téléphone</p></div>
    <div class="grid grid-cols-2 gap-2 mt-4">
      <div class="stat"><b>${H.length}</b><span>séances au total</span></div>
      <div class="stat"><b>${H.filter((h) => h.startedAt >= month.getTime()).length}</b><span>ce mois-ci</span></div>
      <div class="stat"><b>${fmtDur(totalSec)}</b><span>de temps actif</span></div>
      <div class="stat"><b>${avg}</b><span>effort moyen /10</span></div>
    </div>
    <section class="card p-4 mt-3">
      <div class="flex items-center justify-between"><h2 class="font-black">8 dernières semaines</h2><span class="text-xs text-muted font-bold">minutes actives</span></div>
      <div class="flex items-end gap-2 h-36 mt-3">
        ${weeks.map((w) => `<div class="flex-1 h-full flex flex-col items-center justify-end gap-1" title="${w.n} séance(s)">
          <span class="text-[11px] font-bold text-muted tabular">${w.min || ''}</span>
          <div class="w-full rounded-t-lg ${w.min ? 'bg-brand' : 'bg-line'} ${w.current ? '' : 'opacity-70'}" style="height:${w.min ? Math.max(6, (w.min / maxMin) * 100) : 3}%"></div>
          <span class="text-[10px] font-bold text-muted tabular">${fmtShort.format(w.start)}</span></div>`).join('')}
      </div>
    </section>
    <div class="space-y-2">${items}</div>`;
  }

  function historyItem(h) {
    const en = ENERGY[(h.energy || 0) - 1];
    return `<article class="card p-4 mt-2">
      <div class="flex items-start gap-3">
        <div class="text-2xl leading-none mt-0.5" title="Énergie avant la séance">${en ? en.e : '🏃'}</div>
        <div class="flex-1 min-w-0">
          <h3 class="font-black leading-tight">${esc(h.name)}</h3>
          <p class="text-sm text-muted font-semibold">${esc(cap(fmtDay.format(h.startedAt)))} · ${fmtHour.format(h.startedAt)} · ${fmtDur(h.activeSec || 0)}</p>
          <div class="flex flex-wrap gap-1 mt-2">
            ${h.completed ? '<span class="tag" style="--c:#15803d">✓ Terminée</span>' : `<span class="tag tag-warn">◐ Partielle · ${h.exDone}/${h.exTotal}</span>`}
            ${h.light ? '<span class="tag tag-neutral">🪶 Allégée</span>' : ''}
            ${h.rpe != null ? `<span class="tag" style="--c:${rpeColor(h.rpe)}">Effort ${h.rpe}/10 · ${RPE[h.rpe]}</span>` : ''}
            ${h.painDuring ? '<span class="tag" style="--c:#dc2626">🩺 Douleur signalée</span>' : ''}
          </div>
          ${h.note ? `<p class="text-sm mt-2 italic text-muted">« ${esc(h.note)} »</p>` : ''}
        </div>
        <button class="icon-btn -mr-2 -mt-1" data-action="h-del" data-id="${esc(h.id)}" aria-label="Supprimer cette séance">${icon('trash', 'w-5 h-5')}</button>
      </div>
    </article>`;
  }

  /* ================= Réglages ================= */
  function seg(key, options) {
    return `<div class="seg">${options.map(([v, l]) => `<button type="button" class="${String(S.settings[key]) === String(v) ? 'is-on' : ''}" data-action="set" data-key="${key}" data-value="${v}">${l}</button>`).join('')}</div>`;
  }
  function toggleRow(key, label, desc) {
    return `<label class="toggle-row"><span><b>${label}</b><small>${desc}</small></span><input type="checkbox" class="switch" data-input="set-bool" data-key="${key}" ${S.settings[key] ? 'checked' : ''}></label>`;
  }
  function voiceOptions() {
    const best = voices.find((v) => !badVoices.has(v.voiceURI));
    if (!voices.length) return '<option value="">Voix du téléphone</option>';
    const seen = {}; // Android peut donner le même nom à plusieurs voix : on les numérote
    return `<option value="">Automatique${best ? ` (${esc(voiceLabel(best))})` : ''}</option>${voices.map((v) => {
      const l = voiceLabel(v), n = (seen[l] = (seen[l] || 0) + 1);
      return `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voiceURI ? 'selected' : ''}>${esc(n > 1 ? `${l} (${n})` : l)}</option>`;
    }).join('')}`;
  }
  function phasePicker(action = 'set') {
    return `<div class="grid gap-2">${[1, 2, 3].map((p) => `<button type="button" class="pick-row ${S.settings.phase === p ? 'is-on' : ''}" data-action="${action}" data-key="phase" data-value="${p}">
      <span class="w-11 h-11 rounded-xl bg-brand/15 text-brand grid place-items-center font-black shrink-0">P${p}</span>
      <span class="flex-1 min-w-0"><span class="block font-black">${esc(PHASES[p].label)}</span><span class="block text-sm text-muted font-semibold leading-snug">${esc(PHASES[p].desc)}</span></span>
    </button>`).join('')}</div>`;
  }

  function openSettings() {
    openModal(`<div class="p-5 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black">Réglages</h2>
        <button class="icon-btn" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
      </div>

      <section><h3 class="section-title">Mon parcours</h3>
        ${phasePicker()}
        <p class="text-xs text-muted font-semibold mt-2">Les phases sont indicatives : les délais sont fixés par ton chirurgien et ton équipe.</p>
        <div class="mt-4"><span class="label">Objectif de séances par semaine</span>${seg('weeklyGoal', [[2, '2'], [3, '3'], [4, '4'], [5, '5']])}</div>
      </section>

      <section><h3 class="section-title">Affichage</h3>
        <span class="label">Thème</span>${seg('theme', [['auto', 'Auto'], ['light', '☀️ Clair'], ['dark', '🌙 Sombre']])}
        <span class="label mt-3">Taille du texte</span>${seg('bigText', [[false, 'Normale'], [true, 'Grande']])}
      </section>

      <section><h3 class="section-title">Pendant la séance</h3>
        ${toggleRow('sound', 'Bips sonores', 'Décompte 3-2-1 et fin de chaque étape')}
        ${toggleRow('voice', 'Annonces vocales', "Nom de l'exercice, séries, repos")}
        ${'speechSynthesis' in window ? `<div class="pb-3 ${S.settings.voice ? '' : 'opacity-50'}">
          <label class="label" for="voice-select">Voix</label>
          <select id="voice-select" class="input" data-input="set-voice">${voiceOptions()}</select>
          <span class="label mt-3">Débit</span>${seg('voiceRate', [[0.9, 'Posé'], [1, 'Normal'], [1.1, 'Rapide']])}
          <button type="button" class="btn btn-ghost w-full mt-3" data-action="voice-test">${icon('sound', 'w-5 h-5')} Écouter un exemple</button>
          <details class="mt-3 text-sm">
            <summary class="font-extrabold text-brand cursor-pointer">La voix reste robotique ?</summary>
            <p class="text-muted font-semibold mt-2 leading-relaxed">L'appli utilise les voix installées sur le téléphone. Une voix de meilleure qualité s'installe gratuitement :</p>
            <ul class="text-muted font-semibold mt-1 space-y-1 leading-relaxed list-disc pl-5">
              <li><b class="text-ink">iPhone</b> : Réglages › Accessibilité › Contenu énoncé › Voix › Français › choisir une voix et télécharger la version <i>améliorée</i> ou <i>premium</i>.</li>
              <li><b class="text-ink">Android</b> : Paramètres › Gestion globale (ou Accessibilité) › Synthèse vocale › moteur <i>Google</i> › ⚙️ › Installer les données vocales › Français.</li>
            </ul>
            <p class="text-muted font-semibold mt-1 leading-relaxed">Puis rouvre l'appli et choisis la nouvelle voix ci-dessus.</p>
          </details>
        </div>` : ''}
        ${toggleRow('vibrate', 'Vibrations', 'À chaque changement d\'étape (Android)')}
        <span class="label mt-2">Préparation avant la séance</span>${seg('prep', [[5, '5 s'], [10, '10 s'], [15, '15 s'], [20, '20 s']])}
        <span class="label mt-3">Changement de côté</span>${seg('switchTime', [[3, '3 s'], [5, '5 s'], [10, '10 s']])}
        <span class="label mt-3">Pause entre exercices (nouveaux ajouts)</span>${seg('restBetween', [[30, '30 s'], [60, '1 min'], [90, '1 min 30'], [120, '2 min']])}
      </section>

      <section><h3 class="section-title">Mes données</h3>
        <p class="text-sm text-muted font-semibold mb-3">Tout est enregistré uniquement sur ce téléphone. Exporte une sauvegarde pour changer d'appareil ou ne rien perdre.</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" data-action="export">${icon('download', 'w-5 h-5')} Exporter</button>
          <button class="btn btn-ghost" data-action="import">${icon('upload', 'w-5 h-5')} Importer</button>
          <button class="btn btn-ghost col-span-2" data-action="reset-ex">Réinitialiser les exercices du livret</button>
          <button class="btn btn-danger col-span-2" data-action="reset-all">${icon('trash', 'w-5 h-5')} Tout effacer</button>
        </div>
      </section>

      <section class="text-sm text-muted leading-relaxed">
        <h3 class="section-title">À propos</h3>
        <p><b class="text-ink">BariaMouv</b> · exercices issus de ton livret « Mon activité physique adaptée à ma santé ». Cette application ne remplace pas un avis médical : reprends et fais évoluer ton activité avec l'accord de ton équipe soignante.</p>
      </section>
    </div>`, { label: 'Réglages' });
  }

  function applyTheme() {
    const t = S.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('big-text', !!S.settings.bigText);
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#0e1517' : '#0f766e');
  }

  function exportData() {
    const data = { app: 'bariamouv', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, overrides: S.overrides, custom: S.custom, workouts: S.workouts, history: S.history };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bariamouv-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée ✓');
  }

  async function importData(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch { toast('Fichier illisible.'); return; }
    if (data?.app !== 'bariamouv' || !Array.isArray(data.workouts) || !Array.isArray(data.history)) { toast("Ce fichier n'est pas une sauvegarde BariaMouv."); return; }
    const ok = await confirmBox('Importer cette sauvegarde ?', `${plural(data.history.length, 'séance')} et ${plural(data.workouts.length, 'atelier')}. Tes données actuelles seront remplacées.`, 'Importer', false);
    if (!ok) return;
    S.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), accepted: true };
    S.overrides = data.overrides || {};
    S.custom = Array.isArray(data.custom) ? data.custom : [];
    S.workouts = data.workouts;
    S.history = data.history;
    exCache = null;
    saveSettings(); store.set('overrides', S.overrides); store.set('custom', S.custom); saveWorkouts(); saveHistory();
    applyTheme();
    render();
    toast('Sauvegarde importée ✓');
  }

  /* ================= Accueil du premier lancement ================= */
  function openOnboarding() {
    openModal(`<div class="p-6 space-y-5">
      <div class="text-center">
        <img src="icons/icon.svg" alt="" class="w-16 h-16 rounded-2xl mx-auto">
        <h2 class="text-2xl font-black mt-3">Bienvenue dans BariaMouv</h2>
        <p class="text-muted font-semibold mt-1">Ton compagnon d'activité physique adaptée au parcours bariatrique.</p>
      </div>
      <ul class="rules space-y-3 text-[15px]">
        <li><span>📚</span><span><b>${EXERCISES.length} exercices</b> de ton livret APA, triés par catégorie, avec leurs consignes.</span></li>
        <li><span>🧩</span><span><b>Compose tes ateliers</b>, lance le chrono et laisse-toi guider.</span></li>
        <li><span>🔒</span><span><b>Tout reste sur ton téléphone</b> : aucun compte, aucun serveur.</span></li>
      </ul>
      <div class="danger-box text-sm leading-relaxed"><b>Important :</b> cette application ne remplace pas l'avis de ton chirurgien, de ton médecin ou de ton enseignant APA. Reprends l'activité uniquement avec leur accord et respecte les délais qu'ils t'ont donnés.</div>
      <div><h3 class="font-black mb-2">Où en es-tu dans ton parcours ?</h3>${phasePicker('onboard-phase')}</div>
      <button class="btn btn-primary btn-lg w-full" data-action="onboard-ok">J'ai compris, c'est parti !</button>
    </div>`, { label: 'Bienvenue' });
  }

  /* ================= Avant la séance ================= */
  function openCheckin(id) {
    const w = getWorkout(id);
    if (!w) return;
    if (!w.items.some((it) => getEx(it.exId))) { toast('Cet atelier est vide : ajoute des exercices.'); openBuilder(id); return; }
    S.checkin = { id, energy: 3, pain: false, light: false, lightTouched: false };
    renderCheckin();
  }

  function renderCheckin() {
    const c = S.checkin, w = getWorkout(c.id), above = aboveCount(w.items);
    openModal(`<div class="p-5 space-y-5">
      <div class="flex items-start justify-between gap-2">
        <div><p class="text-sm text-muted font-bold">Avant de commencer</p><h2 class="text-xl font-black leading-tight">${esc(w.emoji || '🧩')} ${esc(w.name)}</h2></div>
        <button class="icon-btn" data-action="modal-close" aria-label="Fermer">${icon('x')}</button>
      </div>
      <div>
        <h3 class="font-black">Comment te sens-tu aujourd'hui ?</h3>
        <div class="grid grid-cols-5 gap-1.5 mt-2">${ENERGY.map((x, i) => `<button class="energy-btn ${c.energy === i + 1 ? 'is-on' : ''}" data-action="ci-energy" data-v="${i + 1}" aria-pressed="${c.energy === i + 1}"><span class="text-3xl leading-none">${x.e}</span>${x.l}</button>`).join('')}</div>
      </div>
      <label class="check-row"><input type="checkbox" data-input="ci-pain" ${c.pain ? 'checked' : ''}><span>J'ai une douleur inhabituelle aujourd'hui</span></label>
      ${c.pain ? `<div class="danger-box text-sm leading-relaxed"><b>Douleur abdominale, thoracique ou très inhabituelle ?</b> Ne fais pas de séance et contacte ton équipe médicale. Pour une simple gêne articulaire : version allégée, et passe les mouvements douloureux.</div>` : ''}
      <div>
        <h3 class="font-black">Intensité</h3>
        <div class="seg mt-2">
          <button class="${!c.light ? 'is-on' : ''}" data-action="ci-light" data-v="0">Normale</button>
          <button class="${c.light ? 'is-on' : ''}" data-action="ci-light" data-v="1">🪶 Allégée</button>
        </div>
        <p class="text-sm text-muted font-semibold mt-2">${c.light ? 'Une série en moins, −30 % de répétitions et de durée, pauses plus longues.' : 'Le dosage prévu dans ton atelier.'} Durée : ~${fmtDur(estimate(w.items, c.light))}.</p>
        ${c.energy <= 2 && !c.light ? '<p class="text-sm text-warn font-bold mt-1">Tu sembles fatigué·e : la version allégée est conseillée aujourd\'hui.</p>' : ''}
      </div>
      ${above ? `<div class="warn text-sm">⚠️ ${plural(above, 'exercice')} ${above > 1 ? 'sont prévus' : 'est prévu'} pour une phase plus avancée que la tienne. Assure-toi d'avoir l'accord de ton équipe.</div>` : ''}
      <ul class="rules space-y-2 text-sm font-semibold text-muted">
        <li><span>💧</span><span>Une bouteille d'eau à portée (petites gorgées).</span></li>
        <li><span>🍽️</span><span>Pas de repas copieux dans l'heure qui précède.</span></li>
        <li><span>🪑</span><span>Chaise stable, espace dégagé, bonnes chaussures.</span></li>
      </ul>
      <button class="btn btn-primary btn-lg w-full" data-action="ci-go">${icon('play', 'w-5 h-5')} C'est parti</button>
    </div>`, { label: 'Avant de commencer', onClose: () => { S.checkin = null; } });
  }

  /* ================= Mode séance : sons, voix, écran ================= */
  let audioCtx = null, wakeLock = null, tickTimer = null;

  function ensureAudio() {
    try {
      if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
      if (audioCtx?.state === 'suspended') audioCtx.resume();
    } catch { /* audio indisponible */ }
  }
  function beep(freq = 880, dur = 0.12, vol = 0.22) {
    if (!S.settings.sound || !audioCtx) return;
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  /* ---- Voix ---- */
  // Les voix dépendent du téléphone : on classe les voix françaises pour prendre la plus naturelle
  // (« Natural » d'Edge, « Premium »/« Enhanced » d'iPhone, Google…), sauf si une voix est choisie dans les réglages.
  let voices = [];
  const badVoices = new Set(); // voix en ligne en échec (pas de réseau) : ignorées jusqu'au rechargement
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = speechSynthesis.getVoices()
      .filter((v) => /^fr([-_]|$)/i.test(v.lang || ''))
      .sort((a, b) => voiceScore(b) - voiceScore(a));
  }
  function voiceScore(v) {
    const id = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = 0;
    if (/natural|neural|wavenet|studio/.test(id)) s += 100;
    if (/premium/.test(id)) s += 90;
    if (/enhanced|amélioré/.test(id)) s += 80;
    if (/siri/.test(id)) s += 70;
    if (/google/.test(id)) s += 60;
    if (/network|online/.test(id)) s += 30;
    if (/eloquence|espeak|\b(eddy|flo|grandma|grandpa|grand-m[eè]re|grand-p[eè]re|jacques|reed|rocko|sandy|shelley)\b/.test(id)) s -= 80;
    if (/^fr[-_]fr/i.test(v.lang)) s += 20;
    if (v.default) s += 5;
    return s;
  }
  function currentVoice() {
    if (!voices.length) loadVoices();
    const ok = voices.filter((v) => !badVoices.has(v.voiceURI));
    return ok.find((v) => v.voiceURI === S.settings.voiceURI) || ok[0] || null;
  }
  const voiceLabel = (v) => `${v.name.replace(/\s*-\s*(French|Français).*$/i, '').replace(/^Microsoft\s+/, '').replace(/\s*Online\s*\(Natural\)/i, ' (naturelle)')}${v.localService ? '' : ' · en ligne'}`;
  // Nom d'exercice lisible à voix haute : « Chaise murale (gainage) » → « Chaise murale, gainage ».
  const spoken = (name) => name.replace(/\s*\(([^)]*)\)/g, ', $1').replace(/\s*\/\s*/g, ' ou ').replace(/\s+[-–—]\s+/g, ', ');
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function say(text, force = false) {
    if ((!S.settings.voice && !force) || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const v = currentVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = v?.lang.replace('_', '-') || 'fr-FR';
    if (v) u.voice = v;
    u.rate = S.settings.voiceRate || 1;
    u.onerror = (ev) => {
      // Voix en ligne sans réseau : on retente aussitôt avec la meilleure voix restante.
      if (!v || v.localService || !/network|synthesis|voice-unavailable/.test(ev.error || '')) return;
      badVoices.add(v.voiceURI);
      say(text, force);
    };
    speechSynthesis.speak(u);
  }
  const buzz = (p) => { if (S.settings.vibrate) navigator.vibrate?.(p); };
  async function lockScreen() { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* non supporté */ } }
  function releaseLock() { wakeLock?.release?.().catch(() => {}); wakeLock = null; }

  /* ================= Mode séance : déroulé ================= */
  // L'atelier est déplié en étapes : préparation → [effort, (changement de côté), repos]… → pause entre exercices.
  function buildSteps(items, light) {
    const list = items.map((it) => ({ it, e: getEx(it.exId) })).filter((x) => x.e);
    const steps = [];
    if (!list.length) return { steps, list };
    steps.push({ kind: 'prep', ex: 0, dur: S.settings.prep });
    list.forEach(({ it, e }, i) => {
      const d = dose(it, light);
      for (let s = 1; s <= d.sets; s++) {
        const sides = d.mode === 'time' && e.perSide ? ['droit', 'gauche'] : [null];
        sides.forEach((side, k) => {
          if (k > 0) steps.push({ kind: 'switch', ex: i, dur: S.settings.switchTime });
          steps.push({ kind: 'work', ex: i, set: s, sets: d.sets, side, mode: d.mode, dur: d.mode === 'time' ? d.duration : 0, reps: d.reps });
        });
        if (s < d.sets && d.rest > 0) steps.push({ kind: 'rest', ex: i, next: i, dur: d.rest });
      }
      if (i < list.length - 1 && d.restAfter > 0) steps.push({ kind: 'rest', ex: i, next: i + 1, dur: d.restAfter, between: true });
    });
    return { steps, list };
  }

  const FEM = ['jambe', 'main', 'cheville', 'épaule'];
  const sideLabel = (e, side) => {
    const noun = e.side || 'côté';
    return `${cap(noun)} ${side === 'droit' ? (FEM.includes(noun) ? 'droite' : 'droit') : 'gauche'}`;
  };

  function startSession(id, { energy, pain, light }) {
    const w = getWorkout(id);
    const { steps, list } = buildSteps(w.items, light);
    if (!steps.length) return;
    S.player = {
      workoutId: w.id, name: w.name, emoji: w.emoji, items: JSON.parse(JSON.stringify(w.items)), list, steps,
      idx: 0, paused: false, endAt: 0, remaining: 0, stepStart: 0, stepPaused: 0, pauseAt: 0,
      startedAt: Date.now(), pausedTotal: 0, done: [], energy, pain, light, lastBeep: null, finished: false,
    };
    ensureAudio();
    lockScreen();
    openPlayer();
    goStep(0);
  }

  function openPlayer() {
    const el = $('#player');
    el.hidden = false;
    document.body.classList.add('overflow-hidden');
    pushOverlay();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 200);
  }

  function closePlayer() {
    clearInterval(tickTimer);
    S.player = null;
    const el = $('#player');
    el.hidden = true;
    el.innerHTML = '';
    releaseLock();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (!modalOpen) { document.body.classList.remove('overflow-hidden'); popOverlay(); }
    render();
  }

  // overshoot : retard accumulé (onglet en arrière-plan) reporté sur l'étape chronométrée suivante.
  function goStep(i, { silent = false, overshoot = 0 } = {}) {
    const P = S.player, now = Date.now();
    if (P.paused) { P.pausedTotal += now - P.pauseAt; P.pauseAt = now; }
    P.idx = i;
    const st = P.steps[i];
    P.stepStart = now;
    P.stepPaused = 0;
    P.lastBeep = null;
    P.cueIdx = -1;
    P.remaining = st.dur * 1000;
    P.endAt = now + P.remaining - (st.dur ? overshoot : 0);
    if (!silent) announce(st);
    saveActive();
    renderPlayer();
  }

  // Annonces : phrases complètes et variées (plus naturelles que des mots isolés séparés par des points).
  const ORDINAL = ['Première', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième', 'Huitième', 'Neuvième', 'Dixième'];
  const effort = (st, e) => (st.mode === 'time' ? speakSec(st.dur) : `${st.reps} répétitions${e.per ? ' ' + e.per : ''}`);

  function announce(st) {
    const P = S.player;
    const e = P.list[st.kind === 'rest' ? st.next : st.ex].e, name = spoken(e.name);
    if (st.kind === 'prep') {
      say(pick([`Installe-toi tranquillement. On commence par : ${name}.`, `Bienvenue dans ta séance. Premier exercice : ${name}.`, `Prends ta place, on démarre avec : ${name}.`]));
    } else if (st.kind === 'switch') {
      say(pick(['On change de côté.', "Très bien, passe de l'autre côté.", 'Autre côté, maintenant.']));
    } else if (st.kind === 'rest') {
      const dur = speakSec(st.dur);
      say(st.between
        ? `${pick(['Bravo, exercice terminé !', 'Bien joué !', 'Super, celui-là est fait.'])} ${pick([`Pause de ${dur}.`, `On souffle ${dur}.`])} ${pick(['Ensuite', 'Après la pause', 'Prochain exercice'])} : ${spoken(e.name)}.${Math.random() < 0.4 ? " Une petite gorgée d'eau si tu en as besoin." : ''}`
        : pick([`Repos, ${dur}. Relâche bien.`, `Bien. On récupère ${dur}.`, `Petite pause de ${dur}, respire calmement.`]));
    } else {
      const last = st.set === st.sets && st.sets > 1;
      const side = st.side ? sideLabel(e, st.side).toLowerCase() : '';
      let text;
      if (st.set === 1 && st.side !== 'gauche') {
        const plan = st.sets > 1 ? `${st.sets} séries de ${effort(st, e)}` : effort(st, e);
        const art = FEM.includes(e.side || 'côté') ? 'la' : 'le';
        text = `${pick(["C'est parti", 'On y va', 'À toi'])} : ${name}. ${cap(plan)}${side ? `, en commençant par ${art} ${side}` : ''}.`;
        if (st.mode === 'reps' && !P.repsHint) { P.repsHint = true; text += ' Va à ton rythme, et touche « Série terminée » quand tu as fini.'; }
      } else if (st.side === 'gauche') {
        text = `${cap(side)}, ${speakSec(st.dur)}.`;
      } else {
        const nth = last ? 'Dernière série' : ORDINAL[st.set - 1] ? `${ORDINAL[st.set - 1]} série` : `Série ${st.set}`;
        text = `${nth}${side ? `, ${side}` : ''} : ${effort(st, e)}.${last ? pick([' Courage !', ' Tu y es presque.', '']) : ''}`;
      }
      say(text);
    }
  }

  // Encouragement à mi-parcours d'un effort chronométré, et rappel avant la fin d'une longue pause.
  function midCue(st, sec) {
    const P = S.player;
    if (P.cueIdx === P.idx) return;
    if (st.kind === 'work' && st.dur >= 30 && sec <= st.dur / 2 && sec % 5 === 0 && sec > 5) {
      P.cueIdx = P.idx;
      say(pick([`Plus que ${speakSec(sec)}, continue de respirer.`, `La moitié est faite. Souffle bien pendant l'effort.`, `Encore ${speakSec(sec)}, tu tiens bon.`]));
    } else if (st.kind === 'rest' && st.dur >= 30 && sec === 10) {
      P.cueIdx = P.idx;
      say(pick(['On reprend dans 10 secondes.', 'Prépare-toi, ça repart dans 10 secondes.']));
    }
  }

  function sayExample() {
    const e = getEx('pompes-mur') || EX()[0];
    say(e ? `Bonjour ! C'est parti : ${spoken(e.name)}. Deux séries de dix répétitions. Souffle bien pendant l'effort, et va à ton rythme.` : "Bonjour ! Voici la voix de tes séances.", true);
  }

  function tick() {
    const P = S.player;
    if (!P || P.finished) return;
    const now = Date.now(), st = P.steps[P.idx];
    setText('#pl-total', fmtClock((now - P.startedAt - P.pausedTotal - (P.paused ? now - P.pauseAt : 0)) / 1000));
    if (P.paused) return;
    if (st.dur) {
      const rem = P.endAt - now, sec = Math.ceil(rem / 1000);
      setText('#pl-time', fmtClock(sec));
      const ring = $('#pl-ring');
      if (ring) ring.style.strokeDashoffset = String(RING * (1 - clamp(rem / (st.dur * 1000), 0, 1)));
      if (sec >= 1 && sec <= 3 && P.lastBeep !== sec) { P.lastBeep = sec; beep(660, 0.09); }
      midCue(st, sec);
      if (rem <= 0) completeStep(-rem);
    } else {
      setText('#pl-time', fmtClock((now - P.stepStart - P.stepPaused) / 1000));
    }
  }

  function completeStep(overshoot = 0) {
    const P = S.player, st = P.steps[P.idx];
    if (st.kind === 'work' && !P.done.includes(P.idx)) P.done.push(P.idx);
    const quiet = overshoot > 1500; // rattrapage après une mise en veille : pas de cascade de bips
    if (!quiet) { beep(st.kind === 'work' ? 880 : 990, 0.35); buzz([160, 80, 160]); }
    if (P.idx + 1 < P.steps.length) goStep(P.idx + 1, { overshoot, silent: quiet }); else finishSession();
  }

  function skipStep() {
    const P = S.player;
    if (P.idx + 1 < P.steps.length) goStep(P.idx + 1); else finishSession();
  }

  function prevStep() {
    const P = S.player;
    if (Date.now() - P.stepStart > 3000 && P.steps[P.idx].kind === 'work') return goStep(P.idx);
    let j = P.idx - 1;
    while (j > 0 && P.steps[j].kind !== 'work' && P.steps[j].kind !== 'prep') j--;
    goStep(Math.max(0, j));
  }

  function togglePause() {
    const P = S.player, now = Date.now();
    if (P.paused) {
      const d = now - P.pauseAt;
      P.pausedTotal += d;
      P.stepPaused += d;
      P.endAt = now + P.remaining;
      P.paused = false;
      ensureAudio();
      lockScreen();
    } else {
      P.paused = true;
      P.pauseAt = now;
      P.remaining = Math.max(0, P.endAt - now);
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    }
    renderPlayer();
    saveActive();
  }

  function addTime(sec) {
    const P = S.player, st = P.steps[P.idx];
    if (!st.dur) return;
    st.dur += sec;
    if (P.paused) P.remaining += sec * 1000; else P.endAt += sec * 1000;
    renderPlayer();
  }

  const RING = 2 * Math.PI * 96;
  const REST_TIPS = ["Petite gorgée d'eau 💧", 'Respire lentement par le nez', 'Relâche les épaules', 'Tu dois pouvoir parler sans être essoufflé·e', 'Secoue doucement bras et jambes'];
  const PHASE_UI = { prep: ['Préparation', 'ph-prep'], work: ['Effort', 'ph-work'], rest: ['Récupération', 'ph-rest'], switch: ['Change de côté', 'ph-switch'] };

  function renderPlayer() {
    const P = S.player, st = P.steps[P.idx];
    const { e, it } = P.list[st.kind === 'rest' ? st.next : st.ex];
    const [label, cls] = PHASE_UI[st.kind];
    const pct = Math.round((P.idx / Math.max(1, P.steps.length - 1)) * 100);
    const rem = st.dur ? (P.paused ? P.remaining : Math.max(0, P.endAt - Date.now())) : 0;
    const exPos = `${(st.kind === 'rest' ? st.next : st.ex) + 1}/${P.list.length}`;

    let sub;
    if (st.kind === 'work') sub = `Série ${st.set} / ${st.sets}${st.side ? ` · ${sideLabel(e, st.side)}` : ''}`;
    else if (st.kind === 'rest') sub = st.between ? 'À suivre' : `À suivre · série ${P.steps.slice(P.idx).find((s) => s.kind === 'work')?.set ?? ''}`;
    else if (st.kind === 'switch') sub = `Prochain : ${sideLabel(e, 'gauche')}`;
    else sub = 'Premier exercice';

    const caption = st.kind === 'rest' ? REST_TIPS[P.idx % REST_TIPS.length]
      : st.kind === 'prep' ? 'Installe-toi tranquillement'
        : st.kind === 'switch' ? 'Change de côté' : 'Respire, sans bloquer';

    const center = st.kind === 'work' && st.mode === 'reps'
      ? `<div class="text-center py-2">
          <div class="pl-reps">${st.reps}</div>
          <div class="text-lg font-black mt-1">répétitions${e.per ? ' ' + esc(e.per) : ''}</div>
          <div class="text-muted font-bold mt-2 flex items-center justify-center gap-1.5">⏱ <span id="pl-time" class="tabular">0:00</span></div>
        </div>`
      : `<div class="pl-ring-wrap">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle class="pl-ring-track" cx="110" cy="110" r="96" fill="none" stroke-width="14"/>
            <circle id="pl-ring" class="pl-ring" cx="110" cy="110" r="96" fill="none" stroke-width="14" stroke-linecap="round" style="stroke-dasharray:${RING};stroke-dashoffset:${RING * (1 - clamp(rem / (st.dur * 1000), 0, 1))}"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div id="pl-time" class="pl-time" role="timer">${fmtClock(Math.ceil(rem / 1000))}</div>
            <div class="text-sm font-bold text-muted mt-1 leading-tight">${esc(caption)}</div>
          </div>
        </div>`;

    $('#player').innerHTML = `<div class="pl ${cls} ${P.paused ? 'is-paused' : ''}">
      <div class="pl-inner">
        <div class="flex items-center gap-2 h-12">
          <button class="icon-btn" data-action="pl-quit" aria-label="Arrêter la séance">${icon('x')}</button>
          <div class="pl-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
          <span id="pl-total" class="text-sm font-black tabular w-12 text-right">0:00</span>
          <button class="icon-btn" data-action="pl-sound" aria-label="${S.settings.sound || S.settings.voice ? 'Couper le son' : 'Activer le son'}">${icon(S.settings.sound || S.settings.voice ? 'sound' : 'mute', 'w-5 h-5')}</button>
        </div>

        <div class="flex flex-col gap-3 mt-2 flex-1">
          <div class="pl-phase">${label}${P.paused ? ' · en pause' : ''}</div>
          <div class="text-center">
            <h2 class="text-[1.6rem] font-black leading-tight">${esc(e.name)}</h2>
            <p class="font-bold text-muted mt-0.5">${esc(sub)} · exercice ${exPos}</p>
          </div>
          ${e.img ? `<div class="pl-media"><img src="${esc(e.img)}" alt=""></div>` : ''}
          ${center}
          ${st.kind !== 'work' && st.kind !== 'switch' ? `<p class="text-center text-sm font-bold text-muted -mt-1">${esc(doseText(dose(it, P.light), e))}</p>` : ''}
          <details class="pl-howto" ${st.kind === 'prep' || P.howtoIdx === P.idx ? 'open' : ''}>
            <summary class="flex items-center justify-between font-black">📋 Consignes ${icon('chevron', 'w-5 h-5 text-muted')}</summary>
            <ol class="steps text-[15px] mt-1">${(e.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
            ${e.tip ? `<p class="tip text-sm mt-2">💡 ${esc(e.tip)}</p>` : ''}
          </details>
        </div>

        <div class="pl-controls space-y-3">
          ${st.kind === 'work' && st.mode === 'reps' ? `<button class="btn btn-primary btn-xl w-full" data-action="pl-done">${icon('check', 'w-7 h-7')} Série terminée</button>` : ''}
          ${st.kind === 'rest' ? `<div class="grid grid-cols-2 gap-2"><button class="btn btn-ghost" data-action="pl-add">+15 s</button><button class="btn btn-ghost" data-action="pl-next">Passer le repos</button></div>` : ''}
          <div class="grid grid-cols-3 items-center">
            <button class="pl-side" data-action="pl-prev" aria-label="Étape précédente">${icon('prev', 'w-6 h-6')}</button>
            <button class="pl-round" data-action="pl-toggle" aria-label="${P.paused ? 'Reprendre' : 'Pause'}">${icon(P.paused ? 'play' : 'pause', 'w-9 h-9')}</button>
            <button class="pl-side" data-action="pl-next" aria-label="Étape suivante">${icon('next', 'w-6 h-6')}</button>
          </div>
          <button class="pl-sos w-full" data-action="pl-sos">⚠️ Je ne me sens pas bien</button>
        </div>
      </div>
    </div>`;
    tick();
  }

  function saveActive() {
    const P = S.player;
    if (!P || P.finished) return;
    store.set('active', {
      workoutId: P.workoutId, name: P.name, emoji: P.emoji, items: P.items, light: P.light, energy: P.energy, pain: P.pain,
      idx: P.idx, done: P.done, startedAt: P.startedAt, pausedTotal: P.pausedTotal + (P.paused ? Date.now() - P.pauseAt : 0), savedAt: Date.now(),
    });
  }

  function resumeActive(a) {
    const { steps, list } = buildSteps(a.items, a.light);
    if (!steps.length) { store.del('active'); return; }
    const now = Date.now();
    S.player = {
      workoutId: a.workoutId, name: a.name, emoji: a.emoji, items: a.items, list, steps,
      idx: clamp(a.idx, 0, steps.length - 1), paused: true, pauseAt: now, endAt: 0, remaining: 0, stepStart: 0, stepPaused: 0,
      startedAt: a.startedAt, pausedTotal: a.pausedTotal + (now - a.savedAt), done: a.done || [], energy: a.energy, pain: a.pain, light: a.light,
      lastBeep: null, finished: false,
    };
    openPlayer();
    goStep(S.player.idx, { silent: true });
  }

  async function askQuit() {
    const P = S.player;
    if (!P || P.finished) return;
    const wasPaused = P.paused;
    if (!wasPaused) togglePause();
    const total = P.steps.filter((s) => s.kind === 'work').length;
    const r = await choose({
      title: 'Arrêter la séance ?',
      message: `Tu as fait ${P.done.length} série(s) sur ${total}. Chaque mouvement compte 💪`,
      choices: [
        { id: 'resume', label: 'Continuer la séance', kind: 'primary' },
        { id: 'save', label: 'Terminer et enregistrer' },
        { id: 'discard', label: 'Abandonner sans enregistrer', kind: 'danger' },
      ],
    });
    if (!S.player) return;
    if (r === 'save') { closeModal(); finishSession(); }
    else if (r === 'discard') { closeModal(); store.del('active'); closePlayer(); }
    else { closeModal(); if (S.player.paused && !wasPaused) togglePause(); }
  }

  function openSos() {
    const P = S.player;
    if (!P.paused) togglePause();
    openModal(`<div class="p-5 space-y-4">
      <h2 class="text-xl font-black">⚠️ Prends soin de toi</h2>
      <p class="leading-relaxed"><b>Arrête l'effort.</b> Assieds-toi (ou allonge-toi), respire calmement et bois quelques petites gorgées d'eau.</p>
      <div class="danger-box text-sm leading-relaxed"><b>🚨 Douleur dans la poitrine, malaise, difficulté à respirer, douleur abdominale intense :</b> appelle le <b>15</b> (SAMU) ou le <b>112</b>.</div>
      <div class="note text-sm leading-relaxed"><b>Sueurs, tremblements, faim brutale ?</b> C'est peut-être une hypoglycémie : applique le resucrage prévu avec ton équipe.</div>
      <div class="grid gap-2">
        <a class="btn btn-danger" href="tel:15">📞 Appeler le 15</a>
        <button class="btn btn-primary" data-action="sos-end">Terminer la séance</button>
        <button class="btn btn-ghost" data-action="sos-resume">Ça va mieux, reprendre doucement</button>
      </div>
    </div>`, { label: 'Je ne me sens pas bien' });
  }

  function finishSession() {
    const P = S.player, now = Date.now();
    if (P.paused) { P.pausedTotal += now - P.pauseAt; P.paused = false; }
    Object.assign(P, {
      finished: true, endedAt: now, activeSec: Math.max(0, Math.round((now - P.startedAt - P.pausedTotal) / 1000)),
      workTotal: P.steps.filter((s) => s.kind === 'work').length, workDone: P.done.length,
      exDone: new Set(P.done.map((i) => P.steps[i].ex)).size, exTotal: P.list.length,
      rpe: null, note: '', painDuring: false, progress: false,
    });
    P.completed = P.workDone === P.workTotal;
    store.del('active');
    releaseLock();
    if (P.completed) { say(pick(['Bravo, séance terminée ! Prends le temps de boire quelques petites gorgées.', 'Et voilà, séance terminée. Beau travail !', 'Séance terminée, bravo ! Pense à bien t\'hydrater, par petites gorgées.'])); beep(660, 0.15); setTimeout(() => beep(990, 0.4), 180); }
    renderSummary();
  }

  function adviceFor(P) {
    if (P.painDuring) return ['danger-box', '🩺 <b>Douleur pendant la séance :</b> note où et quand elle apparaît, évite le mouvement concerné et parles-en à ton équipe (kiné, enseignant APA, chirurgien).'];
    if (P.rpe == null) return ['note', 'Indique ton effort ressenti : il sert à ajuster tes prochaines séances.'];
    if (P.rpe <= 3) return ['tip', '👍 <b>Séance confortable.</b> Tu peux progresser doucement : +2 répétitions ou +5 secondes par exercice à la prochaine séance.'];
    if (P.rpe <= 6) return ['tip', "✅ <b>Effort modéré : c'est la bonne zone !</b> Garde ce dosage encore 1 ou 2 séances avant de progresser."];
    if (P.rpe <= 8) return ['warn', '😮‍💨 <b>Séance exigeante.</b> Récupère bien (hydratation, sommeil). La prochaine fois, garde le même dosage ou choisis la version allégée.'];
    return ['danger-box', "🛑 <b>Effort trop intense pour ton parcours.</b> Allège la prochaine séance (version allégée, pauses plus longues). Si cela se répète, parles-en à ton équipe."];
  }

  const canProgress = (P) => P.completed && !P.light && P.rpe != null && P.rpe <= 3 && !P.painDuring && !!getWorkout(P.workoutId);

  function renderSummary() {
    const P = S.player;
    const [boxCls, advice] = adviceFor(P);
    $('#player').innerHTML = `<div class="pl ph-work">
      <div class="pl-inner gap-4">
        <div class="text-center pt-6">
          <div class="text-6xl">${P.completed ? '🎉' : '👏'}</div>
          <h2 class="text-[1.75rem] font-black mt-2">${P.completed ? 'Séance terminée !' : 'Séance interrompue'}</h2>
          <p class="text-muted font-bold">${esc(P.emoji || '🧩')} ${esc(P.name)}${P.light ? ' · version allégée' : ''}</p>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="stat"><b>${fmtClock(P.activeSec)}</b><span>temps actif</span></div>
          <div class="stat"><b>${P.workDone}/${P.workTotal}</b><span>séries</span></div>
          <div class="stat"><b>${P.exDone}/${P.exTotal}</b><span>exercices</span></div>
        </div>
        <section class="card p-4">
          <h3 class="font-black">Effort ressenti</h3>
          <p class="text-sm text-muted font-semibold">0 = repos · 10 = effort maximal</p>
          <div class="grid grid-cols-6 gap-1.5 mt-3">${RPE.map((_, r) => `<button class="rpe-btn ${P.rpe === r ? 'is-on' : ''}" style="--c:${rpeColor(r)}" data-action="sum-rpe" data-v="${r}" aria-label="${r} : ${RPE[r]}">${r}</button>`).join('')}</div>
          <p class="font-black mt-2 text-center" style="color:${P.rpe == null ? 'inherit' : rpeColor(P.rpe)}">${P.rpe == null ? '&nbsp;' : RPE[P.rpe]}</p>
        </section>
        <div class="${boxCls} text-[15px] leading-relaxed">${advice}</div>
        ${canProgress(P) ? `<label class="check-row"><input type="checkbox" data-input="sum-prog" ${P.progress ? 'checked' : ''}><span>Appliquer la progression à « ${esc(P.name)} » (+2 rép. ou +5 s par exercice)</span></label>` : ''}
        <label class="check-row"><input type="checkbox" data-input="sum-pain" ${P.painDuring ? 'checked' : ''}><span>J'ai ressenti une douleur pendant la séance</span></label>
        <label class="block"><span class="label">Note (facultatif)</span>
          <textarea class="input" rows="2" data-input="sum-note" maxlength="300" placeholder="Ressenti, progrès, gêne…">${esc(P.note)}</textarea></label>
        <div class="grid gap-2 pb-2">
          <button class="btn btn-primary btn-lg" data-action="sum-save">${icon('check', 'w-5 h-5')} Enregistrer dans l'historique</button>
          <button class="btn btn-ghost" data-action="sum-discard">Ne pas enregistrer</button>
        </div>
      </div>
    </div>`;
  }

  // Progression douce : +2 rép. (ou +5 s, +15/30 s pour le cardio) jusqu'au maximum du livret, puis +1 série.
  function applyProgression(w) {
    let changed = 0;
    w.items.forEach((it) => {
      const e = getEx(it.exId);
      if (!e || e.phase > S.settings.phase) return;
      if (it.mode === 'reps' && it.reps < (e.repsMax || it.reps)) { it.reps = Math.min(e.repsMax, it.reps + 2); changed++; }
      else if (it.mode === 'time' && it.duration < (e.durationMax || it.duration)) {
        it.duration = Math.min(e.durationMax, it.duration + (it.duration >= 120 ? 30 : it.duration >= 60 ? 15 : 5)); changed++;
      } else if (it.sets < (e.setsMax || it.sets)) {
        it.sets++;
        if (it.mode === 'reps') it.reps = e.reps; else it.duration = e.duration;
        changed++;
      }
    });
    saveWorkouts();
    return changed;
  }

  function saveSummary() {
    const P = S.player;
    S.history.unshift({
      id: uid(), workoutId: P.workoutId, name: P.name, startedAt: P.startedAt, endedAt: P.endedAt, activeSec: P.activeSec,
      completed: P.completed, workDone: P.workDone, workTotal: P.workTotal, exDone: P.exDone, exTotal: P.exTotal,
      energy: P.energy, pain: P.pain, light: P.light, rpe: P.rpe, note: P.note.trim(), painDuring: P.painDuring,
    });
    saveHistory();
    let msg = 'Séance enregistrée ✓';
    if (P.progress && canProgress(P)) { const n = applyProgression(getWorkout(P.workoutId)); if (n) msg = `Enregistrée ✓ · ${plural(n, 'exercice')} en progression`; }
    closePlayer();
    toast(msg);
  }

  /* ================= Actions (clics) ================= */
  const A = {
    'modal-close': () => closeModal(),
    'modal-backdrop': (el, ev) => { if (ev.target === el) closeModal(); },
    choice: (el) => { const r = choiceResolve; choiceResolve = null; r?.(el.dataset.id); closeModal(); },
    'open-settings': () => openSettings(),

    // Bibliothèque
    'lib-cat': (el) => { S.lib.cat = el.dataset.cat; refreshLibrary(); },
    'lib-flag': (el) => { const k = el.dataset.flag; S.lib[k] = !S.lib[k]; refreshLibrary(); },
    'ex-open': (el) => openExercise(el.dataset.id),
    'ex-new': () => openExerciseForm(),
    'ex-edit': (el) => openExerciseForm(el.dataset.id),
    'ex-sheet': (el) => openSheet(el.dataset.id),
    'ex-add': (el) => openAddToWorkout(el.dataset.id),
    'ex-fav': (el) => {
      const e = getEx(el.dataset.id);
      updateExercise(e.id, { fav: !e.fav });
      openExercise(e.id);
      refreshLibrary();
      toast(e.fav ? 'Retiré des favoris' : 'Ajouté aux favoris ⭐');
    },
    'ex-setcat': (el) => {
      updateExercise(el.dataset.id, { cat: el.dataset.cat });
      openExercise(el.dataset.id);
      refreshLibrary();
      toast(`Classé dans « ${catOf(el.dataset.cat).label} »`);
    },
    'ex-remove': async (el) => {
      const e = getEx(el.dataset.id);
      if (e.builtin) {
        updateExercise(e.id, { hidden: true });
        closeModal();
        render();
        toast('Exercice masqué · Réglages › Réinitialiser pour le retrouver');
        return;
      }
      if (!(await confirmBox('Supprimer cet exercice ?', `« ${esc(e.name)} » sera aussi retiré de tes ateliers.`, 'Supprimer'))) return;
      S.custom = S.custom.filter((c) => c.id !== e.id);
      S.workouts.forEach((w) => { w.items = w.items.filter((it) => it.exId !== e.id); });
      store.set('custom', S.custom);
      saveWorkouts();
      exCache = null;
      render();
      toast('Exercice supprimé');
    },
    'add-to': (el) => {
      const w = getWorkout(el.dataset.w);
      w.items.push(itemFromEx(getEx(el.dataset.ex)));
      saveWorkouts();
      closeModal();
      toast(`Ajouté à « ${w.name} » ✓`);
    },
    'add-to-new': (el) => { const w = createWorkout([el.dataset.ex]); closeModal(); openBuilder(w.id); },

    // Ateliers
    'new-workout': () => openBuilder(createWorkout().id),
    'edit-workout': (el) => openBuilder(el.dataset.id),
    launch: (el) => openCheckin(el.dataset.id),
    'w-menu': async (el) => {
      const w = getWorkout(el.dataset.id);
      const r = await choose({
        title: `${w.emoji || '🧩'} ${w.name}`,
        choices: [{ id: 'dup', label: `${icon('copy', 'w-5 h-5')} Dupliquer` }, { id: 'del', label: `${icon('trash', 'w-5 h-5')} Supprimer`, kind: 'danger' }],
      });
      if (r === 'dup') {
        const copy = { ...JSON.parse(JSON.stringify(w)), id: 'w-' + uid(), name: `${w.name} (copie)`, createdAt: Date.now() };
        copy.items.forEach((it) => { it.uid = uid(); });
        S.workouts.splice(S.workouts.indexOf(w) + 1, 0, copy);
        saveWorkouts();
        render();
        toast('Atelier dupliqué');
      } else if (r === 'del') {
        if (!(await confirmBox('Supprimer cet atelier ?', `« ${esc(w.name)} » sera supprimé. Ton historique est conservé.`, 'Supprimer'))) return;
        S.workouts = S.workouts.filter((x) => x !== w);
        saveWorkouts();
        render();
        toast('Atelier supprimé');
      }
    },

    // Composer
    'w-emoji': (el) => { builderWorkout().emoji = el.dataset.emoji; saveWorkouts(); refreshBuilder(); },
    'b-toggle': (el) => { S.builder.open = S.builder.open === el.dataset.uid ? null : el.dataset.uid; refreshBuilder(); },
    'b-remove': (el) => {
      const w = builderWorkout();
      w.items = w.items.filter((it) => it.uid !== el.dataset.uid);
      saveWorkouts();
      refreshBuilder();
    },
    'b-step': (el) => {
      const it = builderWorkout().items.find((x) => x.uid === el.dataset.uid);
      stepField(it, el.dataset.field, +el.dataset.delta);
      saveWorkouts();
      refreshBuilder();
    },
    'b-mode': (el) => {
      const it = builderWorkout().items.find((x) => x.uid === el.dataset.uid);
      it.mode = el.dataset.mode;
      saveWorkouts();
      refreshBuilder();
    },
    'b-move': (el) => {
      const w = builderWorkout(), i = w.items.findIndex((x) => x.uid === el.dataset.uid), j = i + +el.dataset.dir;
      if (j < 0 || j >= w.items.length) return;
      [w.items[i], w.items[j]] = [w.items[j], w.items[i]];
      saveWorkouts();
      refreshBuilder();
    },
    'open-picker': () => openPicker(),
    'pick-cat': (el) => { S.picker.cat = el.dataset.cat; refreshPicker(true); },
    'pick-toggle': (el) => {
      const w = builderWorkout(), id = el.dataset.id;
      const last = w.items.map((it) => it.exId).lastIndexOf(id);
      if (last >= 0) w.items.splice(last, 1); else { w.items.push(itemFromEx(getEx(id))); buzz(12); }
      saveWorkouts();
      refreshPicker();
    },

    // Avant la séance
    'ci-energy': (el) => {
      const c = S.checkin;
      c.energy = +el.dataset.v;
      if (!c.lightTouched) c.light = c.energy <= 2 || c.pain;
      renderCheckin();
    },
    'ci-light': (el) => { S.checkin.light = el.dataset.v === '1'; S.checkin.lightTouched = true; renderCheckin(); },
    'ci-go': () => { const c = S.checkin; closeModal(); startSession(c.id, c); },

    // Séance
    'pl-quit': () => askQuit(),
    'pl-toggle': () => togglePause(),
    'pl-next': () => skipStep(),
    'pl-prev': () => prevStep(),
    'pl-done': () => completeStep(),
    'pl-add': () => addTime(15),
    'pl-sound': () => {
      const on = !(S.settings.sound || S.settings.voice);
      S.settings.sound = on;
      S.settings.voice = on;
      saveSettings();
      if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
      ensureAudio();
      renderPlayer();
      toast(on ? 'Son activé 🔊' : 'Son coupé 🔇');
    },
    'pl-sos': () => openSos(),
    'sos-end': () => { closeModal(); finishSession(); },
    'sos-resume': () => { closeModal(); if (S.player?.paused) togglePause(); },
    'sum-rpe': (el) => { S.player.rpe = +el.dataset.v; renderSummary(); },
    'sum-save': () => saveSummary(),
    'sum-discard': async () => {
      if (await confirmBox('Ne pas enregistrer ?', 'Cette séance ne figurera pas dans ton historique.', 'Ne pas enregistrer')) closePlayer();
    },

    // Historique
    'h-del': async (el) => {
      if (!(await confirmBox('Supprimer cette séance ?', "Elle sera retirée de ton historique.", 'Supprimer'))) return;
      S.history = S.history.filter((h) => h.id !== el.dataset.id);
      saveHistory();
      render();
    },

    // Réglages
    set: (el) => {
      const k = el.dataset.key, raw = el.dataset.value;
      S.settings[k] = raw === 'true' ? true : raw === 'false' ? false : /^\d+(\.\d+)?$/.test(raw) ? +raw : raw;
      saveSettings();
      applyTheme();
      openSettings();
      render();
      if (k === 'voiceRate') sayExample();
    },
    'voice-test': () => sayExample(),
    export: () => exportData(),
    import: () => $('#import-file').click(),
    'reset-ex': async () => {
      if (!(await confirmBox('Réinitialiser les exercices du livret ?', 'Les catégories, favoris, modifications et exercices masqués reviennent à l\'état d\'origine. Tes exercices perso sont conservés.', 'Réinitialiser'))) return;
      S.overrides = {};
      store.set('overrides', S.overrides);
      exCache = null;
      render();
      toast('Exercices du livret réinitialisés');
    },
    'reset-all': async () => {
      if (!(await confirmBox('Tout effacer ?', 'Ateliers, historique, exercices perso et réglages seront supprimés de ce téléphone. Pense à exporter une sauvegarde avant.', 'Tout effacer'))) return;
      Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k));
      location.reload();
    },
    'onboard-phase': (el) => {
      S.settings.phase = +el.dataset.value;
      saveSettings();
      $$('[data-action="onboard-phase"]').forEach((b) => b.classList.toggle('is-on', +b.dataset.value === S.settings.phase));
      render();
    },
    'onboard-ok': () => { S.settings.accepted = true; saveSettings(); closeModal(); checkActive(); },
    'resume-yes': () => { const a = store.get('active', null); closeModal(); if (a) resumeActive(a); },
    'resume-no': () => { store.del('active'); closeModal(); },
  };

  /* ================= Saisie (input / change) ================= */
  const I = {
    'lib-q': (el) => { S.lib.q = el.value; refreshLibrary(); },
    'pick-q': (el) => { S.picker.q = el.value; refreshPicker(true); },
    'w-name': (el) => { const w = builderWorkout(); w.name = el.value.trim() || 'Atelier sans nom'; delete w.fresh; saveWorkouts(); },
    'ci-pain': (el) => { const c = S.checkin; c.pain = el.checked; if (!c.lightTouched) c.light = c.energy <= 2 || c.pain; renderCheckin(); },
    'sum-note': (el) => { S.player.note = el.value; },
    'sum-pain': (el) => { S.player.painDuring = el.checked; renderSummary(); },
    'sum-prog': (el) => { S.player.progress = el.checked; },
    'set-bool': (el) => { S.settings[el.dataset.key] = el.checked; saveSettings(); if (el.checked) ensureAudio(); if (el.dataset.key === 'voice') openSettings(); },
    'set-voice': (el) => { S.settings.voiceURI = el.value; saveSettings(); sayExample(); },
    'f-suggest': (el) => {
      if (!S.form || S.form.catTouched) return;
      const f = el.form.elements, cat = suggestCategory([f.name.value, f.objective.value, f.steps.value].join(' '));
      if (cat) f.cat.value = cat;
      setText('#f-cat-hint', cat ? `✨ Tri automatique : ${catOf(cat).emoji} ${catOf(cat).label}` : '');
    },
    'f-cat': () => { if (S.form) S.form.catTouched = true; setText('#f-cat-hint', ''); },
    'f-mode': () => syncFormMode(),
    'f-img': async (el) => {
      const file = el.files?.[0];
      if (!file) return;
      try {
        S.form.img = await compressImage(file);
        $('#f-img-prev').innerHTML = `<img src="${S.form.img}" alt="" class="w-full h-full object-cover">`;
      } catch { toast("Impossible de lire cette image."); }
    },
    'import-file': (el) => { const f = el.files?.[0]; el.value = ''; if (f) importData(f); },
  };

  /* ================= Branchements ================= */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') ev.preventDefault();
    fn(el, ev);
  });
  const SKIP_INPUT = '[type=checkbox],[type=radio],[type=file],select';
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!el.dataset?.input || el.matches(SKIP_INPUT)) return;
    I[el.dataset.input]?.(el, ev);
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (!el.dataset?.input || !el.matches(SKIP_INPUT)) return;
    I[el.dataset.input]?.(el, ev);
  });
  document.addEventListener('submit', (ev) => {
    const form = ev.target;
    if (form.dataset.submit !== 'ex-save') return;
    ev.preventDefault();
    saveExerciseForm(form);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modalOpen) { closeModal(); return; }
    const P = S.player;
    if (!P || P.finished || modalOpen || ev.target.matches('input, textarea, select')) return;
    if (ev.key === ' ') { ev.preventDefault(); togglePause(); }
    else if (ev.key === 'ArrowRight') skipStep();
    else if (ev.key === 'ArrowLeft') prevStep();
    else if (ev.key === 'Enter' && P.steps[P.idx].kind === 'work' && !P.steps[P.idx].dur) completeStep();
  });

  document.addEventListener('toggle', (ev) => {
    // Garde les consignes ouvertes pendant l'étape (pause, +15 s…) si l'utilisateur les a dépliées.
    if (S.player && ev.target.classList?.contains('pl-howto')) S.player.howtoIdx = ev.target.open ? S.player.idx : null;
  }, true);

  window.addEventListener('popstate', () => {
    if (ignorePop > 0) { ignorePop--; return; }
    if (popTimer) { clearTimeout(popTimer); popTimer = null; }
    overlayEntry = false;
    if (modalOpen) {
      closeModal({ fromPop: true });
      if (S.player) pushOverlay();
      return;
    }
    if (S.player) {
      pushOverlay();
      if (!S.player.finished) askQuit();
    }
  });
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.player && !S.player.finished) { lockScreen(); tick(); }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  if ('speechSynthesis' in window) {
    loadVoices();
    // Chrome charge la liste des voix en différé.
    speechSynthesis.onvoiceschanged = () => {
      loadVoices();
      const sel = $('#voice-select');
      if (sel) sel.innerHTML = voiceOptions();
    };
  }

  /* ================= Démarrage ================= */
  function checkActive() {
    const a = store.get('active', null);
    if (!a) return;
    if (Date.now() - a.savedAt > 6 * 3600000) { store.del('active'); return; }
    openModal(`<div class="p-5 space-y-4">
      <h2 class="text-xl font-black">Séance en cours</h2>
      <p class="text-muted">« ${esc(a.emoji || '🧩')} ${esc(a.name)} » a été interrompue. Veux-tu la reprendre là où tu t'étais arrêté·e ?</p>
      <div class="grid gap-2">
        <button class="btn btn-primary btn-lg" data-action="resume-yes">${icon('play', 'w-5 h-5')} Reprendre</button>
        <button class="btn btn-ghost" data-action="resume-no">Abandonner cette séance</button>
      </div>
    </div>`, { label: 'Séance en cours' });
  }

  const VIEWS = { home: viewHome, library: viewLibrary, workouts: viewWorkouts, builder: viewBuilder, history: viewHistory };

  if (!Array.isArray(S.workouts)) { S.workouts = seedWorkouts(); saveWorkouts(); }
  applyTheme();
  route();
  if (!S.settings.accepted) openOnboarding(); else checkActive();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
