/* Nihongo Techō – Gleichklang: Vokabeln mit gleicher Lesung, aber anderer Schreibung (reine Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const H = App.homophones = {};
  const DAY = 864e5;
  H.FRESH_DAYS = 7;

  const TILDE = /[〜～~]/;
  const strip = (s) => String(s ?? '').replace(/[\s　〜～~]/g, '');
  const isPart = (it) => TILDE.test(String(it.kana || '') + String(it.kanji || ''));
  // Lesung der Grundform; Wortteile (～回) bekommen eine eigene Kennung und bleiben so unter sich
  H.reading = (it) => JP.toHira(strip(it.kana));
  H.key = (it) => (isPart(it) ? '～' : '') + H.reading(it);
  const spelling = (it) => strip(it.kanji) || H.reading(it);

  // Alle Gruppen: gleiche Lesung, mindestens zwei verschiedene Schreibungen. Reihenfolge wie in der Liste.
  H.groups = (vocab) => {
    const map = new Map();
    for (const it of vocab) {
      if (!it || it.type !== 'vocab' || !H.reading(it)) continue;
      const k = H.key(it);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    const out = [];
    map.forEach((items, key) => {
      if (new Set(items.map(spelling)).size > 1) out.push({ key, kana: key, items });
    });
    return out;
  };

  // Sichtbar ist eine Gruppe, sobald eines ihrer Wörter gelernt wird (Lernstapel oder „kann ich“)
  H.visible = (groups, statusOf) => groups.filter((g) => g.items.some((it) => statusOf(it.id) !== 'unchecked'));

  // Die anderen Wörter derselben Gruppe (für den Hinweis am Wort)
  H.partners = (it, vocab) => {
    const g = H.groups(vocab).find((x) => x.items.some((o) => o.id === it.id));
    return g ? g.items.filter((o) => o.id !== it.id) : [];
  };

  // 'same' | 'diff', wenn der Akzent aller Wörter bekannt ist – sonst null
  H.pitch = (group, accentOf) => {
    const a = group.items.map(accentOf);
    if (a.some((x) => !x)) return null;
    return new Set(a.map((x) => x.main)).size > 1 ? 'diff' : 'same';
  };

  // Verben verschiedener Klasse: gleich nur in der Grundform (帰る → 帰ります, 変える → 変えます)
  H.conjDiffers = (group) => {
    const verbs = group.items.filter((it) => it.pos === 'verb' && it.v && it.v.cls);
    return new Set(verbs.map((it) => it.v.cls)).size > 1;
  };

  // Suche: Lesung (Kana oder Romaji), Schreibung oder Bedeutung
  H.matches = (group, query) => {
    const q = String(query ?? '').trim().toLowerCase();
    if (!q) return true;
    const kana = JP.toHira(strip(JP.looksRomaji(q) ? JP.romaji(q) : q));
    const reading = group.kana.replace('～', '');
    if (kana && reading.includes(kana)) return true;
    return group.items.some((it) => String(it.kanji || '').includes(q) || `${it.de || ''} ${it.en || ''}`.toLowerCase().includes(q));
  };

  // Gruppen, in denen sich zuletzt etwas getan hat, stehen oben (jüngste zuerst); der Rest nach Lesung
  H.sort = (groups, changedAt, now) => {
    const rows = groups.map((g) => {
      const last = Math.max(0, ...g.items.map((it) => changedAt(it) || 0));
      return Object.assign({}, g, { last, fresh: now - last < H.FRESH_DAYS * DAY });
    });
    const reading = (g) => g.kana.replace('～', '');
    return rows.sort((a, b) => (b.fresh - a.fresh) || (a.fresh ? b.last - a.last : 0) || reading(a).localeCompare(reading(b), 'ja') || a.kana.localeCompare(b.kana, 'ja'));
  };
})(window.App);
