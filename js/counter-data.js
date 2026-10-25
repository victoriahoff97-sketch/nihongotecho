/* Nihongo Techō – Zähler-Übersicht in den Ausdrücken: jeder Zähler mit 1–10, Fragewort und Besonderheiten (Daten + reine Logik) */
'use strict';
(function (App) {
  const C = App.counters = {};

  const KAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  // Zahl-Lesungen für die Regel „Zahl + Zähler“ – alles, was davon abweicht, gilt als Besonderheit
  const NUM = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];

  // r: zehn Lesungen, Leerzeichen dazwischen, zweite Lesungen mit „/“ · kj: abweichende Schreibungen (Index = Zahl)
  // q: [Schreibung, Lesung] der Frage · extra: [Zahl, Schreibung, Lesung, besonders?] · own: eigene Zahlwörter, nichts hervorheben
  // re: welche Ausdrücke der Gruppe „Zähler“ dazugehören (Standard: enthält den Zähler) · g: Gruppe mit passenden Ausdrücken
  C.SECTIONS = [
    { title: 'Dinge', items: [
      { id: 'tsu', k: 'つ', kana: 'つ', de: 'Dinge allgemein', ex: 'alles ohne eigenen Zähler – Äpfel, Fragen, Bestellungen',
        r: 'ひとつ ふたつ みっつ よっつ いつつ むっつ ななつ やっつ ここのつ とお', kj: { 10: '十' }, q: ['いくつ', 'いくつ'], own: true,
        re: /^[一二三四五六七八九]つ$|^十$|いくつ/,
        rule: 'Eigene japanische Zahlwörter, nur bis 10. 10 heißt とお – ohne つ. Ab 11 normale Zahlen: 十一（じゅういち）.',
        sent: ['りんごを三[みっ]つください。', 'Drei Äpfel, bitte.'] },
      { id: 'ko', k: '個', kana: 'こ', de: 'kleine, runde Dinge', ex: 'Eier, Äpfel, Bonbons, Bälle, Steine',
        r: 'いっこ にこ さんこ よんこ ごこ ろっこ ななこ はっこ/はちこ きゅうこ じゅっこ/じっこ', q: ['何個', 'なんこ'],
        rule: 'Kleiner „っ“ bei 1, 6, 8, 10. Im Alltag oft austauschbar mit 〜つ.',
        sent: ['卵[たまご]を六個[ろっこ]買[か]いました。', 'Ich habe sechs Eier gekauft.'] },
      { id: 'mai', k: '枚', kana: 'まい', de: 'flache Dinge', ex: 'Papier, Tickets, Fotos, Briefmarken, T-Shirts, Teller',
        r: 'いちまい にまい さんまい よんまい ごまい ろくまい ななまい はちまい きゅうまい じゅうまい', q: ['何枚', 'なんまい'],
        rule: 'Ganz regelmäßig.',
        sent: ['切手[きって]を二枚[にまい]ください。', 'Zwei Briefmarken, bitte.'] },
      { id: 'hon', k: '本', kana: 'ほん', de: 'lange, schmale Dinge', ex: 'Stifte, Flaschen, Regenschirme, Bäume, Filme',
        r: 'いっぽん にほん さんぼん よんほん ごほん ろっぽん ななほん はっぽん/はちほん きゅうほん じゅっぽん/じっぽん', q: ['何本', 'なんぼん'],
        rule: 'ぽん bei 1, 6, 8, 10 · ぼん bei 3 und 何 · sonst ほん.',
        sent: ['ビールを三本[さんぼん]買[か]いました。', 'Ich habe drei Flaschen Bier gekauft.'] },
      { id: 'satsu', k: '冊', kana: 'さつ', de: 'Bücher & Hefte', ex: 'Bücher, Hefte, Zeitschriften, Wörterbücher',
        r: 'いっさつ にさつ さんさつ よんさつ ごさつ ろくさつ ななさつ はっさつ/はちさつ きゅうさつ じゅっさつ/じっさつ', q: ['何冊', 'なんさつ'],
        rule: 'Kleiner „っ“ bei 1, 8, 10.',
        sent: ['本[ほん]を一冊[いっさつ]読[よ]みました。', 'Ich habe ein Buch gelesen.'] },
      { id: 'dai', k: '台', kana: 'だい', de: 'Maschinen & Fahrzeuge', ex: 'Autos, Fahrräder, Computer, Fernseher',
        r: 'いちだい にだい さんだい よんだい ごだい ろくだい ななだい はちだい きゅうだい じゅうだい', q: ['何台', 'なんだい'],
        rule: 'Ganz regelmäßig.',
        sent: ['うちに車[くるま]が二台[にだい]あります。', 'Wir haben zu Hause zwei Autos.'] },
      { id: 'hai', k: '杯', kana: 'はい', de: 'Gläser, Tassen, Schalen', ex: 'Kaffee, Bier, Reis, Ramen – gefüllte Gefäße',
        r: 'いっぱい にはい さんばい よんはい ごはい ろっぱい ななはい はっぱい/はちはい きゅうはい じゅっぱい/じっぱい', q: ['何杯', 'なんばい'],
        rule: 'Wie bei 本: ぱい bei 1, 6, 8, 10 · ばい bei 3 und 何 · sonst はい. いっぱい heißt auch „voll / viel“.',
        sent: ['コーヒーを一杯[いっぱい]飲[の]みました。', 'Ich habe eine Tasse Kaffee getrunken.'] },
      { id: 'soku', k: '足', kana: 'そく', de: 'Paar Schuhe & Socken', ex: 'Schuhe, Socken, Stiefel, Hausschuhe',
        r: 'いっそく にそく さんぞく よんそく ごそく ろくそく ななそく はっそく/はちそく きゅうそく じゅっそく/じっそく', q: ['何足', 'なんぞく'],
        rule: 'ぞく bei 3 und 何 · kleiner „っ“ bei 1, 8, 10.',
        sent: ['靴下[くつした]を三足[さんぞく]買[か]いました。', 'Ich habe drei Paar Socken gekauft.'] },
      { id: 'chaku', k: '着', kana: 'ちゃく', de: 'Kleidungsstücke', ex: 'Anzüge, Kleider, Mäntel, Kimonos',
        r: 'いっちゃく にちゃく さんちゃく よんちゃく ごちゃく ろくちゃく ななちゃく はっちゃく/はちちゃく きゅうちゃく じゅっちゃく/じっちゃく', q: ['何着', 'なんちゃく'],
        rule: 'Kleiner „っ“ bei 1, 8, 10. T-Shirts und Hemden zählt man oft mit 〜枚.',
        sent: ['スーツを一着[いっちゃく]買[か]いました。', 'Ich habe einen Anzug gekauft.'] },
      { id: 'ken', k: '軒', kana: 'けん', de: 'Häuser & Läden', ex: 'Häuser, Geschäfte, Restaurants, Konbinis',
        r: 'いっけん にけん さんげん よんけん ごけん ろっけん ななけん はっけん/はちけん きゅうけん じゅっけん/じっけん', q: ['何軒', 'なんげん'],
        rule: 'げん bei 3 und 何 · kleiner „っ“ bei 1, 6, 8, 10.',
        sent: ['この町[まち]にはコンビニが三軒[さんげん]あります。', 'In dieser Stadt gibt es drei Konbinis.'] },
    ] },
    { title: 'Menschen & Tiere', items: [
      { id: 'nin', k: '人', kana: 'にん', de: 'Menschen', ex: 'Personen, Geschwister, Gäste',
        r: 'ひとり ふたり さんにん よにん ごにん ろくにん ななにん/しちにん はちにん きゅうにん じゅうにん', q: ['何人', 'なんにん'],
        rule: '1 und 2 sind eigene Wörter: ひとり, ふたり. 4 = よにん. 一人で = allein. 何人（なにじん）= welche Nationalität?',
        sent: ['兄弟[きょうだい]が二人[ふたり]います。', 'Ich habe zwei Geschwister.'] },
      { id: 'hiki', k: '匹', kana: 'ひき', de: 'kleine Tiere', ex: 'Katzen, Hunde, Fische, Insekten',
        r: 'いっぴき にひき さんびき よんひき ごひき ろっぴき ななひき はっぴき/はちひき きゅうひき じゅっぴき/じっぴき', q: ['何匹', 'なんびき'],
        rule: 'Wie bei 本: ぴき bei 1, 6, 8, 10 · びき bei 3 und 何 · sonst ひき.',
        sent: ['猫[ねこ]が三匹[さんびき]います。', 'Ich habe drei Katzen.'] },
      { id: 'wa', k: '羽', kana: 'わ', de: 'Vögel', ex: 'Vögel, Hühner, Spatzen – traditionell auch Kaninchen',
        r: 'いちわ にわ さんわ/さんば よんわ ごわ ろくわ/ろっぱ ななわ はちわ/はっぱ きゅうわ じゅうわ/じゅっぱ', q: ['何羽', 'なんわ'],
        rule: 'Meist regelmäßig; bei 3, 6, 8, 10 hört man auch ば / ぱ.',
        sent: ['庭[にわ]に鳥[とり]が一羽[いちわ]います。', 'Im Garten ist ein Vogel.'] },
      { id: 'tou', k: '頭', kana: 'とう', de: 'große Tiere', ex: 'Pferde, Kühe, Elefanten, große Hunde',
        r: 'いっとう にとう さんとう よんとう ごとう ろくとう ななとう はっとう/はちとう きゅうとう じゅっとう/じっとう', q: ['何頭', 'なんとう'],
        rule: 'Kleiner „っ“ bei 1, 8, 10.',
        sent: ['牛[うし]が八頭[はっとう]います。', 'Da sind acht Kühe.'] },
    ] },
    { title: 'Alter, Geld, Orte', items: [
      { id: 'sai', k: '歳', kana: 'さい', de: 'Lebensalter', ex: 'wie alt jemand ist',
        r: 'いっさい にさい さんさい よんさい ごさい ろくさい ななさい はっさい きゅうさい じゅっさい/じっさい', q: ['何歳', 'なんさい'],
        extra: [[20, '二十歳', 'はたち', true]],
        rule: 'Kleiner „っ“ bei 1, 8, 10. 20 Jahre = はたち. Höflich fragen: おいくつですか.',
        sent: ['弟[おとうと]は八歳[はっさい]です。', 'Mein kleiner Bruder ist acht Jahre alt.'] },
      { id: 'en', k: '円', kana: 'えん', de: 'Yen', ex: 'Preise und Geld',
        r: 'いちえん にえん さんえん よえん ごえん ろくえん ななえん はちえん きゅうえん じゅうえん', q: ['いくら', 'いくら'],
        extra: [[100, '百円', 'ひゃくえん'], [300, '三百円', 'さんびゃくえん', true], [1000, '千円', 'せんえん'], [10000, '一万円', 'いちまんえん']],
        rule: '4 Yen = よえん. Nach dem Preis fragt man mit いくらですか.',
        sent: ['このペンは百円[ひゃくえん]です。', 'Dieser Stift kostet 100 Yen.'] },
      { id: 'kai-stock', k: '階', kana: 'かい', de: 'Stockwerke', ex: 'Etagen im Gebäude',
        r: 'いっかい にかい さんがい よんかい ごかい ろっかい ななかい はっかい/はちかい きゅうかい じゅっかい/じっかい', q: ['何階', 'なんがい'],
        rule: 'がい bei 3 und 何 · kleiner „っ“ bei 1, 6, 8, 10. Das Erdgeschoss ist schon 一階!',
        sent: ['トイレは三階[さんがい]にあります。', 'Die Toilette ist im 3. Stock (bei uns: 2. Stock).'] },
      { id: 'ban', k: '番', kana: 'ばん', de: 'Nummer & Platz', ex: 'Bus Nummer 3, Platz 1, Gleis 5',
        r: 'いちばん にばん さんばん よんばん ごばん ろくばん ななばん はちばん きゅうばん じゅうばん', q: ['何番', 'なんばん'],
        rule: 'Ganz regelmäßig. 一番 heißt auch „am meisten / der/die Beste“.',
        sent: ['三番[さんばん]のバスに乗[の]ります。', 'Ich nehme den Bus Nummer 3.'] },
    ] },
    { title: 'Zeit', items: [
      { id: 'ji', k: '時', kana: 'じ', de: 'Uhrzeit', ex: 'um 1 Uhr, um 2 Uhr …', g: 'Uhrzeit',
        r: 'いちじ にじ さんじ よじ ごじ ろくじ しちじ/ななじ はちじ くじ じゅうじ', q: ['何時', 'なんじ'],
        extra: [[11, '十一時', 'じゅういちじ'], [12, '十二時', 'じゅうにじ']],
        rule: '4 = よじ, 7 = しちじ, 9 = くじ. Halb: 三時半（さんじはん）.',
        sent: ['七時[しちじ]に起[お]きます。', 'Ich stehe um sieben Uhr auf.'] },
      { id: 'jikan', k: '時間', kana: 'じかん', de: 'Stunden (lang)', ex: 'zwei Stunden lang, drei Stunden', g: 'Zeitdauer',
        r: 'いちじかん にじかん さんじかん よじかん ごじかん ろくじかん ななじかん/しちじかん はちじかん くじかん じゅうじかん', q: ['何時間', 'なんじかん'],
        rule: 'Wie die Uhrzeit + かん: よじかん, くじかん.',
        sent: ['毎日[まいにち]二時間[にじかん]勉強[べんきょう]します。', 'Ich lerne jeden Tag zwei Stunden.'] },
      { id: 'fun', k: '分', kana: 'ふん', de: 'Minuten', ex: 'Uhrzeit und Dauer', g: 'Minuten',
        r: 'いっぷん にふん さんぷん よんぷん ごふん ろっぷん ななふん はっぷん/はちふん きゅうふん じゅっぷん/じっぷん', q: ['何分', 'なんぷん'],
        extra: [[15, '十五分', 'じゅうごふん'], [30, '三十分', 'さんじゅっぷん', true]],
        rule: 'ぷん bei 1, 3, 4, 6, 8, 10 und 何 · sonst ふん. Halb = 半（はん）.',
        sent: ['駅[えき]まで十分[じゅっぷん]かかります。', 'Bis zum Bahnhof sind es zehn Minuten.'] },
      { id: 'nichi', k: '日', kana: 'にち', de: 'Tage & Datum', ex: 'der 1., der 2. … / ein Tag, zwei Tage', g: 'Tage des Monats',
        r: 'ついたち/いちにち ふつか みっか よっか いつか むいか なのか ようか ここのか とおか', q: ['何日', 'なんにち'], own: true,
        extra: [[14, '十四日', 'じゅうよっか', true], [20, '二十日', 'はつか', true], [24, '二十四日', 'にじゅうよっか', true]],
        rule: '1–10 eigene Wörter. Der 1. = ついたち, aber ein Tag lang = いちにち. Ab 2 heißen Datum und Anzahl gleich (三日 = der 3. / drei Tage).',
        sent: ['四月[しがつ]一日[ついたち]に日本[にほん]に行[い]きます。', 'Am 1. April fliege ich nach Japan.'] },
      { id: 'shuukan', k: '週間', kana: 'しゅうかん', de: 'Wochen (lang)', ex: 'eine Woche, zwei Wochen', g: 'Zeitdauer',
        r: 'いっしゅうかん にしゅうかん さんしゅうかん よんしゅうかん ごしゅうかん ろくしゅうかん ななしゅうかん はっしゅうかん きゅうしゅうかん じゅっしゅうかん/じっしゅうかん', q: ['何週間', 'なんしゅうかん'],
        rule: 'Kleiner „っ“ bei 1, 8, 10.',
        sent: ['二週間[にしゅうかん]休[やす]みます。', 'Ich nehme zwei Wochen frei.'] },
      { id: 'kagetsu', k: 'か月', kana: 'かげつ', de: 'Monate (lang)', ex: 'einen Monat, drei Monate', g: 'Zeitdauer',
        r: 'いっかげつ にかげつ さんかげつ よんかげつ ごかげつ ろっかげつ ななかげつ はっかげつ/はちかげつ きゅうかげつ じゅっかげつ/じっかげつ', q: ['何か月', 'なんかげつ'],
        rule: 'Kleiner „っ“ bei 1, 6, 8, 10. Nicht verwechseln: 三月（さんがつ）= März.',
        sent: ['{三か月}[さんかげつ]日本[にほん]にいました。', 'Ich war drei Monate in Japan.'] },
      { id: 'gatsu', k: '月', kana: 'がつ', de: 'Monatsnamen', ex: 'Januar, Februar … Dezember', g: 'Monate',
        r: 'いちがつ にがつ さんがつ しがつ ごがつ ろくがつ しちがつ はちがつ くがつ じゅうがつ', q: ['何月', 'なんがつ'],
        extra: [[11, '十一月', 'じゅういちがつ'], [12, '十二月', 'じゅうにがつ']],
        rule: '4 = しがつ, 7 = しちがつ, 9 = くがつ.',
        sent: ['誕生日[たんじょうび]は九月[くがつ]です。', 'Mein Geburtstag ist im September.'] },
      { id: 'nen', k: '年', kana: 'ねん', de: 'Jahre', ex: 'ein Jahr lang, im Jahr 2026', g: 'Zeitdauer',
        r: 'いちねん にねん さんねん よねん ごねん ろくねん ななねん/しちねん はちねん きゅうねん じゅうねん', q: ['何年', 'なんねん'],
        rule: '4 = よねん. Als Dauer geht auch 〜年間（ねんかん）.',
        sent: ['日本語[にほんご]を一年[いちねん]勉強[べんきょう]しました。', 'Ich habe ein Jahr Japanisch gelernt.'] },
      { id: 'haku', k: '泊', kana: 'はく', de: 'Nächte', ex: 'Übernachtungen im Hotel, auf Reisen', g: 'Zeitdauer',
        r: 'いっぱく にはく さんぱく よんはく/よんぱく ごはく ろっぱく ななはく はっぱく/はちはく きゅうはく じゅっぱく/じっぱく', q: ['何泊', 'なんぱく'],
        rule: 'ぱく bei 1, 3, 6, 8, 10 und 何 · sonst はく. Reise: 二泊三日（にはくみっか）= 2 Nächte, 3 Tage.',
        sent: ['京都[きょうと]に二泊[にはく]します。', 'Ich übernachte zwei Nächte in Kyoto.'] },
      { id: 'kai', k: '回', kana: 'かい', de: 'Mal (wie oft)', ex: 'einmal, zweimal, dreimal pro Woche', g: 'Häufigkeit',
        r: 'いっかい にかい さんかい よんかい ごかい ろっかい ななかい はっかい/はちかい きゅうかい じゅっかい/じっかい', q: ['何回', 'なんかい'],
        rule: 'Kleiner „っ“ bei 1, 6, 8, 10. Pro Woche: 週に三回. Das x-te Mal: 〜回目.',
        sent: ['週[しゅう]に三回[さんかい]ジムに行[い]きます。', 'Ich gehe dreimal pro Woche ins Fitnessstudio.'] },
    ] },
  ];
  C.ALL = C.SECTIONS.flatMap((s) => s.items);
  C.byId = (id) => C.ALL.find((c) => c.id === id);

  // Zeilen der Tabelle: { n, label, jp (Kanji), kana, alt[], odd } – 1–10, Extras, zum Schluss die Frage
  C.rows = (c) => {
    const base = c.kana;
    const odd = (n, kana) => !c.own && kana !== NUM[n] + base;
    const rows = c.r.split(' ').map((x, i) => {
      const n = i + 1;
      const [kana, ...alt] = x.split('/');
      return { n, label: String(n), jp: (c.kj && c.kj[n]) || KAN[n] + c.k, kana, alt, odd: odd(n, kana) };
    });
    (c.extra || []).forEach(([n, jp, kana, o]) => rows.push({ n, label: String(n), jp, kana, alt: [], odd: !!o, extra: true }));
    if (c.q) {
      const [jp, kana] = c.q;
      rows.push({ n: 0, label: '?', jp, kana, alt: [], odd: !c.own && jp.startsWith('何') && kana !== 'なん' + base, ask: true });
    }
    return rows;
  };

  // Ausdrücke der Gruppe „Zähler“ den Zählern zuordnen; was nicht passt, landet unter „rest“
  C.assign = (items, plain) => {
    const by = new Map(C.ALL.map((c) => [c.id, []]));
    const rest = [];
    // längere Zähler zuerst (時間 vor 時), Sonderregeln (re) vor einfachen
    const order = C.ALL.slice().sort((a, b) => (b.re ? 1 : 0) - (a.re ? 1 : 0) || b.k.length - a.k.length);
    items.forEach((it) => {
      const s = plain(it.jp);
      const c = order.find((x) => (x.re ? x.re.test(s) : s.includes(x.k)));
      (c ? by.get(c.id) : rest).push(it);
    });
    return { by, rest };
  };

  // ---------- Lernen: „Kann ich“ je Zähler, Üben und Auffrischen aus der Tabelle ----------
  // Selbst gesetzt (settings.counters[id] = true/false) gilt; sonst „kann ich“, sobald alle alten Karten des Zählers „kann ich“ sind
  C.known = (c, explicit, cardStates) => {
    const e = explicit && explicit[c.id];
    if (typeof e === 'boolean') return e;
    return cardStates.length > 0 && cardStates.every((s) => s === 'known');
  };

  // Frage auf der Karte, wenn nicht „wie viele?“ passt
  const ASK = { ji: 'wie viel Uhr?', fun: 'wie viele Minuten?', nichi: 'der Wievielte? / wie viele Tage?', gatsu: 'welcher Monat?',
    en: 'wie viel (kostet das)?', 'kai-stock': 'welcher Stock?', ban: 'welche Nummer?', sai: 'wie alt?', tsu: 'wie viele (Stück)?' };
  // Jede Zelle der Tabelle als Karte (nur für Üben und Auffrischen – keine echten Einträge, keine Lernschlange)
  C.cards = (c) => C.rows(c).map((r) => ({
    id: `ctr-${c.id}-${r.ask ? 'q' : r.n}`, type: 'phrase', group: 'Zähler', _ctr: c.id,
    jp: App.jp.notate(r.jp, r.kana),
    also: r.alt.map((kana) => ({ kanji: r.jp, kana })),
    de: `${r.ask ? ASK[c.id] || 'wie viele?' : r.n} · ${c.de} · 〜${c.k}`,
    note: c.rule,
  }));
})(window.App = window.App || {});
