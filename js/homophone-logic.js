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
  // Nur Schreibungen mit Kanji zählen: ein Kana-Eintrag kann dasselbe Wort sein wie der mit Kanji (かける / 掛ける)
  // Ausnahmen, von Hand geprüft: Bei diesen Lesungen ist der Kana-Eintrag ein eigenes Wort neben dem mit Kanji
  // (なる werden / 鳴る klingeln). Neue Fälle hier eintragen – am Bedeutungstext lässt sich das nicht ablesen:
  // かける „anrufen“ und 掛ける „aufhängen“ sind dasselbe Wort.
  H.KANA_WORDS = ['なる', 'いる', 'つける', 'くれる', 'おる'];
  const spelling = (it) => {
    const k = strip(it.kanji);
    if (JP.hasKanji(k)) return k;
    return !isPart(it) && H.KANA_WORDS.includes(H.reading(it)) ? H.reading(it) : '';
  };

  // Alle Gruppen: gleiche Lesung, mindestens zwei verschiedene Kanji-Schreibungen. Reihenfolge wie in der Liste.
  // Je Schreibung bleibt ein Eintrag (doppelt angelegte Wörter): der mit dem höchsten rank, sonst der erste.
  H.groups = (vocab, rank = () => 0) => {
    const map = new Map();
    for (const it of vocab) {
      if (!it || it.type !== 'vocab' || !H.reading(it) || !spelling(it)) continue;
      const k = H.key(it);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    const out = [];
    map.forEach((items, key) => {
      const best = new Map();
      items.forEach((it) => { const s = spelling(it); if (!best.has(s) || rank(it) > rank(best.get(s))) best.set(s, it); });
      if (best.size > 1) out.push({ key, kana: key, items: items.filter((it) => best.get(spelling(it)) === it) });
    });
    return out;
  };

  // Sichtbar ist eine Gruppe, sobald eines ihrer Wörter gelernt wird (Lernstapel oder „kann ich“)
  H.visible = (groups, statusOf) => groups.filter((g) => g.items.some((it) => statusOf(it.id) !== 'unchecked'));

  // Die anderen Wörter derselben Gruppe (für den Hinweis am Wort)
  H.partners = (it, vocab, rank) => {
    const g = H.groups(vocab, rank).find((x) => x.key === H.key(it));
    const s = spelling(it);
    return g && s ? g.items.filter((o) => spelling(o) !== s) : [];
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
