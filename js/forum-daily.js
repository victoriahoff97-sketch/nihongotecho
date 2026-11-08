/* Nihongo Techō – Satz des Tages: die Karte ganz oben im Forum (Anstoß, ein kurzer Satz, die Sätze der anderen) */
'use strict';
(function (App) {
  // Der Anstoß wird auf jedem Gerät selbst berechnet (js/daily-logic.js) – aus dem rohen window.SEED, nie aus der eigenen
  // Datenbank, damit alle in der Gruppe dasselbe sehen. In Firestore liegen nur die Sätze (js/forum-db.js).
  const { esc, icon } = App;
  const Y = App.dailyLogic;
  const F = App.forumLogic;
  const K = App.streakLogic;
  const D = App.forumDb;

  const KIND = { word: 'Wort des Tages', question: 'Frage des Tages', grammar: 'Grammatik des Tages', today: 'Ein Satz über heute', chain: 'Mini-Kette' };
  const LOCKED = 'Genki I freischalten, um den Anstoß zu sehen';
  const RULES = 'Konnte nicht speichern – vielleicht sind die Forum-Regeln noch nicht aktualisiert.';
  const OFFLINE = 'Gerade offline – der Satz kommt, sobald du wieder Internet hast.';
  const REASON = { lang: `Höchstens ${Y.MAX} Zeichen – ein kurzer Satz reicht.`, 'kein-japanisch': 'Mindestens ein japanisches Zeichen, bitte.' };

  let m = null;   // gemountete Karte: { el, ctx, lists: { Datum: [...] }, unsubs, ... }
  let timer = 0;  // Datumsprüfung alle 60 s
  const drafts = {}; // angefangener Satz je Datum (nur bis zum Neuladen)
  let open = false;  // Challenge aufgeklappt? Zu Beginn nur eine schmale Zeile, damit die Themen Platz haben (bleibt bis zum Neuladen)
  // 今日 abgehakt, während das Forum offen war: die Startseite zeichnet sich bei offenem Fenster nicht neu (js/main.js) –
  // darum nach dem Schließen einmal anstoßen, damit Haken und Hinweis-Zeile stimmen
  let dayDirty = false;

  const fmtTech = (step, e) => '\n\nTechnisch: ' + step + ' – ' + String((e && (e.code || e.message)) || e);
  const vacation = () => (App.pause && App.pause.vacation ? App.pause.vacation() : App.store.settings.vacation);
  const me = () => (m && (D.uid() || m.ctx.uid)) || null;

  // ---------- Anstoß ----------
  const promptHtml = (p) => {
    if (p.locked) return `<p class="fd-prompt muted">${esc(LOCKED)} · <a href="#/pakete" data-dgenki>Zum Freischalten</a></p>`;
    if (p.kind === 'today') return '<p class="fd-prompt">Ein Satz über deinen Tag</p>';
    if (p.kind === 'question') return `<p class="fd-prompt"><span lang="ja" class="fd-jp">${App.jp.ruby(p.item.jp)}</span><span class="muted">${esc(p.item.de)}</span></p>`;
    if (p.kind === 'word') {
      const w = p.item;
      const jp = w.kanji ? App.jp.notate(w.kanji, w.kana) : w.kana;
      return `<p class="fd-prompt ${App.SECTIONS.vocab.cls}"><b lang="ja" class="fd-jp">${App.jp.ruby(jp)}</b><span class="muted">${esc(App.meaning(w).text)}</span></p>`;
    }
    if (p.kind === 'grammar') {
      const g = p.item;
      const ex = (g.examples || []).find((x) => x && x.jp);
      return `<div class="fd-prompt ${App.SECTIONS.grammar.cls}"><span><b lang="ja" class="fd-jp">${App.jp.ruby(g.jp)}</b> <span class="muted">${esc(g.title)}</span></span>
        ${ex ? `<span class="fd-ex"><span lang="ja">${App.jp.ruby(ex.jp)}</span>${ex.de ? ` <span class="muted">${esc(ex.de)}</span>` : ''}</span>` : ''}</div>`;
    }
    return ''; // Kette: der Anfangssatz steht oben in der Geschichte
  };

  // Kurzer Anstoß für die zugeklappte Zeile: nur Text, ohne Furigana und Übersetzung
  const bandPrompt = (p) => {
    if (p.locked) return '';
    if (p.kind === 'today') return 'Ein Satz über deinen Tag';
    if (p.kind === 'chain') return 'Mini-Kette – schreibt gemeinsam weiter';
    const it = p.item || {};
    const jp = p.kind === 'word' ? (it.kanji || it.kana) : it.jp;
    return jp ? `<span lang="ja">${esc(App.jp.plain(jp))}</span>` : '';
  };
  const setOpen = (on) => {
    open = !!on;
    if (!m) return;
    const body = m.el.querySelector('[data-dbody]');
    const t = m.el.querySelector('[data-dtoggle]');
    if (body) body.hidden = !open;
    // zugeklappt konnte das Feld seine Höhe nicht messen: beim Aufklappen einmal nachmessen
    if (open && body) body.querySelectorAll('textarea').forEach((ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; });
    m.el.classList.toggle('is-open', open);
    if (t) { t.setAttribute('aria-expanded', String(open)); const c = t.querySelector('[data-dchev]'); if (c) { c.innerHTML = icon(open ? 'chevD' : 'chevR'); App.hydrateIcons(c); } }
  };

  // ---------- Sätze ----------
  const at = (x) => x.createdAt || Date.now(); // noch ohne Server-Zeit = gerade eben
  const textHtml = (t) => F.linkify(t, Object.values(m.ctx.members).map((x) => x.name));
  // Furigana über den Sätzen: Lesung aus eigenen Vokabeln + Offline-Wörterbuch (App.sentenceReading), auf jedem Gerät
  // selbst berechnet und gemerkt; bis sie da ist, steht der Satz ohne. Wörter ohne bekannte Lesung bleiben ohne Furigana.
  const furi = {}; // Satz → Notation 食[た]べる ('' = keine Kanji / nichts gefunden, null = wird berechnet)
  const furiHtml = (t) => {
    const jp = String(t || '');
    if (!App.jp.hasKanji(jp) || !App.sentenceReading) return textHtml(jp);
    if (!(jp in furi)) {
      furi[jp] = null;
      Promise.resolve().then(() => App.sentenceReading(jp)).then((r) => {
        furi[jp] = r && r.furi && r.furi !== jp ? r.furi : '';
        if (furi[jp] && m && !m.editing) drawList();
      }, (e) => { console.error(e); furi[jp] = ''; });
    }
    return furi[jp] ? App.jp.ruby(furi[jp]) : textHtml(jp);
  };
  const flame = (uid) => (App.forum && App.forum.flame ? App.forum.flame(uid, m.ctx.members) : '');
  const avatar = (x) => (App.forum && App.forum.avatar ? App.forum.avatar(x, m.ctx.members) : '');
  const likeBtn = (x) => {
    const on = x.likes.includes(me());
    const n = x.likes.length;
    return `<button type="button" class="forum-like ${on ? 'on' : ''}" data-dlike="${esc(x.date)}|${esc(x.id)}" aria-pressed="${on}" title="${n ? esc(F.likeNames(x.likes, m.ctx.members).join(', ')) : 'Gefällt mir'}">${on ? '♥' : '♡'}${n ? `<span>${n}</span>` : ''}</button>`;
  };
  const lineHtml = (x) => {
    const own = x.uid === me();
    const canEdit = own && x.date === m.ctx.today;
    if (m.editing && canEdit) return `<div class="fd-line is-own" data-dline="${esc(x.id)}"><div class="fd-who">${avatar(x)}<b>${esc(x.name)}</b>${flame(x.uid)}</div><div data-deditslot></div></div>`;
    // Kopf: Avatar, Name, Tage in Folge – rechts Herz und Bearbeiten; darunter der Satz
    return `<div class="fd-line ${own ? 'is-own' : ''}"><div class="fd-who">${avatar(x)}<b>${esc(x.name)}</b>${flame(x.uid)}${x.editedAt ? '<span class="muted small">(bearbeitet)</span>' : ''}
        ${own && x.usedPrompt ? '<span class="fd-used">✓ Wort benutzt</span>' : ''}<span class="grow"></span>${likeBtn(x)}
        ${canEdit ? `<button type="button" class="btn btn-sm" data-dchange title="Bearbeiten" aria-label="Bearbeiten">${icon('edit')}<span class="fd-lbl"> Bearbeiten</span></button>` : ''}</div>
      <div class="fd-text forum-text" lang="ja">${furiHtml(x.text)}</div></div>`;
  };
  const veiledHtml = (x) => `<div class="fd-line is-veiled" title="Erst deinen Satz schreiben"><div class="fd-who">${avatar(x)}<b>${esc(x.name)}</b>${flame(x.uid)}</div>
      <div class="fd-text" lang="ja" aria-hidden="true">${esc(x.text)}</div></div>`;
  const all = (dates) => dates.flatMap((d) => (m.lists[d] || []).map((x) => Object.assign({ date: d }, x)));
  const sorted = (list) => Y.chainContext(list.map((x) => Object.assign({}, x, { createdAt: at(x) })));
  const ownToday = () => (m.lists[m.ctx.today] || []).find((x) => x.uid === me()) || null;

  const storyHtml = (start, list) => `<div class="fd-story">
      ${start ? `<div class="fd-start"><span lang="ja" class="fd-jp">${App.jp.ruby(start.jp)}</span>${start.de ? `<span class="muted small">${esc(start.de)}</span>` : ''}</div>` : ''}
      ${list.map(lineHtml).join('')}</div>`;

  // eigene Flamme groß und in der Zeile; keine Zahlen, wer schon dabei ist – nur die Sätze selbst
  const drawCheer = (mine) => {
    const ms = m.ctx.members;
    const fl = m.el.querySelector('[data-dmyflame]');
    const st = ms[me()] && ms[me()].streak;
    const nn = F.flameOf(st, m.ctx.today);
    if (fl) {
      fl.hidden = !nn && !mine;
      fl.classList.toggle('is-lit', !!mine);
      // n kommt aus dem Member-Dokument; direkt nach dem Senden steht dort evtl. noch der alte Stand
      fl.innerHTML = nn ? `<span class="fd-myflame-n">${K.MARK} ${nn}</span><span class="fd-myflame-l">Tage in Folge</span>`
        : `<span class="fd-myflame-n">${K.MARK}</span><span class="fd-myflame-l">heute geschafft</span>`;
    }
    const bf = m.el.querySelector('[data-dbandflame]');
    // eigene Flamme in der Zeile nur, solange du heute noch nicht dran warst – danach steht dein Avatar bei den anderen
    if (bf) bf.textContent = !mine && nn ? `${K.MARK} ${nn}` : '';
    // wer heute schon geschrieben hat: Avatar mit kleiner Flamme darunter (ab Tag 1; eine Person mit zwei Geräten nur einmal)
    const dn = m.el.querySelector('[data-ddone]');
    if (dn) {
      const seen = new Set();
      const done = sorted(all([m.ctx.today])).filter((x) => { const k = String(x.name || x.uid).trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
      dn.innerHTML = done.map((x) => {
        const n = Math.max(1, F.flameOf(ms[x.uid] && ms[x.uid].streak, m.ctx.today));
        return `<span class="fd-done-av" title="${esc(x.name)} · ${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge">${avatar(x)}<small>${K.MARK}${n}</small></span>`;
      }).join('');
    }
    const box = m.el.querySelector('[data-dlist]');
    const foot = mine && m.prompt.kind !== 'chain' ? '<p class="fd-cheer">Geschafft für heute ✓</p>' : '';
    if (foot && box) box.insertAdjacentHTML('beforeend', foot);
  };

  const drawList = () => {
    if (!m) return;
    const box = m.el.querySelector('[data-dlist]');
    const p = m.prompt;
    const mine = ownToday();
    if (m.error) { box.innerHTML = `<div class="forum-note fd-note">${esc(m.error)}</div>`; return; }
    if (!m.loaded) { box.innerHTML = '<p class="muted small">Lade die Sätze von heute …</p>'; return; }
    if (p.kind === 'chain') {
      const list = sorted(all(m.chainDays));
      box.innerHTML = storyHtml(p.chainStart, list)
        + (list.length ? '' : '<p class="muted small">Noch hat niemand weitergeschrieben – du schließt an den Anfangssatz an.</p>');
    } else {
      // der eigene Satz oben; die der anderen bleiben verwischt, bis du selbst geschrieben hast
      const list = sorted(all([m.ctx.today]));
      const lines = (mine ? list.filter((x) => x.uid === me()) : []).concat(list.filter((x) => x.uid !== me()));
      const others = list.filter((x) => x.uid !== me()).length;
      box.innerHTML = lines.length ? `<div class="fd-lines">${lines.map((x) => (mine ? lineHtml(x) : veiledHtml(x))).join('')}</div>`
          + (!mine && others ? '<p class="muted small fd-count">Schreib deinen Satz – dann siehst du die der anderen.</p>' : '')
        : '<p class="muted small fd-count">Noch hat heute niemand geschrieben – du kannst den Anfang machen ✨</p>';
    }
    drawCheer(mine);
    // Wochenende vom Montag aus: auf Klick nachgeladen
    if (m.weekend && m.weekend.open) {
      const wk = m.weekend;
      box.insertAdjacentHTML('beforeend', `<div class="fd-weekend"><b class="small">Geschichte vom Wochenende</b>${wk.loaded ? storyHtml(wk.start, sorted(all(wk.days))) : '<p class="muted small">Lade …</p>'}</div>`);
    }
    App.hydrateIcons(box);
    const slot = box.querySelector('[data-deditslot]');
    if (slot) slot.appendChild(m.editEl || (m.editEl = fieldEl(mine ? mine.text : '', true)));
    // eigenes Feld nur, solange heute noch nichts von mir da ist
    m.el.querySelector('[data-dfield]').hidden = !!mine;
  };

  // ---------- Feld ----------
  // einzeilig, wächst mit; Senden geht erst, wenn checkText einverstanden ist (Grund leise darunter)
  const fieldEl = (init, edit) => {
    const el = document.createElement('div');
    el.className = 'fd-field';
    const mic = App.dictate.supported()
      ? `<button type="button" class="btn btn-sm mic" data-dmic title="Auf Japanisch sprechen – der Text erscheint im Feld. Bleibt an, bis du auf „Fertig“ tippst.">${icon('mic')}<span class="mic-label" lang="ja">日本語</span></button>` : '';
    el.innerHTML = `<div class="fd-input-row"><textarea class="input fd-ta" rows="1" lang="ja" placeholder="${edit ? '' : 'Dein Satz …'}" aria-label="Dein Satz des Tages"></textarea>${mic}</div>
      <div class="fd-under"><span class="fd-why muted small"></span><span class="grow"></span><span class="fd-n muted small"></span>
        ${edit ? '<button type="button" class="btn btn-sm" data-dcancel>Abbrechen</button>' : ''}<button type="button" class="btn btn-sm btn-primary" data-dsend>${edit ? 'Speichern' : 'Senden'}</button></div>
      <div class="forum-err" hidden></div>`;
    const ta = el.querySelector('textarea');
    const send = el.querySelector('[data-dsend]');
    const err = el.querySelector('.forum-err');
    ta.value = init;
    const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; };
    const upd = () => {
      const c = Y.checkText(ta.value);
      send.disabled = !c.ok;
      el.querySelector('.fd-n').textContent = `${c.len} / ${Y.MAX}`;
      el.querySelector('.fd-n').classList.toggle('is-over', c.len > Y.MAX);
      el.querySelector('.fd-why').textContent = REASON[c.reason] || '';
      if (!edit && m) drafts[m.ctx.today] = ta.value;
      grow();
    };
    ta.addEventListener('input', () => { err.hidden = true; upd(); });
    ta.addEventListener('change', upd); // Diktiertes
    // ein Satz = eine Zeile: Enter schickt ab (nicht während der japanischen Eingabe)
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!send.disabled) send.click(); } });
    const micBtn = el.querySelector('[data-dmic]');
    if (micBtn) micBtn.onclick = () => App.dictate.toggle(ta, micBtn, 'ja-JP', { long: true });
    const cancel = el.querySelector('[data-dcancel]');
    if (cancel) cancel.onclick = () => { App.dictate.stopFor(ta, { now: true }); m.editing = false; m.editEl = null; drawList(); };
    let busy = false;
    send.onclick = async () => {
      if (busy || !m) return;
      App.dictate.stopFor(ta, { now: true });
      const text = ta.value.trim();
      if (!Y.checkText(text).ok) return upd();
      if (navigator.onLine === false) { err.textContent = OFFLINE; err.hidden = false; return; }
      busy = true; send.disabled = true;
      try {
        await submit(text);
        if (edit) { m.editing = false; m.editEl = null; } else { ta.value = ''; delete drafts[m.ctx.today]; }
        drawList();
      } catch (e) {
        err.textContent = (e && e.code === 'permission-denied' ? RULES : 'Konnte nicht senden.') + fmtTech('Satz des Tages', e);
        err.hidden = false;
      } finally { busy = false; if (el.isConnected) upd(); }
    };
    setTimeout(upd);
    return el;
  };

  // Senden oder (eigener Satz von heute schon da) bearbeiten; danach 今日 abhaken und die Flamme neu rechnen
  // Alles nach dem await läuft mit der Karte, an der gesendet wurde (mm) – das Forum kann inzwischen zu sein (m = null)
  const submit = async (text) => {
    const mm = m;
    const { code, today } = mm.ctx;
    const st = App.forum && App.forum.state ? App.forum.state() : null;
    const name = (st && st.name) || mm.ctx.name; // nach dem Umbenennen gilt der neue Name (die Regeln prüfen ihn)
    const p = mm.prompt;
    const usedPrompt = !!(p.item && (p.kind === 'word' || p.kind === 'grammar') && Y.usesPrompt(text, p.item));
    if (ownToday()) await D.editDaily(code, today, { text, usedPrompt });
    else {
      try { await D.sendDaily(code, today, { name, text, usedPrompt }); }
      catch (e) {
        // auf einem anderen Gerät schon gesendet (noch nicht angekommen): dann eben bearbeiten
        if (e && e.code === 'permission-denied') await D.editDaily(code, today, { text, usedPrompt }); else throw e;
      }
    }
    markDay(mm);
    syncStreak(mm, true);
  };
  // Abhaken für das Datum des Satzes (ctx.today) – nur solange das noch heute ist: ein Satz von gestern (kurz nach
  // Mitternacht abgeschickt) darf das dayLog von heute nicht auf gestern zurücksetzen
  const markDay = async (mm) => {
    const S = App.store;
    const date = mm && mm.ctx.today;
    if (!S.settings || !date || date !== App.today()) return;
    if (App.dayCheck && App.dayCheck.closeDay) await App.dayCheck.closeDay(); // gestern zuerst festhalten
    const next = App.dayCheckLogic.mark(S.settings.dayLog, date, 'forum');
    if (next) { await App.saveSettings({ dayLog: next }); dayDirty = true; }
  };
  // Eigene Flamme im Member-Dokument: gespeicherte Tage (plus heute, wenn heute ein eigener Satz da ist – gerade gesendet
  // oder in der Liste) neu bewerten; gespeichert nur bei Änderung. Ohne eigenes Member-Dokument (Mitglieder noch nicht
  // geladen) wartet es, sonst würden die alten Tage mit [heute] überschrieben.
  const syncStreak = (mm, sent) => {
    const uid = D.uid() || mm.ctx.uid;
    const mem = mm.ctx.members[uid];
    if (!mem) { if (sent) mm.streakPending = true; return; }
    const t = mm.ctx.today, cur = mem.streak;
    const wrote = sent || mm.streakPending || (mm.lists[t] || []).some((x) => x.uid === uid);
    mm.streakPending = false;
    if (!cur && !wrote) return; // noch nie geschrieben: nichts zu speichern
    const off = K.offDays(App.store.settings && App.store.settings.vacationLog, vacation(), t);
    const next = F.makeStreak(((cur && cur.days) || []).concat(wrote ? [t] : []), off, t, K.futureOff(vacation(), t));
    if (cur && cur.n === next.n && cur.hold === next.hold && cur.days.join() === next.days.join()) return;
    D.setStreak(mm.ctx.code, next).catch(() => { /* Regeln alt oder offline: beim nächsten Öffnen wieder */ });
  };
  // Beim Öffnen (sobald das eigene Member-Dokument da ist): einmal neu bewerten (hält hold aktuell, z. B. im Urlaub)
  const refreshStreak = () => {
    if (!m || !m.ctx.members[me()]) return;
    if (m.streakChecked && !m.streakPending) return;
    m.streakChecked = true;
    syncStreak(m, false);
  };

  // ---------- Ein- und aushängen ----------
  const watch = (date) => {
    m.unsubs.push(D.watchDaily(m.ctx.code, date, (list) => {
      if (!m) return;
      m.lists[date] = list;
      if (date === m.ctx.today) {
        m.loaded = true; m.error = '';
        // auf einem anderen Gerät schon geschrieben: hier ebenfalls abhaken
        const mine = list.some((x) => x.uid === me());
        if (mine && !App.dayCheckLogic.isDone(App.store.settings && App.store.settings.dayLog, m.ctx.today, 'forum')) markDay(m);
        // eigener Satz von heute da: heute gehört in die Flamme (heilt ein fehlgeschlagenes setStreak) – einmal je Karte
        if (mine && !m.healed && m.ctx.members[me()]) { m.healed = true; syncStreak(m, false); }
      }
      if (m.weekend && m.weekend.days.includes(date)) m.weekend.loaded = m.weekend.days.every((d) => d in m.lists);
      if (!m.editing) drawList();
    }, (e) => {
      if (!m) return;
      m.error = (e && e.code === 'permission-denied'
        ? 'Der Satz des Tages geht erst, wenn die Forum-Regeln aktualisiert sind.'
        : 'Gerade keine Verbindung – die Sätze kommen, sobald du wieder Internet hast.') + fmtTech('Sätze laden', e);
      drawList();
    }));
  };

  const mount = (el, ctx) => {
    unmount();
    const today = ctx.today || App.today();
    const prompt = Y.prompt(today, ctx.code, window.SEED, App.DAILY_PROMPTS);
    m = { el, ctx: Object.assign({ members: {} }, ctx, { today }), prompt, lists: {}, unsubs: [], loaded: false, error: '', editing: false, editEl: null, streakChecked: false,
      chainDays: prompt.kind === 'chain' ? Y.chainDays(today) : [today] };
    const monday = Y.mondayChain(today);
    if (monday.length) m.weekend = { days: monday, open: false, loaded: false, start: Y.prompt(monday[0], ctx.code, window.SEED, App.DAILY_PROMPTS).chainStart };
    const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(today + 'T12:00').getDay()];
    if (drafts[today]) open = true;
    el.className = 'fd-card' + (open ? ' is-open' : '');
    // Kopf als schmale Zeile: Name, Anstoß kurz, eigene Flamme – Antippen klappt den Rest auf
    el.innerHTML = `<button type="button" class="fd-band" data-dtoggle aria-expanded="${open}"><span class="fd-spark s1" aria-hidden="true">✦</span><span class="fd-spark s2" aria-hidden="true">✦</span><span class="fd-spark s3" aria-hidden="true">✧</span>${icon('users')}<b>Tägliche Gruppen-Challenge</b>
        <span class="fd-band-kind">${bandPrompt(prompt)}</span>
        <span class="fd-done" data-ddone></span><span class="fd-bandflame" data-dbandflame></span><span class="fd-chev" data-dchev>${icon(open ? 'chevD' : 'chevR')}</span></button>
      <div class="fd-body" data-dbody${open ? '' : ' hidden'}>
      <p class="muted small fd-day">${esc(KIND[prompt.kind])} · ${wd} ${Number(today.slice(8))}.${Number(today.slice(5, 7))}.</p>
      <div class="fd-top"><div class="fd-main">${promptHtml(prompt)}
        <p class="muted small fd-sub">${prompt.kind === 'chain' ? 'Schreibt gemeinsam weiter – ein Satz pro Tag' : `Ein Satz, höchstens ${Y.MAX} Zeichen`}</p></div>
        <div class="fd-myflame" data-dmyflame hidden></div></div>
      ${m.weekend ? '<button type="button" class="fd-link" data-dweekend>Geschichte vom Wochenende lesen</button>' : ''}
      <div data-dlist></div><div data-dfield></div></div>`;
    el.querySelector('[data-dfield]').appendChild(fieldEl(drafts[today] || '', false));
    App.hydrateIcons(el);
    el.onclick = onClick;
    drawList();
    const mm = m;
    D.load().then(() => {
      if (m !== mm) return;
      m.chainDays.forEach(watch);
      refreshStreak();
    }, (e) => { if (m === mm) { m.error = OFFLINE + fmtTech('Sätze laden', e); drawList(); } });
    clearInterval(timer);
    timer = setInterval(check, 60000);
  };

  const onClick = async (e) => {
    if (!m) return;
    if (e.target.closest('[data-dtoggle]')) { setOpen(!open); return; }
    if (e.target.closest('[data-dgenki]')) { e.preventDefault(); if (App.forum && App.forum.close) App.forum.close(); App.go('#/pakete'); return; }
    if (e.target.closest('[data-dweekend]')) {
      const wk = m.weekend;
      wk.open = !wk.open;
      e.target.closest('[data-dweekend]').textContent = wk.open ? 'Geschichte ausblenden' : 'Geschichte vom Wochenende lesen';
      if (wk.open && !wk.watching) { wk.watching = true; wk.days.forEach(watch); }
      drawList();
      return;
    }
    if (e.target.closest('[data-dchange]')) { m.editing = true; m.editEl = null; drawList(); const ta = m.el.querySelector('[data-deditslot] textarea'); if (ta) ta.focus(); return; }
    const lk = e.target.closest('[data-dlike]');
    if (lk) {
      const [date, id] = lk.dataset.dlike.split('|');
      const x = (m.lists[date] || []).find((y) => y.id === id);
      if (!x) return;
      try { await D.likeDaily(m.ctx.code, date, x.uid, !x.likes.includes(me())); }
      catch (y) { App.toast(y && y.code === 'permission-denied' ? 'Herzen am Satz des Tages gehen erst nach dem Regel-Update.' : OFFLINE); }
    }
  };

  const unmount = () => {
    clearInterval(timer);
    if (!m) return;
    m.el.querySelectorAll('textarea').forEach((t) => App.dictate.stopFor(t, { now: true }));
    m.unsubs.forEach((u) => { try { u(); } catch (e) { /* schon beendet */ } });
    m.el.onclick = null;
    m = null;
  };
  // Forum-Fenster zu (js/forum.js onClose): wurde 今日 abgehakt, die Startseite einmal neu zeichnen lassen
  const flush = () => { if (dayDirty) { dayDirty = false; App.emit('settings'); } };

  // Datum gewechselt (Mitternacht bei offenem Forum): alte Listener weg, neu für heute
  const check = () => {
    if (!m) return;
    if (!m.el.isConnected) { unmount(); return; }
    if (App.today() !== m.ctx.today) { const { el, ctx } = m; mount(el, Object.assign({}, ctx, { today: App.today() })); }
  };

  App.forumDaily = {
    mount, unmount, check, flush,
    // neue Mitgliederliste (Namen, Avatare, Flammen)
    members: (members) => { if (!m) return; m.ctx.members = members || {}; refreshStreak(); if (!m.editing) drawList(); },
    // aus der 今日-Karte: zur Karte scrollen und ins Feld
    focus: () => {
      if (!m) return;
      setOpen(true);
      m.el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      const ta = m.el.querySelector('[data-dfield]:not([hidden]) textarea');
      if (ta) setTimeout(() => ta.focus({ preventScroll: true }), 50);
    },
  };
})(window.App = window.App || {});
