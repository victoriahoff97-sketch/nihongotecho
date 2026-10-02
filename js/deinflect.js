/* Nihongo Techō – Deinflektion: konjugierte Formen rueckwaerts auf moegliche Grundformen abbilden */
'use strict';
(function (App) {
  // Kana-Reihen fuer die Godan-Konjugation, jeweils Woerterbuch-Endung -> Reihen-Kana
  const U_A = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' }; // a-Reihe (-ない, -れる, -せる)
  const U_I = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' }; // i-Reihe (-ます, -たい, Stamm)
  const U_E = { う: 'え', く: 'け', ぐ: 'げ', す: 'せ', つ: 'て', ぬ: 'ね', ぶ: 'べ', む: 'め', る: 'れ' }; // e-Reihe (-ば)
  const U_O = { う: 'おう', く: 'こう', ぐ: 'ごう', す: 'そう', つ: 'とう', ぬ: 'のう', ぶ: 'ぼう', む: 'もう', る: 'ろう' }; // o-Reihe+う (Volitiv)
  // て/た-Form je nach Endkonsonant der Woerterbuchform
  const TE_GROUPS = [
    { kanas: ['う', 'つ', 'る'], te: 'って', ta: 'った' },
    { kanas: ['む', 'ぶ', 'ぬ'], te: 'んで', ta: 'んだ' },
    { kanas: ['く'], te: 'いて', ta: 'いた' },
    { kanas: ['ぐ'], te: 'いで', ta: 'いだ' },
    { kanas: ['す'], te: 'して', ta: 'した' },
  ];

  // Regeltabelle [fromSuffix, toSuffix, fromType, toType, ruleName], rueckwaerts angewandt (wie bei Yomitan)
  const RULES = [];
  const rule = (from, to, toType, name, fromType) => RULES.push({ from, to, toType, name, fromType: fromType || 'any' });

  // ---------- Hoeflichkeitsform (-ます, -ません, -ました, -ませんでした, -ましょう) ----------
  ['ます', 'ません', 'ました', 'ませんでした', 'ましょう'].forEach((s) => {
    rule(s, 'る', 'v1', 'masu'); // Ichidan: Stamm+る
    Object.entries(U_I).forEach(([u, i]) => rule(i + s, u, 'v5', 'masu')); // Godan: i-Reihe -> u-Reihe
    rule('し' + s, 'する', 'vs', 'masu');
    rule('き' + s, 'くる', 'vk', 'masu');
    rule('来' + s, '来る', 'vk', 'masu');
  });

  // ---------- て/た-Form ----------
  TE_GROUPS.forEach((g) => {
    g.kanas.forEach((u) => { rule(g.te, u, 'v5', 'te'); rule(g.ta, u, 'v5', 'ta'); });
  });
  rule('して', 'する', 'vs', 'te'); rule('した', 'する', 'vs', 'ta');
  rule('きて', 'くる', 'vk', 'te'); rule('きた', 'くる', 'vk', 'ta');
  rule('来て', '来る', 'vk', 'te'); rule('来た', '来る', 'vk', 'ta');
  rule('て', 'る', 'v1', 'te'); rule('た', 'る', 'v1', 'ta'); // Ichidan: Stamm+て/た ohne Endungswechsel
  // Sonderfall 行く: Stamm endet nicht regelmaessig auf いた/いて
  rule('いって', 'いく', 'v5', 'iku-te'); rule('いった', 'いく', 'v5', 'iku-ta');
  rule('行って', '行く', 'v5', 'iku-te'); rule('行った', '行く', 'v5', 'iku-ta');

  // ---------- たら-Konditional (た-Form + ら) ----------
  TE_GROUPS.forEach((g) => {
    g.kanas.forEach((u) => rule(g.ta + 'ら', u, 'v5', 'tara'));
  });
  rule('たら', 'る', 'v1', 'tara');
  rule('したら', 'する', 'vs', 'tara');
  rule('きたら', 'くる', 'vk', 'tara'); rule('来たら', '来る', 'vk', 'tara');
  rule('いったら', 'いく', 'v5', 'tara'); rule('行ったら', '行く', 'v5', 'tara');

  // ---------- ている/ていた/ています/てる -> て (Kettenregel, danach greifen die て-Regeln erneut) ----------
  ['ている', 'ていた', 'ています', 'てる'].forEach((s) => rule(s, 'て', 'any', 'teiru'));

  // ---------- ない/なかった ----------
  ['ない', 'なかった'].forEach((s) => {
    rule(s, 'る', 'v1', 'nai');
    Object.entries(U_A).forEach(([u, a]) => rule(a + s, u, 'v5', 'nai'));
    rule('し' + s, 'する', 'vs', 'nai');
    rule('こ' + s, 'くる', 'vk', 'nai');
    rule('来' + s, '来る', 'vk', 'nai');
  });

  // ---------- たい/たかった/たくない (Wunschform, haengt am Stamm) ----------
  ['たい', 'たかった', 'たくない'].forEach((s) => {
    rule(s, 'る', 'v1', 'tai');
    Object.entries(U_I).forEach(([u, i]) => rule(i + s, u, 'v5', 'tai'));
    rule('し' + s, 'する', 'vs', 'tai');
    rule('き' + s, 'くる', 'vk', 'tai');
    rule('来' + s, '来る', 'vk', 'tai');
  });

  // ---------- Passiv/Potenzial (-られる/-れる) ----------
  rule('られる', 'る', 'v1', 'rareru');
  Object.entries(U_A).forEach(([u, a]) => rule(a + 'れる', u, 'v5', 'reru'));

  // ---------- Kausativ (-させる/-せる) ----------
  rule('させる', 'る', 'v1', 'saseru');
  Object.entries(U_A).forEach(([u, a]) => rule(a + 'せる', u, 'v5', 'seru'));

  // ---------- Konditional (-ば) ----------
  rule('れば', 'る', 'v1', 'ba');
  Object.entries(U_E).forEach(([u, e]) => rule(e + 'ば', u, 'v5', 'ba'));
  rule('すれば', 'する', 'vs', 'ba');
  rule('くれば', 'くる', 'vk', 'ba');
  rule('来れば', '来る', 'vk', 'ba');

  // ---------- Volitiv (-よう/-おう) ----------
  rule('よう', 'る', 'v1', 'you');
  Object.entries(U_O).forEach(([u, o]) => rule(o, u, 'v5', 'you'));
  rule('しよう', 'する', 'vs', 'you');
  rule('こよう', 'くる', 'vk', 'you');
  rule('来よう', '来る', 'vk', 'you');

  // ---------- i-Adjektive ----------
  ['く', 'かった', 'くない', 'くなかった', 'くて', 'ければ'].forEach((s) => rule(s, 'い', 'adj-i', 'iadj'));

  const MAX_STEPS = 4;

  // Leitet ein Wort rueckwaerts bis zu moeglichen Grundformen ab (Kettenregeln, max. 4 Schritte)
  App.deinflect = (word) => {
    const start = { base: String(word || ''), rules: [], type: 'any' };
    const seen = new Set([start.base + '|any']);
    const results = [start];
    let frontier = [start];
    for (let step = 0; step < MAX_STEPS && frontier.length; step++) {
      const next = [];
      for (const cand of frontier) {
        for (const r of RULES) {
          if (r.fromType !== 'any' && r.fromType !== cand.type) continue;
          if (!cand.base.endsWith(r.from)) continue;
          const newBase = cand.base.slice(0, cand.base.length - r.from.length) + r.to;
          if (!newBase) continue;
          const key = newBase + '|' + r.toType;
          if (seen.has(key)) continue;
          seen.add(key);
          const item = { base: newBase, rules: cand.rules.concat(r.name), type: r.toType };
          results.push(item);
          next.push(item);
        }
      }
      frontier = next;
    }
    return results;
  };
})(window.App);
