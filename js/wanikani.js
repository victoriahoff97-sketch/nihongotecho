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
    for (const l of keepV) await fillVocab(l); // Vokabeln, die inzwischen Guru sind
    await App.db.putMany('items', await german(App.itemsOf('vocab').filter((it) => it._wk))); // Deutsch nachtragen, falls das Wörterbuch erst jetzt da ist
    App.emit('items');
    return wk.state;
  };
  wk.connect = (token) => wk.sync(String(token || '').trim());
  // Höchstens einmal am Tag von selbst, still im Hintergrund
  wk.autoSync = () => {
    if (!wk.connected() || navigator.onLine === false || Date.now() - (wk.state.syncedAt || 0) < DAY) return;
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
  // Deutsche Bedeutung aus dem Wörterbuch eintragen (ohne Wörterbuch oder ohne Treffer bleibt die englische von WaniKani);
  // liefert die geänderten Einträge. Bearbeitetes wird nie angefasst.
  const german = async (items) => {
    const todo = items.filter((it) => !it.de && !it._edited);
    if (!todo.length || !App.dict.installed()) return [];
    let hits;
    try { hits = await App.dict.lookup(todo.map(K.form)); } catch (e) { console.error(e); return []; }
    return todo.filter((it) => { const e = K.pickDict(hits.get(K.form(it)), it); if (e) it.de = K.gloss(e.de); return !!e; });
  };
  // Vokabeln eines Levels anlegen, die bei WaniKani ab Guru sind – Wörter, die es schon gibt, bleiben bei ihrer Quelle
  const fillVocab = async (level) => {
    const keys = new Set(App.itemsOf('vocab').map(App.vocabKey));
    const adds = K.vMissing(wk.state, level, { hasKey: (k) => keys.has(k), hasId: (id) => S.items.has(id) });
    await german(adds);
    const now = Date.now();
    adds.forEach((it, i) => { it.created = it.updated = now + i; if (App.levelFor) it.level = App.levelFor(it); S.items.set(it.id, it); }); // + i: WaniKani-Reihenfolge bleibt die Lernreihenfolge
    await App.db.putMany('items', adds);
  };
  const clearVocab = async (level) => {
    const refs = App.allRefs(Array.from(S.items.values()), Array.from(S.files.values()));
    for (const id of K.vRemovable(level, App.itemsOf('vocab'), { srs: S.srs, refs })) {
      S.items.delete(id);
      await App.db.del('items', id);
    }
  };
  // Beim Einschalten wird das Wörterbuch (häufige Wörter) mit installiert, falls keins da ist – daraus kommt das Deutsch
  wk.setVocabLevel = async (level, on, onProgress) => {
    const set = new Set(wk.vLevels());
    if (on) {
      if (!App.dict.installed()) { try { await App.dict.install('dict-common', onProgress); } catch (e) { console.warn('WaniKani: Wörterbuch nicht installiert – ' + e.message); } }
      set.add(level);
      await fillVocab(level);
    } else { set.delete(level); await clearVocab(level); }
    await App.saveSettings({ wkVocabLevels: Array.from(set).sort((a, b) => a - b) });
    App.emit('items');
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
    const keys = new Set(App.itemsOf('vocab').map(App.vocabKey));
    const ctx = { hasKey: (k) => keys.has(k), hasId: (id) => S.items.has(id), known: (id) => { const s = S.srs.get('w:' + id); return S.items.has(id) && App.writeLogic.isKnown(s); } };
    return (level) => K.vLevelStats(wk.state, level, ctx);
  };
})(window.App);
