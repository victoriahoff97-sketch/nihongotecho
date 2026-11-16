/* Nihongo Techō – Gullideckel: zeichnet einen Deckel als SVG (Eisenrand, Punktring, Kanji unten, Motiv in der Mitte).
   Selbst gezeichnete, einfache Motive, keine Kopien echter Deckel. viewBox 0 0 120 120, ohne ids/Verläufe/Filter. */
'use strict';
(function (App) {
  const INK = '#3a3036', WH = '#ffffff', BLUSH = '#f59aa6', SKY = '#7cc4e8', LEAF = '#5aa55a', WOOD = '#8a5a3b';

  // Farbe mischen: a → b um t (0..1), Hex '#rrggbb'
  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = p(a), y = p(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const dk = (c, t = 0.35) => mix(c, '#000000', t);
  const lt = (c, t = 0.55) => mix(c, '#ffffff', t);

  // kleine Bausteine
  const C = (x, y, r, f, more = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${more}/>`;
  const E = (x, y, rx, ry, f, more = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${more}/>`;
  const R = (x, y, w, h, f, more = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${more}/>`;
  const P = (d, f, more = '') => `<path d="${d}" fill="${f}"${more}/>`;
  const S = (d, col, w = 2) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Kawaii-Gesicht: zwei Punktaugen, Lächeln, rosa Bäckchen
  const face = (x, y, s = 1) =>
    C(x - 5 * s, y, 1.7 * s, INK) + C(x + 5 * s, y, 1.7 * s, INK) +
    S(`M${x - 2.5 * s} ${y + 2.5 * s}Q${x} ${y + 5 * s} ${x + 2.5 * s} ${y + 2.5 * s}`, INK, 1.2 * s) +
    E(x - 9 * s, y + 3 * s, 2.4 * s, 1.5 * s, BLUSH) + E(x + 9 * s, y + 3 * s, 2.4 * s, 1.5 * s, BLUSH);
  const waves = (y, col, w = 2.5) => S(`M30 ${y}q5 -4 10 0t10 0t10 0t10 0t10 0t10 0`, col, w);
  const star = (x, y, r, f) => P(`M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`, f);
  // Burg mit Stufen: Steinsockel, Wände, geschwungene Dächer
  const castle = (roof, wall, orn) =>
    P('M36 86L84 86L79 74L41 74Z', '#9a958c') +
    R(42, 60, 36, 14, wall) + P('M32 62L88 62L80 54L40 54Z', roof) +
    R(47, 44, 26, 10, wall) + P('M38 46L82 46L74 38L46 38Z', roof) +
    R(52, 30, 16, 8, wall) + P('M44 32L76 32L68 24L52 24Z', roof) +
    C(48, 23, 2.5, orn) + C(72, 23, 2.5, orn) +
    R(52, 47, 4, 4, INK) + R(64, 47, 4, 4, INK) + face(60, 66, 0.7);

  // Motive je Deckel-ID: (Hauptfarbe) → SVG-Elemente
  const MOTIFS = {
    // Ginkgo-Blatt
    tokyo: (c) => S('M60 84L60 64', dk(c), 3) +
      P('M60 66C42 66 28 52 32 34Q46 26 56 31L60 41L64 31Q74 26 88 34C92 52 78 66 60 66Z', c) +
      S('M60 64L46 40M60 64L74 40M60 64L60 44', lt(c), 1.2) + face(60, 52, 0.8),
    // Große Welle
    kanagawa: (c) => P('M26 84C26 54 48 32 74 34C88 35 94 46 90 56C86 46 74 44 68 52C63 59 67 68 76 68L94 68L94 84Z', c) +
      C(74, 34, 3.5, WH) + C(82, 37, 3, WH) + C(88, 44, 2.6, WH) + C(91, 51, 2, WH) +
      waves(78, lt(c), 2) + face(44, 66, 0.9),
    // Glocke (Kawagoe, Toki no Kane)
    saitama: (c) => R(55, 22, 10, 8, dk(c), ' rx="3"') +
      P('M42 46Q42 28 60 28Q78 28 78 46L81 76Q60 82 39 76Z', c) +
      S('M42 50L78 50M41 70L79 70', lt(c), 2) + C(60, 80, 4, dk(c)) + face(60, 59, 0.9),
    // Erdnuss
    chiba: (c) => C(60, 44, 15, c) + C(60, 70, 14, c) + E(60, 57, 11, 6, c) +
      C(54, 38, 1.4, dk(c, 0.2)) + C(66, 40, 1.4, dk(c, 0.2)) + C(53, 74, 1.4, dk(c, 0.2)) + C(67, 72, 1.4, dk(c, 0.2)) + C(60, 80, 1.4, dk(c, 0.2)) +
      face(60, 44, 0.8),
    // Burg Nagoya: grüne Dächer, goldene Shachihoko
    aichi: (c) => castle('#5f9e8f', WH, c),
    // Burg Himeji: weiße Burg, graue Dächer
    hyogo: (c) => castle(dk(c, 0.25), WH, dk(c, 0.45)),
    // Kōyasan: Daitō-Pagode zwischen Kiefern
    wakayama: (c) => P('M22 86L32 56L42 86Z', c) + P('M78 86L88 56L98 86Z', c) +
      R(47, 64, 26, 22, '#d9533b') + P('M34 66L86 66L74 57L46 57Z', INK) +
      C(60, 52, 8, WH) + P('M38 48L82 48L70 39L50 39Z', INK) +
      S('M60 39L60 22', '#c9a227', 2.5) + C(60, 30, 2, '#c9a227') + C(60, 25, 2, '#c9a227') + R(57, 72, 6, 14, INK),
    // Hirsch (Nara)
    nara: (c) => S('M40 40L36 28M36 32L30 30M48 40L52 28M52 32L58 30', dk(c), 2.5) +
      E(64, 66, 20, 11, c) + R(50, 72, 5, 14, c, ' rx="2"') + R(72, 72, 5, 14, c, ' rx="2"') +
      P('M50 58L42 50L50 46L58 58Z', c) + C(44, 48, 11, c) + E(32, 42, 5, 3, c) + E(56, 42, 5, 3, c) +
      C(62, 62, 2, WH) + C(70, 66, 2, WH) + C(76, 61, 2, WH) + C(66, 70, 1.6, WH) +
      face(44, 49, 0.7) + C(44, 55, 1.6, INK),
    // Tempel: fünfstöckige Pagode
    kyoto: (c) => [0, 1, 2, 3, 4].map((i) => {
      const y = 78 - i * 11, w = 26 - i * 3;
      return R(60 - w / 2 + 4, y, w - 8, 8, lt(c, 0.7)) + P(`M${60 - w} ${y + 1}L${60 + w} ${y + 1}L${60 + w - 6} ${y - 4}L${60 - w + 6} ${y - 4}Z`, c);
    }).join('') + S('M60 30L60 18', dk(c), 2) + C(60, 22, 1.8, dk(c)) + face(60, 84, 0.6),
    // Biwa-See mit Segelboot
    shiga: (c) => P('M56 26C70 26 72 40 70 50C68 60 84 64 84 76C84 88 62 90 50 84C38 78 40 66 46 58C52 50 42 26 56 26Z', c) +
      S('M52 74q4 -3 8 0t8 0', lt(c), 1.6) +
      P('M60 36L60 50L70 50Z', WH) + P('M56 51L74 51L70 55L58 55Z', WOOD) + face(66, 68, 0.8),
    // Izumo-Schrein: Dach und dickes Shimenawa-Seil
    shimane: (c) => P('M26 44L94 44L82 32L38 32Z', c) + S('M34 34L28 22M38 34L44 22M86 34L92 22M82 34L76 22', dk(c), 2.5) +
      R(36, 44, 48, 6, dk(c)) + R(30, 52, 60, 14, '#e3c46b', ' rx="7"') +
      S('M40 53L36 65M52 53L48 65M64 53L60 65M76 53L72 65', '#b8953f', 1.6) +
      R(42, 66, 4, 10, '#e3c46b') + R(58, 66, 4, 14, '#e3c46b') + R(74, 66, 4, 10, '#e3c46b') +
      P('M50 66L54 70L50 74L54 78', 'none', ` stroke="${WH}" stroke-width="2"`) + P('M66 66L70 70L66 74L70 78', 'none', ` stroke="${WH}" stroke-width="2"`) +
      face(60, 58, 0.6),
    // Kormoran-Fischer: Boot mit Feuerkorb und Kormoran
    gifu: (c) => P('M26 76Q60 82 94 76L94 88L26 88Z', c) + waves(82, lt(c), 2) +
      P('M30 68L88 68L82 76L36 76Z', WOOD) + S('M78 68L86 44', INK, 2) +
      P('M82 44L90 44L88 50L84 50Z', INK) + P('M86 30Q80 38 84 43L88 43Q92 38 86 30Z', '#f4a12a') +
      E(48, 58, 10, 7, '#2f3440') + S('M52 54Q54 40 46 38', '#2f3440', 5) + P('M42 38L36 40L42 41Z', '#f2c14e') +
      C(46, 38, 1.4, WH),
    // Udon-Schüssel
    kagawa: (c) => S('M66 20L52 52M74 22L58 52', WOOD, 2.5) +
      P('M30 58L90 58Q90 86 60 86Q30 86 30 58Z', '#d9534f') + E(60, 58, 30, 7, c) +
      S('M38 58q4 -4 8 0t8 0t8 0t8 0t8 0', '#fff8e7', 2) + C(76, 56, 4, WH) + S('M74 56a2 2 0 1 1 3 1', BLUSH, 1.2) +
      face(60, 72, 0.9),
    // Daruma
    gunma: (c) => E(60, 58, 25, 28, c) + E(60, 52, 15, 13, '#fbe9d7') +
      S('M50 45Q54 42 57 45M63 45Q66 42 70 45', INK, 2) + C(54, 51, 2.2, INK) + C(66, 51, 2.2, INK) +
      S('M55 57Q60 61 65 57', INK, 2) + E(48, 55, 2.4, 1.5, BLUSH) + E(72, 55, 2.4, 1.5, BLUSH) +
      S('M48 74Q60 80 72 74', '#e8c547', 2.5),
    // Washi-Papier: Bögen und Schöpfrahmen
    fukui: (c) => R(30, 30, 60, 50, WOOD, ' rx="3"') + R(34, 34, 52, 42, dk(c, 0.15)) +
      R(38, 38, 40, 34, '#fffaf0', ' transform="rotate(-6 58 55)"') + R(44, 40, 38, 32, WH) +
      S('M48 46l6 3M66 44l8 4M70 62l6 -2M50 64l5 2', dk(c, 0.2), 1) + face(63, 56, 0.8),
    // Kumano-Pinsel
    hiroshima: (c) => S('M30 84Q46 74 62 82T92 78', INK, 3) +
      R(56, 14, 9, 46, c, ' rx="3" transform="rotate(30 60 50)"') +
      R(54, 54, 12, 7, '#d4af37', ' transform="rotate(30 60 50)"') +
      P('M43 66Q38 76 36 82Q44 78 50 70Z', INK) + face(70, 34, 0.6),
    // Kugelfisch (Fugu)
    yamaguchi: (c) => P('M84 58L96 48L94 68Z', c) +
      [[60, 30], [44, 34], [76, 34], [36, 46], [84, 46], [36, 68], [52, 80], [68, 80]].map(([x, y]) => C(x, y, 3, dk(c, 0.2))).join('') +
      C(60, 57, 25, c) + E(58, 66, 18, 12, lt(c, 0.7)) + E(76, 64, 5, 3, dk(c, 0.15)) + face(55, 54, 0.9),
    // Sanddünen mit Kamel
    tottori: (c) => C(84, 34, 7, '#f6c445') + P('M24 86Q40 60 62 72Q80 60 96 74L96 88L24 88Z', c) +
      P('M24 88Q50 74 96 86L96 90L24 90Z', dk(c, 0.15)) +
      E(54, 52, 12, 7, '#b87a44') + C(50, 45, 5, '#b87a44') + C(59, 45, 5, '#b87a44') + R(46, 56, 3, 12, '#b87a44') + R(60, 56, 3, 12, '#b87a44') +
      S('M66 52Q72 50 72 40', '#b87a44', 4) + C(73, 38, 4.5, '#b87a44') + C(74, 37, 1.1, INK),
    // Nikkō: rote Shinkyō-Brücke
    tochigi: (c) => P('M24 52L34 34L44 52Z', LEAF) + P('M76 52L86 34L96 52Z', LEAF) +
      R(26, 72, 68, 14, SKY) + waves(80, WH, 1.6) +
      P('M24 62Q60 44 96 62L96 68Q60 50 24 68Z', c) + S('M26 58Q60 40 94 58', c, 2) +
      R(36, 62, 5, 16, c) + R(79, 62, 5, 16, c) + face(60, 59, 0.6),
    // Kotoji-Laterne und Blattgold
    ishikawa: (c) => P('M36 42L84 42L72 32L48 32Z', '#7d7f86') + C(60, 29, 3, '#7d7f86') +
      R(50, 42, 20, 14, '#9a9ca3') + R(55, 45, 10, 8, c) + E(60, 58, 18, 4, '#7d7f86') +
      R(44, 60, 5, 26, '#7d7f86') + R(70, 60, 5, 14, '#7d7f86') +
      [[34, 30], [88, 56], [86, 78], [30, 64]].map(([x, y]) => R(x - 3, y - 3, 6, 6, c, ` transform="rotate(30 ${x} ${y})"`)).join('') +
      face(60, 48, 0.4),
    // Nachtzug zu den Sternen (Miyazawa Kenji)
    iwate: (c) => star(34, 30, 4, '#f6c445') + star(84, 26, 5, '#f6c445') + star(58, 24, 3, '#f6c445') + C(90, 42, 1.6, '#f6c445') +
      S('M24 84Q60 66 96 50', dk(c), 2) +
      P('M34 70L58 60L60 72L36 82Z', c) + P('M62 58L86 48L88 60L64 70Z', c) +
      R(40, 69, 5, 4, '#f6c445', ' transform="rotate(-22 40 69)"') + R(48, 66, 5, 4, '#f6c445', ' transform="rotate(-22 48 66)"') +
      R(68, 58, 5, 4, '#f6c445', ' transform="rotate(-22 68 58)"') + R(76, 55, 5, 4, '#f6c445', ' transform="rotate(-22 76 55)"') +
      C(40, 82, 2.6, INK) + C(54, 76, 2.6, INK) + C(68, 70, 2.6, INK) + C(82, 64, 2.6, INK) + face(80, 56, 0.4),
    // Hafen: Segelschiff
    nagasaki: (c) => R(26, 74, 68, 14, c) + waves(80, lt(c), 2) +
      P('M32 66L88 66L80 78L40 78Z', dk(c)) + S('M60 66L60 24', INK, 2) +
      P('M62 28L62 62L82 62Z', WH) + P('M58 34L58 62L40 62Z', WH) + P('M60 24L70 27L60 30Z', '#d9534f') +
      face(60, 71, 0.5),
    // Pflaumenblüte
    ibaraki: (c) => S('M28 84Q44 70 52 72', WOOD, 3) +
      [0, 72, 144, 216, 288].map((a) => {
        const r = (a - 90) * Math.PI / 180;
        return C(+(60 + 15 * Math.cos(r)).toFixed(1), +(54 + 15 * Math.sin(r)).toFixed(1), 11, c);
      }).join('') + C(60, 54, 9, '#f6d55c') + face(60, 53, 0.55),
    // Reisfelder und Onigiri
    niigata: (c) => R(26, 64, 68, 7, c) + R(26, 74, 68, 7, dk(c, 0.15)) + R(26, 84, 68, 5, c) +
      S('M30 64L30 56M38 64L38 54M82 64L82 56M90 64L90 54', dk(c, 0.2), 1.6) +
      P('M60 26Q66 26 82 54Q86 64 76 66L44 66Q34 64 38 54Q54 26 60 26Z', WH) + R(52, 54, 16, 12, INK, ' rx="1"') +
      face(60, 45, 0.7),
    // Kantō-Laternen am Bambusmast
    akita: (c) => S('M60 88L60 18', '#c9a46a', 2.5) + S('M38 30L82 30M34 44L86 44M30 58L90 58M32 72L88 72', '#c9a46a', 1.6) +
      [[30, [52, 60, 68]], [44, [44, 52, 60, 68, 76]], [58, [40, 48, 56, 64, 72, 80]], [72, [44, 52, 60, 68, 76]]].map(([y, xs]) =>
        xs.map((x) => R(x - 3, y + 1, 6, 9, c, ' rx="2.5"')).join('')).join('') + P('M56 18L60 12L64 18Z', WH),
    // Tanabata-Kugel mit Streifen
    miyagi: (c) => S('M60 22L60 30', INK, 1.6) +
      [38, 46, 54, 62, 70, 78].map((x, i) => R(x - 3, 44, 6, 42 - (i % 2) * 6, i % 3 === 0 ? c : i % 3 === 1 ? '#f6c445' : '#7cc4e8', ' rx="2"')).join('') +
      C(60, 42, 14, c) + face(60, 41, 0.75),
    // Takoyaki
    osaka: (c) => P('M28 66L92 66L86 82L34 82Z', '#d9b98a') + S('M84 70L96 30', '#d9b98a', 2) +
      C(42, 60, 11, '#c98a4b') + C(60, 56, 11, '#c98a4b') + C(78, 60, 11, '#c98a4b') +
      P('M34 54Q60 40 86 54Q78 50 60 48Q42 50 34 54Z', c) +
      S('M36 54l6 -4l6 4l6 -4l6 4l6 -4l6 4l6 -4l6 4', WH, 1.4) + C(50, 50, 1.2, LEAF) + C(70, 50, 1.2, LEAF) +
      face(60, 60, 0.6),
    // Yatai-Stand
    fukuoka: (c) => P('M28 40L92 40L86 28L34 28Z', c) +
      [36, 46, 56, 66, 76].map((x, i) => R(x, 40, 8, 12, i % 2 ? WH : lt(c, 0.3))).join('') +
      S('M34 40L34 72M86 40L86 72', WOOD, 2.5) + R(30, 62, 60, 10, WOOD) +
      C(42, 80, 6, INK) + C(78, 80, 6, INK) + C(42, 80, 2, WH) + C(78, 80, 2, WH) +
      E(28, 54, 6, 8, '#d9534f') + face(60, 55, 0.6),
    // Heißluftballon
    saga: (c) => E(84, 70, 8, 4, WH) + E(34, 32, 7, 3.5, WH) +
      P('M60 22C80 22 86 40 80 54C76 62 68 66 66 72L54 72C52 66 44 62 40 54C34 40 40 22 60 22Z', c) +
      P('M60 22C68 22 70 44 64 72L56 72C50 44 52 22 60 22Z', lt(c, 0.5)) +
      S('M54 72L56 78M66 72L64 78', INK, 1.2) + R(54, 78, 12, 8, WOOD, ' rx="1.5"') + face(60, 44, 0.75),
    // Apfel
    nagano: (c) => P('M60 36C46 26 30 34 32 54C34 72 48 86 60 80C72 86 86 72 88 54C90 34 74 26 60 36Z', c) +
      S('M60 36Q60 28 64 22', WOOD, 2.5) + P('M63 30Q72 20 80 26Q72 34 63 30Z', LEAF) +
      E(46, 46, 4, 6, lt(c, 0.5)) + face(60, 58, 0.9),
    // Trauben
    yamanashi: (c) => P('M60 28Q74 14 86 24Q74 34 60 28Z', LEAF) + S('M60 22L60 32', WOOD, 2) +
      [[48, 38], [60, 38], [72, 38], [42, 50], [54, 50], [66, 50], [78, 50], [48, 62], [60, 62], [72, 62], [54, 74], [66, 74], [60, 85]]
        .map(([x, y]) => C(x, y, 7, c) + C(x - 2, y - 2, 1.6, lt(c, 0.5))).join('') + face(60, 51, 0.7),
    // Bär im Schnee
    hokkaido: (c) => [[32, 30], [88, 34], [30, 72], [90, 74]].map(([x, y]) =>
      S(`M${x - 5} ${y}L${x + 5} ${y}M${x - 2.5} ${y - 4.3}L${x + 2.5} ${y + 4.3}M${x + 2.5} ${y - 4.3}L${x - 2.5} ${y + 4.3}`, c, 1.6)).join('') +
      C(44, 36, 8, '#9a6b47') + C(76, 36, 8, '#9a6b47') + C(44, 36, 4, '#d8b28c') + C(76, 36, 4, '#d8b28c') +
      C(60, 56, 22, '#9a6b47') + E(60, 64, 10, 7, '#d8b28c') + E(60, 60, 3, 2, INK) + face(60, 54, 0.9),
    // Vulkan Aso
    kumamoto: (c) => C(56, 26, 6, '#c4c4c4') + C(66, 22, 5, '#d6d6d6') + C(62, 32, 5, '#cfcfcf') +
      P('M24 86L50 40Q60 36 70 40L96 86Z', c) + E(60, 40, 10, 3, dk(c)) + face(60, 64, 1),
    // Sakurajima im Meer
    kagoshima: (c) => P('M52 30Q44 22 52 16Q60 12 64 20Q72 16 74 24Q76 32 66 32Z', '#9b9b9b') +
      R(24, 70, 72, 18, SKY) + waves(80, WH, 1.6) + P('M30 72L52 40Q60 36 68 40L90 72Z', c) +
      P('M54 40L60 48L66 40Z', '#f6a12a') + face(60, 58, 0.9),
    // Onsen
    oita: (c) => S('M48 48q-5 -6 0 -12t0 -12M60 48q-5 -6 0 -12t0 -12M72 48q-5 -6 0 -12t0 -12', dk(c, 0.2), 3) +
      E(60, 70, 32, 14, '#8d8d8d') + E(60, 66, 28, 9, c) + C(60, 64, 9, '#fbe0c8') + face(60, 63, 0.55) +
      R(52, 52, 16, 4, WH, ' rx="2"'),
    // Fuji
    shizuoka: (c) => C(86, 30, 7, '#f6845c') + P('M22 86L50 40Q60 34 70 40L98 86Z', c) +
      P('M50 40Q60 34 70 40L78 52L70 50L64 56L58 50L50 54L42 52Z', WH) + face(60, 68, 1),
    // Tulpen
    toyama: (c) => S('M50 86Q50 70 48 58M72 86Q72 70 74 56', c, 3) +
      P('M36 86Q34 68 48 72Z', c) + P('M86 86Q88 66 72 72Z', c) +
      P('M38 40L44 46L48 38L52 46L58 40L58 54Q48 64 38 54Z', '#e0453a') +
      P('M64 38L70 44L74 36L78 44L84 38L84 52Q74 62 64 52Z', '#f6c445') + face(48, 50, 0.5) + face(74, 48, 0.5),
    // Awa-Odori: Strohhut und Fächer
    tokushima: (c) => P('M66 44L92 30L90 60Z', c) + S('M68 44L90 36M68 44L90 46M68 44L90 54', lt(c), 1.2) +
      P('M42 60Q60 74 78 60L82 86L38 86Z', c) + S('M48 64L60 78L72 64', WH, 2) +
      C(60, 54, 13, '#fbe0c8') + P('M30 50Q60 8 90 50Q60 34 30 50Z', '#e8c87a') + face(60, 56, 0.7),
    // Sanshin
    okinawa: (c) => R(57, 14, 6, 52, INK, ' rx="2"') + S('M54 20L50 18M66 24L70 22M54 28L50 26', INK, 2.5) +
      R(42, 56, 36, 30, '#2f3440', ' rx="8"') + R(46, 60, 28, 22, '#f2ede2', ' rx="5"') +
      S('M52 64l4 3l4 -3l4 3l4 -3M52 74l4 3l4 -3l4 3l4 -3', '#b9b1a0', 1) + S('M59 14L59 82M61 14L61 82', '#e8e0c8', 0.6) +
      P('M80 44Q90 36 94 46Q90 54 80 48Z', c) + P('M80 44Q74 34 84 32Q90 38 80 44Z', c) + C(81, 45, 2, '#f6c445'),
    // Akabeko (roter Kuh-Glücksbringer)
    fukushima: (c) => R(44, 52, 40, 22, c, ' rx="10"') + R(48, 70, 6, 14, c) + R(74, 70, 6, 14, c) +
      C(56, 60, 2.4, INK) + C(66, 64, 2.4, INK) + C(76, 58, 2.4, '#f6c445') + S('M84 58Q92 58 92 68', c, 2.5) +
      P('M30 40Q34 34 38 40M42 40Q46 34 50 40', 'none', ` stroke="${INK}" stroke-width="2.5"`) +
      R(28, 40, 24, 22, c, ' rx="10"') + E(40, 56, 7, 4, '#fbe0c8') + face(40, 48, 0.7) + R(44, 62, 10, 3, WH, ' rx="1.5"'),
    // Momotarō-Pfirsich
    okayama: (c) => P('M60 34C42 28 30 42 34 60C38 78 54 86 60 84C66 86 82 78 86 60C90 42 78 28 60 34Z', c) +
      S('M60 36Q54 56 60 82', dk(c, 0.15), 1.6) + P('M58 34Q50 20 38 26Q44 36 58 34Z', LEAF) + P('M62 34Q72 22 82 30Q74 38 62 34Z', LEAF) +
      face(60, 60, 0.9),
    // Kirschen
    yamagata: (c) => S('M42 62Q46 40 64 26M76 62Q72 42 64 26', '#6b8e3a', 2) + P('M64 26Q76 14 86 24Q76 32 64 26Z', LEAF) +
      C(42, 66, 14, c) + C(78, 66, 14, c) + C(37, 61, 3, lt(c)) + C(73, 61, 3, lt(c)) + face(42, 68, 0.6) + face(78, 68, 0.6),
    // Nebuta-Laterne
    aomori: (c) => R(32, 26, 56, 58, '#fff6dc', ' rx="18"') + P('M32 44Q38 24 60 24Q82 24 88 44Q74 34 60 36Q46 34 32 44Z', c) +
      P('M40 48L54 52L42 54Z', INK) + P('M80 48L66 52L78 54Z', INK) + C(48, 58, 3.5, INK) + C(72, 58, 3.5, INK) +
      S('M52 72Q60 78 68 72', c, 2.5) + E(42, 66, 4, 2.4, BLUSH) + E(78, 66, 4, 2.4, BLUSH) +
      S('M32 84L88 84', dk(c), 3),
    // Sonnenaufgang über dem Meer, Palme
    miyazaki: (c) => [-60, -30, 0, 30, 60].map((a) => {
      const r = (a - 90) * Math.PI / 180;
      return S(`M${(56 + 28 * Math.cos(r)).toFixed(1)} ${(64 + 28 * Math.sin(r)).toFixed(1)}L${(56 + 36 * Math.cos(r)).toFixed(1)} ${(64 + 36 * Math.sin(r)).toFixed(1)}`, c, 3);
    }).join('') + P('M34 64A22 22 0 0 1 78 64Z', c) + R(24, 64, 72, 22, SKY) + waves(74, WH, 1.6) +
      S('M86 72Q84 58 88 44', WOOD, 3) + P('M88 44Q78 38 72 46Q80 42 88 44Q96 36 100 44Q94 42 88 44Z', LEAF) + face(56, 54, 0.8),
    // Ise-Schrein: Strohdach mit gekreuzten Giebelbalken
    mie: (c) => S('M34 38L28 22M86 38L92 22', WOOD, 3) + P('M30 50L90 50L82 34L38 34Z', c) +
      [46, 56, 66, 76].map((x) => R(x - 3, 30, 6, 4, '#d4af37', ' rx="2"')).join('') +
      R(40, 50, 40, 22, '#e3c08a') + R(56, 58, 8, 14, WOOD) + R(34, 72, 52, 4, WOOD) +
      R(38, 76, 3, 10, WOOD) + R(79, 76, 3, 10, WOOD) + face(60, 46, 0.5),
    // Wal
    kochi: (c) => S('M50 34Q46 26 40 26M50 34Q54 24 60 24M50 34L50 26', SKY, 2.5) +
      P('M30 62Q30 40 54 40Q78 40 84 60L94 50L92 72L84 66Q76 80 54 80Q30 80 30 62Z', c) +
      P('M32 66Q54 74 80 66Q72 80 54 80Q36 78 32 66Z', lt(c, 0.6)) + face(46, 56, 0.85),
    // Mikan
    ehime: (c) => C(60, 58, 25, c) + P('M60 34Q66 24 78 26Q72 36 60 34Z', LEAF) + C(60, 34, 2, '#6b8e3a') +
      C(50, 46, 4, lt(c, 0.45)) + C(46, 54, 1.4, dk(c, 0.15)) + C(74, 66, 1.4, dk(c, 0.15)) + C(70, 48, 1.4, dk(c, 0.15)) +
      face(60, 60, 1),
    // Bonus Japan: roter Kreis mit goldenen Funkeln
    nihon: (c) => C(60, 54, 22, '#c8102e') + star(30, 30, 5, c) + star(90, 32, 4, c) + star(88, 78, 5, c) + star(32, 76, 4, c)
  };

  // Rahmen: Eisenrand, Punktring, Fläche, Kanji unten
  const DOTS = Array.from({ length: 24 }, (_, i) => {
    const a = i * Math.PI / 12;
    return [(60 + 54 * Math.cos(a)).toFixed(1), (60 + 54 * Math.sin(a)).toFixed(1)];
  });

  App.manholeCover = (def, { size = 120, locked = false } = {}) => {
    const gold = def.id === 'nihon';
    const rim = locked ? '#a8a8af' : gold ? '#b8902a' : '#3d3b42';
    const dot = locked ? '#d0d0d5' : gold ? '#f0d77a' : '#6e6b75';
    const plate = locked ? '#dcdce0' : mix(def.color, '#fbf6ec', 0.78);
    const label = locked && def.secret ? '？' : def.kanji;
    const title = locked && def.secret ? 'Geheimer Deckel' : 'Gullideckel ' + def.name;
    const motif = locked ? '' : (MOTIFS[def.id] || (() => ''))(def.color);
    const dash = locked ? ' stroke-dasharray="5 4"' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${App.esc(title)}">` +
      C(60, 60, 58, rim, locked ? ` stroke="#8e8e95" stroke-width="2"${dash}` : '') +
      DOTS.map(([x, y]) => C(x, y, 1.8, dot)).join('') +
      C(60, 60, 49, plate, ` stroke="${locked ? '#a5a5ab' : dk(rim, 0.3)}" stroke-width="2"${dash}`) +
      motif +
      `<text x="60" y="104" text-anchor="middle" font-size="${label.length > 2 ? 11 : 12}" font-weight="700" font-family="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif" fill="${locked ? '#6f6f76' : INK}">${App.esc(label)}</text>` +
      '</svg>';
  };
  App.manholeCovers = { MOTIFS };
})(window.App = window.App || {});
