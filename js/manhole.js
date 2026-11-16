/* Nihongo Techō – Gullideckel: Schnappschuss des Lernstands, Lebenszeit-Zähler (settings.stats), Freischalten (settings.manhole).
   Teil 2 (unten): Startseiten-Kachel, Sammelseite #/gullideckel mit Japan-Karte, Freischalt-Fenster über onShow. Ein Fehler hier darf Bewerten, Hören oder das Forum nie stören. */
'use strict';
(function (App) {
  const L = App.manholeLogic, DEFS = App.manholeData.DEFS;
  const st = () => App.store.settings;
  const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { console.error('Gullideckel:', e); } };

  // ---------- Zähler ----------
  // Im Speicher sofort, in der Datenbank gesammelt (still): eine Bewertung mit Reihe-Rekord schreibt so nur einmal
  // Backup wird gerade eingespielt (Datenbank neu, gleich location.reload): nichts Altes mehr zurückschreiben
  const restoring = () => { try { return !!(App.backup && App.backup.restoring && App.backup.restoring()); } catch (e) { return false; } };
  let saveTimer = null;
  const flush = () => {
    clearTimeout(saveTimer); saveTimer = null;
    if (restoring()) return Promise.resolve();
    return App.saveSettings({ stats: st().stats }, { silent: true }).catch((e) => console.error('Gullideckel:', e));
  };
  const put = (next) => {
    if (JSON.stringify(next) === JSON.stringify(st().stats || {})) return;
    st().stats = next;
    if (!saveTimer) saveTimer = setTimeout(flush, 800);
    later();
  };
  if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => { if (saveTimer && !restoring()) flush(); });

  const bump = safe((key, by = 1) => { if (by > 0) put(L.bump(st().stats, key, by)); });
  const max = safe((key, value) => put(L.max(st().stats, key, value || 0)));

  // App.grade: eine Wiederholung, Uhrzeit-Flags, offenes Comeback einlösen
  const graded = safe(() => {
    const s = L.bump(st().stats, 'reviews');
    const f = L.timeFlags(new Date());
    for (const k in f) if (f[k]) s[k] = 1;
    if (s.comebackPending) { s.comeback = 1; delete s.comebackPending; }
    put(s);
  });
  // App.gradeWrite: Kanji geschrieben (Kana zählen nicht)
  const wrote = safe((srsId) => { if (!String(srsId).startsWith('w:kana:')) bump('kanjiWritten'); });

  // Forum: beim ersten Laden eigene Beiträge und Satz-des-Tages-Tage nachzählen (einmal)
  const seedForum = safe((posts, dailyDays) => {
    if (st().stats && st().stats.forumSeeded) return;
    let s = L.max(st().stats, 'forumPosts', posts || 0);
    s = L.max(s, 'dailySentences', dailyDays || 0);
    s.forumSeeded = 1;
    put(s);
  });

  // ---------- Schnappschuss ----------
  const snapshot = () => {
    const S = App.store, set = S.settings, today = App.today();
    const vocab = App.itemsOf('vocab');
    const kanaAll = (script) => { const l = App.kanaLogic.items(script); return l.length > 0 && l.every((it) => S.srs.has('w:' + it.id)); };
    const best = Object.values((App.exams && App.exams.cache && App.exams.cache.best) || {}).filter(Boolean);
    const plain = (html) => App.aLogic.plainText(html || '');
    const inked = new Set();
    S.files.forEach((f) => { if (f.sessionId && f.role === 'notes' && (S.inkCount.get(f.id) || 0) > 0) inked.add(f.sessionId); });
    const have = set.manhole || {};
    return {
      words: vocab.filter((it) => App.wordState(it) === 'known').length,
      kanji: App.vocabCounts(App.itemsOf('kanji').filter((k) => k.char !== '々')).known,
      grammar: App.progressCounts(App.itemsOf('grammar')).known,
      hiraganaAll: kanaAll('h'), katakanaAll: kanaAll('k'),
      diaryTexts: App.itemsOf('journal').map((j) => plain(j.html)),
      ownVocab: vocab.filter(App.isOwn).length,
      nhk: vocab.filter((it) => it.sourceRef).length,
      history: set.dayHistory || {},
      off: App.streakLogic.offDays(set.vacationLog, set.vacation, today),
      today,
      examsPassed: best.filter((b) => b.passed).length,
      exams100: best.filter((b) => b.pct === 100).length,
      lessons: App.itemsOf('session').filter((x) => plain(x.notesHtml).trim() || inked.has(x.id)).length,
      collected: DEFS.filter((d) => d.pref !== null && have[d.id]).length,
      stats: set.stats || {},
    };
  };

  // ---------- Freischalten und Zeigen ----------
  let queue = [], held = false, ready = false;
  const listeners = [];
  const show = () => {
    if (held || !listeners.length || !queue.length) return;
    const ids = queue.splice(0);
    listeners.forEach((fn) => { try { fn(ids); } catch (e) { console.error('Gullideckel:', e); } });
  };
  // Neue Deckel speichern (einmal gesammelt bleibt gesammelt) und zeigen; liefert die neuen IDs
  const check = async () => {
    try {
      if (!ready || restoring()) return [];
      const have = st().manhole || {}, today = App.today();
      const fresh = L.check(DEFS, L.metrics(snapshot()), have, today);
      if (!fresh.length) return [];
      const next = Object.assign({}, have);
      fresh.forEach((id) => { next[id] = today; });
      await App.saveSettings({ manhole: next }, { silent: true }); // setzt settings.manhole sofort: ein zweiter Lauf findet sie nicht noch einmal
      queue.push(...fresh);
      show();
      return fresh;
    } catch (e) { console.error('Gullideckel:', e); return []; }
  };
  // gebündelt: höchstens alle 3 s – nicht während einer Kartenrunde (hold), dort prüft erst das Rundenende
  let laterTimer = null;
  const later = () => { if (ready && !held && !laterTimer) laterTimer = setTimeout(() => { laterTimer = null; if (!held) check(); }, 3000); };
  // Rundenende: erst prüfen (Deckel der letzten Karte), dann alles Gesammelte in einem Fenster zeigen
  const hold = (on) => { held = !!on; return held ? Promise.resolve() : check().then(show); };
  const onShow = (fn) => { listeners.push(fn); show(); };

  // ---------- Start (main.js, nach dem Laden) ----------
  let bootAt = 0;
  const boot = async () => {
    bootAt = Date.now();
    try {
      const S = App.store, set = S.settings, today = App.today();
      let reviews = 0, kanjiWritten = 0;
      S.srs.forEach((s) => {
        reviews += s.reps || 0;
        if (String(s.id).startsWith('w:') && !String(s.id).startsWith('w:kana:')) kanjiWritten += s.reps || 0;
      });
      let s = L.seedStats(set.stats, { reviews, kanjiWritten, openDays: Object.keys(set.dayHistory || {}).length });
      if (s.lastOpen !== today) {
        if (L.comebackDue(s.lastOpen, today, App.streakLogic.offDays(set.vacationLog, set.vacation, today))) s.comebackPending = 1;
        s = L.bump(s, 'openDays');
        s.lastOpen = today;
      }
      if (JSON.stringify(s) !== JSON.stringify(set.stats || {})) await App.saveSettings({ stats: s }, { silent: true });
    } catch (e) { console.error('Gullideckel:', e); }
    ready = true;
    App.onChange(later);
    return check();
  };

  // ---------- Anzeige-Helfer (ohne DOM) ----------
  // Einheit je Metrik [eins, viele] für „noch 3 Kanji“; Ja/Nein-Meilensteine (Schwelle 1) haben keinen Zähltext
  const UNITS = {
    words: ['Wort', 'Wörter'], kanji: ['Kanji', 'Kanji'], grammar: ['Grammatik-Eintrag', 'Grammatik-Einträge'],
    reviews: ['Wiederholung', 'Wiederholungen'], kanjiWritten: ['Kanji schreiben', 'Kanji schreiben'],
    diary: ['Tagebuch-Satz', 'Tagebuch-Sätze'], translations: ['Übersetzung', 'Übersetzungen'],
    ownVocab: ['eigene Vokabel', 'eigene Vokabeln'], nhk: ['Wort aus NHK', 'Wörter aus NHK'],
    forumPosts: ['Forum-Beitrag', 'Forum-Beiträge'], dailySentences: ['Satz des Tages', 'Sätze des Tages'],
    openDays: ['Tag', 'Tage'], flame: ['Tag Flamme', 'Tage Flamme'], dayAll: ['volle Tagesliste', 'volle Tageslisten'],
    listenMin: ['Minute hören', 'Minuten hören'], lessons: ['Stunde mitschreiben', 'Stunden mitschreiben'], collected: ['Deckel', 'Deckel'],
  };
  const left = (def, m) => {
    const u = UNITS[def.metric], p = L.progress(def, m);
    return def.n > 1 && u && p.left ? `noch ${p.left} ${u[p.left === 1 ? 0 : 1]}` : '';
  };
  // zuletzt gesammelter Deckel (bei gleichem Datum der spätere in der Liste)
  const newest = (have) => {
    let best = null;
    DEFS.forEach((d) => { const t = (have || {})[d.id]; if (t && (!best || t >= have[best.id])) best = d; });
    return best;
  };
  const dateDe = (iso) => { const [y, mo, d] = String(iso).split('-'); return `${d}.${mo}.${y}`; };

  App.manhole = { bump, max, graded, wrote, seedForum, snapshot, check, hold, held: () => held, bootedAt: () => bootAt, onShow, boot, queued: () => queue.slice(), left, newest, dateDe };

  // =========================================================
  // Teil 2: Kachel (Startseite), Sammelseite #/gullideckel, Freischalt-Fenster – nur im Browser
  // =========================================================
  const ui = () => {
    const esc = App.esc, cover = App.manholeCover;
    const PREFS = DEFS.filter((d) => d.pref !== null), BONUS = DEFS.find((d) => d.pref === null);
    const view = () => {
      const have = st().manhole || {};
      return { have, m: L.metrics(snapshot()), n: PREFS.filter((d) => have[d.id]).length };
    };
    const nextLine = (v) => {
      const next = L.nearest(DEFS, v.m, v.have);
      if (next) return `${next.name}: ${left(next, v.m) || next.text}`;
      return v.n >= PREFS.length ? 'Ganz Japan gesammelt 🎉' : 'Nur noch geheime Deckel 🤫';
    };
    const lead = (v) => newest(v.have) || L.nearest(DEFS, v.m, v.have) || PREFS[0];

    // ---------- Kachel ----------
    const tile = () => safeHtml(() => {
      const v = view(), d = lead(v);
      return `<a class="card mh-tile" href="#/gullideckel" data-manhole-tile>
        <span class="mh-tile-cover">${cover(d, { size: 64, locked: !v.have[d.id] })}</span>
        <span class="mh-tile-txt"><b><span lang="ja">マンホール</span> <span class="mh-count">${v.n}/${PREFS.length}</span></b>
          <small>${esc(nextLine(v))}</small>
          <span class="progress mh-bar"><i style="width:${(v.n / PREFS.length) * 100}%"></i></span></span>
        <span class="mh-go">Zur Sammlung ›</span></a>`;
    });
    // Handy-Startseite: eine schmale Zeile mit kleinem Deckel
    const tileHandy = () => safeHtml(() => {
      const v = view(), d = lead(v);
      return `<a class="hh-mh" href="#/gullideckel" data-hh-manhole>${cover(d, { size: 44, locked: !v.have[d.id] })}
        <span class="hh-mh-txt"><b><span lang="ja">マンホール</span> ${v.n}/${PREFS.length}</b><small>${esc(nextLine(v))}</small></span><span class="hh-mh-go">›</span></a>`;
    });
    function safeHtml(fn) { try { return fn(); } catch (e) { console.error('Gullideckel:', e); return ''; } }

    // ---------- Sammelseite ----------
    // Schild: Deckel, Präfektur, Meilenstein (geheim und nicht gesammelt: „Geheim 🤫“), Datum bzw. Fortschritt
    const tipHtml = (d, v) => {
      const got = v.have[d.id];
      const goal = !got && d.secret ? 'Geheim 🤫' : d.text;
      const sub = got ? `gesammelt am ${dateDe(got)}` : d.secret ? '' : left(d, v.m) || 'noch nicht geschafft';
      return `${cover(d, { size: 72, locked: !got })}<div class="mh-tip-txt"><b><span lang="ja">${esc(d.kanji)}</span> ${esc(d.name)}</b>
        <span>${esc(goal)}</span>${sub ? `<small class="${got ? 'got' : ''}">${esc(sub)}</small>` : ''}</div>`;
    };

    App.route('/gullideckel', (root) => {
      const v = view(), J = App.japanMap, box = J.inset;
      const byPref = {};
      PREFS.forEach((d) => { byPref[d.pref] = d; });
      const label = (d) => esc(`${d.kanji} ${d.name} – ${v.have[d.id] ? 'gesammelt' : 'noch nicht gesammelt'}`);
      const paths = Object.keys(J.prefs).map((code) => {
        const d = byPref[code];
        if (!d) return '';
        const fill = v.have[d.id] ? ` style="fill:${d.color}"` : '';
        // Okinawa: die Inseln sind schmal – Ziel ist der ganze Kasten (unten)
        if (d.id === 'okinawa') return `<path class="mh-pref${v.have[d.id] ? ' got' : ''} mh-oki" d="${J.prefs[code]}"${fill}/>`;
        return `<path class="mh-pref${v.have[d.id] ? ' got' : ''}" d="${J.prefs[code]}"${fill} data-mh="${d.id}" tabindex="0" aria-label="${label(d)}"/>`;
      }).join('');
      const oki = byPref['JP-47'];
      const inset = `<rect class="mh-inset" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14" data-mh="${oki.id}" tabindex="0" aria-label="${label(oki)}"/>
        <text class="mh-inset-lbl" x="${box.x + 14}" y="${box.y + 34}" lang="ja">沖縄</text>`;
      const bonus = v.have[BONUS.id];
      root.innerHTML = `<div class="sec-home mh-page">
        <div class="page-head"><div class="titles"><h1><span><span lang="ja">日本</span> Sammlung</span><span class="mh-head-n">· ${v.n} von ${PREFS.length}</span>${bonus ? ' <span class="mh-head-bonus"><span lang="ja">日本</span>-Deckel ✓</span>' : ''}</h1>
          <p>Jeder Meilenstein bringt einen Gullideckel. Fahr über eine Präfektur oder tipp sie an.</p></div></div>
        <div class="mh-wrap"><div class="card mh-mapcard"><svg class="mh-map" viewBox="${J.viewBox}" role="group" aria-label="Japan-Karte mit deinen Gullideckeln">
          <g class="mh-prefs">${paths}</g>${inset}</svg></div>
          ${bonus ? `<aside class="card mh-bonus">${cover(BONUS, { size: 140 })}<b><span lang="ja">${esc(BONUS.kanji)}</span> ${esc(BONUS.name)}</b><span>${esc(BONUS.text)}</span><small>gesammelt am ${dateDe(bonus)}</small></aside>` : ''}</div>
        <div class="mh-tip" role="tooltip" hidden></div></div>`;
      const svg = root.querySelector('.mh-map'), tip = root.querySelector('.mh-tip');
      let curId = null, lastType = 'mouse';
      const hide = () => { tip.hidden = true; curId = null; svg.querySelectorAll('.on').forEach((x) => x.classList.remove('on')); };
      // Maus/Stift: rechts unter dem Zeiger; Finger: unter dem Finger. Immer ganz im Fenster.
      const showAt = (id, x, y, touch) => {
        const d = DEFS.find((z) => z.id === id);
        if (!d) return hide();
        if (curId !== id) {
          svg.querySelectorAll('.on').forEach((z) => z.classList.remove('on'));
          const el = svg.querySelector(`[data-mh="${id}"]`);
          if (el) el.classList.add('on');
          tip.innerHTML = tipHtml(d, v);
          curId = id;
        }
        tip.hidden = false;
        const w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight, M = 8;
        let lx, ty;
        if (touch) { lx = x - w / 2; ty = y + 28; } else {
          lx = x + 16; ty = y + 16;
          if (lx + w > vw - M) lx = x - 16 - w;
          if (ty + h > vh - M) ty = y - 16 - h;
        }
        tip.style.left = `${Math.round(Math.max(M, Math.min(lx, vw - w - M)))}px`;
        tip.style.top = `${Math.round(Math.max(M, Math.min(ty, vh - h - M)))}px`;
      };
      const hit = (e) => { const t = e.target.closest && e.target.closest('[data-mh]'); return t ? t.dataset.mh : null; };
      svg.addEventListener('pointerdown', (e) => { lastType = e.pointerType || 'mouse'; });
      svg.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const id = hit(e);
        if (id) showAt(id, e.clientX, e.clientY, false); else hide();
      });
      svg.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hide(); });
      svg.addEventListener('click', (e) => {
        const id = hit(e);
        if (id) showAt(id, e.clientX, e.clientY, lastType === 'touch' || document.body.classList.contains('view-handy'));
        else hide();
      });
      svg.addEventListener('focusin', (e) => {
        const id = hit(e);
        if (!id) return;
        const r = e.target.getBoundingClientRect();
        showAt(id, r.left + r.width / 2, r.bottom, true);
      });
      svg.addEventListener('focusout', hide);
      // Tipp daneben oder Esc schließt das Schild
      const away = (e) => { if (!tip.hidden && !(e.target.closest && (e.target.closest('[data-mh]') || e.target.closest('.mh-tip')))) hide(); };
      const esc2 = (e) => { if (e.key === 'Escape' && !tip.hidden) hide(); };
      document.addEventListener('click', away, true);
      document.addEventListener('keydown', esc2);
      window.addEventListener('scroll', hide, { passive: true });
      App.onLeave(() => {
        document.removeEventListener('click', away, true);
        document.removeEventListener('keydown', esc2);
        window.removeEventListener('scroll', hide);
      });
    });

    // ---------- Freischalt-Fenster ----------
    // Liegt schon ein Fenster oder die Tour offen, wartet es; mehrere Schübe kommen zusammen in ein Fenster
    const pending = [];
    let waitTimer = null;
    // Kartenrunde (hold) zählt auch als belegt: das Fenster wartet bis zum Rundenende/Verlassen, nie über einer Karte
    const busy = () => !!document.querySelector('.modal-back') || !!(App.tour && App.tour.active && App.tour.active()) || App.manhole.held();
    // Start: „Was ist neu“ (news.boot, 900 ms nach dem ersten Zeichnen) kommt zuerst – erst 1,2 s nach boot,
    // dann solange news noch auf seinen Auftritt wartet; liegt sein Fenster offen, wartet busy() wie sonst
    const newsFirst = () => !!(App.news && App.news.pending && App.news.pending());
    const tryOpen = () => {
      clearTimeout(waitTimer); waitTimer = null;
      if (!pending.length) return;
      const wait = App.manhole.bootedAt() + 1200 - Date.now();
      if (wait > 0) { waitTimer = setTimeout(tryOpen, wait); return; }
      if (newsFirst()) { waitTimer = setTimeout(tryOpen, 300); return; }
      if (busy()) { waitTimer = setTimeout(tryOpen, 1500); return; }
      open(pending.splice(0));
    };
    const open = (ids) => {
      const defs = ids.map((id) => DEFS.find((d) => d.id === id)).filter(Boolean);
      if (!defs.length) return;
      const one = defs.length === 1, d = defs[0];
      const total = PREFS.filter((x) => (st().manhole || {})[x.id]).length;
      const body = one
        ? `<div class="mh-pop"><div class="mh-stamp">${cover(d, { size: 200 })}</div>
            <p class="mh-pop-title">Neuer Gullideckel: <b><span lang="ja">${esc(d.kanji)}</span> ${esc(d.name)}</b></p><p class="mh-pop-goal">${esc(d.text)}</p></div>`
        : `<div class="mh-pop"><p class="mh-pop-title"><b>${defs.length === total ? `Du hast schon ${defs.length} Gullideckel!` : `${defs.length} neue Gullideckel!`}</b></p>
            <div class="mh-pop-grid">${defs.map((x, i) => `<figure class="mh-stamp" style="animation-delay:${Math.min(i, 12) * 70}ms">${cover(x, { size: 96 })}<figcaption><span lang="ja">${esc(x.kanji)}</span> ${esc(x.name)}</figcaption></figure>`).join('')}</div></div>`;
      const back = document.activeElement;
      const md = App.modal({
        title: '<span class="jp">マンホール</span> Gullideckel', cls: 'mh-modal', body,
        foot: '<button class="btn" data-mh-go>Zur Sammlung</button><button class="btn btn-primary" data-mh-ok autofocus>Weiter</button>',
        onClose: () => {
          if (back && back.isConnected && back.focus) try { back.focus(); } catch (e) { /* egal */ }
          const path = App.parseHash().path;
          if (path === '/' || path === '/gullideckel') App.render(true); // Kachel und Karte zeigen den neuen Deckel
          tryOpen();
        },
      });
      md.el.querySelector('[data-mh-ok]').onclick = md.close;
      md.el.querySelector('[data-mh-go]').onclick = () => { md.close(); if (App.parseHash().path !== '/gullideckel') location.hash = '#/gullideckel'; };
      if (App.matsuri) App.matsuri({ jp: 'マンホール！', de: one ? 'Neuer Gullideckel' : 'Neue Gullideckel' });
    };
    onShow((ids) => { pending.push(...ids); tryOpen(); });

    Object.assign(App.manhole, { tile, tileHandy, open });
  };
  if (typeof document !== 'undefined' && App.route && App.manholeCover && App.japanMap) ui();
})(window.App = window.App || {});
