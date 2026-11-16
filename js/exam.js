/* Nihongo Techō – Prüfungen (試験): Seiten #/pruefung (Übersicht) und #/pruefung/<stufe>
   Ablauf wie beim JLPT: 語彙 → 文法 → 聴解 → 漢字, 4 Antworten je Frage, keine Uhr. Jede Antwort wird sofort
   gespeichert (exam-store.js), man kann jederzeit pausieren. Am Ende: Punkte je Teil, 合格 ab 80 % gesamt und
   60 % in jedem Teil, Frage „Fehler zurück in die Lernschlange?“, danach alle Fragen mit Lösung. */
'use strict';
(function (App) {
  const S = App.store, JP = App.jp, esc = App.esc, icon = App.icon;
  const L = App.examLogic, E = App.exams, W = App.writeLogic;
  const X = App.exam = {};
  const TYPES = ['vocab', 'kanji', 'grammar'];

  // ---------- Lernstand je Stufe ----------
  const stageItems = (st) => {
    const out = [];
    S.items.forEach((it) => { if (TYPES.includes(it.type) && L.inStage(st, it)) out.push(it); });
    return out;
  };
  // Prozent „kann ich“ wie auf der Startseite (Vokabeln + Kanji + Grammatik der Stufe); null = Stufe hat keine Einträge
  X.pct = (key) => {
    const items = stageItems(L.stage(key));
    if (!items.length) return null;
    const c = App.progressCounts(items);
    return Math.floor((c.known / c.total) * 100);
  };
  // state: locked | open | running | passed (bestanden, keine angefangene) · empty = Stufe gibt es hier nicht
  // JLPT-Stufen gibt es nur mit installiertem Paket (Genki- oder Duolingo-Wörter tragen auch ein Niveau)
  const available = (st) => {
    if (!st.level) return true;
    const p = (window.PACKS || []).find((x) => x.kind === 'level' && x.level === st.level);
    return !!p && !!App.packs && ['installed', 'update'].includes(App.packs.status(p));
  };
  X.status = (key) => {
    const st = L.stage(key), cache = E.cache, run = cache.runs[key] || null, best = cache.best[key] || null;
    const ok = available(st), pct = ok ? X.pct(key) : null;
    return { state: L.state({ pct, run, best, available: ok }), pct, run, best };
  };
  const answered = (run) => run.answers.filter((a) => a !== null).length;
  const href = (key) => `#/pruefung/${key}`;
  const fmtDate = (t) => new Date(t).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  X.badge = (best) => (best && best.passed ? `<span class="badge exam-pass" title="Bestanden am ${fmtDate(best.date)}">合格 ${best.pct} %</span>` : '');
  // Kleiner Knopf für Lernstand-Karten (label z. B. „L3“ oder „Genki gesamt“); '' wenn gesperrt oder leer
  X.chip = (key, label) => {
    const s = X.status(key), st = L.stage(key), what = st.kind === 'mini' ? 'Minitest' : 'Prüfung';
    const pre = label ? `${esc(label)} ` : '';
    if (s.state === 'running') return `<a class="exam-cta run" href="${href(key)}" title="${what} fortsetzen">${pre}${icon('play')} ${answered(s.run)}/${s.run.answers.length}</a>`;
    if (s.state === 'passed') return `<a class="exam-cta pass" href="${href(key)}" title="Bestanden am ${fmtDate(s.best.date)} – noch einmal machen?">${pre}合格 ${s.best.pct} %</a>`;
    if (s.state === 'open') return `<a class="exam-cta" href="${href(key)}" title="Ab ${L.UNLOCK} % freigeschaltet">${pre}${what}</a>`;
    return '';
  };
  // Zeile „試 Prüfungen“ für eine Lernstand-Karte; '' wenn noch nichts freigeschaltet ist
  X.cardLine = (pairs) => {
    const chips = pairs.map(([key, label]) => X.chip(key, label)).filter(Boolean);
    return chips.length ? `<div class="exam-line"><a class="exam-line-k" href="#/pruefung" title="Alle Prüfungen">試 Prüfungen</a>${chips.join('')}</div>` : '';
  };

  // ---------- Fragen anzeigen ----------
  const INSTR = {
    read: ['＿＿のことばはどう読みますか。', 'Wie liest man das unterstrichene Wort?'],
    kread: ['＿＿のことばはどう読みますか。', 'Wie liest man das unterstrichene Wort?'],
    kwrite: ['＿＿のことばはどう書きますか。', 'Wie schreibt man das unterstrichene Wort?'],
    fill: ['（　）に何を入れますか。', 'Welches Wort passt in die Lücke?'],
    gfill: ['（　）に何を入れますか。', 'Was passt in die Lücke?'],
    mean: ['正しい意味はどれですか。', 'Was bedeutet das Wort?'],
    gpick: ['この文の文法はどれですか。', 'Welcher Grammatikpunkt steckt in diesem Satz?'],
    order: ['★に入るものはどれですか。', 'Welches Teil gehört an die Stelle ★?'],
    hear: ['聞いて、正しい意味を選んでください。', 'Hör zu: Was bedeutet der Satz?'],
    dialog: ['会話を聞いて、答えを選んでください。', 'Hör dir das Gespräch an und wähle die Antwort.'],
  };
  // Furigana-Schreibweise → HTML; __x__ = unterstrichen
  const jpHtml = (s) => JP.ruby(s || '').replace(/__(.+?)__/g, '<span class="exam-u">$1</span>');
  const listenText = (q) => (q.dialog ? q.dialog.map(([who, t]) => `<div><b>${esc(who)}:</b> <span lang="ja">${jpHtml(t)}</span></div>`).join('') : `<div lang="ja">${jpHtml(q.say || q.text || '')}</div>`);
  const isListen = (q) => q.part === 'listening';

  // Hören: Satz oder Gespräch nacheinander vorlesen; A und B mit zwei Stimmen, wenn das Gerät zwei japanische hat
  X.play = (q) => {
    if (!JP.canSpeak()) return;
    speechSynthesis.cancel();
    const voices = JP.voices().filter((v) => /^ja/i.test(v.lang));
    const first = JP.voice() || voices[0] || null;
    const second = voices.find((v) => !first || v.voiceURI !== first.voiceURI) || first;
    const lines = q.dialog ? q.dialog : [['', q.say || q.text]];
    const rate = (S.settings && S.settings.ttsRate) || 0.9;
    lines.forEach(([who, t]) => {
      const u = new SpeechSynthesisUtterance(JP.kana(t));
      u.lang = 'ja-JP';
      const v = who === 'B' ? second : first;
      if (v) u.voice = v;
      u.rate = rate;
      speechSynthesis.speak(u);
    });
  };

  const partBar = (run, pos) => {
    let i = 0;
    return `<div class="exam-parts">${run.parts.map((p) => {
      const from = i, to = i + p.qs.length;
      i = to;
      const done = run.answers.slice(from, to).filter((a) => a !== null).length;
      const cur = pos >= from && pos < to;
      const info = L.PART_INFO[p.part];
      return `<span class="exam-chip ${cls(p.part)}${cur ? ' cur' : ''}${done === p.qs.length ? ' done' : ''}"><b lang="ja">${info.jp}</b> ${cur ? `${pos - from + 1}/${p.qs.length}` : done === p.qs.length ? '✓' : `${done}/${p.qs.length}`}</span>`;
    }).join('')}</div>`;
  };
  const cls = (part) => ({ vocab: 'sec-vocab', grammar: 'sec-grammar', listening: 'sec-listen', kanji: 'sec-kanji' })[part];

  const questionHtml = (run, pos) => {
    const qs = L.flat(run), q = qs[pos], chosen = run.answers[pos];
    const [jpI, deI] = INSTR[q.kind] || ['', ''];
    const listen = isListen(q);
    const speak = JP.canSpeak();
    const body = listen
      ? `<div class="exam-listen"><button class="btn btn-sec exam-play" data-play>${icon('speak')} Anhören</button><span class="small muted">so oft du willst</span></div>
         ${q.prompt ? `<div class="exam-prompt" lang="ja">${jpHtml(q.prompt)}</div>` : ''}
         ${speak ? `<details class="exam-text-toggle"><summary class="small muted">Keine japanische Stimme? Text zeigen</summary><div class="exam-listen-text">${listenText(q)}</div></details>` : `<p class="small muted">Dieses Gerät kann nicht vorlesen – hier ist der Text:</p><div class="exam-listen-text">${listenText(q)}</div>`}`
      : `<div class="exam-prompt" lang="ja">${jpHtml(q.prompt)}</div>${['gpick', 'fill', 'gfill', 'order'].includes(q.kind) && q.de ?`<div class="small muted">${esc(q.de)}</div>` : ''}`;
    return `${partBar(run, pos)}
      <div class="card exam-card ${cls(q.part)}">
        <div class="exam-instr"><span lang="ja">${jpI}</span> <span class="small muted">${deI}</span><span class="exam-no small muted">Frage ${pos + 1} von ${qs.length}</span></div>
        ${body}
        <div class="exam-opts">${q.opts.map((o, i) => `<button class="exam-opt${chosen === i ? ' sel' : ''}" data-opt="${i}"><span class="exam-n">${i + 1}</span><span lang="ja">${jpHtml(o)}</span></button>`).join('')}</div>
      </div>
      <div class="row between exam-nav">
        <span class="row"><a class="btn" href="#/pruefung" title="Alles ist gespeichert – später geht es hier weiter">${icon('pause')} Pause – später weiter</a><button class="btn btn-ghost" data-discard title="Angefangene Prüfung verwerfen">Neu anfangen</button></span>
        <span class="row">${pos > 0 ? `<button class="btn" data-go="${pos - 1}">← Zurück</button>` : ''}${pos < qs.length - 1 ? `<button class="btn btn-sec" data-go="${pos + 1}">Weiter →</button>` : `<button class="btn btn-sec" data-finish>Abgeben</button>`}</span>
      </div>`;
  };

  // ---------- Ergebnis und Lösungen ----------
  const resultHtml = (key, last, sent) => {
    const sc = last.score, st = L.stage(key);
    const wrong = L.mistakes(last.run).filter((id) => S.items.has(id));
    return `<div class="card exam-result">
        <div class="exam-verdict ${sc.passed ? 'ok' : 'no'}"><span lang="ja">${sc.passed ? '合格' : '不合格'}</span> · ${sc.pct} %</div>
        <p class="small muted">${sc.passed ? `Bestanden – das Abzeichen steht jetzt bei ${esc(st.label)}.` : 'Diesmal nicht bestanden – du kannst gleich noch einmal.'} Bestanden heißt: gesamt mindestens ${L.PASS} % und jeder Teil mindestens ${L.PART_MIN} %.</p>
        <div class="exam-score">${sc.parts.map((p) => `<div class="${cls(p.part)}${p.pct < L.PART_MIN ? ' low' : ''}"><b lang="ja">${L.PART_INFO[p.part].jp}</b> ${L.PART_INFO[p.part].label}<span>${p.right}/${p.total}</span></div>`).join('')}</div>
        ${wrong.length && !sent ? `<div class="exam-back"><b>${wrong.length} ${wrong.length === 1 ? 'Eintrag' : 'Einträge'} mit Fehlern – zurück in die Lernschlange?</b>
            <div class="small muted">Wörter und Kanji kommen in die Lernschlange (heute fällig), Grammatik wird wieder „offen“.</div>
            <div class="row" style="margin-top:8px"><button class="btn btn-sec" data-back="yes">Ja, zurück</button><button class="btn" data-back="no">Nein</button></div></div>` : ''}
        <div class="row" style="margin-top:12px"><button class="btn" data-review>Fragen ansehen</button><a class="btn" href="#/pruefung">Alle Prüfungen</a><a class="btn" href="${href(key)}?neu=1">Noch einmal</a></div>
      </div><div data-review-list></div>`;
  };
  const entryHref = (id) => {
    const it = S.items.get(id);
    if (!it) return '';
    return it.type === 'kanji' ? `#/kanji/${encodeURIComponent(it.char)}` : it.type === 'grammar' ? `#/grammatik/${encodeURIComponent(id)}` : `#/vokabeln/${encodeURIComponent(id)}`;
  };
  const reviewHtml = (run) => L.flat(run).map((q, i) => {
    const a = run.answers[i], ok = a === q.a, link = q.ref ? entryHref(q.ref) : '';
    return `<div class="card exam-rev ${ok ? 'ok' : 'no'}"><div class="small muted">Frage ${i + 1} · ${L.PART_INFO[q.part].label}</div>
      ${isListen(q) ? `<div class="exam-listen-text">${listenText(q)}</div>${q.prompt ? `<div lang="ja">${jpHtml(q.prompt)}</div>` : ''}` : `<div lang="ja" class="exam-prompt sm">${jpHtml(q.prompt)}</div>`}${q.de ? `<div class="small muted">${esc(q.de)}</div>` : ''}
      <div>${ok ? '✓' : '✗'} ${a === null ? '<i class="muted">keine Antwort</i>' : `<span lang="ja">${jpHtml(q.opts[a])}</span>`}${ok ? '' : ` → richtig: <b lang="ja">${jpHtml(q.opts[q.a])}</b>`}</div>
      ${q.note ? `<div class="small muted">${esc(q.note)}</div>` : ''}${link ? `<a class="small" href="${link}">Eintrag öffnen ›</a>` : ''}</div>`;
  }).join('');

  // Fehler zurück: Vokabeln/Ausdrücke beide Richtungen und Kanji in die Lernschlange, Grammatik wieder „offen“ – rückgängig machbar
  X.sendBack = async (run) => {
    const ids = L.mistakes(run).filter((id) => S.items.has(id));
    const keys = [];
    ids.forEach((id) => { keys.push(id); const it = S.items.get(id); if (W.direct(it.type)) keys.push(W.id(id)); });
    const snap = App.srsSnap(keys);
    for (const id of ids) {
      const it = S.items.get(id);
      for (const [which, st, extra] of L.backOps(it, W.direct(it.type))) await App.setCheck(which === 'active' ? W.id(id) : id, st, extra || undefined);
    }
    App.undoToast(`${ids.length} ${ids.length === 1 ? 'Eintrag' : 'Einträge'} zurück in der Lernschlange`, snap, () => App.emit('srs'));
    App.emit('srs');
  };

  // ---------- Seite einer Prüfung ----------
  const seenItems = () => {
    const out = [];
    S.items.forEach((it) => { if (TYPES.includes(it.type) && it.char !== '々' && App.wordState(it) !== 'open') out.push(it); });
    return out;
  };

  App.route('/pruefung/:stage', async (view, p) => {
    const key = p.stage, st = L.stage(key);
    if (!st) { view.innerHTML = '<div class="card">Diese Prüfung gibt es nicht.</div>'; return; }
    const { query } = App.parseHash();
    view.innerHTML = `<div class="sec-practice exam ${App.furiClass()}"><div class="crumbs"><a href="#/ueben">Üben</a> › <a href="#/pruefung">Prüfungen</a> › ${esc(st.label)}</div>
      <div class="page-head"><div class="titles"><h1>${esc(st.label)} <span class="jp-title">試験</span></h1></div></div><div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    let state = await E.load();
    if (query.neu && !state.runs[key]) { history.replaceState(history.state, '', href(key)); }

    const draw = (html) => { stage.innerHTML = html; };
    const startScreen = () => {
      const s = X.status(key), n = L.PER_PART[st.kind] * 4;
      if (s.state === 'empty') return draw(`<div class="card exam-start"><p>${st.level ? `Für diese Prüfung brauchst du das Paket JLPT ${esc(st.level)} (unter Pakete).` : 'Für diese Stufe gibt es noch keine Einträge.'}</p></div>`);
      const parts = L.PARTS.map((pt) => `<span class="exam-chip ${cls(pt)}"><b lang="ja">${L.PART_INFO[pt].jp}</b> ${L.PART_INFO[pt].label}</span>`).join('');
      const best = s.best ? `<p>Bestes Ergebnis: ${s.best.passed ? X.badge(s.best) : `${s.best.pct} % (nicht bestanden)`} · ${fmtDate(s.best.date)}</p>` : '';
      const last = state.last && state.last.stage === key ? '<button class="btn" data-last>Letzte Auswertung ansehen</button>' : '';
      if (s.state === 'locked') {
        return draw(`<div class="card exam-start"><p><b>Noch gesperrt</b> – frei ab ${L.UNLOCK} % „kann ich“ (jetzt ${s.pct} %).</p>
          <p class="small muted">Lerne die Einträge dieser Stufe weiter; sobald genug sitzt, erscheint hier der ${st.kind === 'mini' ? 'Minitest' : 'Prüfung'}-Knopf.</p>${best}<div class="row">${last}</div></div>`);
      }
      draw(`<div class="card exam-start"><div class="exam-parts">${parts}</div>
        <p>${st.kind === 'mini' ? 'Minitest' : 'Große Prüfung'} mit bis zu ${n} Fragen, je Frage 4 Antworten. Keine Uhr – du kannst jederzeit pausieren, jede Antwort wird sofort gespeichert.</p>
        <p class="small muted">Bestanden ab ${L.PASS} % gesamt und mindestens ${L.PART_MIN} % in jedem Teil. Jetzt: ${s.pct} % „kann ich“.</p>${best}
        <div class="row"><button class="btn btn-sec" data-start>試 ${st.kind === 'mini' ? 'Minitest' : 'Prüfung'} starten</button>${last}</div></div>`);
    };
    const runScreen = () => {
      const run = state.runs[key];
      const pos = Math.min(run.pos, run.answers.length - 1);
      draw(questionHtml(run, pos));
      stage.dataset.pos = pos;
      // beim ersten Anzeigen einer Hörfrage gleich abspielen
      const q = L.flat(run)[pos];
      if (isListen(q) && run.answers[pos] === null) setTimeout(() => X.play(q), 250);
    };
    const showResult = (sent) => {
      draw(resultHtml(key, state.last, sent));
    };
    const render = () => (state.runs[key] ? runScreen() : startScreen());

    let finishing = false; // Doppelklick auf „Abgeben“ wertet nur einmal aus
    const finish = async () => {
      const run = state.runs[key];
      if (!run || finishing) return;
      const open = run.answers.filter((a) => a === null).length;
      if (open && !(await App.confirm(`${open} ${open === 1 ? 'Frage ist' : 'Fragen sind'} noch ohne Antwort und zählen als falsch. Trotzdem abgeben?`, { ok: 'Abgeben', danger: false, title: 'Prüfung abgeben?' }))) return;
      finishing = true;
      state = await E.finish(key, L.score(run));
      finishing = false;
      if (state.last && state.last.stage === key) showResult(false);
    };

    stage.onclick = async (e) => {
      const t = e.target.closest('button, a');
      if (!t || !stage.contains(t)) return;
      if (t.dataset.start !== undefined) {
        const run = L.build(key, seenItems(), window.EXAM_BANK || [], state.seen[key] || [], Date.now() % 2147483647);
        if (!run.parts.length) { App.toast('Für diese Stufe gibt es noch nicht genug Einträge mit Lernstand.'); return; }
        state = await E.start(key, run);
        render();
      } else if (t.dataset.opt !== undefined) {
        // gleich markieren, dann speichern; die Frage bleibt stehen, bis man „Weiter“ drückt
        const pos = +stage.dataset.pos;
        stage.querySelectorAll('.exam-opt').forEach((b) => b.classList.toggle('sel', b === t));
        state = await E.answer(key, pos, +t.dataset.opt);
        if (t.isConnected && state.runs[key]) stage.querySelector('.exam-parts').outerHTML = partBar(state.runs[key], pos);
      } else if (t.dataset.go !== undefined) {
        state = await E.goto(key, +t.dataset.go);
        runScreen();
      } else if (t.dataset.finish !== undefined) {
        await finish();
      } else if (t.dataset.play !== undefined) {
        X.play(L.flat(state.runs[key])[+stage.dataset.pos]);
      } else if (t.dataset.back) {
        if (t.dataset.back === 'yes') await X.sendBack(state.last.run);
        showResult(true);
      } else if (t.dataset.review !== undefined) {
        const box = stage.querySelector('[data-review-list]');
        box.innerHTML = box.innerHTML ? '' : reviewHtml(state.last.run);
      } else if (t.dataset.last !== undefined) {
        showResult(true);
        stage.querySelector('[data-review-list]').innerHTML = reviewHtml(state.last.run);
      } else if (t.dataset.discard !== undefined) {
        if (await App.confirm('Die angefangene Prüfung wird verworfen.', { ok: 'Verwerfen', title: 'Neu anfangen?' })) { state = await E.discard(key); render(); }
      }
    };
    // Tasten: 1–4 wählen, → / Enter weiter, ← zurück
    const onKey = (e) => {
      if (!stage.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (!state.runs[key] || e.ctrlKey || e.metaKey || e.altKey || /input|textarea/i.test((e.target && e.target.tagName) || '')) return;
      const b = (sel) => stage.querySelector(sel);
      if (/^[1-4]$/.test(e.key)) { const o = b(`[data-opt="${+e.key - 1}"]`); if (o) { e.preventDefault(); o.click(); } }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { const n = b(`[data-go="${+stage.dataset.pos + 1}"]`) || (e.key === 'Enter' ? b('[data-finish]') : null); if (n) { e.preventDefault(); n.click(); } }
      else if (e.key === 'ArrowLeft') { const n = b(`[data-go="${+stage.dataset.pos - 1}"]`); if (n) { e.preventDefault(); n.click(); } }
    };
    document.addEventListener('keydown', onKey);
    render();
  });

  // ---------- Übersicht aller Prüfungen ----------
  App.route('/pruefung', (view) => {
    const row = (st) => {
      const s = X.status(st.key);
      if (s.state === 'empty') return '';
      const pill = s.state === 'running' ? `<span class="badge">angefangen ${answered(s.run)}/${s.run.answers.length}</span>`
        : s.state === 'passed' ? X.badge(s.best)
          : s.state === 'open' ? '<span class="badge count">bereit</span>'
            : `<span class="badge" title="Frei ab ${L.UNLOCK} %">gesperrt · ${s.pct} %</span>`;
      return `<a class="exam-row${s.state === 'locked' ? ' locked' : ''}" href="${href(st.key)}"><span>${esc(st.kind === 'mini' ? `Lektion ${st.lesson}` : st.label)}<span class="small muted"> · ${st.kind === 'mini' ? 'Minitest' : 'große Prüfung'}</span></span>${pill}</a>`;
    };
    const genki = L.STAGES.filter((st) => st.src).map(row).join('');
    const jlpt = L.STAGES.filter((st) => st.level).map(row).join('');
    view.innerHTML = `<div class="sec-practice exam"><div class="crumbs"><a href="#/ueben">Üben</a> › Prüfungen</div>
      <div class="page-head"><div class="titles"><h1>Prüfungen <span class="jp-title">試験</span></h1><p>Wie ein kleiner JLPT: Vokabeln, Grammatik, Hören und Kanji. Frei ab ${L.UNLOCK} % „kann ich“, bestanden ab ${L.PASS} %.</p></div></div>
      ${genki ? `<div class="section-title">Genki I</div><div class="card exam-list">${genki}</div>` : ''}
      ${jlpt ? `<div class="section-title">JLPT</div><div class="card exam-list">${jlpt}</div>` : ''}
      ${!genki && !jlpt ? '<div class="card">Noch keine Stufe mit Einträgen – installiere Genki oder ein JLPT-Paket.</div>' : ''}</div>`;
  });
})(window.App);
