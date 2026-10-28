/* Nihongo Techō – Vokabel-Lernstand: Einstufung („Kenne ich das?“) und Import */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;
  const DAY = 864e5;

  // ---------- Status ----------
  // unchecked = noch nie geprüft · learn = wird gelernt · known = kann ich schon
  // „Kann ich“ ist, was so eingestuft wurde – oder was mit den Karten bis 3 Wochen Abstand gelernt ist (springt von allein um).
  //
  // Vokabeln und Ausdrücke gehen einen gemeinsamen Weg: ungeprüft → Lernschlange → kann ich.
  // „Ungeprüft“ sind nur Einträge aus Paketen (Genki, JLPT) und importierten Listen; dort liegen sie, bis man sie einstuft
  // oder mit „neue lernen“ holt – auch wenn Einstufen in den Einstellungen aus ist (das blendet nur den Einstufen-Knopf aus).
  // Eigene Einträge (selbst angelegt, aus Satzerkennung/Suche übernommen) sind nie „ungeprüft“: sie kommen direkt in die Lernschlange.
  // „learn“ heißt bei ihnen immer: in der Lernschlange (queued).
  //
  // Kanji laufen wie bisher: eigene liegen in der Lernschlange und warten auf „neue lernen“; ist Einstufen aus (check: 'off'),
  // liegen auch die aus Paketen dort. Am Speicher ändert das nichts – wieder eingeschaltet, ist Unberührtes wieder „ungeprüft“.
  //
  // Grammatik wird nicht abgefragt: sie hat nur den Haken von Hand – „offen“ (unchecked) oder „kann ich“ (known).
  // Aus WaniKani angelegte Vokabeln: lesen lernt man dort – hier gelten sie als lesbar und werden nur aktiv (Deutsch → Japanisch) eingestuft.
  // Ebenso aus WaniKani angelegte Kanji: lesen lernt man dort – hier kommen sie nur zum Schreiben (ab Master, wk-logic.js).
  const wkLearned = (it) => !!it && !!it._wk && (it.type === 'vocab' || it.type === 'kanji');
  const W = App.writeLogic;
  App.checkOn = () => S.settings.check !== 'off';
  // selbst angelegt – nicht aus Paket, Genki, Import oder WaniKani
  App.isOwn = (it) => !!it && !it._seed && !it._pack && !it.imported && !wkLearned(it);
  App.needsCheck = (it) => !!it && (W.direct(it.type) ? !App.isOwn(it) : it.type === 'kanji' ? App.checkOn() && !App.isOwn(it) : true);
  // Lernstand-Filter der Kanji- und Ausdrücke-Liste: ohne Einstufen gibt es „Ungeprüft“ nicht; Beschriftung wie auf den Karten der Art
  App.statusFilter = (cur, type) => Object.keys(App.STATUS).filter((k) => k !== 'unchecked' || App.checkOn()).map((k) => { const s = App.statusInfo({ type }, k); return `<option value="${k}" ${cur === k ? 'selected' : ''}>${s.dot} ${s.label}</option>`; }).join('');
  const ownWord = (id) => { const it = S.items.get(id); return !!it && !App.needsCheck(it); };
  const isGrammar = (id) => { const it = S.items.get(id); return !!it && it.type === 'grammar'; };
  App.vocabStatus = (id) => {
    const s = S.srs.get(id);
    // Grammatik: nur der Haken zählt; ein alter Lernstand aus der Zeit der Grammatik-Karten gilt als „kann ich“, wenn er es damals war
    if (isGrammar(id)) return App.furiLogic.readKnown(S.srs, id) ? 'known' : 'unchecked';
    if (!s) return wkLearned(S.items.get(id)) ? 'known' : ownWord(id) ? 'learn' : 'unchecked';
    if (s.check === 'unchecked') return ownWord(id) ? 'learn' : 'unchecked';
    return App.furiLogic.readKnown(S.srs, id) ? 'known' : 'learn';
  };
  App.STATUS = {
    unchecked: { label: 'Ungeprüft', color: 'var(--muted)', dot: '○' },
    learn: { label: 'Lernschlange', color: 'var(--ai)', dot: '◐' },
    known: { label: 'Kann ich', color: 'var(--matcha)', dot: '●' },
  };
  // Beschriftung je Art: Grammatik kennt nur „Offen“ und „Kann ich“; „learn“ heißt überall Lernschlange
  App.statusInfo = (it, key) => {
    const s = App.STATUS[key];
    if (it && it.type === 'grammar' && key === 'unchecked') return Object.assign({}, s, { label: 'Offen' });
    return s;
  };
  // Auswahl auf der Seite des Eintrags: [Schlüssel, Beschriftung]
  App.statusChoices = (it) => Object.keys(App.STATUS)
    .filter((k) => (it && it.type === 'grammar' ? k !== 'learn' : k !== 'unchecked' || App.needsCheck(it)))
    .map((k) => [k, App.statusInfo(it, k)]);
  const itemOf = (id) => S.items.get(W.isId(id) ? W.itemId(id) : id);
  // extra: Zusatzfelder für den Lernstand (pre = für Deutsch → Japanisch vorgemerkt, bis das Wort lesbar ist · queued = in der Lernschlange).
  // Vokabeln und Ausdrücke: „learn“ heißt immer Lernschlange, also queued – heute fällig, ohne „neue lernen“.
  App.setCheck = async (id, st, extra) => {
    const now = Date.now();
    let s;
    if (st === 'unchecked') {
      S.srs.delete(id);
      await App.db.del('srs', id);
      if (App.backup && App.backup.noteChange) App.backup.noteChange();
      return;
    }
    if (st === 'known') {
      // gilt als gelernt und wird nicht mehr abgefragt; Abstand und Termin zählen erst wieder, wenn die Karte beim freien Üben zurückfällt
      const ivl = App.furiLogic.KNOWN_IVL;
      s = { id, check: 'known', ivl, ease: 2.6, reps: 3, lapses: 0, due: now + ivl * DAY, last: now, checked: now };
    } else {
      const it = itemOf(id);
      s = Object.assign({ id, check: 'learn', ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now, last: 0, checked: now }, it && W.direct(it.type) ? { queued: 1 } : null, extra);
    }
    S.srs.set(id, s);
    await App.db.put('srs', s);
    if (App.backup && App.backup.noteChange) App.backup.noteChange();
  };
  // Rückgängig: Lernstand vorher merken (Kopie – App.grade ändert den Eintrag an Ort und Stelle), später genau so zurückspielen.
  // null = hatte noch keinen Lernstand → wird wieder gelöscht
  App.srsSnap = (ids) => Array.from(new Set(ids)).map((id) => [id, S.srs.has(id) ? JSON.parse(JSON.stringify(S.srs.get(id))) : null]);
  App.srsRestore = async (snap) => {
    const puts = [];
    for (const [id, s] of snap) {
      if (s) { S.srs.set(id, s); puts.push(s); } else if (S.srs.delete(id)) await App.db.del('srs', id);
    }
    if (puts.length) await App.db.putMany('srs', puts);
    if (App.backup && App.backup.noteChange) App.backup.noteChange();
  };
  // Hinweis mit „Rückgängig“: spielt den gemerkten Stand zurück, danach after() (z. B. neu zeichnen)
  App.undoToast = (msg, snap, after) => App.toast(msg, {
    label: 'Rückgängig', ms: 8000, id: 'undo',
    fn: async () => { await App.srsRestore(snap); if (after) await after(); App.toast('Rückgängig gemacht'); },
  });
  // Neu angelegter eigener Eintrag (App.saveItem): direkt in die Lernschlange. Vokabeln auch für Deutsch → Japanisch –
  // vorgemerkt, die Karte kommt, sobald das Wort lesbar ist. Was schon einen Lernstand hat, bleibt.
  App.enqueueOwn = async (it) => {
    if (!it || !W.direct(it.type) || !App.isOwn(it)) return;
    if (!S.srs.has(it.id)) await App.setCheck(it.id, 'learn');
    if (it.type === 'vocab' && !S.srs.has(W.id(it.id))) await App.setCheck(W.id(it.id), 'learn', { pre: 1 });
  };
  // Einmaliger Umzug auf den gemeinsamen Lernweg (write-logic.js: lernwegPlan) – beim Start, solange der Vermerk in den Einstellungen fehlt
  App.lernwegMigrate = async () => {
    if (S.settings.lernweg === 1) return 0;
    const plan = W.lernwegPlan(Array.from(S.items.values()), S.srs, App.isOwn, Date.now(), +S.settings.newPerDay || 15);
    plan.forEach((s) => S.srs.set(s.id, s));
    if (plan.length) await App.db.putMany('srs', plan);
    await App.saveSettings({ lernweg: 1 });
    return plan.length;
  };
  // Einmalig: Lese-Karten von WaniKani-Kanji wieder heraus – sie kamen versehentlich über „neue lernen“ dazu (Lesen lernt man bei WaniKani).
  // Der Schreib-Stand (w:…) bleibt.
  App.wkKanjiMigrate = async () => {
    if (S.settings.wkKanjiRead === 1) return 0;
    const ids = App.itemsOf('kanji').filter((it) => it._wk && S.srs.has(it.id)).map((it) => it.id);
    for (const id of ids) { S.srs.delete(id); await App.db.del('srs', id); }
    await App.saveSettings({ wkKanjiRead: 1 });
    return ids.length;
  };
  App.vocabCounts = (items = App.itemsOf('vocab')) => {
    const c = { unchecked: 0, learn: 0, known: 0, total: items.length };
    items.forEach((v) => c[App.vocabStatus(v.id)]++);
    return c;
  };
  // Gesamt-Lernstand eines Eintrags – so zählen Startseite und Vokabelliste:
  // known = kann ich · queue = in der Lernschlange (kommt von selbst wieder) · open = wartet noch (ungeprüft; bei Kanji auch neu in der Lernschlange).
  // Eine Vokabel ist erst „kann ich“, wenn beide Richtungen sitzen: lesen (Japanisch → Deutsch) UND aktiv (Deutsch → Japanisch).
  // Solange das Lesen noch läuft, zählt sie zur Lernschlange; kann man sie lesen, entscheidet der Aktiv-Stand.
  // Kanji und Ausdrücke zählen nach dem Lese-Stand, Grammatik nach dem Haken („offen“ zählt als wartet noch).
  App.wordState = (it) => {
    const r = App.vocabStatus(it.id), s = S.srs.get(it.id);
    if (r === 'unchecked') return 'open';
    if (r === 'learn') return W.inQueue(s) ? 'queue' : 'open';
    if (it.type !== 'vocab') return 'known';
    const a = W.activeStatus(S.srs, it, App.needsCheck);
    return a === 'known' ? 'known' : a === 'learn' && W.activeAsked(S.srs, it) ? 'queue' : 'open';
  };
  App.WORD_STATE = {
    known: { label: 'Kann ich', color: 'var(--matcha)', dot: '●' },
    queue: { label: 'In der Lernschlange', color: 'var(--ai)', dot: '◐' },
    open: { label: 'Ungeprüft', color: 'var(--muted)', dot: '○' },
  };
  App.progressCounts = (items = App.itemsOf('vocab')) => {
    const c = { known: 0, queue: 0, open: 0, total: items.length };
    items.forEach((v) => c[App.wordState(S.items.get(v.id) || v)]++);
    return c;
  };
  // Genki-Lernstand der Startseite: „kann ich“ je Lektion und gesamt, jeweils Vokabeln + Kanji + Grammatik.
  // Eine Lektion ist abgeschlossen (done), wenn alles aus ihr „kann ich“ ist.
  App.genkiProgress = (source = 'Genki I', lessonCount = 12) => {
    const TYPES = ['vocab', 'kanji', 'grammar'];
    const all = {};
    TYPES.forEach((t) => { all[t] = App.itemsOf(t).filter((i) => i.source === source && i.char !== '々'); });
    const sum = (o) => { o.known = 0; o.learn = 0; o.total = 0; TYPES.forEach((t) => { o.known += o[t].known; o.learn += o[t].learn; o.total += o[t].total; }); return o; };
    const lessons = Array.from({ length: lessonCount }, (_, i) => {
      const x = { l: i + 1 };
      TYPES.forEach((t) => { const c = App.progressCounts(all[t].filter((it) => +it.lesson === x.l)); x[t] = { known: c.known, learn: c.queue, unchecked: c.open, total: c.total }; });
      sum(x);
      x.done = x.total > 0 && x.known >= x.total;
      x.pct = x.total ? Math.floor((x.known / x.total) * 100) : 0;
      return x;
    });
    // Gesamt = Summe der Lektionen, damit die Zahlen oben genau zur Leiste passen
    const out = { lessons, doneLessons: lessons.filter((x) => x.done).length };
    TYPES.forEach((t) => { out[t] = { known: 0, learn: 0, unchecked: 0, total: 0 }; lessons.forEach((x) => Object.keys(out[t]).forEach((k) => { out[t][k] += x[t][k]; })); });
    return sum(out);
  };
  // Zeile unter dem Lernstand: „Kann ich“ hat keinen nächsten Termin mehr
  App.srsNote = (s) => `${s.check === 'known' ? 'als gelernt markiert' : s.reps ? s.reps + '× gewusst' : 'in der Lernschlange'} · ${App.writeLogic.isKnown(s) ? 'wird nicht mehr abgefragt' : 'nächste Wiederholung ' + App.fmtDate(s.due)}`;
  // Vokabel, die man lesen kann, aber aktiv noch nicht: „Kann ich lesen“ – „Kann ich“ heißt beide Richtungen
  App.statusBadge = (id) => {
    const it = S.items.get(id), st = App.statusInfo(it, App.vocabStatus(id));
    const half = it && it.type === 'vocab' && App.vocabStatus(id) === 'known' && App.wordState(it) !== 'known';
    return `<span class="badge vst" style="color:${st.color}" title="${half ? 'Lesen kannst du es – Deutsch → Japanisch fehlt noch' : 'Lernstand'}">${half ? '◐ Kann ich lesen' : `${st.dot} ${st.label}`}</span>`;
  };

  // ---------- Markierungen für Kanji (z. B. „Im Unterricht gelernt“) ----------
  App.MARK_CLASS = 'Im Unterricht gelernt';
  const DEFAULT_MARKS = [App.MARK_CLASS, 'Im Lehrbuch gelernt', 'Selbst gelernt', 'Aus Anime/Manga', 'Schwierig'];
  App.kanjiMarks = () => (S.settings.kanjiMarks && S.settings.kanjiMarks.length ? S.settings.kanjiMarks : DEFAULT_MARKS);
  // „Im Unterricht gelernt“ gilt auch automatisch, wenn das Kanji mit einer Unterrichtsstunde verknüpft ist
  App.hasMark = (it, m) => (it.marks || []).includes(m) || (m === App.MARK_CLASS && App.sessionsFor(it.id).length > 0);
  App.marksOf = (it) => App.kanjiMarks().filter((m) => App.hasMark(it, m)).concat((it.marks || []).filter((m) => !App.kanjiMarks().includes(m)));
  App.addKanjiMark = async () => {
    const r = await App.ask('Neue Markierung', [{ label: 'Name', placeholder: 'z. B. Aus NHK Easy, Prüfung Juni …' }]);
    const m = r && r[0] && r[0].trim();
    if (!m) return null;
    if (!App.kanjiMarks().includes(m)) await App.saveSettings({ kanjiMarks: App.kanjiMarks().concat(m) });
    return m;
  };
  App.toggleMark = async (it, m) => {
    const auto = m === App.MARK_CLASS && App.sessionsFor(it.id).length > 0;
    if ((it.marks || []).includes(m)) it.marks = it.marks.filter((x) => x !== m);
    else if (auto) { App.toast('Dieses Kanji ist mit einer Unterrichtsstunde verknüpft und gilt deshalb automatisch als „Im Unterricht gelernt“.'); return; }
    else it.marks = (it.marks || []).concat(m);
    await App.saveItem(it, { silent: true });
  };
  App.marksChips = (it) => `<div class="chips" data-marks="${it.id}">${App.kanjiMarks().map((m) => {
    const on = App.hasMark(it, m);
    const auto = on && !(it.marks || []).includes(m);
    return `<button class="chip ${on ? 'on' : ''}" data-mark="${esc(m)}" title="${auto ? 'automatisch – über eine Unterrichtsstunde verknüpft' : ''}">${on ? '✓ ' : ''}${esc(m)}${auto ? ' 授' : ''}</button>`;
  }).join('')}<button class="chip" data-mark-new>${icon('plus')} Markierung</button></div>`;
  document.addEventListener('click', async (e) => {
    const box = e.target.closest('[data-marks]');
    if (!box) return;
    const it = App.item(box.dataset.marks);
    const b = e.target.closest('[data-mark]');
    if (b) { await App.toggleMark(it, b.dataset.mark); box.outerHTML = App.marksChips(it); return; }
    if (e.target.closest('[data-mark-new]')) { const m = await App.addKanjiMark(); if (m) { if (!App.hasMark(it, m)) await App.toggleMark(it, m); App.render(true); } }
  });

  const srcOrder = (name) => { const i = App.sources().findIndex((s) => s.name === name); return i < 0 ? 99 : i; };
  const order = (a, b) => srcOrder(a.source) - srcOrder(b.source) || (+a.lesson || 0) - (+b.lesson || 0) || App.ord(a) - App.ord(b);

  // =========================================================
  // Einstufung in Runden
  // =========================================================
  // „Nächste Runde“ nach einer Runde: gleich weiter mit derselben Auswahl und Anzahl, ohne die Auswahlkarte dazwischen
  let autoNext = false;
  App.route('/ueben/einstufen', (view, p, q) => {
    if (!App.checkOn()) return App.go('#/ueben'); // abgeschaltet: alte Links und Lesezeichen führen zur Übersicht
    const type = q.type === 'kanji' || q.type === 'phrase' ? q.type : 'vocab';
    const isK = type === 'kanji', isP = type === 'phrase';
    const sec = App.SECTIONS[type];
    const all = App.itemsOf(type).filter((i) => i.char !== '々');
    // Pro Lektion gilt immer für genau eine Quelle – Genki Lektion 1 und Duolingo-Einheit 1 sind verschiedene Lektionen
    if (type === 'vocab' && q.l && !App.oneSrc(q.src)) {
      const first = all.filter((i) => App.srcMatch(i, q.src) && String(i.lesson) === q.l && i.source).sort(order)[0];
      if (first) return App.setQuery({ src: first.source });
    }
    let items = all;
    if (q.src) items = items.filter((i) => App.srcMatch(i, q.src));
    if (q.l) items = items.filter((i) => String(i.lesson) === q.l);
    if (q.mark) items = items.filter((i) => App.hasMark(i, q.mark));
    if (q.lvl) items = items.filter((i) => App.levelMatch(i, q.lvl));
    if (isP && q.g) items = items.filter((i) => i.group === q.g);
    // Vokabeln haben zwei Einstufungen: lesen (Japanisch → Deutsch) und aktiv (Deutsch → Japanisch, eigener Lernstand unter „w:<Id>“).
    // Aktiv eingestuft wird, was man schon lesen kann.
    // Vokabeln: „Alle Lektionen gemischt“ (Wörter quer durch alle Lektionen gewürfelt) oder „Pro Lektion“ (perLesson, Buchreihenfolge).
    // Richtung: lesen, aktiv oder beide gemischt (mix: beide Richtungen in einer Runde – siehe writeLogic.lessonRound);
    // ohne Vorgabe pro Lektion gemischt, sonst lesen.
    const perLesson = type === 'vocab' && !!q.l;
    const dir = type !== 'vocab' ? 'jp' : ['jp', 'de', 'mix'].includes(q.dir) ? q.dir : perLesson ? 'mix' : 'jp';
    const mix = dir === 'mix', active = dir === 'de';
    const W = App.writeLogic;
    const statusOf = active ? App.activeStatus : (v) => App.vocabStatus(v.id);
    const counts = active ? (list) => W.activeCounts(list, S.srs, App.needsCheck) : App.vocabCounts;
    const c = counts(items);
    const cAll = counts(all);
    const batch = +S.settings.checkBatch || 15;
    const readOpen = (v) => App.vocabStatus(v.id) === 'unchecked';
    const ac = mix ? W.activeCounts(items, S.srs, App.needsCheck) : null;
    const open = c.unchecked + (ac ? ac.unchecked : 0);
    // Lektionen der Auswahl (ohne den Lektionsfilter) und ob in ihnen noch etwas einzustufen ist
    const pool = type !== 'vocab' ? [] : all.filter((i) => App.srcMatch(i, q.src) && (!q.lvl || App.levelMatch(i, q.lvl)));
    const lessons = Array.from(new Set(pool.map((i) => i.lesson).filter((l) => l !== '' && l != null))).sort((a, b) => (+a) - (+b) || String(a).localeCompare(String(b)));
    const lessonOpen = (l) => pool.some((i) => String(i.lesson) === String(l) && ((dir !== 'de' && readOpen(i)) || (dir !== 'jp' && App.activeStatus(i) === 'unchecked')));
    const nextLesson = perLesson ? lessons.slice(lessons.findIndex((l) => String(l) === q.l) + 1).find(lessonOpen) : undefined;
    const pct = (n) => (c.total ? (n / c.total) * 100 : 0);
    // Aufbau wie bei den Karteikarten: Art · Richtung · Quelle/Lektion/Niveau – Lernstand – Startknopf mit „pro Runde“
    // Ohne Lektion = alle Lektionen gemischt, mit Lektion = pro Lektion (Buchreihenfolge)
    const F = App.FLAG;
    const tip = mix ? 'Steht ein japanisches Wort da, geht es ums Lesen, steht die deutsche Bedeutung da, ums Wort aus dem Deutschen. Antippen deckt auf.'
      : active ? 'Antippen zeigt das japanische Wort.'
        : `Antippen zeigt ${isK ? 'Bedeutung und Lesungen' : 'Lesung und Übersetzung'}.${isK ? ' „Kann ich“ heißt hier: kann ich lesen – Schreiben kommt danach im Kanji-Quiz.' : ''}`;
    const locked = mix ? (!c.unchecked ? ac.locked : 0) : active ? c.locked : 0;
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="crumbs">${App.backCrumb()} › Einstufen</div>
      <div class="page-head"><div class="titles"><h1>Einstufen <span class="jp-title">確認</span></h1>
        <p>Was kannst du schon? Was du noch lernen musst, kommt gleich in die Lernschlange.</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row"><div class="seg">${[['vocab', 'Vokabeln'], ['kanji', 'Kanji'], ['phrase', 'Ausdrücke']].map(([k, l]) => `<button class="${type === k ? 'on' : ''}" data-q-type="${k === 'vocab' ? '' : k}">${l}</button>`).join('')}</div>
          ${type !== 'vocab' ? '' : `<div class="seg">${[['jp', `JP ${F.jp} → DE ${F.de}`, 'Japanisch → Deutsch (lesen)'], ['de', `DE ${F.de} → JP ${F.jp}`, 'Deutsch → Japanisch (aktiv)'], ['mix', 'Beide', 'Beide Richtungen gemischt']].map(([k, l, t]) => `<button class="${dir === k ? 'on' : ''}" data-q-dir="${k}" title="${t}">${l}</button>`).join('')}</div>`}
          ${App.sourceSelect(all, q.src)}${App.lessonSelect(all.filter((i) => App.srcMatch(i, q.src)), q.l)}${App.levelSelect(q.lvl)}${isP ? `<select class="input" data-q-select="g"><option value="">Alle Gruppen</option>${App.phraseGroups().map((g) => `<option ${q.g === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>` : ''}</div>
        <div class="row between"><div class="row" style="gap:18px">
          <span><b style="font-size:22px;color:var(--muted)">${c.unchecked}</b> ungeprüft</span>
          <span><b style="font-size:22px;color:var(--ai)">${c.learn}</b> in der Lernschlange</span>
          <span><b style="font-size:22px;color:var(--matcha)">${c.known}</b> kann ich${active ? ' aktiv' : ''}</span></div>
          <span class="small muted">${mix ? `DE → JP: ${ac.unchecked} offen · ${ac.learn} in der Lernschlange · ${ac.known} kann ich` : q.src || q.l || q.lvl || (isP && q.g) ? `Insgesamt ${cAll.unchecked} ungeprüft` : ''}</span></div>
        <div class="progress" style="display:flex;height:10px"><i style="width:${pct(c.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pct(c.learn)}%;background:var(--ai);border-radius:0"></i></div>
        <div class="row between karten-go"><div class="row">
          <button class="btn btn-primary" data-go ${open ? '' : 'disabled'}>${icon('play')} Runde starten (${Math.min(batch, open)})</button>
          ${perLesson && !open && c.total ? `<span class="verdict ok">✓ Lektion ${esc(q.l)} ist eingestuft</span>${nextLesson !== undefined ? `<button class="btn btn-sec" data-lmode="${esc(nextLesson)}">${icon('next')} Lektion ${esc(nextLesson)}</button>` : ''}` : !c.unchecked && c.total ? `<span class="verdict ok">✓ ${active && !(c.learn + c.known) ? 'Noch nichts einzustufen' : 'Alles in dieser Auswahl ist eingestuft'}</span>` : ''}</div>
          <label class="small muted row" style="gap:6px">pro Runde <input class="input" type="number" min="3" max="100" value="${batch}" data-batch style="width:80px"></label></div>
        <div class="small muted">${tip} „Kann ich“ wird nicht mehr abgefragt, „Lernen“ kommt in die Lernschlange und ist heute bei „Jetzt wiederholen“ dabei.${locked ? ` ${locked} ${locked === 1 ? 'Wort kommt' : 'Wörter kommen'} für DE → JP dazu, sobald du ${locked === 1 ? 'es' : 'sie'} lesen kannst.` : ''}</div>
      </div></div>
      <div data-stage style="margin-top:18px"></div></div>`;
    const bi = view.querySelector('[data-batch]');
    bi.addEventListener('change', async () => { await App.saveSettings({ checkBatch: App.clamp(+bi.value || 15, 3, 100) }); });
    const stage = view.querySelector('[data-stage]');
    const go = () => {
      const n = App.clamp(+bi.value || 15, 3, 100);
      // Alle Lektionen gemischt: Vokabeln quer durch die Auswahl gewürfelt; pro Lektion, Kanji und Ausdrücke in Buchreihenfolge
      const base = type === 'vocab' && !perLesson ? App.shuffle(items) : items.slice().sort(order);
      const list = mix ? W.lessonRound(base, S.srs, App.needsCheck, readOpen, n, App.shuffle) : base.filter((v) => statusOf(v) === 'unchecked').slice(0, n).map((item) => ({ item, de: active }));
      if (!list.length) return;
      view.querySelector('[data-setup]').hidden = true;
      runBatch(stage, list, () => { autoNext = true; App.render(); }, type, mix);
    };
    $$('[data-lmode]', view).forEach((b) => { b.onclick = () => App.setQuery({ l: b.dataset.lmode, dir: '' }); });
    view.querySelector('[data-go]').onclick = go;
    const again = autoNext;
    autoNext = false;
    if (q.auto || again) go();
  });

  // list: Zeilen { item, de } – de: Vokabel Deutsch → Japanisch (gefragt wird die Bedeutung, eingestuft der Aktiv-Stand).
  // mixed: beide Richtungen in einer Runde; „Lernen“ beim Lesen merkt das Wort für Deutsch → Japanisch vor.
  function runBatch(stage, list, onDone, type = 'vocab', mixed = false) {
    const W = App.writeLogic;
    const decided = new Map();
    const shown = new Set();
    const pre = new Set();
    const isK = type === 'kanji';
    const key = (e) => (e.de ? W.id(e.item.id) : e.item.id);
    const setRow = async (e, st) => {
      const id = e.item.id;
      if (st === 'unchecked') {
        decided.delete(key(e));
        await App.setCheck(key(e), st);
        if (pre.delete(id)) await App.setCheck(W.id(id), st);
        return;
      }
      decided.set(key(e), st);
      // „Lernen“ heißt hier: gleich in die Lernschlange (queued) – heute fällig, ohne den Umweg über „neue lernen“
      await App.setCheck(key(e), st, st === 'learn' ? { queued: 1 } : undefined);
      if (mixed && !e.de && st === 'learn' && !S.srs.has(W.id(id))) { pre.add(id); await App.setCheck(W.id(id), 'learn', { pre: 1, queued: 1 }); }
    };
    const answer = (e) => {
      const v = e.item;
      if (e.de) { const ex = v.examples && v.examples[0]; return `<b lang="ja" style="font-family:var(--font-jp);font-size:26px;font-weight:500">${JP.wordRuby(v)}</b>${App.levelBadge(v)}${App.accentHtml(v)}${ex ? `<div class="small muted" lang="ja">${JP.ruby(ex.jp)}</div>` : ''}`; }
      if (isK) return `<b>${App.meaningHtml(v)}</b>${App.levelBadge(v)}<div lang="ja" class="small muted">${(v.on || []).length ? 'On: ' + esc(v.on.join('、')) : ''}${(v.kun || []).length ? ' · Kun: ' + esc(v.kun.map(App.kanjiLogic.kunText).join('、')) : ''}</div>${(v.words || [])[0] ? `<div class="small muted" lang="ja">${JP.ruby(v.words[0].jp)} – ${App.meaningHtml(v.words[0])}</div>` : ''}`;
      if (type === 'phrase') return `<div lang="ja" class="muted">${JP.kana(v.jp) !== JP.plain(v.jp) ? esc(JP.kana(v.jp)) : ''}</div><b>${App.meaningHtml(v)}</b>${v.note ? `<div class="small muted" lang="ja">${JP.ruby(v.note)}</div>` : ''}`;
      const ex = v.examples && v.examples[0];
      return `<div lang="ja" class="muted">${v.kanji ? esc(v.kana) : ''}</div><b>${App.meaningHtml(v)}</b>${App.levelBadge(v)}${App.accentHtml(v)}${ex ? `<div class="small muted" lang="ja">${JP.ruby(ex.jp)}</div>` : ''}`;
    };
    const row = (e, i) => {
      const v = e.item, d = decided.get(key(e));
      return `<div class="check-row ${d ? 'done ' + d : ''}" data-i="${i}">
        ${e.de ? `<div class="check-word" data-reveal style="font-family:var(--font-ui);font-size:20px;font-weight:800">${App.meaningHtml(v, true)}</div>`
        : `<div class="check-word" data-reveal lang="ja" ${isK ? 'style="font-family:var(--font-kanji);font-size:48px"' : ''}>${isK ? esc(v.char) : App.askHtml(v)}</div>`}
        <div class="check-ans" data-reveal>${d || shown.has(key(e)) ? answer(e) : '<span class="muted small">antippen zum Aufdecken</span>'}</div>
        <div class="check-btns">${d ? `<span class="verdict ${d === 'known' ? 'ok' : ''}" style="${d === 'learn' ? 'background:var(--ai-soft);color:var(--ai)' : ''}">${d === 'known' ? '✓ Kann ich' : '＋ Lernschlange'}</span><button class="btn btn-sm btn-ghost" data-undo>ändern</button>`
          : `<button class="btn btn-sm check-known" data-set="known">${icon('check')} Kann ich</button><button class="btn btn-sm check-learn" data-set="learn">${icon('plus')} Lernen</button>`}</div></div>`;
    };
    const draw = () => {
      const left = list.filter((e) => !decided.has(key(e))).length;
      const k = Array.from(decided.values()).filter((x) => x === 'known').length;
      // „Rest“-Knöpfe über und unter der Liste, damit man am Ende nicht zurückscrollen muss
      const rest = left ? `<button class="btn btn-sm" data-all="known">Rest: kann ich</button><button class="btn btn-sm" data-all="learn">Rest: lernen</button>` : '';
      stage.innerHTML = `<div class="row between" style="margin-bottom:10px"><b>Runde: ${list.length - left} / ${list.length} eingestuft</b>
        <div class="row">${rest}</div></div>
        <div class="check-list">${list.map(row).join('')}</div>
        ${left ? `<div class="row" style="justify-content:flex-end;margin-top:10px">${rest}</div>` : ''}
        ${!left ? `<div class="card row between" style="margin-top:16px"><div><b>Runde geschafft!</b> ${k} kannst du schon, ${list.length - k === 1 ? '1 ist' : `${list.length - k} sind`} jetzt in der Lernschlange.</div>
          <div class="row">${App.origin() ? App.backBtn() : ''}<a class="btn" href="#/ueben/heute">${icon('shuffle')} Jetzt wiederholen</a><button class="btn btn-primary" data-next>${icon('next')} Nächste Runde</button></div></div>` : ''}`;
    };
    stage.onclick = async (ev) => {
      const r = ev.target.closest('.check-row');
      const all = ev.target.closest('[data-all]');
      if (all) {
        // auf einmal eingestuft – ein Verklicker lässt sich mit „Rückgängig“ zurücknehmen: die Zeilen stehen dann wieder offen da
        const rows = list.filter((e) => !decided.has(key(e)));
        const snap = App.srsSnap(rows.flatMap((e) => [key(e), W.id(e.item.id)]));
        const prePrev = new Set(pre);
        for (const e of rows) await setRow(e, all.dataset.all);
        draw();
        App.undoToast(`${rows.length} ${all.dataset.all === 'known' ? 'als „kann ich“ eingestuft' : 'in die Lernschlange gelegt'}`, snap, () => {
          rows.forEach((e) => { decided.delete(key(e)); if (!prePrev.has(e.item.id)) pre.delete(e.item.id); });
          if (stage.isConnected) draw();
        });
        return;
      }
      if (ev.target.closest('[data-next]')) { onDone(); return; }
      if (!r) return;
      const e = list[+r.dataset.i];
      const set = ev.target.closest('[data-set]');
      if (set) { await setRow(e, set.dataset.set); draw(); return; }
      if (ev.target.closest('[data-undo]')) { await setRow(e, 'unchecked'); draw(); return; }
      if (ev.target.closest('[data-reveal]')) { if (!shown.delete(key(e))) shown.add(key(e)); draw(); }
    };
    draw();
  }

  // =========================================================
  // Import
  // =========================================================
  const FIELDS = [['skip', '– ignorieren –'], ['jp', 'Japanisch (automatisch: Kanji/Kana/Furigana)'], ['kanji', 'Kanji-Schreibweise'], ['kana', 'Lesung (Kana)'], ['de', 'Deutsch'], ['exjp', 'Beispielsatz (Japanisch)'], ['exde', 'Beispielsatz (Deutsch)'], ['lesson', 'Lektion'], ['tags', 'Schlagwörter']];
  const clean = (s) => String(s || '').replace(/\[sound:[^\]]*\]/g, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  const isJp = (s) => /[぀-ヿ㐀-鿿]/.test(s);
  const hasLatin = (s) => /[a-zäöüß]{2,}/i.test(s);
  // Anki-Furigana „ 日本[にほん]語[ご]“ → Notation ohne Leerzeichen
  const ankiFuri = (s) => s.replace(/\s+(?=[㐀-鿿々]+\[)/g, '').replace(/^\s+/, '');
  const IL = App.importLogic;
  const splitJp = (raw) => IL.splitWord(clean(raw));
  const parseCsvLine = (line, d) => {
    if (d !== ',' && d !== ';') return line.split(d);
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === d && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const detect = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    const sample = lines.slice(0, 40);
    let delim = '\t';
    for (const d of ['\t', ';', '|', ' = ', '=', ' - ', ' – ', ',']) { if (sample.filter((l) => l.includes(d)).length >= sample.length * 0.7) { delim = d; break; } }
    const rows = lines.map((l) => parseCsvLine(l, delim).map((c) => c.trim()));
    const ncol = Math.max(1, ...rows.slice(0, 40).map((r) => r.length));
    // Kopfzeile: erste Zeile ohne Japanisch, die anderen mit – oder lauter bekannte Spaltennamen (言葉 · ドイツ語 · 例)
    const named = rows.length > 1 && IL.isHeadRow(rows[0]);
    const header = named || (rows.length > 1 && rows[0].length >= 2 && !rows[0].some(isJp) && rows.slice(1, 6).some((r) => r.some(isJp)));
    const body = header ? rows.slice(1) : rows;
    const map = [];
    let deUsed = false, exjp = -1;
    for (let c = 0; c < ncol; c++) {
      const vals = body.slice(0, 40).map((r) => clean(r[c] || '')).filter(Boolean);
      const h = header ? (rows[0][c] || '').toLowerCase() : '';
      const hf = named ? IL.headField(rows[0][c] || '') : null;
      const jpShare = vals.filter(isJp).length / Math.max(1, vals.length);
      const avgLen = vals.reduce((a, v) => a + v.length, 0) / Math.max(1, vals.length);
      let f = 'skip';
      if (hf && (hf === 'skip' || !map.includes(hf))) { f = hf; if (f === 'de') deUsed = true; if (f === 'exjp') exjp = c; }
      else if (/lektion|lesson|kapitel/.test(h)) f = 'lesson';
      else if (/tag/.test(h)) f = 'tags';
      else if (jpShare > 0.6) {
        if (avgLen > 9 && map.some((x) => x === 'jp' || x === 'kanji' || x === 'kana')) { f = 'exjp'; exjp = c; }
        else if (vals.some((v) => /\[/.test(v))) f = 'jp';
        else if (vals.filter((v) => JP.hasKanji(v)).length / Math.max(1, vals.length) > 0.3 && !map.includes('kanji') && !map.includes('jp')) f = 'kanji';
        else if (!map.includes('kana') && !map.includes('jp')) f = map.includes('kanji') ? 'kana' : 'jp';
      } else if (vals.some(hasLatin)) {
        if (!deUsed) { f = 'de'; deUsed = true; } else if (exjp >= 0 && !map.includes('exde')) f = 'exde';
      }
      map.push(f);
    }
    if (map.includes('kanji') && !map.includes('kana') && !map.includes('jp')) map[map.indexOf('kanji')] = 'jp';
    return { delim, header, rows: body, ncol, map, headRow: header ? rows[0] : null };
  };
  const guessPos = (kana, de) => {
    if (/^(der|die|das) /i.test(de)) return 'noun';
    if (/[うくぐすつぬぶむる]$/.test(kana) && /^(sich )?[a-zäöüß]+n$/.test(de.split(/[,;]/)[0].trim())) return 'verb';
    if (/い$/.test(kana) && !/^(der|die|das) /i.test(de) && /^[a-zäöüß]+$/.test(de.split(/[,;]/)[0].trim()) && de[0] === de[0].toLowerCase()) return 'i-adj';
    return '';
  };
  // Zeilen der Liste → bearbeitbare Einträge (eine Zeile = ein Eintrag). Was man in der Vorschau ändert, landet hier –
  // den ausgelesenen Text selbst bekommt man nur noch unter „Wörter falsch erkannt?“ zu sehen.
  const toEntries = (st, map, from) => st.rows.map((r, i) => {
    const get = (f) => { const c = map.indexOf(f); return c >= 0 ? clean(r[c]) : ''; };
    let { kanji, kana, na } = get('jp') ? splitJp(get('jp')) : { kanji: get('kanji'), kana: get('kana') };
    if (map.includes('jp') && get('kanji')) kanji = get('kanji');
    if (map.includes('jp') && get('kana')) kana = get('kana');
    const exjp = get('exjp');
    return { eid: 'e' + (from + i), kanji: kanji || '', kana: kana || '', na: !!na, de: get('de'), exjp: /\[/.test(exjp) ? ankiFuri(exjp) : exjp, exde: get('exde'), lesson: get('lesson'), tags: get('tags') };
  });
  // Ohne Deutsch (Spalte leer, z. B. eine Liste aus dem Unterricht) zählt die Zeile trotzdem: enrich() ergänzt die Bedeutung.
  // Gibt es das Wort schon, kommt sein Beispielsatz zum vorhandenen Eintrag (addEx), wenn er dort noch fehlt.
  // „Vielleicht schon vorhanden“ (maybe): wie die Warnung im Vokabel-Formular (autofillLogic.dupes) – in der Liste nur Kana
  // (きらい), in der App mit Kanji (嫌い), oder gleiche Kanji mit anderer Lesung. Was damit passiert, steht in opts.choice
  // (Schlüssel des Listenworts → Id des vorhandenen Worts oder 'new'); ohne Wahl gilt der erste Treffer als dasselbe Wort.
  // Abgewählte Einträge (off) bleiben draußen; deOwn/exdeOwn = von Hand geändert, dort wird nichts nachgeschlagen.
  const buildItems = (entries, opts) => {
    const vocab = App.itemsOf('vocab');
    const existing = new Map(vocab.map((v) => [App.vocabKey(v), v]));
    const seen = new Set();
    const out = { items: [], addEx: [], maybe: [], known: [], dup: 0, bad: 0, noReading: 0 };
    const exTo = (old, ex) => { if (ex && !(old.examples || []).some((e) => JP.plain(e.jp) === JP.plain(ex.jp)) && !out.addEx.some((a) => a.id === old.id)) out.addEx.push({ id: old.id, ex }); };
    for (const e of entries) {
      if (e.off) continue;
      let { kanji, kana } = e;
      if (kana && JP.looksRomaji(kana)) kana = JP.romaji(kana);
      if (!kanji && !kana) { if (!e.manual) out.bad++; continue; }
      if (!kana) { out.noReading++; kana = kanji; }
      if (kanji === kana) kanji = '';
      const ex = e.exjp ? { jp: e.exjp, de: e.exde } : null;
      if (ex && e.exdeOwn) ex._own = 1;
      const key = App.vocabKey({ kanji, kana });
      const old = existing.get(key);
      if (old || seen.has(key)) {
        out.dup++;
        if (old) { exTo(old, ex); if (!out.known.some((k) => k.id === old.id)) out.known.push({ id: old.id, ex }); }
        continue;
      }
      seen.add(key);
      const it = { id: App.uid('v'), type: 'vocab', kana, kanji, de: e.de, pos: e.na ? 'na-adj' : guessPos(kana, e.de), cat: [], source: opts.source, lesson: e.lesson || opts.lesson, tags: opts.tags.concat(e.tags ? e.tags.split(/[\s,]+/).map((t) => t.toLowerCase()).filter(Boolean) : []), level: '', examples: [], imported: Date.now(), _eid: e.eid };
      if (e.deOwn) it._deOwn = 1;
      it.level = App.levelFor(it); // JLPT-Niveau aus dem Index (Import speichert direkt, ohne saveItem)
      if (it.lesson !== '' && !isNaN(+it.lesson)) it.lesson = +it.lesson;
      if (ex) it.examples.push(ex);
      const cands = App.autofillLogic.dupes(vocab, { kanji, kana }).map((d) => d.it).slice(0, 4);
      if (cands.length) {
        const pick = (opts.choice && opts.choice.get(key)) || cands[0].id;
        const same = cands.find((c) => c.id === pick);
        out.maybe.push({ key, it, cands, pick: same ? same.id : 'new', ex });
        if (same) { out.dup++; const n = out.addEx.length; exTo(same, ex); if (out.addEx[n]) out.addEx[n].maybe = 1; continue; }
        it._maybe = 1;
      }
      out.items.push(it);
    }
    return out;
  };

  // ---------- Fehlendes Deutsch ergänzen ----------
  // Bedeutung: zuerst das Offline-Wörterbuch, sonst der Google-Übersetzer; Beispielsätze ohne Deutsch: Übersetzer.
  // Ergebnisse bleiben im cache (je Import-Fenster), damit Vorschau und Import nicht doppelt nachschlagen.
  const newCache = () => ({ word: new Map(), sent: new Map() });
  const wordKey = (it) => App.vocabKey(it);
  const sentences = (r) => r.items.flatMap((it) => it.examples).concat(r.addEx.map((a) => a.ex)).filter((e) => !e._own && !String(e.de || '').trim());
  // trägt ein, was der cache schon weiß (r ist frisch aus buildItems); _fill/_mt markieren Ergänztes für die Vorschau
  const applyCache = (r, cache) => {
    r.items.forEach((it) => {
      const w = !it.de && !it._deOwn && cache.word.get(wordKey(it));
      if (!w) return;
      it._fill = w.src;
      it.de = w.de || '';
      if (w.en) it.en = w.en;
      if (w.pos && !it.pos) it.pos = w.pos;
    });
    sentences(r).forEach((e) => { const de = cache.sent.get(JP.plain(e.jp)); if (de) { e.de = de; e._mt = 1; } });
    return r;
  };
  const unmark = (r) => {
    r.items.forEach((it) => { delete it._fill; delete it._maybe; delete it._deOwn; delete it._eid; it.examples.forEach((e) => { delete e._mt; delete e._own; }); });
    r.addEx.forEach((a) => { delete a.ex._mt; delete a.ex._own; });
  };
  const translateMany = async (texts, out) => {
    const T = App.exfillLogic;
    for (let i = 0; i < texts.length; i += 25) {
      const part = texts.slice(i, i + 25);
      // mehrere Zeilen in einer Anfrage; kommt nicht genau eine Übersetzung je Zeile zurück, einzeln
      const res = (await T.translate(part.join('\n'), fetch)).split('\n').map((s) => s.trim());
      if (res.length === part.length && res.every(Boolean)) part.forEach((t, j) => out.set(t, res[j]));
      else for (const t of part) out.set(t, await T.translate(t, fetch));
    }
  };
  const enrich = async (r, cache) => {
    const AL = App.autofillLogic;
    // wie im Vokabel-Formular: leichte JLPT-Wörter zuerst – nur in Kana (きらい) soll 嫌い gewinnen, nicht 機雷
    const LV = { N5: 6, N4: 5, N3: 4, N2: 3, N1: 2 };
    const bonus = (e) => (LV[App.jlptOf({ type: 'vocab', kanji: (e.k || [])[0] || '', kana: (e.r || [])[0] || '' })] || 0) + (e.de ? 1 : 0);
    const todo = r.items.filter((it) => !it.de && !it._deOwn && !cache.word.has(wordKey(it)));
    if (todo.length && App.dict.installed()) {
      let hits = new Map();
      try { hits = await App.dict.lookup([...new Set(todo.flatMap((it) => [it.kanji, it.kana].filter(Boolean)))]); } catch (e) { console.error(e); }
      todo.forEach((it) => {
        const typed = { kanji: it.kanji, kana: it.kana };
        const hira = JP.toHira(it.kana);
        const list = AL.rank([].concat(hits.get(it.kanji) || [], hits.get(it.kana) || []), typed, bonus)
          .filter((e) => (!it.kanji || (e.k || []).includes(it.kanji)) && (e.r || []).some((x) => JP.toHira(x) === hira));
        const e = list[0];
        if (e && (e.de || e.en)) cache.word.set(wordKey(it), { src: 'dict', de: App.firstGloss(e.de), en: App.firstGloss(e.en), pos: App.mapPos(e.p || [], it.kanji || it.kana).pos });
      });
    }
    const rest = todo.filter((it) => !cache.word.has(wordKey(it)));
    const sents = [...new Set(sentences(r).map((e) => JP.plain(e.jp)).filter((s) => !cache.sent.has(s)))];
    try {
      if (rest.length) {
        const m = new Map();
        await translateMany([...new Set(rest.map((it) => it.kanji || it.kana))], m);
        rest.forEach((it) => { const de = m.get(it.kanji || it.kana); if (de) cache.word.set(wordKey(it), { src: 'mt', de }); });
      }
      if (sents.length) await translateMany(sents, cache.sent);
    } catch (e) { console.error(e); } // ohne Internet bleibt es beim Wörterbuch
    return applyCache(r, cache);
  };

  // ---------- PDF → Text (Zeilen & Spalten aus der Position auf der Seite) ----------
  const parsePages = (spec, max) => {
    if (!spec || !spec.trim()) return Array.from({ length: max }, (_, i) => i + 1);
    const out = new Set();
    spec.split(/[,;\s]+/).forEach((part) => {
      const m = part.match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return;
      const a = +m[1], b = m[2] ? +m[2] : a;
      for (let p = Math.min(a, b); p <= Math.max(a, b); p++) if (p >= 1 && p <= max) out.add(p);
    });
    return Array.from(out).sort((x, y) => x - y);
  };
  App.pdfToText = async (blob, { pages = '', twoCols = 'auto' } = {}) => {
    let splitPages = 0;
    const lib = await App.ink.pdfjs();
    const pdf = await lib.getDocument({
      data: await blob.arrayBuffer(),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
    }).promise;
    const list = parsePages(pages, pdf.numPages);
    const lines = [];
    let chars = 0;
    for (const n of list) {
      const page = await pdf.getPage(n);
      const tc = await page.getTextContent();
      const items = tc.items.filter((i) => i.str && i.str.trim()).map((i) => ({
        // NFKC: Kangxi-Radikale (⾷) → normale Kanji (食), Halbbreiten-Katakana → normale Katakana
        s: i.str.normalize('NFKC'), x: i.transform[4], y: i.transform[5], w: i.width || 0, h: Math.abs(i.transform[3]) || i.height || 10,
      }));
      chars += items.reduce((a, i) => a + i.s.length, 0);
      // Zeilen und Spalten nach der Lage auf der Seite, Furigana an ihr Kanji, Überschriften als „# …“ (importlist-logic.js)
      const r = App.importLogic.pageLines(items, { twoCols });
      lines.push(...r.lines);
      if (r.split) splitPages++;
    }
    return { text: lines.join('\n'), pages: list.length, total: pdf.numPages, chars, splitPages };
  };

  // Zwei Schritte: 1) Liste wählen (Datei, Bibliothek oder Text einfügen) – eine Datei wird gleich ausgelesen;
  // 2) Wörter prüfen und ergänzen: Wort, Lesung, Deutsch und Satz-Übersetzung direkt eintippen, ✎ ändert auch den Satz, Haken = übernehmen.
  // Spalten, Seiten und der ausgelesene Text stecken eingeklappt unter „Wörter falsch erkannt?“.
  App.importVocab = ({ fileId } = {}) => {
    const body = document.createElement('div');
    body.className = 'sec-vocab imp';
    const libPdfs = Array.from(S.files.values()).filter((f) => App.fileKind(f) === 'pdf').sort((a, b) => b.created - a.created);
    body.innerHTML = `<div class="stack" data-step1>
        <p class="muted" style="margin:0">Wähle deine Wortliste. Die App liest die Wörter heraus und ergänzt fehlendes Deutsch – danach siehst du alles noch einmal und kannst es ändern.</p>
        <div class="imp-choices">
          <label class="imp-choice">${icon('upload')}<b>Datei wählen</b><span>PDF aus dem Unterricht, Anki-Export (.txt) oder Tabelle (.csv)</span><input type="file" accept=".pdf,application/pdf,.txt,.csv,.tsv,text/plain,text/csv" hidden data-file></label>
          ${libPdfs.length ? `<div class="imp-choice">${icon('library')}<b>Aus der Bibliothek</b><select class="input" data-libpdf><option value="">PDF auswählen …</option>${libPdfs.map((f) => `<option value="${f.id}" ${f.id === fileId ? 'selected' : ''}>${esc(f.name)}${f.source ? ' · ' + esc(f.source) : ''}${f.lesson !== '' && f.lesson != null ? ' L' + esc(f.lesson) : ''}</option>`).join('')}</select></div>` : ''}
          <button type="button" class="imp-choice" data-paste>${icon('edit')}<b>Text einfügen</b><span>kopierte Liste, eine Zeile pro Wort</span></button>
        </div>
        <div class="stack" data-pastebox hidden>
          <textarea class="input jp-in" rows="8" data-text placeholder="食べる;たべる;essen&#10;新聞 (しんぶん) = Zeitung&#10;がっこう	die Schule"></textarea>
          <span class="small muted">Spalten getrennt durch Tab, Semikolon, Komma, „=“ oder „ - “. Anki: <i>Durchsuchen › Notizen exportieren › „Notizen als Klartext (.txt)“</i>. Excel/Numbers: als CSV speichern.</span>
        </div>
        <div class="small muted" data-status></div>
      </div><div class="stack" data-step2 hidden></div>`;
    const md = App.modal({ title: 'Vokabeln importieren', body, wide: true, foot: '<button class="btn" data-back hidden>← Andere Liste</button><span class="grow"></span><button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-next hidden disabled>Weiter</button>' });
    const ta = body.querySelector('[data-text]');
    const step1 = body.querySelector('[data-step1]'), s2 = body.querySelector('[data-step2]');
    const statusEl = body.querySelector('[data-status]');
    const nextB = md.el.querySelector('[data-next]'), backB = md.el.querySelector('[data-back]');
    md.el.querySelector('[data-no]').onclick = md.close;

    const cache = newCache();
    const choice = new Map(); // „vielleicht schon vorhanden“: Schlüssel des Listenworts → Id des vorhandenen Worts oder 'new'
    let raw = '', st = null, map = [], entries = [], nextEid = 0, editing = null, step = 1, run = 0, last = null, busy = false;
    let pdfBlob = null, pdfPages = '', pdfTwo = 'auto', pdfInfo = '', fname = '', meta = {};
    const form = { status: 'learn' }; // Lernstand neuer Wörter: standardmäßig gleich in die Lernschlange
    const entryOf = (eid) => entries.find((e) => e.eid === eid);

    // ---------- Schritt 1: Liste wählen ----------
    const readPdf = async () => {
      statusEl.textContent = 'PDF wird ausgelesen …';
      try {
        const r = await App.pdfToText(pdfBlob, { pages: pdfPages, twoCols: ({ auto: 'auto', true: true, false: false })[pdfTwo] });
        statusEl.textContent = '';
        if (!r.chars) {
          App.modal({ title: 'Kein Text in dieser PDF', body: '<p>Die PDF enthält nur Bilder (z. B. eingescannte Buchseiten) – daraus kann die App keinen Text lesen.</p><p class="muted">Tipp: In der Microsoft-Fotos-App oder OneNote lässt sich Text aus Bildern kopieren („Text kopieren“). Den kopierten Text hier über „Text einfügen“ einfügen.</p>' });
          return false;
        }
        raw = r.text;
        pdfInfo = `${r.pages === r.total ? (r.total === 1 ? '1 Seite' : r.total + ' Seiten') : r.pages + ' von ' + r.total + ' Seiten'}${r.splitPages ? ' · zwei Listen nebeneinander erkannt' : ''}`;
        return true;
      } catch (er) { statusEl.textContent = 'Fehler beim Lesen: ' + er.message; return false; }
    };
    // Text → Zeilen → Einträge; selbst hinzugefügte Wörter bleiben beim Neu-Einlesen erhalten
    const parse = () => {
      const s = detect(raw);
      if (!s.rows.length) { App.toast('In dieser Liste wurden keine Wörter gefunden'); return false; }
      st = s; map = s.map.slice();
      entries = toEntries(st, map, nextEid).concat(entries.filter((e) => e.manual));
      nextEid += st.rows.length;
      editing = null;
      return true;
    };
    const open = async (fromPdf) => {
      if (fromPdf && !(await readPdf())) return;
      if (parse()) showStep2();
    };
    const usePdf = (blob, name, m = {}) => { pdfBlob = blob; fname = name; meta = m; pdfPages = ''; pdfTwo = 'auto'; open(true); };
    body.querySelector('[data-file]').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      e.target.value = '';
      if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) return usePdf(f, f.name);
      pdfBlob = null; fname = f.name; meta = {}; pdfInfo = '';
      raw = await f.text();
      open(false);
    };
    const lib = body.querySelector('[data-libpdf]');
    if (lib) lib.onchange = async () => { if (lib.value) { const f = S.files.get(lib.value); usePdf(await App.fileBlob(f.id), f.name, f); } };
    if (lib && fileId) lib.onchange();
    body.querySelector('[data-paste]').onclick = () => {
      body.querySelector('[data-pastebox]').hidden = false;
      nextB.hidden = false; nextB.innerHTML = 'Weiter';
      ta.focus();
    };
    ta.addEventListener('input', () => { nextB.disabled = !ta.value.trim(); });
    backB.onclick = () => {
      step = 1; ++run; editing = null; entries = [];
      s2.hidden = true; step1.hidden = false; backB.hidden = true;
      nextB.hidden = body.querySelector('[data-pastebox]').hidden; nextB.innerHTML = 'Weiter'; nextB.disabled = !ta.value.trim();
    };

    // ---------- Schritt 2: prüfen und ergänzen ----------
    const FILL = { dict: 'aus dem Wörterbuch', mt: 'übersetzt – bitte prüfen' };
    const showStep2 = () => {
      step = 2;
      step1.hidden = true; s2.hidden = false; backB.hidden = false; nextB.hidden = false;
      if (!('source' in form)) {
        form.source = meta.source || (/anki/i.test(fname) ? 'Anki' : (App.lsGet('importSource') || (pdfBlob ? 'VHS-Kurs' : 'Anki')));
        form.lesson = String(meta.lesson ?? ''); form.tags = '';
      }
      s2.innerHTML = `<div class="imp-head"><span class="imp-file">${icon(pdfBlob ? 'file' : 'list')}<b>${esc(fname || 'Eingefügter Text')}</b></span>${pdfInfo ? `<span class="small muted">${pdfInfo}</span>` : ''}<span class="grow"></span><span class="row small" data-badges></span></div>
        <div data-maybe></div>
        <div class="imp-list" data-list></div>
        <div class="row small muted" style="gap:10px"><button class="btn btn-sm" data-add>${icon('plus')} Wort hinzufügen</button><span>Alle Felder kannst du direkt ändern · ${icon('edit')} ändert auch den Beispielsatz · Haken weg = nicht übernehmen</span></div>
        <div data-known></div>
        <div class="imp-where form">
          <div class="three"><div class="field"><label>Quelle</label><select class="input" data-w="source">${App.sourceOptions(form.source, false)}</select></div>
            <div class="field"><label>Lektion</label><input class="input" data-w="lesson" value="${esc(form.lesson)}" placeholder="z. B. 4"></div>
            <div class="field"><label>Schlagwörter</label><input class="input" data-w="tags" value="${esc(form.tags)}" placeholder="z. B. unterricht"></div></div>
          <div class="field"><label>Neue Wörter kommen …</label><div class="seg" data-st>${[['learn', 'in die Lernschlange'], ['unchecked', 'erst zum Einstufen'], ['known', 'zu „kann ich schon“']].map(([v, l]) => `<button type="button" data-v="${v}" class="${form.status === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        </div>
        <details class="adv" data-adv><summary>Wörter falsch erkannt? Spalten und Seiten anpassen</summary><div class="stack" data-advbody></div></details>`;
      App.hydrateIcons(s2);
      drawAdv();
      prev();
    };
    const drawAdv = () => {
      s2.querySelector('[data-advbody]').innerHTML = `
        ${pdfBlob ? `<div class="row small"><label class="row" style="gap:6px">Seiten <input class="input" data-pages value="${esc(pdfPages)}" placeholder="alle – z. B. 3-5, 8" style="width:150px;height:38px"></label>
          <select class="input" data-twocols style="height:38px;width:auto">${[['auto', 'Listen: automatisch'], ['false', 'eine Liste pro Seite'], ['true', 'zwei Listen nebeneinander']].map(([v, l]) => `<option value="${v}" ${pdfTwo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <button class="btn btn-sm" data-reread>${icon('replay')} Neu auslesen</button></div>` : ''}
        <div class="small muted">So wurden die Spalten verstanden – stimmt eine nicht, hier umstellen:</div>
        <div style="overflow:auto"><table class="map-table"><thead><tr>${Array.from({ length: st.ncol }, (_, c) => `<th><select class="input" data-col="${c}" style="min-width:170px">${FIELDS.map(([k, l]) => `<option value="${k}" ${map[c] === k ? 'selected' : ''}>${l}</option>`).join('')}</select>${st.headRow ? `<div class="small" style="margin-top:4px;text-transform:none">${esc(st.headRow[c] || '')}</div>` : ''}</th>`).join('')}</tr></thead>
          <tbody>${st.rows.slice(0, 3).map((r) => `<tr>${Array.from({ length: st.ncol }, (_, c) => `<td lang="ja" class="small">${esc(clean(r[c] || '').slice(0, 60))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <details class="imp-raw"><summary class="small">Ausgelesenen Text ansehen und bearbeiten</summary>
          <textarea class="input jp-in" rows="8" data-raw>${esc(raw)}</textarea>
          <div class="row"><span class="small muted grow">Eine Zeile pro Wort, Spalten mit Tab getrennt. Zeilen mit # werden übersprungen.</span><button class="btn btn-sm" data-reparse>${icon('replay')} Text neu einlesen</button></div></details>
        <div class="small muted">Beim Neu-Einlesen gehen Änderungen in der Liste verloren – selbst hinzugefügte Wörter bleiben.</div>`;
      App.hydrateIcons(s2);
    };

    // Vorschau: Einträge → Wörter; fehlendes Deutsch wird nachgeschlagen (Wörterbuch, sonst Übersetzer) – Ergänztes ist markiert
    const opts0 = () => ({ source: '', lesson: '', tags: [], choice });
    const prev = async () => {
      const my = ++run;
      const r = buildItems(entries, opts0());
      const need = r.items.some((v) => !v.de && !v._deOwn) || sentences(r).length > 0;
      busy = need;
      draw(applyCache(r, cache));
      if (!need) return;
      await enrich(r, cache);
      if (my !== run || !s2.isConnected) return;
      busy = false;
      draw(r);
    };
    // abgewählte Zeilen: kein Wort im Ergebnis – Nachgeschlagenes kommt aus dem cache
    const wordOf = (e, it) => it || { kanji: e.kanji, kana: e.kana || e.kanji, de: e.de || (cache.word.get(App.vocabKey({ kanji: e.kanji === e.kana ? '' : e.kanji, kana: e.kana || e.kanji })) || {}).de || '', examples: e.exjp ? [{ jp: e.exjp, de: e.exde || cache.sent.get(JP.plain(e.exjp)) || '' }] : [] };
    const exRuby = (ex) => `<span lang="ja">${JP.ruby(ex.jp)}</span>${ex.de ? `<div class="muted">${esc(ex.de)}${ex._mt ? ' <i>(übersetzt)</i>' : ''}</div>` : ''}`;
    const rowHtml = (e, it) => {
      const v = wordOf(e, it);
      if (editing === e.eid) return editHtml(e, v);
      const ex = v.examples[0];
      const de = e.deOwn ? e.de : v.de || '';
      const exde = ex ? (e.exdeOwn ? e.exde : ex.de || '') : '';
      const hint = it && it._fill && !e.deOwn ? `<span class="imp-hint ${it._fill}">${FILL[it._fill]}</span>` : '';
      return `<div class="imp-row${e.off ? ' off' : ''}" data-eid="${e.eid}">
        <label class="imp-on" title="übernehmen"><input type="checkbox" data-on ${e.off ? '' : 'checked'}></label>
        <span class="imp-w"><input class="imp-in w jp-in" lang="ja" data-f="kanji" value="${esc(e.kanji)}" placeholder="ohne Kanji" ${e.off ? 'disabled' : ''}><input class="imp-in w sm jp-in" lang="ja" data-f="kana" value="${esc(e.kana)}" placeholder="Lesung" ${e.off ? 'disabled' : ''}></span>
        <span class="imp-de"><input class="imp-in" data-f="de" value="${esc(de)}" placeholder="${!de && busy ? 'wird ergänzt …' : v.en ? 'engl.: ' + esc(v.en) : 'Deutsch eintragen'}" ${e.off ? 'disabled' : ''}>${hint}</span>
        <span class="imp-ex">${ex ? `<span lang="ja" class="imp-exjp">${JP.ruby(ex.jp)}</span><input class="imp-in sm" data-f="exde" value="${esc(exde)}" placeholder="${!exde && busy ? 'wird übersetzt …' : 'Übersetzung des Satzes'}" ${e.off ? 'disabled' : ''}>${ex._mt && !e.exdeOwn ? '<span class="imp-hint mt">übersetzt – bitte prüfen</span>' : ''}` : '<span class="small muted">kein Beispielsatz</span>'}</span>
        <button type="button" class="icon-btn" data-edit title="Wort oder Satz ändern" ${e.off ? 'disabled' : ''}>${icon('edit')}</button></div>`;
    };
    // Bearbeiten: data-o hält den angezeigten Stand – nur was sich davon unterscheidet, gilt als geändert
    const editHtml = (e, v) => {
      const ex = v.examples[0] || { jp: '', de: '' };
      const f = (k, label, val, ph = '', jp = false) => `<div class="field"><label>${label}</label><input class="input${jp ? ' jp-in' : ''}" data-e="${k}" data-o="${esc(val)}" value="${esc(val)}" placeholder="${ph}"></div>`;
      return `<div class="imp-row editing" data-eid="${e.eid}"><div class="imp-edit form">
        <div class="three">${f('kanji', 'Kanji', e.kanji, 'falls es welche gibt', true)}${f('kana', 'Lesung', e.kana, 'Kana oder Romaji', true)}${f('de', 'Deutsch', e.deOwn ? e.de : v.de || '')}</div>
        <div class="two">${f('exjp', 'Beispielsatz', JP.plain(e.exjp), 'optional', true)}${f('exde', 'Übersetzung', e.exdeOwn ? e.exde : ex.de || '', 'leer = wird übersetzt')}</div>
        <div class="row"><span class="small muted grow">Lesung und Furigana im Satz ergänzt die App, wenn du sie leer lässt.</span><button type="button" class="btn btn-sm" data-cancel>Abbrechen</button><button type="button" class="btn btn-sm btn-primary" data-done>${icon('check')} Fertig</button></div>
      </div></div>`;
    };
    const finishEdit = async (row) => {
      const e = entryOf(row.dataset.eid);
      const inp = (k) => row.querySelector(`[data-e="${k}"]`);
      const val = (k) => inp(k).value.trim();
      const changed = (k) => val(k) !== inp(k).dataset.o.trim();
      let kanji = val('kanji'), kana = val('kana');
      editing = null;
      if (!kanji && !kana) { if (e.manual) entries.splice(entries.indexOf(e), 1); return prev(); }
      if (kanji && !JP.hasKanji(kanji) && !kana) { kana = kanji; kanji = ''; }
      if (kanji && !kana) { try { const r = await App.sentenceReading(kanji); if (!r.missing.length) kana = r.kana; } catch (er) { console.error(er); } }
      e.kanji = kanji; e.kana = kana;
      if (changed('de')) { e.de = val('de'); e.deOwn = 1; }
      if (changed('exjp')) {
        const s = val('exjp');
        e.exjp = s;
        if (s && JP.hasKanji(s)) { try { const r = await App.sentenceReading(s); if (r.furi) e.exjp = r.furi; } catch (er) { console.error(er); } }
        if (!changed('exde')) { e.exde = ''; delete e.exdeOwn; } // neuer Satz → neue Übersetzung
      }
      if (changed('exde')) { e.exde = val('exde'); e.exdeOwn = 1; }
      // selbst hinzugefügt, gibt es aber schon: es landet bei „hast du schon“ – kurz sagen, wohin es verschwindet
      const old = e.manual && App.itemsOf('vocab').find((v) => App.vocabKey(v) === App.vocabKey({ kanji: kanji === kana ? '' : kanji, kana: kana || kanji }));
      if (old) App.toast(`${old.kanji || old.kana} hast du schon${e.exjp ? ' – der Satz kommt dort dazu' : ''}`);
      return prev();
    };
    // Wort direkt in der Liste geändert: fehlt die Lesung zu Kanji, ergänzt sie die App; dann neu prüfen (schon vorhanden? Deutsch?)
    const wordChanged = async (e) => {
      if (e.kanji && !JP.hasKanji(e.kanji) && !e.kana) { e.kana = e.kanji; e.kanji = ''; }
      if (e.kanji && !e.kana) { try { const r = await App.sentenceReading(e.kanji); if (!r.missing.length) e.kana = r.kana; } catch (er) { console.error(er); } }
      prev();
    };
    const badge = (txt, warn) => `<span class="badge"${warn ? ' style="background:var(--shu-soft);color:var(--shu)"' : ''}>${txt}</span>`;
    const draw = (r) => {
      last = r;
      const list = s2.querySelector('[data-list]');
      // Fokus und Scrollstand halten, wenn das Nachschlagen fertig wird, während man tippt
      const a = document.activeElement;
      const keep = a && list.contains(a) && a.dataset.f ? { eid: a.closest('[data-eid]').dataset.eid, f: a.dataset.f, s: a.selectionStart } : null;
      const top = md.body.scrollTop;
      const byEid = new Map(r.items.map((it) => [it._eid, it]));
      const rows = entries.map((e) => (byEid.has(e.eid) || e.off || editing === e.eid ? rowHtml(e, byEid.get(e.eid)) : '')).join('');
      list.innerHTML = rows || '<div class="imp-empty muted">Keine neuen Wörter in dieser Liste.</div>';
      md.body.scrollTop = top;
      if (keep) { const x = list.querySelector(`[data-eid="${keep.eid}"] [data-f="${keep.f}"]`); if (x) { x.focus(); try { x.setSelectionRange(keep.s, keep.s); } catch (er) { /* kein Textfeld */ } } }
      // „vielleicht schon vorhanden“ – je Wort: dasselbe (Satz kommt dorthin) oder neu anlegen
      const candLabel = (c) => `Dasselbe wie ${c.kanji ? c.kanji + ' (' + c.kana + ')' : c.kana}${c.de ? ' – ' + App.firstGloss(c.de) : ''}${c.source ? ' · ' + c.source : ''}`;
      s2.querySelector('[data-maybe]').innerHTML = r.maybe.length ? `<div class="imp-group maybe"><div class="imp-gtitle">${icon('alert')} Gibt es vielleicht schon – bitte kurz ansehen</div>${r.maybe.map((m) => { const old = S.items.get(m.pick);
        return `<div class="imp-mrow"><span class="imp-w" lang="ja">${JP.wordRuby(m.it)}</span><select class="input" data-maybe="${esc(m.key)}">${m.cands.map((c) => `<option value="${c.id}" ${m.pick === c.id ? 'selected' : ''}>${esc(candLabel(c))}</option>`).join('')}<option value="new" ${m.pick === 'new' ? 'selected' : ''}>Anderes Wort – neu anlegen</option></select>
          <span class="small muted">${m.pick === 'new' ? 'steht unten bei den neuen Wörtern' : !m.ex ? 'wird übersprungen' : r.addEx.some((x) => x.id === m.pick) ? 'der Satz kommt zu ' + esc(old.kanji || old.kana) : 'wird übersprungen, der Satz ist dort schon'}</span></div>`; }).join('')}</div>` : '';
      // schon vorhanden: eingeklappt
      const exN = r.addEx.filter((x) => !x.maybe).length;
      s2.querySelector('[data-known]').innerHTML = r.known.length ? `<details class="imp-group known"><summary><b>${r.known.length === 1 ? '1 Wort hast' : r.known.length + ' Wörter hast'} du schon</b> – ${r.known.length === 1 ? 'wird' : 'werden'} übersprungen${exN ? `, ${exN === 1 ? 'eins bekommt' : exN + ' bekommen'} den Beispielsatz aus der Liste` : ''}</summary>
        ${r.known.map((k) => { const old = S.items.get(k.id); const gets = r.addEx.some((x) => x.id === k.id && !x.maybe);
          return `<div class="imp-mrow"><span class="imp-w" lang="ja">${JP.wordRuby(old)}</span><span class="small">${old.de || old.en ? App.meaningHtml(old) : ''}</span><span class="small">${gets ? `<span class="muted">bekommt diesen Satz:</span> ${exRuby(k.ex)}` : `<span class="muted">${k.ex ? 'Satz ist schon da' : 'nichts zu ergänzen'}</span>`}</span></div>`; }).join('')}</details>` : '';
      App.hydrateIcons(s2);
      const n = r.items.length;
      const noDe = r.items.filter((v) => !v.de && !v.en).length;
      s2.querySelector('[data-badges]').innerHTML = (n ? badge(`${n} neu`) : '') + (busy ? badge('Deutsch wird ergänzt …') : noDe ? badge(`${noDe} noch ohne Deutsch`, 1) : '') + (r.bad ? badge(`${r.bad} ${r.bad === 1 ? 'Zeile' : 'Zeilen'} ohne Japanisch übersprungen`) : '');
      nextB.disabled = busy || !!editing || !(n || r.addEx.length);
      nextB.innerHTML = busy ? 'Deutsch wird ergänzt …' : `${icon('download')} ${n ? `${n === 1 ? '1 Wort' : n + ' Wörter'} übernehmen` : r.addEx.length ? 'Beispielsätze ergänzen' : 'Nichts zu übernehmen'}`;
    };

    s2.addEventListener('input', (ev) => {
      const t = ev.target, row = t.closest('[data-eid]');
      if (t.dataset.f && row) {
        const e = entryOf(row.dataset.eid), v = t.value.trim();
        if (t.dataset.f === 'de') { e.de = v; e.deOwn = 1; } else if (t.dataset.f === 'exde') { e.exde = v; e.exdeOwn = 1; } else e[t.dataset.f] = v; // Kanji/Lesung: neu prüfen erst beim Verlassen (change)
      }
      if (t.dataset.w) form[t.dataset.w] = t.value;
    });
    s2.addEventListener('change', (ev) => {
      const t = ev.target, row = t.closest('[data-eid]');
      if (t.matches('[data-on]')) { entryOf(row.dataset.eid).off = !t.checked; prev(); }
      else if (t.matches('[data-maybe]')) { choice.set(t.dataset.maybe, t.value); prev(); }
      else if (t.matches('[data-f="kanji"], [data-f="kana"]')) wordChanged(entryOf(row.dataset.eid));
      else if (t.matches('[data-col]')) {
        map = $$('[data-col]', s2).map((x) => x.value);
        entries = toEntries(st, map, nextEid).concat(entries.filter((e) => e.manual));
        nextEid += st.rows.length; editing = null;
        prev();
      } else if (t.matches('[data-twocols]')) { pdfTwo = t.value; reread(); }
    });
    const reread = async () => { if (await readPdf() && parse()) { drawAdv(); prev(); s2.querySelector('[data-adv]').open = true; } };
    s2.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      if (ev.target.matches('[data-pages]')) { pdfPages = ev.target.value.trim(); reread(); }
      else if (ev.target.matches('[data-e]')) { ev.preventDefault(); finishEdit(ev.target.closest('[data-eid]')); }
    });
    s2.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      const row = b.closest('[data-eid]');
      if (b.matches('[data-edit]')) { editing = row.dataset.eid; draw(last); const f = s2.querySelector('.editing [data-e="de"]'); if (f) f.focus(); }
      else if (b.matches('[data-done]')) finishEdit(row);
      else if (b.matches('[data-cancel]')) { const e = entryOf(row.dataset.eid); editing = null; if (e.manual && !e.kanji && !e.kana) entries.splice(entries.indexOf(e), 1); draw(last); }
      else if (b.matches('[data-add]')) {
        if (editing) return;
        const e = { eid: 'e' + nextEid++, manual: 1, kanji: '', kana: '', de: '', exjp: '', exde: '', lesson: '', tags: '' };
        entries.push(e); editing = e.eid; draw(last);
        const f = s2.querySelector('.editing [data-e="kanji"]'); if (f) { f.scrollIntoView({ block: 'nearest' }); f.focus(); }
      } else if (b.matches('[data-v]')) { form.status = b.dataset.v; $$('[data-st] [data-v]', s2).forEach((x) => x.classList.toggle('on', x === b)); }
      else if (b.matches('[data-reread]')) { pdfPages = s2.querySelector('[data-pages]').value.trim(); reread(); }
      else if (b.matches('[data-reparse]')) { raw = s2.querySelector('[data-raw]').value; if (parse()) { drawAdv(); prev(); } }
    });

    const doImport = async () => {
      const source = s2.querySelector('[data-w="source"]').value;
      App.lsSet('importSource', source);
      const tags = s2.querySelector('[data-w="tags"]').value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      const r = applyCache(buildItems(entries, { source, lesson: s2.querySelector('[data-w="lesson"]').value.trim(), tags, choice }), cache);
      unmark(r);
      const status = form.status;
      nextB.disabled = true; nextB.textContent = 'Wird übernommen …';
      const now = Date.now();
      r.items.forEach((it, i) => { it.created = now + i; it.updated = now + i; S.items.set(it.id, it); });
      await App.db.putMany('items', r.items);
      // Beispielsatz aus der Liste bei schon vorhandenen Wörtern: vorne, damit er in den Abfragen erscheint
      const changed = r.addEx.map((a) => { const it = S.items.get(a.id); it.examples = [a.ex].concat(it.examples || []); it.updated = now; return it; });
      if (changed.length) await App.db.putMany('items', changed);
      if (status !== 'unchecked') for (const it of r.items) await App.setCheck(it.id, status);
      md.close();
      App.emit('items');
      const exMsg = changed.length ? `${changed.length} ${changed.length === 1 ? 'Beispielsatz' : 'Beispielsätze'} bei vorhandenen Wörtern ergänzt` : '';
      const where = { learn: ' – sie sind jetzt in der Lernschlange', known: ' als „kann ich“' }[status] || '';
      App.toast(r.items.length ? `${r.items.length} Vokabeln importiert${where}${exMsg ? ' · ' + exMsg : ''}` : exMsg, status === 'unchecked' && r.items.length ? { label: 'Jetzt einstufen', fn: () => App.go('#/ueben/einstufen?src=' + encodeURIComponent(source)) } : null);
    };
    nextB.onclick = () => {
      if (step === 2) return doImport();
      raw = ta.value; fname = ''; meta = {}; pdfBlob = null; pdfInfo = '';
      open(false);
    };
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-action="import-vocab"]')) App.importVocab(); });
})(window.App);
