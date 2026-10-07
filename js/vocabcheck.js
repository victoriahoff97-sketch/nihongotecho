/* Nihongo Techō – Vokabel-Lernstand: Einstufung („Kenne ich das?“) und Import */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;
  const DAY = 864e5;

  // ---------- Status ----------
  // unchecked = noch nie geprüft · learn = im Lernstapel / wird gelernt · known = kann ich schon
  // „Kann ich“ ist, was so eingestuft wurde – oder was mit den Karten bis 3 Wochen Abstand gelernt ist (springt von allein um).
  // Grammatik, die mit einer Unterrichtsstunde verknüpft ist, gilt ohne Einstufung als „Lernstapel“.
  const autoLearn = (id) => { const it = S.items.get(id); return !!it && it.type === 'grammar' && App.sessionsFor(id).length > 0; };
  // Eingestuft werden nur Vokabeln/Kanji aus Paketen (Genki, JLPT, Kanji) und aus importierten Listen.
  // Eigene Einträge (selbst angelegt, aus Satzerkennung/Suche übernommen) sind nie „ungeprüft“ – sie sind direkt im Lernstapel.
  App.needsCheck = (it) => !!it && !((it.type === 'vocab' || it.type === 'kanji') && !it._seed && !it._pack && !it.imported);
  const ownWord = (id) => { const it = S.items.get(id); return !!it && !App.needsCheck(it); };
  App.statusChoices = (it) => Object.entries(App.STATUS).filter(([k]) => k !== 'unchecked' || App.needsCheck(it));
  App.vocabStatus = (id) => {
    const s = S.srs.get(id);
    if (!s) return autoLearn(id) || ownWord(id) ? 'learn' : 'unchecked';
    if (s.check === 'unchecked') return ownWord(id) ? 'learn' : 'unchecked';
    return App.furiLogic.readKnown(S.srs, id) ? 'known' : 'learn';
  };
  App.STATUS = {
    unchecked: { label: 'Ungeprüft', color: 'var(--muted)', dot: '○' },
    learn: { label: 'Lernstapel', color: 'var(--ai)', dot: '◐' },
    known: { label: 'Kann ich', color: 'var(--matcha)', dot: '●' },
  };
  App.setCheck = async (id, st) => {
    const now = Date.now();
    let s;
    if (st === 'unchecked') {
      if (!autoLearn(id)) { S.srs.delete(id); await App.db.del('srs', id); return; }
      // sonst würde die Unterrichts-Verknüpfung den Punkt sofort wieder in den Lernstapel holen
      s = { id, check: 'unchecked', ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now, last: 0, checked: now };
      S.srs.set(id, s);
      await App.db.put('srs', s);
      return;
    }
    if (st === 'known') {
      // gilt als gelernt; kommt nach 3–6 Wochen einmal zur Kontrolle wieder
      const ivl = 21 + Math.round(Math.random() * 21);
      s = { id, check: 'known', ivl, ease: 2.6, reps: 3, lapses: 0, due: now + ivl * DAY, last: now, checked: now };
    } else {
      s = { id, check: 'learn', ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now, last: 0, checked: now };
    }
    S.srs.set(id, s);
    await App.db.put('srs', s);
  };
  App.vocabCounts = (items = App.itemsOf('vocab')) => {
    const c = { unchecked: 0, learn: 0, known: 0, total: items.length };
    items.forEach((v) => c[App.vocabStatus(v.id)]++);
    return c;
  };
  App.statusBadge = (id) => { const st = App.STATUS[App.vocabStatus(id)]; return `<span class="badge vst" style="color:${st.color}" title="Lernstand">${st.dot} ${st.label}</span>`; };

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
  App.route('/ueben/einstufen', (view, p, q) => {
    const type = q.type === 'kanji' ? 'kanji' : 'vocab';
    const isK = type === 'kanji';
    const sec = App.SECTIONS[type];
    const all = App.itemsOf(type).filter((i) => i.char !== '々');
    let items = all;
    if (q.src) items = items.filter((i) => i.source === q.src);
    if (q.l) items = items.filter((i) => String(i.lesson) === q.l);
    if (q.mark) items = items.filter((i) => App.hasMark(i, q.mark));
    if (q.lvl) items = items.filter((i) => App.levelMatch(i, q.lvl));
    const c = App.vocabCounts(items);
    const cAll = App.vocabCounts(all);
    const batch = +S.settings.checkBatch || 15;
    const pct = (n) => (c.total ? (n / c.total) * 100 : 0);
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="crumbs"><a href="#/ueben">Üben</a> › Einstufen</div>
      <div class="page-head"><div class="titles"><h1>Einstufen <span class="jp-title">確認</span></h1>
        <p>Was kannst du schon? Geh deine ${isK ? 'Kanji' : 'Vokabeln'} in Runden durch – danach landet im Lernstapel nur, was du wirklich noch lernen musst.</p></div>
        <div class="seg">${[['vocab', 'Vokabeln'], ['kanji', 'Kanji']].map(([k, l]) => `<button class="${type === k ? 'on' : ''}" data-q-type="${k === 'vocab' ? '' : k}">${l}</button>`).join('')}</div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row between"><div class="row" style="gap:18px">
          <span><b style="font-size:24px;color:var(--muted)">${c.unchecked}</b> ungeprüft</span>
          <span><b style="font-size:24px;color:var(--ai)">${c.learn}</b> im Lernstapel</span>
          <span><b style="font-size:24px;color:var(--matcha)">${c.known}</b> kann ich</span></div>
          <span class="small muted">${q.src || q.l ? `Auswahl · insgesamt ${cAll.unchecked} ungeprüft` : ''}</span></div>
        <div class="progress" style="display:flex;height:10px"><i style="width:${pct(c.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pct(c.learn)}%;background:var(--ai);border-radius:0"></i></div>
        <div class="row">${App.lessonSelect(all.filter((i) => !q.src || i.source === q.src), q.l)}
          <label class="row small" style="gap:8px"><b>${isK ? 'Kanji' : 'Wörter'} pro Runde</b><input class="input" type="number" min="3" max="100" value="${batch}" data-batch style="width:90px"></label>
          <button class="btn btn-primary" data-go ${c.unchecked ? '' : 'disabled'}>${icon('play')} Runde starten (${Math.min(batch, c.unchecked)})</button>
          ${!c.unchecked && c.total ? '<span class="verdict ok">✓ Alles in dieser Auswahl ist eingestuft</span>' : ''}</div>
        ${App.sourceChips(all, q.src)}
        ${App.levelChips(q.lvl)}
        <div class="small muted">Tipp: Tippe auf ${isK ? 'ein Kanji, um Bedeutung & Lesungen' : 'ein Wort, um Lesung & Übersetzung'} zu sehen. „Kann ich“ = gilt als gelernt (kommt nach einigen Wochen einmal zur Kontrolle). „Lernen“ = kommt in deine Karteikarten.${isK ? ' Bei Kanji heißt „Kann ich“: kann ich lesen – fürs Schreiben kommt es danach im Kanji-Quiz dran.' : ''}</div>
      </div></div>
      <div data-stage style="margin-top:18px"></div></div>`;
    const bi = view.querySelector('[data-batch]');
    bi.addEventListener('change', async () => { await App.saveSettings({ checkBatch: App.clamp(+bi.value || 15, 3, 100) }); });
    const stage = view.querySelector('[data-stage]');
    const go = () => {
      const n = App.clamp(+bi.value || 15, 3, 100);
      const list = items.filter((v) => App.vocabStatus(v.id) === 'unchecked').sort(order).slice(0, n);
      if (!list.length) return;
      view.querySelector('[data-setup]').hidden = true;
      runBatch(stage, list, () => App.render(), type);
    };
    view.querySelector('[data-go]').onclick = go;
    if (q.auto) go();
  });

  function runBatch(stage, list, onDone, type = 'vocab') {
    const decided = new Map();
    const isK = type === 'kanji';
    const answer = (v) => {
      if (isK) return `<b>${App.meaningHtml(v)}</b>${App.levelBadge(v)}<div lang="ja" class="small muted">${(v.on || []).length ? 'On: ' + esc(v.on.join('、')) : ''}${(v.kun || []).length ? ' · Kun: ' + esc(v.kun.join('、')) : ''}</div>${(v.words || [])[0] ? `<div class="small muted" lang="ja">${JP.ruby(v.words[0].jp)} – ${App.meaningHtml(v.words[0])}</div>` : ''}`;
      const ex = v.examples && v.examples[0];
      return `<div lang="ja" class="muted">${v.kanji ? esc(v.kana) : ''}</div><b>${App.meaningHtml(v)}</b>${App.levelBadge(v)}${ex ? `<div class="small muted" lang="ja">${JP.ruby(ex.jp)}</div>` : ''}`;
    };
    const row = (v, i) => {
      const d = decided.get(v.id);
      return `<div class="check-row ${d ? 'done ' + d : ''}" data-i="${i}">
        <div class="check-word" data-reveal lang="ja" ${isK ? 'style="font-family:var(--font-kanji);font-size:48px"' : ''}>${isK ? esc(v.char) : App.askHtml(v)}</div>
        <div class="check-ans" data-reveal>${d || v._shown ? answer(v) : '<span class="muted small">antippen zum Aufdecken</span>'}</div>
        <div class="check-btns">${d ? `<span class="verdict ${d === 'known' ? 'ok' : ''}" style="${d === 'learn' ? 'background:var(--ai-soft);color:var(--ai)' : ''}">${d === 'known' ? '✓ Kann ich' : '＋ Lernstapel'}</span><button class="btn btn-sm btn-ghost" data-undo>ändern</button>`
          : `<button class="btn btn-sm check-known" data-set="known">${icon('check')} Kann ich</button><button class="btn btn-sm check-learn" data-set="learn">${icon('plus')} Lernen</button>`}</div></div>`;
    };
    const draw = () => {
      const left = list.filter((v) => !decided.has(v.id)).length;
      const k = Array.from(decided.values()).filter((x) => x === 'known').length;
      // „Rest“-Knöpfe über und unter der Liste, damit man am Ende nicht zurückscrollen muss
      const rest = left ? `<button class="btn btn-sm" data-all="known">Rest: kann ich</button><button class="btn btn-sm" data-all="learn">Rest: lernen</button>` : '';
      stage.innerHTML = `<div class="row between" style="margin-bottom:10px"><b>Runde: ${list.length - left} / ${list.length} eingestuft</b>
        <div class="row">${rest}</div></div>
        <div class="check-list">${list.map(row).join('')}</div>
        ${left ? `<div class="row" style="justify-content:flex-end;margin-top:10px">${rest}</div>` : ''}
        ${!left ? `<div class="card row between" style="margin-top:16px"><div><b>Runde geschafft!</b> ${k} kannst du schon, ${list.length - k} kommen in den Lernstapel.</div>
          <div class="row"><a class="btn" href="#/ueben/karten${isK ? '?type=kanji' : ''}">${icon('practice')} Lernstapel üben</a><button class="btn btn-primary" data-next>${icon('next')} Nächste Runde</button></div></div>` : ''}`;
    };
    stage.onclick = async (e) => {
      const r = e.target.closest('.check-row');
      const all = e.target.closest('[data-all]');
      if (all) { for (const v of list) if (!decided.has(v.id)) { decided.set(v.id, all.dataset.all); await App.setCheck(v.id, all.dataset.all); } draw(); return; }
      if (e.target.closest('[data-next]')) { onDone(); return; }
      if (!r) return;
      const v = list[+r.dataset.i];
      const set = e.target.closest('[data-set]');
      if (set) { decided.set(v.id, set.dataset.set); await App.setCheck(v.id, set.dataset.set); draw(); return; }
      if (e.target.closest('[data-undo]')) { decided.delete(v.id); await App.setCheck(v.id, 'unchecked'); draw(); return; }
      if (e.target.closest('[data-reveal]')) { Object.defineProperty(v, '_shown', { value: !v._shown, configurable: true, writable: true }); draw(); }
    };
    list.forEach((v) => { if (v._shown) v._shown = false; });
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
  const splitJp = (raw) => {
    let s = clean(raw);
    if (!s) return { kanji: '', kana: '' };
    if (/\[[^\]]+\]/.test(s)) { s = ankiFuri(s); return { kanji: JP.hasKanji(s) ? JP.plain(s).replace(/\s/g, '') : '', kana: JP.kana(s).replace(/\s/g, '') }; }
    const m = s.match(/^(.+?)\s*[（(【]\s*([぀-ヿー・\s]+)\s*[）)】]\s*$/);
    if (m) return { kanji: m[1].trim(), kana: m[2].replace(/\s/g, '') };
    const m2 = s.match(/^([^\s]+)\s+([぀-ヿー]+)$/);
    if (m2 && JP.hasKanji(m2[1])) return { kanji: m2[1], kana: m2[2] };
    return JP.hasKanji(s) ? { kanji: s, kana: '' } : { kanji: '', kana: s };
  };
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
    // Kopfzeile: erste Zeile ohne Japanisch, die anderen mit
    const header = rows.length > 1 && rows[0].length >= 2 && !rows[0].some(isJp) && rows.slice(1, 6).some((r) => r.some(isJp));
    const body = header ? rows.slice(1) : rows;
    const map = [];
    let deUsed = false, exjp = -1;
    for (let c = 0; c < ncol; c++) {
      const vals = body.slice(0, 40).map((r) => clean(r[c] || '')).filter(Boolean);
      const h = header ? (rows[0][c] || '').toLowerCase() : '';
      const jpShare = vals.filter(isJp).length / Math.max(1, vals.length);
      const avgLen = vals.reduce((a, v) => a + v.length, 0) / Math.max(1, vals.length);
      let f = 'skip';
      if (/lektion|lesson|kapitel/.test(h)) f = 'lesson';
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
  const buildItems = (st, map, opts) => {
    const existing = new Set(App.itemsOf('vocab').map(App.vocabKey));
    const seen = new Set();
    const out = { items: [], dup: 0, bad: 0, noReading: 0 };
    for (const r of st.rows) {
      const get = (f) => { const i = map.indexOf(f); return i >= 0 ? clean(r[i]) : ''; };
      let { kanji, kana } = get('jp') ? splitJp(get('jp')) : { kanji: get('kanji'), kana: get('kana') };
      if (map.includes('jp') && get('kanji')) kanji = get('kanji');
      if (map.includes('jp') && get('kana')) kana = get('kana');
      if (kana && JP.looksRomaji(kana)) kana = JP.romaji(kana);
      const de = get('de');
      if ((!kanji && !kana) || !de) { out.bad++; continue; }
      if (!kana) { out.noReading++; kana = kanji; }
      if (kanji === kana) kanji = '';
      const key = App.vocabKey({ kanji, kana });
      if (existing.has(key) || seen.has(key)) { out.dup++; continue; }
      seen.add(key);
      const it = { id: App.uid('v'), type: 'vocab', kana, kanji, de, pos: guessPos(kana, de), cat: [], source: opts.source, lesson: get('lesson') || opts.lesson, tags: opts.tags.concat(get('tags') ? get('tags').split(/[\s,]+/).map((t) => t.toLowerCase()).filter(Boolean) : []), level: '', examples: [], imported: Date.now() };
      it.level = App.levelFor(it); // JLPT-Niveau aus dem Index (Import speichert direkt, ohne saveItem)
      if (it.lesson !== '' && !isNaN(+it.lesson)) it.lesson = +it.lesson;
      const exjp = get('exjp');
      if (exjp) { const n = /\[/.test(exjp) ? ankiFuri(exjp) : exjp; it.examples.push({ jp: n, de: get('exde') }); }
      out.items.push(it);
    }
    return out;
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
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = tc.items.filter((i) => i.str && i.str.trim()).map((i) => ({
        // NFKC: Kangxi-Radikale (⾷) → normale Kanji (食), Halbbreiten-Katakana → normale Katakana
        s: i.str.normalize('NFKC'), x: i.transform[4], y: i.transform[5], w: i.width || 0, h: Math.abs(i.transform[3]) || i.height || 10,
      }));
      chars += items.reduce((a, i) => a + i.s.length, 0);
      const pageLines = [];
      for (const half of [items]) {
        // nach Zeilen gruppieren (gleiche Höhe auf der Seite)
        const rows = [];
        half.sort((a, b) => b.y - a.y || a.x - b.x).forEach((it) => {
          const r = rows.find((row) => Math.abs(row.y - it.y) < Math.max(3, Math.min(row.h, it.h) * 0.5));
          if (r) r.items.push(it); else rows.push({ y: it.y, h: it.h, items: [it] });
        });
        rows.sort((a, b) => b.y - a.y);
        for (const r of rows) {
          r.items.sort((a, b) => a.x - b.x);
          let s = '';
          r.items.forEach((it, k) => {
            if (k) {
              const prev = r.items[k - 1];
              const gap = it.x - (prev.x + prev.w);
              const latin = /[A-Za-zÄÖÜäöüß0-9]$/.test(prev.s) && /^[A-Za-zÄÖÜäöüß0-9]/.test(it.s);
              if (gap > Math.max(prev.h, it.h) * 1.1) s += '\t';
              else if (latin && gap > prev.h * 0.12) s += ' ';
            }
            s += it.s;
          });
          s = s.replace(/[ 　]{2,}/g, '\t').replace(/\t{2,}/g, '\t').trim();
          if (s) pageLines.push(s.split('\t'));
        }
      }
      // Zwei Wortlisten nebeneinander? (Muster wiederholt sich: 日本語 | かな | Deutsch | 日本語 | かな | Deutsch)
      const kind = (c) => (/[぀-ヿ㐀-鿿]/.test(c) ? 'j' : /[A-Za-zÄÖÜäöüß]/.test(c) ? 'l' : 'o');
      const isDouble = (cells) => {
        if (cells.length < 4 || cells.length % 2) return false;
        const h = cells.length / 2;
        return cells.slice(0, h).map(kind).join('') === cells.slice(h).map(kind).join('') && cells.slice(0, h).some((c) => kind(c) === 'j');
      };
      const multi = pageLines.filter((c) => c.length >= 4);
      const split = twoCols === true || (twoCols === 'auto' && multi.length >= 2 && multi.filter(isDouble).length >= multi.length * 0.6);
      if (split) {
        const left = [], right = [];
        pageLines.forEach((c) => { if (c.length >= 4 && c.length % 2 === 0) { left.push(c.slice(0, c.length / 2)); right.push(c.slice(c.length / 2)); } else left.push(c); });
        left.concat(right).forEach((c) => lines.push(c.join('\t')));
        splitPages++;
      } else pageLines.forEach((c) => lines.push(c.join('\t')));
    }
    return { text: lines.join('\n'), pages: list.length, total: pdf.numPages, chars, splitPages };
  };

  App.importVocab = ({ fileId } = {}) => {
    const body = document.createElement('div');
    body.className = 'sec-vocab';
    const libPdfs = Array.from(S.files.values()).filter((f) => App.fileKind(f) === 'pdf').sort((a, b) => b.created - a.created);
    body.innerHTML = `<div class="stack" data-step1>
        <p class="muted" style="margin:0">Füge eine Wortliste ein oder wähle eine Datei (auch PDF). Eine Zeile pro Wort, Spalten getrennt durch Tab, Semikolon, Komma, „=“ oder „ - “.</p>
        <div class="row"><label class="btn">${icon('upload')} Datei wählen (PDF, .txt, .csv)<input type="file" accept=".pdf,application/pdf,.txt,.csv,.tsv,text/plain,text/csv" hidden data-file></label>
          ${libPdfs.length ? `<select class="input" data-libpdf style="max-width:320px"><option value="">… oder PDF aus der Bibliothek</option>${libPdfs.map((f) => `<option value="${f.id}" ${f.id === fileId ? 'selected' : ''}>${esc(f.name)}${f.source ? ' · ' + esc(f.source) : ''}${f.lesson !== '' && f.lesson != null ? ' L' + esc(f.lesson) : ''}</option>`).join('')}</select>` : ''}</div>
        <div class="card" data-pdfopts hidden style="box-shadow:none;background:var(--matcha-soft);border-color:transparent;padding:12px 16px"><div class="row">
          <b data-pdfname></b><span class="small muted" data-pdfinfo></span><span class="grow"></span>
          <label class="row small" style="gap:6px">Seiten <input class="input" data-pages placeholder="alle – z. B. 3-5, 8" style="width:150px;height:38px"></label>
          <select class="input" data-twocols style="height:38px;width:auto"><option value="auto">Listen: automatisch</option><option value="false">eine Liste pro Seite</option><option value="true">zwei Listen nebeneinander</option></select>
          <button class="btn btn-sm" data-reread>${icon('replay')} Neu auslesen</button></div></div>
        <textarea class="input jp-in" rows="9" data-text placeholder="食べる;たべる;essen&#10;新聞 (しんぶん) = Zeitung&#10;がっこう	die Schule&#10;日本[にほん]語[ご]	Japanisch"></textarea>
        <span class="small muted">Anki: <i>Durchsuchen › Notizen exportieren › „Notizen als Klartext (.txt)“</i>. Excel/Numbers: als CSV speichern. PDF: Der ausgelesene Text erscheint oben – du kannst ihn vor dem Weiter noch bearbeiten.</span>
      </div><div data-step2 hidden></div>`;
    const md = App.modal({ title: 'Vokabeln importieren', body, wide: true, foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-next disabled>Weiter</button>' });
    const ta = body.querySelector('[data-text]');
    const nextB = md.el.querySelector('[data-next]');
    md.el.querySelector('[data-no]').onclick = md.close;
    ta.addEventListener('input', () => { nextB.disabled = !ta.value.trim(); });
    let pdfBlob = null;
    const opts = body.querySelector('[data-pdfopts]');
    const readPdf = async () => {
      if (!pdfBlob) return;
      const info = body.querySelector('[data-pdfinfo]');
      info.textContent = 'wird ausgelesen …';
      nextB.disabled = true;
      try {
        const r = await App.pdfToText(pdfBlob, { pages: body.querySelector('[data-pages]').value, twoCols: ({ auto: 'auto', true: true, false: false })[body.querySelector('[data-twocols]').value] });
        if (!r.chars) {
          info.textContent = '';
          ta.value = '';
          App.modal({ title: 'Kein Text in dieser PDF', body: '<p>Die PDF enthält nur Bilder (z. B. eingescannte Buchseiten) – daraus kann die App keinen Text lesen.</p><p class="muted">Tipp: In der Microsoft-Fotos-App oder OneNote lässt sich Text aus Bildern kopieren („Text kopieren“). Den kopierten Text hier einfügen.</p>' });
          return;
        }
        ta.value = r.text;
        info.textContent = `${r.pages} von ${r.total} Seiten gelesen · ${r.text.split('\n').length} Zeilen${r.splitPages ? ` · auf ${r.splitPages} Seite(n) zwei Listen nebeneinander erkannt` : ''}`;
        nextB.disabled = !ta.value.trim();
      } catch (er) { info.textContent = 'Fehler beim Lesen: ' + er.message; }
    };
    const usePdf = (blob, name, meta = {}) => { pdfBlob = blob; body.dataset.fname = name; body.dataset.src = meta.source || ''; body.dataset.lesson = meta.lesson ?? ''; opts.hidden = false; body.querySelector('[data-pdfname]').textContent = name; readPdf(); };
    body.querySelector('[data-file]').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) return usePdf(f, f.name);
      pdfBlob = null; opts.hidden = true;
      ta.value = await f.text(); nextB.disabled = false; body.dataset.fname = f.name;
    };
    const lib = body.querySelector('[data-libpdf]');
    if (lib) lib.onchange = async () => { if (lib.value) { const f = S.files.get(lib.value); usePdf(await App.fileBlob(f.id), f.name, f); } };
    if (lib && fileId) lib.onchange();
    body.querySelector('[data-reread]').onclick = readPdf;
    body.querySelector('[data-twocols]').onchange = readPdf;
    body.querySelector('[data-pages]').addEventListener('keydown', (e) => { if (e.key === 'Enter') readPdf(); });
    let st = null;
    const step2 = () => {
      st = detect(ta.value);
      if (!st.rows.length) return App.toast('Keine Zeilen erkannt');
      const s2 = body.querySelector('[data-step2]');
      body.querySelector('[data-step1]').hidden = true;
      s2.hidden = false;
      const defSrc = body.dataset.src || (/anki/i.test(body.dataset.fname || '') ? 'Anki' : (App.lsGet('importSource') || 'Anki'));
      s2.innerHTML = `<div class="stack">
        <div class="small muted">${st.rows.length} Zeilen erkannt · Trennzeichen: <b>${esc(st.delim === '\t' ? 'Tab' : st.delim.trim() || st.delim)}</b>${st.header ? ' · erste Zeile ist eine Kopfzeile' : ''}. Prüfe die Spalten-Zuordnung:</div>
        <div style="overflow:auto"><table class="map-table"><thead><tr>${Array.from({ length: st.ncol }, (_, c) => `<th><select class="input" data-col="${c}" style="min-width:170px">${FIELDS.map(([k, l]) => `<option value="${k}" ${st.map[c] === k ? 'selected' : ''}>${l}</option>`).join('')}</select>${st.headRow ? `<div class="small" style="margin-top:4px;text-transform:none">${esc(st.headRow[c] || '')}</div>` : ''}</th>`).join('')}</tr></thead>
          <tbody>${st.rows.slice(0, 5).map((r) => `<tr>${Array.from({ length: st.ncol }, (_, c) => `<td lang="ja" class="small">${esc(clean(r[c] || '').slice(0, 60))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="section-title" style="margin:6px 0">Vorschau</div><div data-prev></div>
        <div class="form"><div class="three"><div class="field"><label>Quelle</label><select class="input" data-src>${App.sourceOptions(defSrc, false)}</select></div>
          <div class="field"><label>Lektion <small>falls keine Spalte</small></label><input class="input" data-lesson value="${esc(body.dataset.lesson || '')}"></div>
          <div class="field"><label>Schlagwörter</label><input class="input" data-tags placeholder="z. B. import"></div></div>
          <div class="field"><label>Lernstand der neuen Wörter</label><div class="seg" data-st><button class="on" data-v="unchecked">Ungeprüft – erst einstufen (empfohlen)</button><button data-v="learn">Direkt in den Lernstapel</button><button data-v="known">Kann ich schon</button></div></div></div></div>`;
      const prev = () => {
        const map = $$('[data-col]', s2).map((x) => x.value);
        const r = buildItems(st, map, { source: '', lesson: '', tags: [] });
        s2.querySelector('[data-prev]').innerHTML = `<div class="row small" style="margin-bottom:8px"><span class="badge" style="background:var(--matcha-soft);color:var(--matcha)">${r.items.length} neu</span>${r.dup ? `<span class="badge">${r.dup} schon vorhanden – werden übersprungen</span>` : ''}${r.bad ? `<span class="badge" style="background:var(--shu-soft);color:var(--shu)">${r.bad} ohne Japanisch oder Deutsch</span>` : ''}${r.noReading ? `<span class="badge">${r.noReading} ohne Lesung</span>` : ''}</div>
          <div class="list">${r.items.slice(0, 6).map((v) => `<div class="list-row" style="grid-template-columns:1fr 1fr 1.5fr"><span class="k" lang="ja">${JP.wordRuby(v)}</span><span>${App.meaningHtml(v)}</span><span class="small muted" lang="ja">${v.examples[0] ? JP.ruby(v.examples[0].jp) : ''}</span></div>`).join('') || '<div class="list-row">Nichts zu importieren – Zuordnung prüfen.</div>'}</div>`;
        nextB.disabled = !r.items.length;
        nextB.innerHTML = `${icon('download')} ${r.items.length} importieren`;
      };
      s2.addEventListener('change', (e) => { if (e.target.matches('[data-col]')) prev(); });
      s2.querySelector('[data-st]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) $$('[data-v]', s2).forEach((x) => x.classList.toggle('on', x === b)); });
      prev();
      nextB.onclick = doImport;
    };
    const doImport = async () => {
      const s2 = body.querySelector('[data-step2]');
      const map = $$('[data-col]', s2).map((x) => x.value);
      const source = s2.querySelector('[data-src]').value;
      App.lsSet('importSource', source);
      const tags = s2.querySelector('[data-tags]').value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      const r = buildItems(st, map, { source, lesson: s2.querySelector('[data-lesson]').value.trim(), tags });
      const status = s2.querySelector('[data-st] .on').dataset.v;
      nextB.disabled = true; nextB.textContent = 'Importiere …';
      const now = Date.now();
      r.items.forEach((it, i) => { it.created = now + i; it.updated = now + i; S.items.set(it.id, it); });
      await App.db.putMany('items', r.items);
      if (status !== 'unchecked') for (const it of r.items) await App.setCheck(it.id, status);
      md.close();
      App.emit('items');
      App.toast(`${r.items.length} Vokabeln importiert`, status === 'unchecked' ? { label: 'Jetzt einstufen', fn: () => App.go('#/ueben/einstufen?src=' + encodeURIComponent(source)) } : null);
    };
    nextB.onclick = step2;
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-action="import-vocab"]')) App.importVocab(); });
})(window.App);
