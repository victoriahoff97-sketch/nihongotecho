/* Nihongo Techō – Nachschlagen-Fenster auf Stift-Seiten: eigene Wörter + Offline-Wörterbuch, groß mit Strichfolge.
   Übernimmt von sich aus nichts; nach „Erkennen“ kann die Schreibfläche einen Treffer mit dem eingekreisten Wort verknüpfen (onLink). */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const LL = App.lookupLogic;
  const LK = App.lookup = {};
  const MAX = 8, MAX_CHARS = 6;

  // Bedeutungen des Wörterbuchs einmal laden; neu, sobald sich die installierten Wörterbuch-Pakete ändern
  // (das Versprechen wird gemerkt, damit schnelles Tippen den Store nicht mehrfach lädt)
  let gloss = null, glossSig = '';
  const dictSig = () => JSON.stringify(Object.entries(App.packMeta.cached()).filter(([id, m]) => m && m.complete && (App.packById(id) || {}).kind === 'dict').map(([id, m]) => id + ':' + m.version).sort());
  const glossList = () => {
    const sig = dictSig();
    if (!gloss || sig !== glossSig) {
      glossSig = sig;
      gloss = App.db.all('dict').then((rows) => rows.map((v) => ({ id: v.id, k: v.k, r: v.r, de: v.de, en: v.en, c: v.c })));
      gloss.catch(() => { gloss = null; });
    }
    return gloss;
  };
  LK.glossLoaded = () => !!gloss && glossSig === dictSig();

  // id = eigener Eintrag (zum Verknüpfen); Wörterbuch-Treffer tragen stattdessen entry
  const ownResult = (it) => {
    if (it.type === 'kanji') return { id: it.id, jp: it.char, kana: (it.kun || [])[0] || (it.on || [])[0] || '', meaning: App.meaning(it).text };
    if (it.type === 'phrase') return { id: it.id, jp: JP.plain(it.jp), kana: JP.kana(it.jp), meaning: App.meaning(it).text };
    return { id: it.id, jp: it.kanji || it.kana || '', kana: it.kana || '', meaning: App.meaning(it).text };
  };
  const dictResult = (row) => Object.assign(LL.dictResult(row), { entry: row });

  LK.search = async (q) => {
    q = (q || '').trim();
    const dictInstalled = App.dict.installed();
    if (!q) return { own: [], dict: [], dictInstalled };
    const kanaQ = !LL.isJp(q) && JP.looksRomaji(q) ? JP.romaji(q.toLowerCase()) : '';
    const own = LL.uniq(App.search(q, { types: ['vocab', 'kanji', 'phrase'], limit: 40 }).map(ownResult).filter((r) => r.jp && LL.ownMatch(r, q, kanaQ))).slice(0, MAX);
    let rows = [];
    if (dictInstalled) {
      const byForms = async (forms) => {
        const seen = new Set(), out = [];
        for (const list of (await App.dict.lookup(forms)).values()) for (const e of list) if (!seen.has(e.id)) { seen.add(e.id); out.push(e); }
        return out.sort((a, b) => (b.c || 0) - (a.c || 0));
      };
      if (LL.isJp(q)) rows = await byForms(LL.dictForms(q));
      else {
        const kana = kanaQ ? await byForms(LL.dictForms(kanaQ)) : [];
        rows = LL.mergeDict(kana, q.length < 2 ? [] : LL.rankDict(await glossList(), q, MAX), MAX);
      }
    }
    // Gebeugte Formen, Wort + Partikel, ganze Sätze: in Grundformen zerlegen (たべます → 食べる, 今日は → 今日)
    const scanQ = LL.isJp(q) ? q : kanaQ;
    let scanOwn = [], scanDict = [];
    if (scanQ) {
      const lookup = LL.combineLookups(ownIx(), dictInstalled ? App.dict.lookup : null);
      // alle Grundformen, die zu einer Form passen (いきました = 行く oder 生きる), eigene zuerst
      const entriesFor = async (surface) => {
        const cands = App.deinflect(surface);
        return LL.surfaceEntries(cands, await lookup([...new Set(cands.map((c) => c.base))]), App.posMatches);
      };
      let found = [];
      try {
        found = await entriesFor(scanQ); // die ganze Eingabe als ein Wort
        // Satz: einmal nur mit eigenen Wörtern zerlegen (今日は → 今日, auch wenn das Wörterbuch 今日は als Ganzes kennt), einmal mit allem
        const hits = (await App.scanUnknown(scanQ, [], LL.combineLookups(ownIx(), null))).concat(dictInstalled ? await App.scanUnknown(scanQ, [], lookup) : []);
        for (const h of hits) if (h.surface !== scanQ) found = found.concat((await entriesFor(h.surface)).slice(0, 3)); // je Stelle höchstens 3
      } catch (e) { console.error(e); }
      const seen = new Set();
      found = found.filter((e) => !seen.has(e.id) && seen.add(e.id));
      scanOwn = found.filter((e) => e.own).map((e) => ownResult(e.own));
      scanDict = found.filter((e) => !e.own).map(dictResult);
    }
    const allOwn = LL.uniq(scanOwn.concat(own)).slice(0, MAX);
    return { own: allOwn, dict: LL.dedupe(allOwn, LL.uniq(scanDict.concat(rows.map(dictResult)))).slice(0, MAX), dictInstalled };
  };

  // Eigene Vokabeln als Scan-Index; neu, sobald sich Einträge ändern
  let ownMap = null;
  const ownIx = () => ownMap || (ownMap = LL.ownIndex(App.store.items.values()));
  App.onChange(() => { ownMap = null; });

  const rowHtml = (r, i, grp) => `<button class="lk-row" data-lk="${grp}:${i}"><span class="lk-jp">${esc(r.jp)}</span><span class="lk-txt"><span class="lk-kana">${esc(r.kana !== r.jp ? r.kana : '')}</span><span class="lk-de">${r.lang === 'en' ? '<span class="badge">EN</span> ' : ''}${esc(r.meaning)}</span></span></button>`;

  // Ein Fenster pro Schreibfläche; erneutes Öffnen holt das vorhandene nach vorn
  // onLink(r) (optional): Treffer mit dem zuletzt eingekreisten Wort verknüpfen – zeigt in der Detailansicht „Verknüpfen“
  LK.open = (root, q = '', { onLink = null } = {}) => {
    // q leer = Knopf in der Leiste (Feld fokussieren, Eingabe behalten); q gesetzt = Vorschlag aus „Erkennen“ (keine Bildschirmtastatur)
    if (root._lookup) { root._lookup.setLink(onLink); if (q) root._lookup.setQuery(q); else root._lookup.focus(); return root._lookup; }
    const pop = document.createElement('div');
    pop.className = 'lookup-pop card';
    pop.innerHTML = `<div class="lk-head"><input class="input" type="search" autocomplete="off" placeholder="Deutsch, かな, 漢字 oder Romaji"><button class="icon-btn sm" data-lkclose title="Schließen">${icon('close')}</button></div><div class="lk-body"></div>`;
    const bar = root.querySelector('.viewer-bar');
    pop.style.top = (bar ? bar.offsetHeight : 0) + 8 + 'px';
    root.appendChild(pop);
    const input = pop.querySelector('input'), body = pop.querySelector('.lk-body');
    let run = 0, last = { q: '', own: [], dict: [] }, shown = null;

    // Ohne Offline-Wörterbuch gibt es nur eigene Wörter: direkt hier installieren (kein Seitenwechsel, geht auch im Vollbild)
    const DICT_ID = 'dict-common';
    const installHint = () => {
      const p = App.packById(DICT_ID);
      if (!p || !p.available) return '';
      return `<div class="lk-install small muted">Mehr Treffer mit dem Offline-Wörterbuch (${Math.round(p.entries / 1000)}.000 häufige Wörter, etwa ${Math.round(p.sizeKB / 1024)} MB).
        <button class="btn btn-sm btn-sec" data-lkinstall>${icon('download')} Wörterbuch installieren</button></div>`;
    };
    const install = async (btn) => {
      const box = btn.closest('.lk-install');
      btn.disabled = true;
      try {
        await App.dict.install(DICT_ID, (frac, text) => { if (box.isConnected) btn.textContent = `${Math.round(frac * 100)} % – ${text}`; });
        search();
      } catch (e) {
        console.error(e);
        if (box.isConnected) box.innerHTML = `Wörterbuch konnte nicht installiert werden: ${esc(e.message || e)}`;
      }
    };
    const list = (res) => {
      last = res; shown = null;
      if (!res.q) { body.innerHTML = '<p class="muted small">Wort eingeben – Treffer antippen, um es groß mit Strichfolge zu sehen.</p>'; return; }
      const hint = res.dictInstalled ? '' : installHint();
      if (!res.own.length && !res.dict.length) { body.innerHTML = '<p class="muted">Nichts gefunden</p>' + hint; return; }
      body.innerHTML = (res.own.length ? `<div class="lk-sec">Deine Wörter</div>${res.own.map((r, i) => rowHtml(r, i, 'own')).join('')}` : '')
        + (res.dict.length ? `<div class="lk-sec">Wörterbuch</div>${res.dict.map((r, i) => rowHtml(r, i, 'dict')).join('')}` : '') + hint;
    };
    const search = async () => {
      const n = ++run, q = input.value.trim();
      if (q.length > 1 && App.dict.installed() && !LK.glossLoaded()) body.innerHTML = '<p class="muted">Wörterbuch wird geladen …</p>';
      const res = await LK.search(q);
      if (n === run) list({ q, ...res }); // veraltete Antworten verwerfen
    };
    const detail = (r) => {
      run++; // eine noch laufende Suche soll die Detailansicht nicht überschreiben
      shown = r;
      const chars = Array.from(r.jp.replace(/\s/g, '')).slice(0, MAX_CHARS);
      body.innerHTML = `<button class="btn btn-sm btn-ghost" data-lkback>${icon('back')} Treffer</button>
        <div class="lk-big">${esc(r.jp)}</div><div class="lk-kana">${esc(r.kana !== r.jp ? r.kana : '')}</div><div class="lk-de">${esc(r.meaning)}</div>
        ${onLink ? `<button class="btn btn-sm btn-primary lk-link" data-lklink>${icon('link')} ${r.id ? 'Mit dem Wort verknüpfen' : 'Als Vokabel speichern & verknüpfen'}</button>` : ''}
        <div class="lk-strokes">${chars.map(() => '<div class="lk-stroke"></div>').join('')}</div>`;
      body.scrollTop = 0;
      body.querySelectorAll('.lk-stroke').forEach((host, i) => App.stroke.animator(host, chars[i], { compact: true, autoplay: i === 0 }));
    };

    const close = () => { run++; pop.remove(); root._lookup = null; };
    const setQuery = (v) => { input.value = v; search(); };
    // Ziel fürs Verknüpfen wechselt mit jedem eingekreisten Wort; ohne Ziel verschwindet der Knopf
    const setLink = (fn) => { if (fn === onLink) return; onLink = fn; if (shown) detail(shown); };
    const focus = () => input.focus();
    const debounced = App.debounce(search, 200);
    input.addEventListener('input', debounced);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    // Eingaben im Fenster gehören nicht der Schreibfläche
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      if (e.target.closest('[data-lkclose]')) { close(); return; }
      if (e.target.closest('[data-lkback]')) { list(last); return; }
      if (e.target.closest('[data-lklink]')) { if (onLink && shown) onLink(shown); return; }
      const inst = e.target.closest('[data-lkinstall]');
      if (inst) { install(inst); return; }
      const row = e.target.closest('[data-lk]');
      if (row) { const [grp, i] = row.dataset.lk.split(':'); detail(last[grp][+i]); }
    });
    root._lookup = { close, setQuery, focus, setLink };
    setQuery(q);
    if (!q) focus();
    return root._lookup;
  };
})(window.App);
