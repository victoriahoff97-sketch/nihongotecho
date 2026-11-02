/* Nihongo Techō – Gleiche Bedeutung (同義): Vokabeln mit derselben deutschen Bedeutung (reine Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const S = App.synonyms = {};

  const strip = (s) => String(s ?? '').replace(/[\s　〜～~]/g, '');
  const word = (it) => strip(it.kanji) || strip(it.kana);

  // Stichwörter, die nichts verbinden: gleich geschriebene deutsche Wörter mit verschiedener Bedeutung
  // (der Morgen 朝 / morgen 明日) oder so allgemein, dass die Gruppe nichts zeigt. Kleingeschrieben.
  S.STOP = ['morgen', 'gleich', 'sie', 'er', 'es', 'ich', 'tag', 'seite', 'nun', 'so', 'also', 'noch', 'schon',
    'mal', 'sein', 'haben', 'werden', 'lassen', 'stück', 'teil', 'art', 'sache', 'ding', 'zeit', 'ganz', 'aber', 'oder',
    'und', 'wie', 'was', 'da', 'dort', 'hier', 'ja', 'nein', 'nicht', 'kein', 'alle', 'etwas', 'viel', 'wenig',
    'laut', 'nach', 'recht', 'befinden', 'fest', 'sinn', 'vor', 'grad', 'treffen', 'ablegen', 'ausgehen'];

  // Von Hand: Wörter, die dasselbe meinen, aber im Deutschen verschieden heißen (Student / Schüler).
  // label: Überschrift der Gruppe · words: Schreibungen (mit Kanji, sonst Kana) wie in den Vokabeln
  S.EXTRA = [
    { label: 'Student · Schüler', words: ['学生', '生徒', '大学生', '留学生', '高校生', '中学生', '小学生'] },
    { label: 'Lehrer', words: ['先生', '教師', '教授'] },
    { label: 'anziehen · aufsetzen', words: ['着る', 'はく', '履く', 'かぶる', '被る', 'はめる', '締める'] },
    { label: 'ausziehen', words: ['脱ぐ', '外す'] },
    { label: 'froh · glücklich', words: ['嬉しい', '幸せ', '楽しい'] },
    { label: 'Familie', words: ['家族', '家庭', 'うち'] },
    { label: 'Haus · Wohnung', words: ['家', 'うち', 'お宅', 'アパート', 'マンション', '住まい'] },
    { label: 'Arbeit', words: ['仕事', '勤め', '働く', '勤める', 'バイト', 'アルバイト'] },
    { label: 'Essen · Mahlzeit', words: ['ご飯', '食事', '料理', '食べ物'] },
    { label: 'schön · hübsch', words: ['綺麗', 'きれい', '美しい', 'かわいい', '可愛い'] },
    { label: 'Freund', words: ['友達', '友人', '仲間', '彼氏'] },
  ];

  // Bedeutungstext in Stichwörter zerlegen: Trennung an ; und , außerhalb von Klammern,
  // Klammern, Artikel, „sich“ und Auslassungspunkte weg. „anziehen; tragen (Oberkörper, Kleid)“ → anziehen, tragen
  // Groß und klein bleiben verschieden: „das Leben“ (生活, 人生) und „leben“ (住む, 生きる) sind zwei Gruppen
  S.keys = (de) => {
    const parts = [];
    let depth = 0, cur = '';
    for (const c of String(de ?? '')) {
      if ('(（['.includes(c)) depth++;
      if (')）]'.includes(c)) depth = Math.max(0, depth - 1);
      if (!depth && (c === ';' || c === ',' || c === '；' || c === '、')) { parts.push(cur); cur = ''; } else cur += c;
    }
    parts.push(cur);
    const out = [];
    for (let p of parts) {
      p = p.replace(/\([^)]*\)|（[^）]*）|\[[^\]]*\]/g, '').replace(/[…~〜～.!?]/g, ' ').replace(/\s+/g, ' ').trim();
      // mit Artikel ist es ein Nomen: groß, auch wenn es klein eingetragen ist
      const noun = /^(der|die|das|ein|eine|einen)\s/i.test(p);
      p = p.replace(/^(der|die|das|ein|eine|einen|sich|zu|etw\.?|jdn\.?|jdm\.?)\s+/i, '').replace(/^(der|die|das|sich)\s+/i, '');
      if (noun) p = p.charAt(0).toUpperCase() + p.slice(1);
      // lange Umschreibungen sind keine Stichwörter
      if (p.length < 3 || p.split(' ').length > 2 || S.STOP.includes(p.toLowerCase())) continue;
      if (!out.includes(p)) out.push(p);
    }
    return out;
  };

  // Alle Gruppen: mindestens zwei verschiedene Wörter mit demselben Stichwort, dazu die von Hand verbundenen.
  // Je Schreibung zählt ein Eintrag (Genki und JLPT): der mit dem höchsten rank. Gleiche Wortmengen werden eine Gruppe.
  S.groups = (vocab, rank = () => 0) => {
    const best = new Map();
    for (const it of vocab) {
      if (!it || it.type !== 'vocab' || !word(it)) continue;
      const w = word(it);
      if (!best.has(w) || rank(it) > rank(best.get(w))) best.set(w, it);
    }
    const map = new Map();
    const add = (key, label, it) => {
      if (!map.has(key)) map.set(key, { key, labels: [label], items: [] });
      const g = map.get(key);
      if (!g.items.includes(it)) g.items.push(it);
    };
    // von Hand zuerst: bei gleichen Wörtern gilt ihre Überschrift
    S.EXTRA.forEach((x) => x.words.forEach((w) => best.has(w) && add('＊' + x.label, x.label, best.get(w))));
    best.forEach((it) => S.keys(it.de).forEach((k) => add(k, k, it)));
    // die Stichwörter der Überschrift gehören zur Gruppe von Hand: ein neues Wort mit „anziehen“ kommt dorthin
    S.EXTRA.forEach((x) => S.keys(x.label.replace(/ · /g, ';')).forEach((k) => {
      if (!map.has(k)) return;
      map.get(k).items.forEach((it) => add('＊' + x.label, x.label, it));
      map.delete(k);
    }));
    const out = [], bySet = new Map();
    map.forEach((g) => {
      if (g.items.length < 2) return;
      const id = g.items.map(word).sort().join('|');
      const same = bySet.get(id);
      // dieselben Wörter unter mehreren Stichwörtern (machen / tun): eine Gruppe, beide Überschriften
      if (same) { if (!same.key.startsWith('＊')) g.labels.forEach((l) => !same.labels.includes(l) && same.labels.push(l)); return; }
      bySet.set(id, g);
      out.push(g);
    });
    // Gruppen von Hand stecken die automatischen mit denselben (oder weniger) Wörtern ein
    return out.filter((g) => g.key.startsWith('＊') || !out.some((h) => h !== g && h.key.startsWith('＊') && g.items.every((it) => h.items.includes(it))));
  };

  S.label = (g) => g.labels.join(' · ');

  // Sichtbar ist eine Gruppe, sobald eines ihrer Wörter gelernt wird – wie beim Gleichklang
  S.visible = (groups, statusOf) => groups.filter((g) => g.items.some((it) => statusOf(it.id) !== 'unchecked'));

  // Gruppen, in denen das Wort steht (für den Hinweis an der Vokabel)
  S.groupsOf = (it, groups) => groups.filter((g) => g.items.some((o) => o.id === it.id || word(o) === word(it)));

  // Suche: deutsches Stichwort, Lesung (Kana oder Romaji), Schreibung oder Bedeutung
  S.matches = (g, query) => {
    const q = String(query ?? '').trim().toLowerCase();
    if (!q) return true;
    if (S.label(g).toLowerCase().includes(q)) return true;
    const kana = JP.toHira(strip(JP.looksRomaji(q) ? JP.romaji(q) : q));
    return g.items.some((it) => (kana && JP.toHira(strip(it.kana)).includes(kana)) || String(it.kanji || '').includes(q) || String(it.de || '').toLowerCase().includes(q));
  };

  // Reihenfolge: neu Gelerntes zuerst (wie Gleichklang), sonst nach dem deutschen Stichwort
  S.sort = (groups, changedAt, now, fresh = 7 * 864e5) => groups.map((g) => {
    const last = Math.max(0, ...g.items.map((it) => changedAt(it) || 0));
    return Object.assign({}, g, { last, fresh: now - last < fresh });
  }).sort((a, b) => (b.fresh - a.fresh) || (a.fresh ? b.last - a.last : 0) || S.label(a).localeCompare(S.label(b), 'de'));
})(window.App);
