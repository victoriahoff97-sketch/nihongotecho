/* Nihongo Techō – Sätze aus einem Text einfügen und als Beispielsätze den enthaltenen Vokabeln zuordnen */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  const jpCount = (s) => (s.match(/[぀-ヿ㐀-鿿]/g) || []).length;
  const latinCount = (s) => (s.match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
  const isJpLine = (s) => jpCount(s) > 0 && jpCount(s) >= latinCount(s) / 2;
  const splitJp = (s) => (s.match(/[^。！？!?]+[。！？!?]*[」』）)]*/g) || []).map((x) => x.trim()).filter((x) => jpCount(x) > 0);
  const splitDe = (s) => (s.match(/[^.!?]+[.!?]*["“”»«]*/g) || []).map((x) => x.trim()).filter(Boolean);

  // ---------- Text → Sätze (mit Übersetzung, wenn vorhanden) ----------
  App.parseSentences = (text) => {
    const out = [];
    let lastGroup = [];
    for (let line of text.split(/\r?\n/)) {
      line = line.trim();
      if (!line) continue;
      const parts = line.split(/\t| \| | ｜ /);
      if (parts.length >= 2 && isJpLine(parts[0]) && !isJpLine(parts[1])) { out.push({ jp: parts[0].trim(), de: parts.slice(1).join(' ').trim() }); lastGroup = []; continue; }
      if (isJpLine(line)) { lastGroup = splitJp(line).map((jp) => ({ jp, de: '' })); out.push(...lastGroup); continue; }
      // deutsche Zeile → gehört zur japanischen Zeile davor
      if (lastGroup.length === 1) lastGroup[0].de = (lastGroup[0].de ? lastGroup[0].de + ' ' : '') + line;
      else if (lastGroup.length > 1) {
        const ds = splitDe(line);
        if (ds.length === lastGroup.length) lastGroup.forEach((g, i) => (g.de = ds[i]));
        else lastGroup[lastGroup.length - 1].de = line;
      }
      lastGroup = [];
    }
    return out;
  };

  // ---------- Vokabel-Index: Grund- und konjugierte Formen ----------
  let index = null;
  App.onChange((w) => { if (w === 'items') index = null; });
  const buildIndex = () => {
    const forms = [];
    const add = (f, v) => { if (!f) return; const kana = !JP.hasKanji(f); if (kana && /^[぀-ゟー]+$/.test(f) && f.length < 3) return; if (kana && f.length < 2) return; forms.push({ f, v }); };
    for (const v of App.itemsOf('vocab')) {
      if (v.pos === 'particle') continue;
      const base = v.kanji || v.kana;
      const set = new Set([base]);
      // Wörter werden oft auch in Kana geschrieben (きのう statt 昨日)
      const writings = v.kanji && v.kana && v.kana.length >= 3 ? [v, Object.assign({}, v, { kanji: '' })] : [v];
      for (const w of writings) {
        const b = w.kanji || w.kana;
        set.add(b);
        if (v.pos === 'verb' && v.v && v.v.cls) {
          ['dict', 'te', 'ta', 'nai'].forEach((f) => set.add(JP.plain(JP.conj(w, f))));
          const stem = JP.plain(JP.conj(w, 'stem'));
          ['ま', 'た', 'に', 'な'].forEach((e) => set.add(stem + e));
          if (stem.length >= 2) set.add(stem);
        } else if (v.pos === 'i-adj') {
          const st = /いい$/.test(b) ? b.slice(0, -2) + 'よ' : b.slice(0, -1);
          ['く', 'かっ', 'くな', 'けれ'].forEach((e) => set.add(st + e));
        }
      }
      set.forEach((f) => add(f, v));
    }
    forms.sort((a, b) => b.f.length - a.f.length);
    return forms;
  };
  App.matchVocab = (sentence) => {
    if (!index) index = buildIndex();
    const all = [];
    for (const { f, v } of index) {
      let i = sentence.indexOf(f);
      while (i >= 0) { all.push({ v, start: i, end: i + f.length, form: f }); i = sentence.indexOf(f, i + 1); }
    }
    // Treffer, die komplett in einem längeren Treffer eines anderen Wortes stecken (天気 in 天気予報, 本 in 日本)
    all.forEach((a) => { a.nested = all.some((b) => b.v !== a.v && b.start <= a.start && b.end >= a.end && (b.end - b.start) > (a.end - a.start)); });
    const best = new Map();
    for (const a of all) {
      const cur = best.get(a.v.id);
      const better = !cur || (cur.nested && !a.nested) || (cur.nested === a.nested && a.end - a.start > cur.end - cur.start);
      if (better) best.set(a.v.id, a);
    }
    return Array.from(best.values()).sort((a, b) => a.start - b.start);
  };
  // Markiert eigene Vokabeln (known) und neue Wörter aus dem Wörterbuch (new, jedes Wort einzeln); eigene haben Vorrang
  const highlight = (s, matches, hits) => {
    const marks = new Array(s.length).fill('');
    (hits || []).forEach((h, k) => { for (let i = h.start; i < h.end; i++) marks[i] = 'new' + k; });
    matches.filter((m) => m.on).forEach((m) => { for (let i = m.start; i < m.end; i++) marks[i] = 'known'; });
    let out = '', open = '';
    for (let i = 0; i < s.length; i++) {
      if (marks[i] !== open) {
        if (open) out += '</mark>';
        if (marks[i]) out += `<mark class="${marks[i] === 'known' ? 'known' : 'new'}">`;
        open = marks[i];
      }
      out += esc(s[i]);
    }
    return out + (open ? '</mark>' : '');
  };

  // Beispielsatz einer Zeile (mit Furigana-Notation, wenn eine Lesung eingetragen ist)
  const exampleOf = (r, srcLabel) => {
    let jp = r.jp;
    if (r.kana && JP.hasKanji(jp)) { const n = JP.notate(jp, r.kana.trim()); if (!n.startsWith('{')) jp = n; }
    const ex = { jp, de: (r.de || '').trim() };
    if (r.kana && jp === r.jp) ex.kana = r.kana.trim();
    if (srcLabel) ex.src = srcLabel;
    return ex;
  };

  // Seitenzustand überlebt das Neuzeichnen der Ansicht (z. B. nach dem Speichern einer Vokabel)
  let state = null;
  // Von außen belegen (Eingang): readings = Map Satz → Lesung; die Erkennung startet beim nächsten Zeichnen der Seite
  App.sentencesPreset = ({ text, src, ref, readings }) => {
    state = { text: text || '', src: src || '', ref: ref || '', rows: [], readings: readings || new Map(), run: true, srcFixed: true };
  };
  // Läuft gerade eine Zuordnung (erkannte Sätze, noch nicht gespeichert oder geleert)?
  App.sentencesBusy = () => !!(state && state.rows.length);

  // =========================================================
  // Seite: Sätze zuordnen
  // =========================================================
  App.route('/saetze', (view) => {
    const sec = App.SECTIONS.vocab;
    // von außen belegt: auch „keine Quelle“ gilt (fremde Seite ≠ zuletzt benutzte Quelle)
    const lastSrc = state && state.srcFixed ? state.src : (state && state.src) || App.lsGet('sentSource') || 'NHK Easy';
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/vokabeln">Vokabeln</a> › Beispielsätze zuordnen</div>
      <div class="page-head"><div class="titles"><h1>Sätze zuordnen <span class="jp-title">例文</span></h1>
        <p>Füge einen Text ein – z. B. einen NHK-Easy-Artikel, Untertitel oder Sätze aus dem Buch. Die App findet die enthaltenen Vokabeln, du entscheidest, wo jeder Satz als Beispiel landet.</p></div></div>
      <div class="card" data-in><div class="form">
        <div class="field"><label>Text <small>Japanisch; deutsche Übersetzung optional in der Zeile darunter oder nach Tab / „ | “</small></label>
          <textarea class="input jp-in" rows="8" data-text placeholder="きのう、東京で大きい地震がありました。&#10;Gestern gab es in Tokio ein großes Erdbeben.&#10;わたしは毎朝コーヒーを飲みます。 | Ich trinke jeden Morgen Kaffee."></textarea></div>
        <div class="three"><div class="field"><label>Quelle</label><select class="input" data-src>${App.sourceOptions(lastSrc)}</select></div>
          <div class="field" style="grid-column:span 2"><label>Fundstelle / Link <small>optional</small></label><input class="input" data-ref placeholder="z. B. https://www3.nhk.or.jp/news/easy/… oder „Genki S. 112“"></div></div>
        <div class="row"><a class="btn btn-sec" href="#/eingang" data-clip-link>Aus Zwischenablage</a><button class="btn btn-sec" data-go>${icon('sparkle')} Sätze erkennen</button></div></div></div>
      <div data-out style="margin-top:18px"></div></div>`;
    const out = view.querySelector('[data-out]');
    const txt = view.querySelector('[data-text]'), srcSel = view.querySelector('[data-src]'), refIn = view.querySelector('[data-ref]');
    if (!state) state = { text: '', src: '', ref: '', rows: [] };
    let rows = state.rows;
    txt.value = state.text; refIn.value = state.ref;
    txt.addEventListener('input', () => { state.text = txt.value; });
    refIn.addEventListener('input', () => { state.ref = refIn.value; });
    srcSel.addEventListener('change', () => { state.src = srcSel.value; });
    const srcLabel = () => [srcSel.value, refIn.value.trim()].filter(Boolean).join(' – ');
    const setRows = (r) => { rows = state.rows = r; };

    view.querySelector('[data-go]').onclick = () => {
      state.text = txt.value;
      const sents = App.parseSentences(txt.value);
      if (!sents.length) return App.toast('Keine japanischen Sätze gefunden');
      setRows(sents.map((s) => {
        const m = App.matchVocab(s.jp).map((x) => Object.assign(x, { on: !x.nested }));
        return { jp: s.jp, de: s.de, kana: (state.readings && state.readings.get(s.jp)) || '', matches: m, extra: [], use: true, unknown: null };
      }));
      draw();
      scanAll();
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Vokabel-Treffer neu berechnen (neue Vokabel ist jetzt „bekannt“); An/Aus-Zustand bleibt erhalten
    const refreshMatches = () => {
      index = null;
      rows.forEach((r) => {
        const prev = new Map(r.matches.map((m) => [m.v.id, m.on]));
        r.matches = App.matchVocab(r.jp).map((x) => Object.assign(x, { on: prev.has(x.v.id) ? prev.get(x.v.id) : !x.nested }));
        // zusätzliche Zuordnungen aus den aktuellen Daten holen (Eintrag kann inzwischen bearbeitet oder gelöscht sein)
        r.extra = r.extra.map((x) => ({ it: App.item(x.it.id), on: x.on })).filter((x) => x.it);
      });
    };

    // ---------- Unbekannte Wörter (asynchron nach dem Zeichnen) ----------
    // Zähler im geteilten Zustand: Scans aus älteren Ansichten (vor App.render / Navigation) schreiben nichts mehr
    const scanAll = async () => {
      const my = state.gen = (state.gen || 0) + 1;
      const list = rows;
      const hasDict = App.dict.installed();
      const isKnown = App.entryKnownFn(App.itemsOf('vocab'));
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        const cov = App.coveredFromMatches(r.jp.length, r.matches);
        if (!hasDict) { if (my !== state.gen) return; r.unknown = { spans: App.uncoveredSpans(r.jp, cov) }; }
        else {
          let hits = [];
          try { hits = await App.scanUnknown(r.jp, cov, App.dict.lookup, isKnown, r.matches); } catch (e) { console.error(e); }
          if (my !== state.gen) return;
          r.unknown = { hits };
          // Eigene Vokabeln, die in einem längeren Wort stecken (東 in 東京), gelten als verschachtelt → abwählen
          hits.forEach((h) => (h.over || []).forEach((k) => { const m = r.matches[k]; if (m) { m.on = false; m.nested = true; } }));
        }
        if (rows !== list) continue;
        const card = out.querySelector(`[data-row="${i}"]`);
        if (!card) continue;
        card.querySelector('[data-unk]').innerHTML = unknownHtml(r);
        card.querySelector('[data-jp]').innerHTML = highlight(r.jp, r.matches, r.unknown.hits);
        card.querySelector('[data-chips]').innerHTML = chipsHtml(r);
        updateTotal();
      }
    };
    const unknownHtml = (r) => {
      const u = r.unknown;
      if (!u) return '<div class="small muted" style="margin-top:8px">Suche unbekannte Wörter …</div>';
      if (u.spans) return u.spans.length ? `<div class="small muted" style="margin-top:8px">Nicht erkannt: ${u.spans.map((s) => `<a lang="ja" href="${esc(App.jishoUrl(s.text))}" target="_blank" rel="noopener">${esc(s.text)} ↗</a>`).join(' · ')}</div>` : '';
      if (!u.hits.length) return '<div class="small muted" style="margin-top:8px">Keine unbekannten Wörter gefunden.</div>';
      return `<div style="margin-top:10px"><div class="small muted" style="margin-bottom:2px"><b>Unbekannte Wörter</b> – aus dem Wörterbuch</div>${u.hits.map((h, k) => App.dictHitHtml(h, k)).join('')}</div>`;
    };
    const chip = (label, sub, on, attrs, muted) => `<label class="chip ${on ? 'on' : ''}" style="${muted && !on ? 'opacity:.65' : ''}"><input type="checkbox" ${attrs} ${on ? 'checked' : ''} hidden><span lang="ja">${esc(label)}</span><span class="small" style="opacity:.8">${esc(sub)}</span></label>`;
    const chipsHtml = (r) => `${r.matches.map((m, k) => chip(m.v.kanji || m.v.kana, `${m.v.kanji ? m.v.kana + ' · ' : ''}${App.meaning(m.v).text}`.slice(0, 40), m.on, `data-m="${k}"`, m.nested)).join('')}
            ${r.extra.map((x, k) => chip(x.it.type === 'grammar' ? '文 ' + x.it.title : (x.it.kanji || x.it.kana), x.it.type === 'grammar' ? 'Grammatik' : App.meaning(x.it).text, x.on, `data-x="${k}"`)).join('')}
            <button class="chip" data-add>${icon('plus')} Weitere zuordnen</button>`;
    const totalOf = () => rows.filter((r) => r.use).reduce((a, r) => a + r.matches.filter((m) => m.on).length + r.extra.filter((x) => x.on).length, 0);
    const updateTotal = () => {
      const total = totalOf();
      const b = out.querySelector('[data-total]'); if (b) b.textContent = total;
      const btn = out.querySelector('[data-save]'); if (btn) btn.disabled = !total;
    };
    // Markierungen im Satz ein-/ausblenden (bekannte / neue Wörter), gemerkt pro Gerät
    const hidden = new Set((App.lsGet('sentHideMarks') || '').split(',').filter(Boolean));
    const markClasses = () => ['known', 'new'].filter((k) => hidden.has(k)).map((k) => 'hide-' + k).join(' ');
    const markToggle = (k, label) => `<label class="mark-toggle ${hidden.has(k) ? '' : 'on'}"><input type="checkbox" data-marks="${k}" ${hidden.has(k) ? '' : 'checked'}><mark class="${k}">${label}</mark></label>`;
    const draw = () => {
      const total = totalOf();
      out.className = markClasses();
      out.innerHTML =`<div class="row between" style="margin-bottom:12px;flex-wrap:wrap;gap:8px"><b>${rows.length} Sätze erkannt</b>
          <span class="row small" style="gap:12px;flex-wrap:wrap"><span class="muted">Markieren:</span>${markToggle('known', 'Deine Vokabeln')}${App.dict.installed() ? markToggle('new', 'Neue Wörter') : ''}</span></div>
        <div class="small muted" style="margin:-6px 0 12px">Unter jedem Satz: Tippe eine Vokabel an, um sie als Zuordnung an- oder abzuwählen.</div>
        ${!App.dict.installed() ? `<div class="card" style="margin-bottom:12px;background:var(--sec-soft);border-color:transparent;box-shadow:none">${icon('info')} <a href="#/pakete">Wörterbuch freischalten, um unbekannte Wörter nachzuschlagen</a> <span class="small muted">– bis dahin führen die Links bei „Nicht erkannt“ zu Jisho.</span></div>` : ''}
        <div class="stack">${rows.map((r, i) => `<div class="card" data-row="${i}" style="${r.use ? '' : 'opacity:.55'}">
          <div class="row between" style="align-items:flex-start"><div class="grow"><div lang="ja" class="sent-jp" data-jp style="font-size:21px;line-height:1.8">${highlight(r.jp, r.matches, r.unknown && r.unknown.hits)}</div></div>
            <label class="row small" style="gap:6px;white-space:nowrap"><input type="checkbox" data-use ${r.use ? 'checked' : ''}> übernehmen</label></div>
          <div class="two" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0">
            <input class="input" data-de placeholder="Deutsche Übersetzung (optional)" value="${esc(r.de)}">
            <input class="input jp-in" data-kana placeholder="Lesung in Kana (optional → Furigana)" value="${esc(r.kana)}"></div>
          <div class="small muted" style="margin-bottom:6px">Zuordnen zu:</div>
          <div class="chips" data-chips>${chipsHtml(r)}</div>
          ${!r.matches.length && !r.extra.length ? '<div class="small muted" style="margin-top:6px">Keine bekannte Vokabel gefunden – ordne den Satz selbst zu (auch Grammatikpunkte möglich).</div>' : ''}
          <div data-unk="${i}">${unknownHtml(r)}</div></div>`).join('')}</div>
        <div class="card row between" style="margin-top:16px;position:sticky;bottom:12px;box-shadow:var(--shadow-lg)"><span><b data-total>${total}</b> Zuordnungen aus <b>${rows.filter((r) => r.use).length}</b> Sätzen</span>
          <div class="row"><button class="btn" data-reset>Neuer Text</button><button class="btn btn-primary" data-save ${total ? '' : 'disabled'}>${icon('check')} Als Beispielsätze speichern</button></div></div>`;
    };
    out.addEventListener('input', (e) => {
      const r = rows[+(e.target.closest('[data-row]') || {}).dataset?.row];
      if (!r) return;
      if (e.target.matches('[data-de]')) r.de = e.target.value;
      if (e.target.matches('[data-kana]')) r.kana = e.target.value;
    });
    out.addEventListener('change', (e) => {
      const mk = e.target.closest('[data-marks]');
      if (mk) {
        if (mk.checked) hidden.delete(mk.dataset.marks); else hidden.add(mk.dataset.marks);
        App.lsSet('sentHideMarks', Array.from(hidden).join(','));
        mk.closest('.mark-toggle').classList.toggle('on', mk.checked);
        out.className = markClasses();
        return;
      }
      const card = e.target.closest('[data-row]'); if (!card) return;
      const r = rows[+card.dataset.row];
      if (e.target.matches('[data-use]')) r.use = e.target.checked;
      if (e.target.matches('[data-m]')) r.matches[+e.target.dataset.m].on = e.target.checked;
      if (e.target.matches('[data-x]')) r.extra[+e.target.dataset.x].on = e.target.checked;
      if (e.target.matches('[data-use], [data-m], [data-x]')) draw();
    });
    out.addEventListener('click', async (e) => {
      if (e.target.closest('[data-reset]')) { state.gen = (state.gen || 0) + 1; setRows([]); out.innerHTML = ''; txt.value = state.text = ''; txt.focus(); return; }
      const adopt = e.target.closest('[data-adopt]');
      if (adopt) {
        const r = rows[+adopt.closest('[data-row]').dataset.row];
        const h = r && r.unknown && r.unknown.hits && r.unknown.hits[+adopt.dataset.adopt];
        if (!h) return;
        App.lsSet('sentSource', srcSel.value);
        App.adoptDictEntry(h, {
          extra: { examples: [exampleOf(r, srcLabel())], source: srcSel.value, sourceRef: refIn.value.trim() },
          onSaved: () => { refreshMatches(); draw(); scanAll(); },
        });
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add) {
        const r = rows[+add.closest('[data-row]').dataset.row];
        const ids = await App.pickItems({ title: 'Satz zuordnen zu …', types: ['vocab', 'grammar'], selected: r.extra.filter((x) => x.on).map((x) => x.it.id) });
        if (ids) {
          const have = new Set(r.matches.map((m) => m.v.id));
          ids.forEach((id) => { if (have.has(id)) { r.matches.find((m) => m.v.id === id).on = true; return; } const ex = r.extra.find((x) => x.it.id === id); if (ex) ex.on = true; else r.extra.push({ it: App.item(id), on: true }); });
          r.use = true;
          draw();
        }
        return;
      }
      if (e.target.closest('[data-save]')) save();
    });
    const save = async () => {
      App.lsSet('sentSource', srcSel.value);
      const label = srcLabel();
      const touched = new Map();
      let added = 0, skipped = 0;
      for (const r of rows.filter((x) => x.use)) {
        const ex = exampleOf(r, label);
        // Ziele über die ID aus den aktuellen Daten holen: nie in veraltete Objekte schreiben, Gelöschtes nicht wiederbeleben
        const ids = r.matches.filter((m) => m.on).map((m) => m.v.id).concat(r.extra.filter((x) => x.on).map((x) => x.it.id));
        for (const id of ids) {
          const cur = touched.get(id) || App.item(id);
          if (!cur) continue;
          cur.examples = cur.examples || [];
          if (cur.examples.some((x) => JP.plain(x.jp) === JP.plain(ex.jp))) { skipped++; continue; }
          cur.examples.push(Object.assign({}, ex));
          touched.set(id, cur);
          added++;
        }
      }
      for (const it of touched.values()) await App.saveItem(it, { silent: true });
      index = null;
      S.items.forEach((x) => { if (x._st) delete x._st; }); // Suchindex auffrischen
      App.toast(`${added} Beispielsätze bei ${touched.size} Einträgen gespeichert${skipped ? ` (${skipped} gab es schon)` : ''}`);
      out.innerHTML = `<div class="card"><h3>Gespeichert ✓</h3><p class="muted">${added} Beispielsätze wurden zugeordnet.</p><div class="rel-list">${Array.from(touched.values()).map(App.relItem).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn btn-sec" data-reset>Weiteren Text einfügen</button></div></div>`;
      state.gen = (state.gen || 0) + 1;
      setRows([]);
    };

    // Nach dem Neuzeichnen der Ansicht (z. B. nach dem Speichern einer Vokabel) weitermachen, wo man war
    if (rows.length) { refreshMatches(); draw(); scanAll(); }
    if (state.run) { state.run = false; view.querySelector('[data-go]').click(); }
  });
})(window.App);
