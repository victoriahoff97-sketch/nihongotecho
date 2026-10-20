/* Nihongo Techō – WaniKani: Verbindung, Abgleich und Level-Freischaltung für „Kanji schreiben“ und „Vokabeln Deutsch → Japanisch“ */
'use strict';
(function (App) {
  const K = App.wkLogic;
  const S = App.store;
  const API = 'https://api.wanikani.com/v2/';
  const DAY = 864e5;

  // Zustand liegt in meta unter „wanikani“ – getrennt von den Einstellungen, damit Schlüssel und WaniKani-Daten
  // nie in Backup oder Teilen-Paket landen: { token, user, syncedAt, subjectsAt, assignmentsAt, kanji, stage, vSubjectsAt, vAssignmentsAt, vocab, vstage }
  const wk = App.wk = { state: K.empty() };
  wk.load = async () => { const m = await App.db.get('meta', 'wanikani'); wk.state = Object.assign(K.empty(), m && m.value); };
  const save = () => App.db.put('meta', { key: 'wanikani', value: wk.state });
  wk.connected = () => !!wk.state.token;
  wk.levels = () => S.settings.wkLevels || [];
  wk.vLevels = () => S.settings.wkVocabLevels || []; // Vokabeln Deutsch → Japanisch: eigene Level-Liste

  wk.MSG = {
    offline: 'Kein Internet – WaniKani ist gerade nicht erreichbar.',
    auth: 'Der Schlüssel wird von WaniKani nicht angenommen.',
    busy: 'WaniKani antwortet gerade nicht. Später noch einmal.',
    other: 'Der Abgleich mit WaniKani hat nicht geklappt.',
  };
  const fail = (code) => Object.assign(new Error(wk.MSG[code]), { code });
  const get = async (token, url) => {
    if (!url.startsWith(API)) throw fail('other'); // der Schlüssel geht nur an WaniKani
    let r;
    try { r = await fetch(url, { headers: { Authorization: 'Bearer ' + token, 'Wanikani-Revision': '20170710' }, signal: AbortSignal.timeout(20000) }); }
    catch (e) { throw fail('offline'); }
    if (r.status === 401) throw fail('auth');
    if (r.status === 429 || r.status >= 500) throw fail('busy');
    if (!r.ok) throw fail('other');
    return r.json();
  };
  // Alle Seiten einer Liste holen; liefert den Stand der Daten (für den nächsten Abruf nur der Änderungen)
  const pages = async (token, url, each) => {
    let at = null;
    while (url) {
      const p = await get(token, url);
      each(p);
      if (p.data_updated_at) at = p.data_updated_at;
      url = p.pages && p.pages.next_url;
    }
    return at;
  };
  const since = (at) => (at ? '&updated_after=' + encodeURIComponent(at) : '');

  // Abgleich: Level, Kanji und Vokabeln je Level und ihre Stufen. Schlägt etwas fehl, bleibt der letzte Stand unverändert.
  wk.sync = async (token = wk.state.token) => {
    if (!token) throw fail('auth');
    const next = token === wk.state.token ? JSON.parse(JSON.stringify(wk.state)) : K.empty(); // anderer Schlüssel = von vorn
    const user = await get(token, API + 'user');
    next.user = { level: user.data.level, username: user.data.username };
    const sAt = await pages(token, API + 'subjects?types=kanji' + since(next.subjectsAt), (p) => K.mergeSubjects(next, p));
    if (sAt) next.subjectsAt = sAt;
    const aAt = await pages(token, API + 'assignments?subject_types=kanji' + since(next.assignmentsAt), (p) => K.mergeAssignments(next, p));
    if (aAt) next.assignmentsAt = aAt;
    // Vokabeln haben eigene Zeitstempel: wer schon verbunden war, holt sie beim nächsten Abgleich einmal vollständig
    // (ebenso nach einer neuen Fassung des Zustands, z. B. für die Beispielsätze)
    if (next.vSchema !== K.V_SCHEMA) { delete next.vSubjectsAt; next.vSchema = K.V_SCHEMA; }
    const vsAt = await pages(token, API + 'subjects?types=vocabulary,kana_vocabulary' + since(next.vSubjectsAt), (p) => K.mergeVocab(next, p));
    if (vsAt) next.vSubjectsAt = vsAt;
    const vaAt = await pages(token, API + 'assignments?subject_types=vocabulary,kana_vocabulary' + since(next.vAssignmentsAt), (p) => K.mergeVocabAssignments(next, p));
    if (vaAt) next.vAssignmentsAt = vaAt;
    next.token = token;
    next.syncedAt = Date.now();
    wk.state = next;
    await save();
    // Level über dem eigenen WaniKani-Level gibt es nicht (z. B. nach einem Zurücksetzen dort)
    const keep = wk.levels().filter((l) => l <= next.user.level);
    if (keep.length !== wk.levels().length) await App.saveSettings({ wkLevels: keep });
    for (const l of keep) await fill(l); // neu hinzugekommene Kanji eingeschalteter Level
    const keepV = wk.vLevels().filter((l) => l <= next.user.level);
    if (keepV.length !== wk.vLevels().length) await App.saveSettings({ wkVocabLevels: keepV });
    await dropBelow(); // unberührte Vokabeln, die bei WaniKani unter Master stehen
    for (const l of keepV) await fillVocab(l); // Vokabeln, die inzwischen Master sind
    App.emit('items');
    wk.enrich();
    return wk.state;
  };
  wk.connect = (token) => wk.sync(String(token || '').trim());
  // Höchstens einmal am Tag von selbst, still im Hintergrund; sonst nur aufräumen und Fehlendes nachholen (wk.enrich)
  wk.autoSync = () => {
    if (!wk.connected() || navigator.onLine === false) return;
    if (Date.now() - (wk.state.syncedAt || 0) < DAY) { wk.enrich(); return; }
    wk.sync().catch((e) => console.warn('WaniKani: ' + e.message));
  };

  // Fehlende Kanji eines Levels anlegen – nie ein zweiter Eintrag für ein vorhandenes Zeichen
  const fill = async (level) => {
    const have = new Set(App.itemsOf('kanji').map((k) => k.char));
    const now = Date.now();
    for (const it of K.missing(wk.state, level, (c) => have.has(c))) {
      it.created = it.updated = now;
      if (App.levelFor) it.level = App.levelFor(it);
      S.items.set(it.id, it);
      await App.db.put('items', it);
    }
  };
  // Unberührte, automatisch angelegte Einträge wieder entfernen (level null = alle)
  const clear = async (level) => {
    const refs = App.allRefs(Array.from(S.items.values()), Array.from(S.files.values()));
    for (const id of K.removable(wk.state, level, App.itemsOf('kanji'), { srs: S.srs, refs })) {
      S.items.delete(id);
      await App.db.del('items', id);
    }
  };
  // Schlüssel der Wörter, die es in der App schon gibt: Vokabeln (mit oder ohne die aus WaniKani) und Ausdrücke
  const haveKeys = (withWk) => {
    const keys = new Set(App.itemsOf('vocab').filter((it) => withWk || !it._wk).map(App.vocabKey));
    App.itemsOf('phrase').forEach((p) => K.phraseKeys(p).forEach((k) => keys.add(k)));
    return keys;
  };
  // Andere Schreibweisen je WaniKani-Vokabel (Wörterbuch), einmal je Sitzung nachgeschlagen; ohne Wörterbuch nur die Kana-Schreibung
  const altCache = new Map();
  const altsOf = (it) => altCache.get(it.id) || K.altKeys(it, null);
  const loadAlts = async (items) => {
    const todo = items.filter((it) => it.kanji && !altCache.has(it.id));
    if (!todo.length || !App.dict.installed()) return;
    let hits;
    try { hits = await App.dict.lookup(Array.from(new Set(todo.map(K.form)))); } catch (e) { console.error(e); return; }
    todo.forEach((it) => altCache.set(it.id, K.altKeys(it, hits.get(K.form(it)))));
  };
  // Deutsch aus dem Paket eintragen; altes Wörterbuch-Deutsch fliegt raus (dann gilt bis zur Übersetzung das Englische).
  // Liefert die geänderten Einträge. Bearbeitetes wird nie angefasst.
  const packGerman = (idx, items) => items.filter(K.needsGerman).filter((it) => {
    const de = K.packGerman(idx, it, altsOf(it));
    if (de) { it.de = de; it._de = 'pack'; return true; }
    if (it.de && !it._de) { it.de = ''; return true; }
    return false;
  });
  // Vokabeln eines Levels anlegen, die bei WaniKani ab Master sind – Wörter, die es schon gibt, bleiben bei ihrer Quelle
  const fillVocab = async (level) => {
    const keys = haveKeys(true), hasId = (id) => S.items.has(id);
    await loadAlts(K.vMissing(wk.state, level, { hasKey: () => false, hasId }));
    const adds = K.vMissing(wk.state, level, { hasKey: (k) => keys.has(k), hasId, alts: altsOf });
    packGerman(await App.exampleIndex(), adds);
    const now = Date.now();
    adds.forEach((it, i) => { it.created = it.updated = now + i; if (App.levelFor) it.level = App.levelFor(it); S.items.set(it.id, it); }); // + i: WaniKani-Reihenfolge bleibt die Lernreihenfolge
    await App.db.putMany('items', adds);
  };
  // Entfernt, was pick(Vokabeln, ctx) liefert; gibt die Anzahl zurück
  const dropVocab = async (pick) => {
    const refs = App.allRefs(Array.from(S.items.values()), Array.from(S.files.values()));
    const ids = pick(App.itemsOf('vocab'), { srs: S.srs, refs });
    for (const id of ids) {
      S.items.delete(id);
      await App.db.del('items', id);
    }
    return ids.length;
  };
  const clearVocab = (level) => dropVocab((items, ctx) => K.vRemovable(level, items, ctx));
  const dropBelow = () => dropVocab((items, ctx) => K.vBelow(wk.state, items, ctx));

  // ---------- Aufräumen und Nachholen (wk.enrich), still im Hintergrund ----------
  // 1. Doppelte entfernen (gibt es schon als Vokabel oder Ausdruck, auch in anderer Schreibweise)
  // 2. Deutsch: Paket → übersetzte englische Bedeutung von WaniKani (nur mit Zustimmung zum Google Übersetzer)
  // 3. Beispielsatz: Satz-Index der Pakete → kürzester Tatoeba-Satz → kürzester Satz von WaniKani
  // Wort für Wort; nie über App.saveItem – das würde die Vokabel als bearbeitet markieren.
  // Ohne Internet oder wenn Tatoeba hakt, bleibt der Rest für den nächsten Lauf.
  const needsEx = (it) => !!it && it._wk && App.exampleLogic.needs(it);
  const needsMt = (it) => !!it && K.needsGerman(it) && !!S.settings.trConsent && !!K.enQuery(it);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const wkSentence = async (it) => {
    const s = (wk.state.vocab[String(it.id).replace(/^v-wk/, '')] || {}).s;
    if (!s) return null;
    let furi = '', de = '';
    try { const res = await App.sentenceReading(s.ja); if (!res.missing.length) furi = res.furi; } catch (e) { console.error(e); }
    if (S.settings.trConsent) { try { de = await App.exfillLogic.translate(s.ja, (u, o) => fetch(u, o)); } catch (e) { console.warn('Übersetzung: ' + e.message); } }
    return K.wkRow(s, furi, de);
  };
  const enrich = async () => {
    const wkItems = () => App.itemsOf('vocab').filter((it) => it._wk);
    if (!wkItems().length) return;
    const idx = await App.exampleIndex();
    const put = async (list) => { if (!list.length) return; const now = Date.now(); list.forEach((it) => { it.updated = now; }); await App.db.putMany('items', list); App.emit('items'); };
    await loadAlts(wkItems());
    const has = haveKeys(false);
    if (await dropVocab((items, ctx) => K.vDupes(items, (k) => has.has(k), altsOf, ctx))) App.emit('items');
    await put(packGerman(idx, wkItems()));
    await put(wkItems().filter((it) => needsEx(it) && App.exampleLogic.fill(idx, it)));
    let batch = [];
    for (const it of wkItems().filter((x) => needsEx(x) || needsMt(x))) {
      if (navigator.onLine === false) break;
      let de = '', row = null, failed = false;
      if (needsMt(it)) {
        try { de = await App.exfillLogic.translate(K.enQuery(it), (u, o) => fetch(u, o), 'en'); } catch (e) { console.warn('Übersetzung: ' + e.message); }
      }
      if (needsEx(it)) {
        try {
          const ex = K.pickTatoeba((await App.tatoeba.search(K.form(it), (u, o) => fetch(u, o)).more(5)).list, it);
          row = ex ? K.tatoebaRow(ex) : await wkSentence(it);
        } catch (e) { console.warn('Tatoeba: ' + e.message); failed = true; }
      }
      const cur = S.items.get(it.id);
      let changed = false;
      if (de && needsMt(cur)) { cur.de = de; cur._de = 'mt'; changed = true; }
      if (row && needsEx(cur)) { cur.examples = [row]; changed = true; }
      if (changed) batch.push(cur);
      if (batch.length >= 20) { await put(batch); batch = []; }
      if (failed) break;
      await pause(300);
    }
    await put(batch);
  };
  let enrichRun = null;
  wk.enrich = () => enrichRun || (enrichRun = enrich().catch((e) => console.error(e)).finally(() => { enrichRun = null; }));
  // Beim Einschalten wird das Wörterbuch (häufige Wörter) mit installiert, falls keins da ist – daraus kommen die anderen
  // Schreibweisen (入り口 = 入口) und die Lesung der WaniKani-Beispielsätze
  wk.setVocabLevel = async (level, on, onProgress) => {
    const set = new Set(wk.vLevels());
    if (on) {
      if (!App.dict.installed()) { try { await App.dict.install('dict-common', onProgress); } catch (e) { console.warn('WaniKani: Wörterbuch nicht installiert – ' + e.message); } }
      set.add(level);
      await fillVocab(level);
    } else { set.delete(level); await clearVocab(level); }
    await App.saveSettings({ wkVocabLevels: Array.from(set).sort((a, b) => a - b) });
    App.emit('items');
    if (on) wk.enrich();
  };
  wk.setLevel = async (level, on) => {
    const set = new Set(wk.levels());
    if (on) { set.add(level); await fill(level); } else { set.delete(level); await clear(level); }
    await App.saveSettings({ wkLevels: Array.from(set).sort((a, b) => a - b) });
    App.emit('items');
  };
  wk.disconnect = async () => {
    await clear(null);
    await clearVocab(null);
    wk.state = K.empty();
    await App.db.del('meta', 'wanikani');
    await App.saveSettings({ wkLevels: [], wkVocabLevels: [], writeSource: S.settings.writeSource === 'wk' ? 'all' : S.settings.writeSource });
    App.emit('items');
  };

  // Für Anzeige: Level und Stufe eines Zeichens (null = kein WaniKani-Kanji oder nicht verbunden)
  wk.info = (char) => { const k = wk.state.kanji[char]; return k ? { level: k.level, stage: wk.state.stage[char], name: K.stageName(wk.state.stage[char]), on: wk.levels().includes(k.level) } : null; };
  // Vokabel aus WaniKani: Level und Stufe (null = nicht von dort oder nicht verbunden)
  wk.vInfo = (it) => { const id = it && it._wk && it.type === 'vocab' ? String(it.id).slice(4) : '', v = wk.state.vocab[id]; return v ? { level: v.level, stage: wk.state.vstage[id], name: K.stageName(wk.state.vstage[id]) } : null; };
  // Zahlen einer Level-Zeile der Einstellungen
  wk.vStats = () => {
    const keys = haveKeys(true);
    const ctx = { hasKey: (k) => keys.has(k), hasId: (id) => S.items.has(id), alts: altsOf, known: (id) => { const s = S.srs.get('w:' + id); return S.items.has(id) && App.writeLogic.isKnown(s); } };
    return (level) => K.vLevelStats(wk.state, level, ctx);
  };
})(window.App);
