/* Nihongo Techō – Grammatik-Kompass N5/N4 (#/kompass) und Wochen-Waage (Block auf der Startseite) samt Zeitmessung */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const C = App.compassLogic;
  const S = App.store;
  const TICK = 5;    // Sekunden pro Messschritt
  const FLUSH = 60;  // so oft ins Protokoll schreiben (Sekunden)

  // ---------- Kompass: Zählen ----------
  App.compass = {
    // Grammatikpunkt selbst richtig gebildet (Übersetzen Deutsch → Japanisch, Umformen)
    made: (id) => { if (id) App.saveSettings({ gramMade: C.bump(S.settings.gramMade, id) }, { silent: true }); },
  };
  const ownDocs = () => (App.aLogic ? Array.from(S.items.values()).filter((x) => x.type === 'journal' || x.type === 'answer').map((x) => ({ item: x, text: App.aLogic.plainText(x.html) })) : []);
  const rowsFor = (level) => {
    const docs = ownDocs();
    const uses = (it) => { const r = App.grammarUsesLogic.uses(it, docs, { limit: 0 }); return r.more; };
    return C.rows(App.itemsOf('grammar').filter((g) => g.level === level), S.settings.gramMade, uses);
  };

  App.route('/kompass', (view, p, q) => {
    // Stufe: aus der Adresse, sonst die zuletzt angesehene (pro Gerät), sonst N5
    const LV = ['N5', 'N4'];
    const level = LV.includes(q.lv) ? q.lv : LV.includes(App.lsGet('kompassLv')) ? App.lsGet('kompassLv') : 'N5';
    App.lsSet('kompassLv', level);
    const show = ['0', '1', '2'].includes(q.st) ? +q.st : null;
    const all = {};
    LV.forEach((l) => { all[l] = rowsFor(l); });
    const rows = all[level];
    const s = C.summary(rows);
    // Beide Stufen nebeneinander, die gewählte hervorgehoben – antippen wechselt
    const tile = (l) => {
      const t = C.summary(all[l]);
      const w = (n) => (t.total ? (n / t.total) * 100 : 0);
      return `<a class="kp-level${l === level ? ' on' : ''}" href="#/kompass?${new URLSearchParams(Object.assign({}, q, { lv: l })).toString()}">
        <b>${l}</b><span>${t.total ? `<b style="color:var(--matcha)">${t.safe}</b> / ${t.total} sicher` : '<span class="muted">nicht in der Sammlung</span>'}</span>
        <div class="progress kp-bar"><i style="width:${w(t.safe)}%;background:var(--matcha)"></i><i style="width:${w(t.started)}%;background:var(--matcha-soft)"></i></div></a>`;
    };
    const pct = (n) => (s.total ? (n / s.total) * 100 : 0);
    const dots = (n) => (n ? `<span class="kp-dots">${'●'.repeat(Math.min(n, C.SAFE))}${n > C.SAFE ? '<small>+' + (n - C.SAFE) + '</small>' : ''}</span>` : '');
    const chip = (r) => `<a class="kp-chip kp-s${r.stage}" href="${App.link(r.it)}" title="${esc(r.it.title)}${r.n ? ` – ${r.ex}× geübt, ${r.own}× in eigenen Sätzen` : ' – noch nicht selbst gebildet'}"><span lang="ja">${App.jp.ruby(r.it.jp || r.it.title)}</span>${dots(r.n)}</a>`;
    const seg = (k, v, l) => `<a class="${String(q[k] ?? '') === v ? 'on' : ''}" href="#/kompass?${new URLSearchParams(Object.assign({}, q, { [k]: v })).toString()}">${l}</a>`;
    const list = rows.filter((r) => show === null || r.stage === show);
    view.innerHTML = `<div class="sec-grammar">
      <div class="crumbs">${App.backCrumb()} › Kompass</div>
      <div class="page-head"><div class="titles"><h1>Grammatik-Kompass <span class="jp-title">羅針盤</span></h1>
        <p>Welche Grammatik kannst du schon <b>selbst bilden</b>? Ein ● für jedes Mal: richtig übersetzt (Deutsch → Japanisch), richtig umgeformt oder in einem eigenen Satz im Tagebuch bzw. Smalltalk benutzt. Ab ${C.SAFE} gilt ein Punkt als sicher.</p></div></div>
      <div class="kp-levels">${LV.map(tile).join('')}</div>
      ${s.total ? `<div class="card">
        <div><b style="font-size:22px;color:var(--matcha)">${s.safe}</b> von ${s.total} ${level}-Punkten sicher · <b>${s.started}</b> angefangen · <span class="muted">${s.none} noch nicht selbst gebildet</span></div>
        <div class="progress kp-bar"><i style="width:${pct(s.safe)}%;background:var(--matcha)"></i><i style="width:${pct(s.started)}%;background:var(--matcha-soft)"></i></div>
        <div class="row" style="margin-top:12px;gap:6px;flex-wrap:wrap"><span class="seg">${seg('st', '', 'Alle')}${seg('st', '0', 'Noch nicht')}${seg('st', '1', 'Angefangen')}${seg('st', '2', 'Sicher')}</span>
          ${list.length ? `<a class="btn btn-sm" href="#/ueben/saetze?${new URLSearchParams({ gs: list.map((r) => r.it.id).join(','), gsl: level + ' · ' + ({ 0: 'Noch nicht', 1: 'Angefangen', 2: 'Sicher' }[show] || 'Alle') }).toString()}" title="Übt genau die ${list.length} Punkte dieser Auswahl">${icon('edit')} Übersetzen üben (${list.length})</a>` : ''}</div>
        <div class="kp-grid">${list.map(chip).join('') || '<p class="muted small">Nichts in dieser Auswahl.</p>'}</div>
        <p class="small muted" style="margin:10px 0 0">Antippen öffnet den Grammatikpunkt – dort gibt es „Übersetzungsübung zu diesem Thema“. Gezählt wird ab dem 22. November 2026; eigene Sätze auch von früher.</p></div>`
      : `<div class="card"><p>Noch keine ${level}-Grammatik in deiner Sammlung.</p><a class="btn" href="#/pakete">${icon('download')} JLPT-${level}-Paket holen</a></div>`}
    </div>`;
  });

  // ---------- Wochen-Waage: Zeit messen ----------
  let lastAct = Date.now(), pending = {}, since = 0, cardSrc = null;
  App.skillTime = {
    // Karteikarten-Runde meldet, welche Fertigkeit die offene Karte übt (null = keine Runde)
    setCardSource: (fn) => { cardSrc = fn; },
  };
  ['pointerdown', 'keydown', 'input', 'wheel'].forEach((t) => document.addEventListener(t, () => { lastAct = Date.now(); }, { capture: true, passive: true }));
  // Schreiben = selbst schreiben: eigene Eingabe in ein japanisches Feld (isTrusted – Diktiertes setzt das Programm ein
  // und zählt nicht) oder Striche im Schreibfeld, auf dem Schreibblatt, im Kanji-/Kana-Feld
  let lastWrite = 0;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t || !(t.matches && (t.matches('input, textarea') || t.isContentEditable))) return;
    const host = t.isContentEditable ? (t.closest('[contenteditable="true"]') || t) : t;
    const langEl = t.closest('[lang]');
    if (C.typedJa({ trusted: e.isTrusted, lang: langEl ? langEl.lang : '', text: 'value' in host && host.value != null ? host.value : host.textContent, search: t.type === 'search' || !!t.closest('.search-wrap') })) lastWrite = Date.now();
  }, true);
  document.addEventListener('pointerdown', (e) => {
    if (!e.isTrusted || !e.target || e.target.tagName !== 'CANVAS') return;
    const c = e.target;
    // Schreibblatt: nur Stift und Maus – mit dem Finger wird dort geblättert
    if (c.closest('.hw-pad, .lk-pad, .pad-wrap') || (c.closest('.vpage') && e.pointerType !== 'touch')) lastWrite = Date.now();
  }, true);
  window.addEventListener('hashchange', () => { lastWrite = 0; }); // neue Seite: das Schreiben von eben zählt dort nicht weiter
  const mediaOn = () => Array.from(document.querySelectorAll('audio, video')).some((m) => !m.paused && !m.ended)
    || (App.voiceAudio && App.voiceAudio.isPlaying && App.voiceAudio.isPlaying())
    || (window.speechSynthesis && speechSynthesis.speaking)
    || !!document.querySelector('.modal iframe[src*="youtube"], .mini-back iframe[src*="youtube"]');
  const current = () => {
    const hash = (location.hash || '').replace(/^#/, '');
    const path = hash.split('?')[0], qs = new URLSearchParams(hash.split('?')[1] || '');
    const inRound = cardSrc && /^\/ueben\/(karten|heute|kimon|auffrischen|grammatik-auffrischen)/.test(path);
    const playing = mediaOn();
    const ctx = {
      path,
      jaMic: !!(App.dictate && App.dictate.japaneseOn && App.dictate.japaneseOn()),
      readAloud: !!document.querySelector('.ra-modal'),
      playing,
      wrote: (Date.now() - lastWrite) / 1000 <= C.IDLE,
      card: inRound ? cardSrc() : undefined,
      jpPrompt: !!document.querySelector('.ex-card .ex-prompt.jp'),
      einstufenDe: qs.get('dir') === 'de',
    };
    return { skill: C.skillOf(ctx), playing };
  };
  const flush = () => {
    const keys = Object.keys(pending);
    if (!keys.length || !S.settings) return;
    let log = S.settings.skillLog;
    keys.forEach((k) => { const [date, skill] = k.split('|'); log = C.add(log, date, skill, pending[k]); });
    pending = {};
    App.saveSettings({ skillLog: log }, { silent: true }).catch(() => {});
  };
  setInterval(() => {
    if (!S.settings) return;
    const { skill, playing } = current();
    const idle = (Date.now() - lastAct) / 1000 > C.IDLE;
    const seen = document.visibilityState === 'visible';
    if (skill && (playing || (!idle && seen))) {
      const k = C.day(new Date()) + '|' + skill;
      pending[k] = (pending[k] || 0) + TICK;
    }
    since += TICK;
    if (since >= FLUSH) { since = 0; flush(); }
  }, TICK * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);

  // ---------- Wochen-Waage: Block auf der Startseite ----------
  let weekBack = 0; // 0 = diese Woche, 1 = Vorwoche …
  const COL = { l: 'var(--ai)', s: 'var(--sakura, #ED93B1)', h: 'var(--sora)', p: 'var(--yamabuki)' };
  const TIP = { l: ['Lesen', '#/eingang', 'NHK Easy lesen'], s: ['Schreiben', '#/anwenden', 'ins Tagebuch schreiben'], h: ['Hören', '#/hoeren', 'etwas anhören'], p: ['Sprechen', '#/grammatik', '声 Sätze nachsprechen (Grammatik › Zum Hören)'] };
  App.skillTime.card = () => {
    flush();
    const today = C.day(new Date());
    const mon = C.addDays(C.monday(today), -7 * weekBack);
    const min = C.week(S.settings.skillLog, mon);
    const max = Math.max(30, ...C.SKILLS.map(([k]) => min[k]));
    const low = weekBack ? null : C.lacking(min);
    const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)} Std ${m % 60 ? (m % 60) + ' Min' : ''}` : `${m} Min`);
    const label = weekBack === 0 ? 'diese Woche' : weekBack === 1 ? 'letzte Woche' : `vor ${weekBack} Wochen`;
    return `<div class="card waage"><div class="row between"><h3>天秤 Wochen-Waage <span class="muted small" style="font-weight:400">· ${label}</span></h3>
      <span class="row" style="gap:4px"><button class="btn btn-sm btn-ghost" data-waage="1" title="Woche davor">‹</button>${weekBack ? '<button class="btn btn-sm btn-ghost" data-waage="-1" title="Woche danach">›</button>' : ''}</span></div>
      <div class="waage-rows">${C.SKILLS.map(([k, l]) => `<span>${l}</span><div class="waage-track"><i style="width:${(min[k] / max) * 100}%;background:${COL[k]}"></i></div><span class="muted small">${fmt(min[k])}</span>`).join('')}</div>
      ${low ? `<a class="waage-tip" href="${TIP[low][1]}">${TIP[low][0]} kommt diese Woche zu kurz → ${esc(TIP[low][2])}</a>` : ''}
      <p class="small muted" style="margin:8px 0 0">Zählt aktive Zeit – nach einer Minute ohne Tippen oder Abspielen steht die Uhr.</p></div>`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-waage]');
    if (!b) return;
    weekBack = Math.max(0, Math.min(9, weekBack + +b.dataset.waage));
    const box = b.closest('.waage');
    if (box) box.outerHTML = App.skillTime.card();
  });
  // Einmalig: Wer die Startseite schon umsortiert hatte, bekommt die Waage ebenfalls unter „Deine Sammlung“ (vorher stand sie darüber)
  try {
    const raw = localStorage.getItem('nt-homeOrder');
    if (raw && !localStorage.getItem('nt-waageMoved')) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.includes('waage') && list.includes('sammlung')) {
        const out = list.filter((k) => k !== 'waage');
        out.splice(out.indexOf('sammlung') + 1, 0, 'waage');
        localStorage.setItem('nt-homeOrder', JSON.stringify(out));
      }
      localStorage.setItem('nt-waageMoved', '1');
    }
  } catch (e) { /* egal */ }
})(window.App);
