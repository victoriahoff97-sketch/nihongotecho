/* Nihongo Techō – WaniKani: Verbindung, Abgleich und Level-Freischaltung für „Kanji schreiben“ */
'use strict';
(function (App) {
  const K = App.wkLogic;
  const S = App.store;
  const API = 'https://api.wanikani.com/v2/';
  const DAY = 864e5;

  // Zustand liegt in meta unter „wanikani“ – getrennt von den Einstellungen, damit Schlüssel und WaniKani-Daten
  // nie in Backup oder Teilen-Paket landen: { token, user, syncedAt, subjectsAt, assignmentsAt, kanji, stage }
  const wk = App.wk = { state: K.empty() };
  wk.load = async () => { const m = await App.db.get('meta', 'wanikani'); wk.state = Object.assign(K.empty(), m && m.value); };
  const save = () => App.db.put('meta', { key: 'wanikani', value: wk.state });
  wk.connected = () => !!wk.state.token;
  wk.levels = () => S.settings.wkLevels || [];

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

  // Abgleich: Level, Kanji je Level und Stufe je Kanji. Schlägt etwas fehl, bleibt der letzte Stand unverändert.
  wk.sync = async (token = wk.state.token) => {
    if (!token) throw fail('auth');
    const next = token === wk.state.token ? JSON.parse(JSON.stringify(wk.state)) : K.empty(); // anderer Schlüssel = von vorn
    const user = await get(token, API + 'user');
    next.user = { level: user.data.level, username: user.data.username };
    const sAt = await pages(token, API + 'subjects?types=kanji' + since(next.subjectsAt), (p) => K.mergeSubjects(next, p));
    if (sAt) next.subjectsAt = sAt;
    const aAt = await pages(token, API + 'assignments?subject_types=kanji' + since(next.assignmentsAt), (p) => K.mergeAssignments(next, p));
    if (aAt) next.assignmentsAt = aAt;
    next.token = token;
    next.syncedAt = Date.now();
    wk.state = next;
    await save();
    // Level über dem eigenen WaniKani-Level gibt es nicht (z. B. nach einem Zurücksetzen dort)
    const keep = wk.levels().filter((l) => l <= next.user.level);
    if (keep.length !== wk.levels().length) await App.saveSettings({ wkLevels: keep });
    for (const l of keep) await fill(l); // neu hinzugekommene Kanji eingeschalteter Level
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
  wk.setLevel = async (level, on) => {
    const set = new Set(wk.levels());
    if (on) { set.add(level); await fill(level); } else { set.delete(level); await clear(level); }
    await App.saveSettings({ wkLevels: Array.from(set).sort((a, b) => a - b) });
    App.emit('items');
  };
  wk.disconnect = async () => {
    await clear(null);
    wk.state = K.empty();
    await App.db.del('meta', 'wanikani');
    await App.saveSettings({ wkLevels: [], writeSource: S.settings.writeSource === 'wk' ? 'all' : S.settings.writeSource });
    App.emit('items');
  };

  // Für Anzeige: Level und Stufe eines Zeichens (null = kein WaniKani-Kanji oder nicht verbunden)
  wk.info = (char) => { const k = wk.state.kanji[char]; return k ? { level: k.level, stage: wk.state.stage[char], name: K.stageName(wk.state.stage[char]), on: wk.levels().includes(k.level) } : null; };
})(window.App);
