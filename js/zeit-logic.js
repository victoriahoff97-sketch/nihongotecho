/* Nihongo Techō – Zeitangaben mit Zahlen („Welche Form?“): Formen, Lesungen, deutsche Texte, Aufgaben, Prüfung (reine Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const Z = App.zeitLogic = {};

  // ---------- Lesungen 1–10 (Index = Zahl), zweite übliche Lesungen extra ----------
  const KAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const L = (s) => [''].concat(s.split(' '));
  const R = {
    fun: L('いっぷん にふん さんぷん よんぷん ごふん ろっぷん ななふん はっぷん きゅうふん じゅっぷん'),
    ji: L('いちじ にじ さんじ よじ ごじ ろくじ しちじ はちじ くじ じゅうじ'),
    hi: L('ついたち ふつか みっか よっか いつか むいか なのか ようか ここのか とおか'),
    shuu: L('いっしゅう にしゅう さんしゅう よんしゅう ごしゅう ろくしゅう ななしゅう はっしゅう きゅうしゅう じゅっしゅう'),
    kagetsu: L('いっかげつ にかげつ さんかげつ よんかげつ ごかげつ ろっかげつ ななかげつ はっかげつ きゅうかげつ じゅっかげつ'),
    gatsu: L('いちがつ にがつ さんがつ しがつ ごがつ ろくがつ しちがつ はちがつ くがつ じゅうがつ'),
    nen: L('いちねん にねん さんねん よねん ごねん ろくねん ななねん はちねん きゅうねん じゅうねん'),
    haku: L('いっぱく にはく さんぱく よんはく ごはく ろっぱく ななはく はっぱく きゅうはく じゅっぱく'),
    kai: L('いっかい にかい さんかい よんかい ごかい ろっかい ななかい はっかい きゅうかい じゅっかい'),
  };
  const ALSO = {
    fun: { 8: ['はちふん'], 10: ['じっぷん'] },
    ji: { 7: ['ななじ'] },
    shuu: { 10: ['じっしゅう'] },
    kagetsu: { 8: ['はちかげつ'], 10: ['じっかげつ'] },
    nen: { 7: ['しちねん'] },
    haku: { 4: ['よんぱく'], 8: ['はちはく'], 10: ['じっぱく'] },
    kai: { 8: ['はちかい'], 10: ['じっかい'] },
  };
  // Tage als Anzahl: 1 = いちにち, sonst wie das Datum
  R.nichi = R.hi.map((x, i) => (i === 1 ? 'いちにち' : x));
  const KJ = { fun: '分', ji: '時', hi: '日', nichi: '日', shuu: '週', kagetsu: 'か月', gatsu: '月', nen: '年', haku: '泊', kai: '回' };
  // Zahl + Zähler mit allen Lesungen: [[Kanji, Kana], …], die erste ist die übliche
  const num = (c, n) => [R[c][n]].concat((ALSO[c] || {})[n] || []).map((kana) => [KAN[n] + KJ[c], kana]);

  // ---------- Formen ----------
  // Eine Form = Liste von Teilen; Teil = Kana-Text oder [[Kanji, Kana], …] (Varianten). Kombiniert ergibt das Lösung + alt.
  const add = (c, n, k, r) => num(c, n).map(([a, b]) => [a + k, b + r]);
  const BUILD = {
    min: { dauer: (n) => [add('fun', n, '', '').concat(add('fun', n, '間', 'かん'))], nach: (n) => [add('fun', n, '後', 'ご')], vor: (n) => [add('fun', n, '前', 'まえ')] },
    std: {
      punkt: (n) => [num('ji', n)], dauer: (n) => [add('ji', n, '間', 'かん')],
      nach: (n) => [add('ji', n, '間後', 'かんご')], vor: (n) => [add('ji', n, '間前', 'かんまえ')],
    },
    tag: {
      punkt: (n) => [num('hi', n)],
      dauer: (n) => [n === 1 ? num('nichi', 1) : add('nichi', n, '間', 'かん').concat(num('nichi', n))],
      xte: (n) => [add('nichi', n, '目', 'め')], nach: (n) => [add('nichi', n, '後', 'ご')], vor: (n) => [add('nichi', n, '前', 'まえ')],
      oft: (n) => [[['一日', 'いちにち']], 'に', num('kai', n)],
      alle: (n) => (n > 1 ? [num('nichi', n), 'に', [['一回', 'いっかい']]] : null),
    },
    woche: {
      dauer: (n) => [add('shuu', n, '間', 'かん')], xte: (n) => [add('shuu', n, '目', 'め')],
      nach: (n) => [add('shuu', n, '間後', 'かんご')], vor: (n) => [add('shuu', n, '間前', 'かんまえ')],
      oft: (n) => [[['週', 'しゅう'], ['一週間', 'いっしゅうかん']], 'に', num('kai', n)],
      alle: (n) => (n > 1 ? [add('shuu', n, '間', 'かん'), 'に', [['一回', 'いっかい']]] : null),
    },
    monat: {
      punkt: (n) => [num('gatsu', n)], dauer: (n) => [num('kagetsu', n)], xte: (n) => [add('kagetsu', n, '目', 'め')],
      nach: (n) => [add('kagetsu', n, '後', 'ご')], vor: (n) => [add('kagetsu', n, '前', 'まえ')],
      oft: (n) => [[['月', 'つき'], ['一か月', 'いっかげつ']], 'に', num('kai', n)],
    },
    jahr: {
      dauer: (n) => [add('nen', n, '間', 'かん').concat(num('nen', n))], xte: (n) => [add('nen', n, '目', 'め')],
      nach: (n) => [add('nen', n, '後', 'ご')], vor: (n) => [add('nen', n, '前', 'まえ')],
      oft: (n) => [[['年', 'ねん'], ['一年', 'いちねん']], 'に', num('kai', n)],
    },
    nacht: { dauer: (n) => [num('haku', n)], reise: (n) => (n < 10 ? [num('haku', n), num('nichi', n + 1)] : null) },
    mal: { anzahl: (n) => [num('kai', n)], xte: (n) => [add('kai', n, '目', 'め')] },
  };
  // alle Kombinationen der Teile → Notationen, die erste = Musterlösung
  const combine = (parts) => {
    let out = [''];
    for (const p of parts) {
      const opts = typeof p === 'string' ? [p] : p.map(([k, r]) => JP.notate(k, r));
      out = out.flatMap((a) => opts.map((b) => a + b));
    }
    return out;
  };

  // ---------- Deutsch ----------
  const ZAHL = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'];
  const ORD = ['', 'erst', 'zweit', 'dritt', 'viert', 'fünft', 'sechst', 'siebt', 'acht', 'neunt', 'zehnt'];
  const MONAT = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  // Einheit: Singular, Geschlecht, Plural, Dativ Plural
  const WORT = {
    min: ['Minute', 'f', 'Minuten', 'Minuten'], std: ['Stunde', 'f', 'Stunden', 'Stunden'], tag: ['Tag', 'm', 'Tage', 'Tagen'],
    woche: ['Woche', 'f', 'Wochen', 'Wochen'], monat: ['Monat', 'm', 'Monate', 'Monaten'], jahr: ['Jahr', 'n', 'Jahre', 'Jahren'],
    nacht: ['Nacht', 'f', 'Nächte', 'Nächten'], mal: ['Mal', 'n', 'Mal', 'Mal'],
  };
  const AKK = { m: 'einen', f: 'eine', n: 'ein' }, DAT = { m: 'einem', f: 'einer', n: 'einem' }, DER = { m: 'der', f: 'die', n: 'das' };
  const AM = { tag: 'am', woche: 'in der', monat: 'im', jahr: 'im', mal: 'beim' };
  const mal = (n) => (n === 1 ? 'einmal' : ZAHL[n] + 'mal');
  const deOf = (unit, n) => {
    const [sg, g, pl, dpl] = WORT[unit];
    const akk = n === 1 ? `${AKK[g]} ${sg}` : `${ZAHL[n]} ${pl}`;
    const dat = n === 1 ? `${DAT[g]} ${sg}` : `${ZAHL[n]} ${dpl}`;
    const S = {
      akk: () => akk, lang: () => akk + ' lang', fuer: () => 'für ' + akk,
      nach: () => 'nach ' + dat, in: () => 'in ' + dat, vor: () => 'vor ' + dat,
      der: () => `${DER[g]} ${ORD[n]}e ${sg}`, am: () => `${AM[unit]} ${ORD[n]}en ${sg}`,
      punkt: () => (unit === 'tag' ? `am ${n}.` : unit === 'monat' ? 'im ' + MONAT[n] : `um ${ZAHL[n]} Uhr`),
      mal: () => mal(n), oft: () => `${mal(n)} pro ${sg}`, alle: () => `alle ${ZAHL[n]} ${pl}`,
      reise: () => `${n === 1 ? 'eine Nacht' : ZAHL[n] + ' Nächte'} und ${ZAHL[n + 1]} Tage`,
    };
    return (style) => S[style]();
  };

  Z.form = (unit, form, n) => {
    const b = BUILD[unit] && BUILD[unit][form];
    if (!b || !(n >= 1 && n <= 10)) return null;
    const parts = b(n);
    if (!parts) return null;
    const all = Array.from(new Set(combine(parts)));
    return { unit, form, n, jp: all[0], alt: all.slice(1), de: deOf(unit, n) };
  };

  // ---------- Regeln (eine Zeile nach der Antwort) ----------
  Z.RULES = {
    'tag-punkt': 'Datum: 三日（みっか）= der 3., ohne 間. Der 1. heißt ついたち.',
    'monat-punkt': 'Monatsname: 〜月（がつ）. 三月 = März – drei Monate wären 三か月.',
    'std-punkt': 'Uhrzeit: 〜時（じ）. Wie lange wäre 〜時間（じかん）.',
    'tag-dauer': 'Wie lange: 〜日間, ab 2 Tagen wie das Datum (三日間). Ein Tag = 一日（いちにち）. Ohne Partikel.',
    'monat-dauer': 'Wie lange: 〜か月（かげつ）, ohne Partikel. Nicht 三月 – das ist März.',
    'min-dauer': 'Wie lange: 〜分（ふん / ぷん）, 間 kann dazu. Ohne Partikel.',
    'nacht-dauer': 'Nächte zählt man mit 〜泊（はく / ぱく）.',
    'nacht-reise': 'Reisedauer: Nächte + Tage, z. B. 二泊三日（にはくみっか）.',
    'mal-xte': 'Das x-te Mal: 〜回目（かいめ）.',
    dauer: 'Wie lange / für …: 〜間（かん）, ohne Partikel.',
    xte: 'Der x-te: 〜目（め）.',
    nach: 'Nach / in …: 〜後（ご）, meist mit に.',
    vor: 'Vor …: 〜前（まえ）, meist mit に.',
    anzahl: 'Wie oft insgesamt: 〜回（かい）.',
    oft: 'Wie oft pro …: Zeitraum + に + Anzahl 回 (週に三回).',
    alle: 'Alle n Tage / Wochen: Zeitraum + に + 一回 (三日に一回).',
  };
  const ruleOf = (unit, form) => Z.RULES[unit + '-' + form] || Z.RULES[form];

  // ---------- Satzrahmen ----------
  // {X} = die gesuchte Zeitangabe auf Deutsch (im Stil style), ＿＿ = die Lücke im japanischen Satz
  const N = (a, b) => Array.from({ length: b - a + 1 }, (x, i) => a + i);
  Z.FRAMES = [
    { form: 'dauer', units: ['tag', 'woche', 'monat'], style: 'lang', de: 'Ich bleibe {X} in Kyoto.', jp: '京都[きょうと]に＿＿います。' },
    { form: 'dauer', units: ['std', 'tag', 'woche', 'monat', 'jahr'], style: 'lang', de: 'Ich habe {X} Japanisch gelernt.', jp: '＿＿日本語[にほんご]を勉強[べんきょう]しました。' },
    { form: 'dauer', units: ['tag', 'woche', 'monat'], style: 'fuer', de: 'Ich fahre {X} nach Japan.', jp: '＿＿日本[にほん]に行[い]きます。' },
    { form: 'dauer', units: ['min', 'std'], style: 'lang', de: 'Ich habe {X} gewartet.', jp: '＿＿待[ま]ちました。' },
    { form: 'dauer', units: ['nacht'], nums: N(1, 7), style: 'fuer', de: 'Ich habe {X} reserviert.', jp: '＿＿予約[よやく]しました。' },
    { form: 'dauer', units: ['nacht'], nums: N(1, 5), style: 'akk', de: 'Wir übernachten {X} im Ryokan.', jp: '旅館[りょかん]に＿＿します。' },
    { form: 'reise', units: ['nacht'], nums: N(1, 4), style: 'reise', de: 'Die Reise dauert {X}.', jp: '旅行[りょこう]は＿＿です。' },
    { form: 'xte', units: ['tag', 'woche', 'monat', 'jahr'], style: 'der', de: 'Heute ist {X} in Japan.', jp: '今日[きょう]は日本[にほん]で＿＿です。' },
    { form: 'xte', units: ['tag'], style: 'am', de: '{X} bin ich nach Nara gefahren.', jp: '＿＿に奈良[なら]に行[い]きました。' },
    { form: 'xte', units: ['mal'], nums: N(2, 10), style: 'der', de: 'Das ist {X} in Tokyo.', jp: '東京[とうきょう]は＿＿です。' },
    { form: 'nach', units: ['std', 'tag', 'woche', 'monat', 'jahr'], style: 'nach', de: '{X} bin ich nach Hause zurückgekommen.', jp: '＿＿にうちに帰[かえ]りました。' },
    { form: 'nach', units: ['tag', 'woche', 'monat', 'jahr'], style: 'in', de: '{X} fahre ich nach Japan.', jp: '＿＿に日本[にほん]に行[い]きます。' },
    { form: 'nach', units: ['min', 'std'], style: 'in', de: 'Der Zug kommt {X}.', jp: '電車[でんしゃ]は＿＿に来[き]ます。' },
    { form: 'vor', units: ['tag', 'woche', 'monat', 'jahr'], style: 'vor', de: '{X} bin ich nach Japan gekommen.', jp: '＿＿に日本[にほん]に来[き]ました。' },
    { form: 'vor', units: ['min', 'std'], style: 'vor', de: 'Ich habe {X} gegessen.', jp: '＿＿に食[た]べました。' },
    { form: 'punkt', units: ['tag'], style: 'punkt', de: '{X} fahre ich nach Kyoto.', jp: '＿＿に京都[きょうと]に行[い]きます。' },
    { form: 'punkt', units: ['monat'], style: 'punkt', de: '{X} fahre ich nach Japan.', jp: '＿＿に日本[にほん]に行[い]きます。' },
    { form: 'punkt', units: ['std'], nums: N(4, 10), style: 'punkt', de: 'Ich stehe {X} auf.', jp: '＿＿に起[お]きます。' },
    { form: 'anzahl', units: ['mal'], nums: N(1, 5), style: 'mal', de: 'Ich habe den Film {X} gesehen.', jp: 'その映画[えいが]を＿＿見[み]ました。' },
    { form: 'oft', units: ['tag'], nums: N(1, 4), style: 'oft', de: 'Ich nehme die Medizin {X}.', jp: '薬[くすり]を＿＿飲[の]みます。' },
    { form: 'oft', units: ['woche', 'monat'], nums: N(1, 5), style: 'oft', de: 'Ich gehe {X} ins Café.', jp: '＿＿カフェに行[い]きます。' },
    { form: 'oft', units: ['jahr'], nums: N(1, 3), style: 'oft', de: 'Ich fahre {X} nach Japan.', jp: '＿＿日本[にほん]に行[い]きます。' },
    { form: 'alle', units: ['tag', 'woche'], nums: N(2, 5), style: 'alle', de: 'Ich rufe meine Mutter {X} an.', jp: '＿＿母[はは]に電話[でんわ]します。' },
  ];
  const numsOf = (f) => f.nums || N(1, 10);

  Z.task = (frame, unit, n) => {
    const f = Z.form(unit, frame.form, n);
    if (!f) return null;
    const deX = f.de(frame.style);
    const de = frame.de.replace('{X}', deX).replace(/^./, (c) => c.toUpperCase());
    return {
      key: [frame.de, unit, n].join('|'), de, deX, jp: frame.jp, after: frame.jp.split('＿＿')[1] || '',
      solution: f.jp, alt: f.alt, rule: ruleOf(unit, frame.form), unit, form: frame.form, n,
    };
  };

  // Eine Runde: Formen wechseln sich ab; mindestens einmal Monat (März ↔ drei Monate), Tag (Datum ↔ Dauer) und Nächte
  Z.round = ({ n = 10, rnd = Math.random } = {}) => {
    const all = [];
    Z.FRAMES.forEach((f) => f.units.forEach((u) => numsOf(f).forEach((x) => all.push([f, u, x]))));
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const out = [], keys = new Set(), pairs = new Set();
    const take = (list) => {
      const fresh = list.filter(([f, u, x]) => !keys.has([f.de, u, x].join('|')));
      const better = fresh.filter(([f, u]) => !pairs.has(u + f.form));
      const c = pick(better.length ? better : fresh);
      if (!c) return;
      const t = Z.task(c[0], c[1], c[2]);
      keys.add(t.key); pairs.add(t.unit + t.form); out.push(t);
    };
    take(all.filter(([f, u]) => u === 'monat' && /punkt|dauer/.test(f.form)));
    take(all.filter(([f, u]) => u === 'tag' && /punkt|dauer/.test(f.form)));
    take(all.filter(([f, u]) => u === 'nacht'));
    const forms = Array.from(new Set(Z.FRAMES.map((f) => f.form)));
    for (let i = forms.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [forms[i], forms[j]] = [forms[j], forms[i]]; }
    for (let i = 0; out.length < n && i < n * 10; i++) take(all.filter(([f]) => f.form === forms[i % forms.length]));
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out.slice(0, n);
  };

  // ---------- Prüfung ----------
  // Ziffern → Kanji-Zahlen (1–10), ヶ/ヵ/カ/ケ vor 月 → か; ein に, das im Satz schon nach der Lücke steht, darf mit dabei sein
  const ZIFF = '０１２３４５６７８９';
  const prep = (raw, t) => {
    let s = JP.romaji(String(raw ?? '').trim()).replace(/[０-９]/g, (c) => String(ZIFF.indexOf(c)));
    s = s.replace(/10|[1-9]/g, (d) => KAN[Number(d)]).replace(/[ヶヵカケ](?=月)/g, 'か');
    if (/^に/.test(t.after)) s = s.replace(/に$/, '');
    return s;
  };
  Z.check = (raw, t, readingsOf) => App.drillLogic.sameAnswer(prep(raw, t), [t.solution].concat(t.alt), readingsOf);
})(window.App);
