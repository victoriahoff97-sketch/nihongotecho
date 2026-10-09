/* Nihongo Techō – Kawaii-Sticker und Merkzettel: bunte Vektorbilder, die wie eingefügte Bilder auf dem Blatt liegen (verschieben, skalieren, unter der Schrift). Browser: App.inkKawaii, Node: module.exports */
'use strict';
(function (root) {
  const O = '#7A5548', DARK = '#5A4038';
  const SK = (w) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`, ST = SK(2.5);
  const n1 = (v) => +v.toFixed(1);
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const rr = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); return `M${n1(x + r)} ${n1(y)}h${n1(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n1(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${n1(2 * r - w)}a${r} ${r} 0 0 1 ${-r} ${-r}v${n1(2 * r - h)}a${r} ${r} 0 0 1 ${r} ${-r}Z`; };
  const p = (d, fill, more = '', w = 2.5) => `<path d="${d}" fill="${fill}" ${SK(w)}${more ? ' ' + more : ''}/>`;
  const ln = (d, c = O, w = 2.5, more = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${more ? ' ' + more : ''}/>`;
  const dot = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  // Gesicht: Bäckchen, Knopfaugen mit Glanzpunkt, kleines Lächeln; Mitte zwischen den Augen bei (x, y)
  const face = (x, y, s = 1, blush = '#FF8FB0') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-15" cy="5.5" rx="4.5" ry="2.8" fill="${blush}" opacity=".85"/><ellipse cx="15" cy="5.5" rx="4.5" ry="2.8" fill="${blush}" opacity=".85"/><circle cx="-8" cy="0" r="3.2" fill="${DARK}"/><circle cx="8" cy="0" r="3.2" fill="${DARK}"/><circle cx="-9" cy="-1.2" r="1.1" fill="#fff"/><circle cx="7" cy="-1.2" r="1.1" fill="#fff"/><path d="M-3.5 4Q0 8 3.5 4" fill="none" stroke="${DARK}" stroke-width="1.8" stroke-linecap="round"/></g>`;
  const spark = (x, y, c, s = 1) => `<path transform="translate(${n1(x)} ${n1(y)}) scale(${s})" d="M0 -7Q0 0 7 0Q0 0 0 7Q0 0 -7 0Q0 0 0 -7Z" fill="${c}"/>`;
  const heart = (x, y, s, fill) => `<path transform="translate(${n1(x)} ${n1(y)}) scale(${s})" d="M0 9C-12 0 -9 -9 -4 -9C-2 -9 0 -7 0 -5C0 -7 2 -9 4 -9C9 -9 12 0 0 9Z" fill="${fill}" ${ST}/>`;

  const PINK = '#FFC2D9', ROSE = '#FF8FA3', YEL = '#FFE08A', MINT = '#A8E6CF', LILA = '#B9B5F0', SKY = '#BFE3FF', CREAM = '#FFFDF8', PEACH = '#F7C9A0', PLUM = '#6B5B8A';
  const BUBBLE = 'M22 16H78C86 16 90 22 90 30V56C90 64 86 70 78 70H48L30 86L33 70H22C14 70 10 64 10 56V30C10 22 14 16 22 16Z';
  const STAR = 'M50 12L61 36L88 39L68 57L74 84L50 70L26 84L32 57L12 39L39 36Z';
  const rays = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a); return `M${n1(50 + 35 * c)} ${n1(50 + 35 * s)}L${n1(50 + 41 * c)} ${n1(50 + 41 * s)}`; }).join('');
  const PETAL = 'M50 50C36 40 36 22 45 12L50 19L55 12C64 22 64 40 50 50Z';

  // Sticker im Feld 100 × 100: edge = weißer Stickerrand (sonst sil), pre = hinter der Hauptform, sil + fill = Hauptform, body = darüber
  const STICKERS = [
    { id: 'onigiri', label: 'Onigiri', sil: 'M50 12C58 12 62 18 66 26L86 64C92 78 84 88 70 88H30C16 88 8 78 14 64L34 26C38 18 42 12 50 12Z', fill: CREAM, body: p('M36 88V70Q36 65 41 65H59Q64 65 64 70V88Z', PLUM) + face(50, 48) },
    { id: 'daruma', label: 'Daruma', sil: circ(50, 50, 40), fill: ROSE, body: p('M23 44a27 21 0 1 0 54 0a27 21 0 1 0 -54 0Z', '#FFF3E0') + ln('M36 72Q50 82 64 72M42 80Q50 85 58 80', '#FFD166', 3) + face(50, 44) },
    { id: 'sakura', label: 'Sakura', edge: circ(50, 50, 37), body: [0, 72, 144, 216, 288].map((a) => p(PETAL, PINK, `transform="rotate(${a} 50 50)"`)).join('') + dot(50, 50, 13, '#FFE9F1') + face(50, 49, 0.62) },
    { id: 'fuji', label: 'Fuji', sil: 'M8 86L36 26C40 18 44 22 50 20C56 18 60 18 64 26L92 86Z', fill: LILA, body: p('M36 26C40 18 44 22 50 20C56 18 60 18 64 26L70 40L63 34L56 42L50 34L44 42L37 34L30 40Z', '#fff') + face(50, 64) },
    { id: 'tee', label: 'Tee', sil: 'M22 40L26 76C27 84 34 88 42 88H58C66 88 73 84 74 76L78 40Z', fill: MINT, edge: 'M22 40L26 76C27 84 34 88 42 88H58C66 88 73 84 74 76L78 40Z M22 40a28 7 0 1 0 56 0a28 7 0 1 0 -56 0Z', body: p('M22 40a28 7 0 1 0 56 0a28 7 0 1 0 -56 0Z', '#D6EE9A') + ln('M42 26C38 20 46 16 42 10M58 26C54 20 62 16 58 10', LILA, 3) + face(50, 64) },
    { id: 'torii', label: 'Torii', edge: rr(24, 30, 10, 60, 3) + rr(66, 30, 10, 60, 3) + 'M8 16C30 24 70 24 92 16L89 31C70 37 30 37 11 31Z' + rr(17, 44, 66, 9, 3), pre: p(rr(24, 30, 10, 60, 3) + rr(66, 30, 10, 60, 3), ROSE), sil: 'M8 16C30 24 70 24 92 16L89 31C70 37 30 37 11 31Z' + rr(17, 44, 66, 9, 3), fill: ROSE, body: spark(50, 68, '#FFD166', 0.9) + spark(40, 80, MINT, 0.5) + spark(60, 80, LILA, 0.5) },
    { id: 'laterne', label: 'Laterne', edge: 'M50 16C76 16 86 34 86 52C86 70 76 86 50 86C24 86 14 70 14 52C14 34 24 16 50 16Z' + rr(36, 8, 28, 10, 3) + rr(36, 82, 28, 10, 3), sil: 'M50 16C76 16 86 34 86 52C86 70 76 86 50 86C24 86 14 70 14 52C14 34 24 16 50 16Z', fill: ROSE, body: ln('M32 21C22 40 22 64 32 81M68 21C78 40 78 64 68 81', '#FFC2D9', 2.5) + p(rr(36, 8, 28, 10, 3) + rr(36, 82, 28, 10, 3), PLUM) + face(50, 52, 1, '#FFD0DC') },
    { id: 'neko', label: 'Glückskatze', sil: 'M20 40L18 12L40 24C46 22 54 22 60 24L82 12L80 40C88 52 86 88 50 88C14 88 12 52 20 40Z', fill: CREAM, body: `<path d="M24 21L25 33L35 27Z" fill="${PINK}"/><path d="M76 21L75 33L65 27Z" fill="${PINK}"/>` + ln('M30 78C40 85 60 85 70 78', ROSE, 5) + p(circ(50, 83, 5), YEL) + face(50, 54) },
    { id: 'panda', label: 'Panda', edge: circ(50, 54, 36) + circ(22, 24, 12) + circ(78, 24, 12), pre: p(circ(22, 24, 12) + circ(78, 24, 12), DARK), sil: circ(50, 54, 36), fill: '#fff', body: `<ellipse cx="35" cy="52" rx="9" ry="11" fill="${DARK}" transform="rotate(18 35 52)"/><ellipse cx="65" cy="52" rx="9" ry="11" fill="${DARK}" transform="rotate(-18 65 52)"/>` + dot(36, 51, 3, '#fff') + dot(64, 51, 3, '#fff') + `<ellipse cx="50" cy="62" rx="4" ry="2.8" fill="${DARK}"/>` + ln('M45 68Q50 73 55 68', DARK, 1.8) + `<ellipse cx="24" cy="66" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/><ellipse cx="76" cy="66" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/>` },
    { id: 'dango', label: 'Dango', edge: circ(50, 24, 15) + circ(50, 51, 15) + circ(50, 78, 15), pre: ln('M50 8V95', '#C9A27A', 4), body: p(circ(50, 24, 15), PINK) + p(circ(50, 51, 15), CREAM) + p(circ(50, 78, 15), '#CDEBA8') + face(50, 50, 0.6) },
    { id: 'sushi', label: 'Sushi', edge: 'M16 60C16 50 24 46 50 46C76 46 84 50 84 60V72C84 80 76 84 50 84C24 84 16 80 16 72Z M12 46C12 32 30 26 50 26C70 26 88 32 88 46C88 55 70 58 50 58C30 58 12 55 12 46Z', sil: 'M16 60C16 50 24 46 50 46C76 46 84 50 84 60V72C84 80 76 84 50 84C24 84 16 80 16 72Z', fill: CREAM, body: p('M12 46C12 32 30 26 50 26C70 26 88 32 88 46C88 55 70 58 50 58C30 58 12 55 12 46Z', '#FFA98F') + ln('M33 30L27 53M50 28L47 56M67 30L66 54', '#FFD9CC', 3) + face(50, 70, 0.75) },
    { id: 'ramen', label: 'Ramen', sil: 'M10 46H90C90 70 74 86 50 86C26 86 10 70 10 46Z', fill: ROSE, edge: 'M10 46H90C90 70 74 86 50 86C26 86 10 70 10 46Z M10 46a40 10 0 1 0 80 0a40 10 0 1 0 -80 0Z', body: p('M10 46a40 10 0 1 0 80 0a40 10 0 1 0 -80 0Z', '#FFE9A8') + ln('M60 44L82 12M68 45L90 16', O, 3.5) + p(circ(34, 45, 6), '#fff') + dot(34, 45, 2, ROSE) + ln('M44 48C48 46 52 50 56 47', '#F5C76E', 2.5) + face(50, 66, 1, '#FFD0DC') },
    { id: 'stern', label: 'Wichtig', sil: STAR, fill: YEL, body: face(50, 50, 0.85) },
    { id: 'herz', label: 'Liebling', sil: 'M50 86C22 66 10 50 10 34C10 20 21 12 32 12C40 12 47 17 50 24C53 17 60 12 68 12C79 12 90 20 90 34C90 50 78 66 50 86Z', fill: PINK, body: face(50, 42) },
    { id: 'idee', label: 'Idee', edge: 'M50 10C68 10 80 23 80 39C80 50 74 57 68 63C65 66 64 69 64 73H36C36 69 35 66 32 63C26 57 20 50 20 39C20 23 32 10 50 10Z' + rr(38, 73, 24, 15, 5), sil: 'M50 10C68 10 80 23 80 39C80 50 74 57 68 63C65 66 64 69 64 73H36C36 69 35 66 32 63C26 57 20 50 20 39C20 23 32 10 50 10Z', fill: YEL, body: p(rr(38, 73, 24, 15, 5), '#C9C4D9') + ln('M40 80H60', O, 2) + face(50, 42) + spark(88, 16, '#FF8FB0', 0.8) + spark(12, 20, MINT, 0.6) },
    { id: 'achtung', label: 'Achtung', sil: 'M50 12C54 12 57 14 59 18L90 74C94 82 89 88 81 88H19C11 88 6 82 10 74L41 18C43 14 46 12 50 12Z', fill: '#FFC27A', body: ln('M50 36V58', '#fff', 8) + dot(50, 73, 4.5, '#fff') + `<ellipse cx="30" cy="76" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/><ellipse cx="70" cy="76" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/>` },
    { id: 'frage', label: 'Frage', sil: BUBBLE, fill: '#E0D4FF', body: ln('M40 36C40 24 60 23 60 35C60 43 50 42 50 51', O, 5) + dot(50, 60, 3.2, O) + spark(78, 28, '#FFD166', 0.6) },
    { id: 'haken', label: 'Verstanden', sil: circ(50, 50, 40), fill: MINT, body: ln('M30 52L44 66L72 36', '#fff', 9) + spark(84, 18, '#FFD166', 0.8) },
    { id: 'sprechen', label: 'Sprechen', sil: BUBBLE, fill: SKY, body: face(50, 42) },
    { id: 'hoeren', label: 'Hören', edge: circ(38, 72, 17) + 'M58 12C72 16 82 26 78 44C72 34 66 32 58 32Z M53 12h5v60h-5Z', pre: ln('M56 72V14', O, 5), sil: circ(38, 72, 17) + 'M56 12C72 16 82 26 78 44C72 34 66 32 56 32Z', fill: LILA, body: face(38, 71, 0.62) },
    { id: 'lesen', label: 'Lesen', sil: rr(20, 12, 60, 76, 8), fill: PINK, body: p('M26 74H80V86H26C22 86 20 83 20 80C20 77 22 74 26 74Z', CREAM) + p('M60 12V32L66 26L72 32V12Z', YEL) + face(48, 46) },
    { id: 'buch', label: 'Lehrbuch', sil: 'M50 26C40 18 24 18 10 22V78C24 74 40 74 50 82C60 74 76 74 90 78V22C76 18 60 18 50 26Z', fill: CREAM, body: ln('M50 26V82') + ln('M18 36C26 34 34 34 42 38M18 48C26 46 34 46 42 50M58 38C66 34 74 34 82 36M58 50C66 46 74 46 82 48', MINT, 3) + heart(70, 64, 0.7, PINK) + heart(30, 64, 0.7, YEL) },
    { id: 'schreiben', label: 'Schreiben', rot: 40, edge: 'M44 8H56Q60 8 60 12V68L50 90L40 68V12Q40 8 44 8Z', sil: 'M40 20H60V68H40Z', fill: YEL, body: p('M44 8H56Q60 8 60 12V20H40V12Q40 8 44 8Z', ROSE) + p('M40 68L50 90L60 68Z', PEACH) + `<path d="M46.4 82L50 90L53.6 82Z" fill="${DARK}"/>` + face(50, 44, 0.55) },
    { id: 'zeit', label: 'Zeit', edge: circ(50, 54, 36) + circ(24, 20, 9) + circ(76, 20, 9), pre: p(circ(24, 20, 9) + circ(76, 20, 9), ROSE), sil: circ(50, 54, 36), fill: MINT, body: p(circ(50, 54, 27), CREAM) + ln('M50 54V37M50 54L61 49', O, 3.5) + face(50, 66, 0.7) },
    { id: 'aufgabe', label: 'Aufgabe', sil: 'M50 10L92 46H82V86H18V46H8Z', fill: '#FFE9C9', body: p('M50 10L92 46H8Z', ROSE) + p(rr(43, 70, 14, 16, 3), PEACH) + face(50, 57, 0.8) },
    { id: 'wiederholen', label: 'Nochmal', sil: circ(50, 50, 40), fill: '#E0D4FF', body: ln('M30 46C32 34 44 28 56 31C62 33 66 37 68 42M70 29V43H56M70 54C68 66 56 72 44 69C38 67 34 63 32 58M30 71V57H44', '#fff', 6) },
    { id: 'merken', label: 'Merken', edge: circ(50, 36, 26), pre: ln('M50 60V92', O, 4), sil: circ(50, 36, 26), fill: ROSE, body: `<ellipse cx="38" cy="22" rx="6" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-35 38 22)"/>` + face(50, 38, 0.85, '#FFD0DC') },
    { id: 'termin', label: 'Termin', sil: rr(12, 18, 76, 70, 10), fill: CREAM, body: p('M12 40V28C12 22 16 18 22 18H78C84 18 88 22 88 28V40Z', ROSE) + ln('M32 11V26M68 11V26', O, 5) + face(50, 62) },
    { id: 'ziel', label: 'Ziel', edge: 'M24 14C40 8 52 22 84 14V54C52 62 40 48 24 54Z M22 10h4v82h-4Z', pre: ln('M24 10V92', O, 5), sil: 'M24 14C40 8 52 22 84 14V54C52 62 40 48 24 54Z', fill: MINT, body: face(54, 33, 0.8) },
    { id: 'leicht', label: 'Leicht', edge: circ(50, 50, 39), pre: ln(rays, '#FFC27A', 6), sil: circ(50, 50, 28), fill: YEL, body: face(50, 50) },
    { id: 'schwer', label: 'Schwer', sil: 'M58 8L22 54H44L36 92L78 42H56Z', fill: YEL, body: face(50, 49, 0.5) },
    { id: 'denken', label: 'Gedanke', sil: 'M28 74C14 74 8 64 12 54C8 40 22 30 34 36C38 22 60 20 66 34C80 28 94 42 86 56C92 66 84 74 72 74Z', fill: '#DFF1FF', body: face(50, 55) + p(circ(22, 86, 4), '#DFF1FF') },
  ];

  // ---------- Merkzettel, Rahmen, Kanji-Feld: f(W, H) in Tausendstel der Seitenbreite; Verzierungen behalten beim Ziehen ihre Größe ----------
  const tape = (x, y, c, a) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${a} 34 10)"><rect width="68" height="20" fill="${c}" opacity=".9"/><path d="M9 0V20M21 0V20M33 0V20M45 0V20M57 0V20" stroke="#fff" stroke-width="3" opacity=".75"/></g>`;
  const note = (fill, fold, tp) => (W, H) => {
    const f = Math.min(26, W / 4, H / 4), b = H - 3, r = W - 3;
    return p(`M3 12H${n1(r)}V${n1(b - f)}L${n1(r - f)} ${n1(b)}H3Z`, fill) + p(`M${n1(r)} ${n1(b - f)}H${n1(r - f)}V${n1(b)}Z`, fold) + tape(W / 2 - 34, 1, tp, -3);
  };
  const cloud = (W, H) => {
    const m = 19, side = (len) => { const n = Math.max(2, Math.round(len / 28)); return [n, len / n]; };
    const [nx, sx] = side(W - 2 * m), [ny, sy] = side(H - 2 * m);
    const arcs = (n, s, dx, dy) => Array(n).fill(`a${n1(s / 2)} ${n1(s / 2)} 0 0 1 ${n1(dx * s)} ${n1(dy * s)}`).join('');
    return p(`M${m} ${m}` + arcs(nx, sx, 1, 0) + arcs(ny, sy, 0, 1) + arcs(nx, sx, -1, 0) + arcs(ny, sy, 0, -1) + 'Z', '#E9E0FF')
      + `<path d="${rr(m + 6, m + 6, W - 2 * m - 12, H - 2 * m - 12, 9)}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/>`
      + heart(W - m - 8, m - 1, 1.3, ROSE);
  };
  const bear = (W, H) => {
    const ex = Math.min(34, W / 4), lines = [];
    for (let y = 72; y < H - 14; y += 24) lines.push(`M14 ${y}H${n1(W - 14)}`);
    return p(circ(ex, 17, 14) + circ(n1(W - ex), 17, 14), PEACH) + dot(ex, 17, 6.5, '#FFB3C7') + dot(n1(W - ex), 17, 6.5, '#FFB3C7')
      + p(rr(2, 14, W - 4, H - 16, 14), CREAM) + p(`M2 48V28a14 14 0 0 1 14 -14H${n1(W - 16)}a14 14 0 0 1 14 14V48Z`, PEACH)
      + face(n1(W / 2), 30, 1.25) + (lines.length ? ln(lines.join(''), '#CDEBDD', 2) : '');
  };
  const banner = (W, H) => {
    const h = H * 0.74, t = H * 0.26;
    return p(`M2 ${n1(t)}H22V${n1(H - 2)}H2L11 ${n1((t + H) / 2)}Z M${n1(W - 2)} ${n1(t)}H${n1(W - 22)}V${n1(H - 2)}H${n1(W - 2)}L${n1(W - 11)} ${n1((t + H) / 2)}Z`, '#7FD6B4')
      + p(rr(12, 2, W - 24, h, 6), MINT)
      + `<path d="M20 ${n1(2 + 7)}H${n1(W - 20)}M20 ${n1(h - 5)}H${n1(W - 20)}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>`
      + spark(W - 14, 9, '#FFD166', 1);
  };
  const box = (W, H) => p(rr(3, 14, W - 6, H - 17, 12), '#DFF7EC')
    + `<path d="${rr(10, 21, W - 20, H - 31, 8)}" fill="none" stroke="#7FD6B4" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>`
    + `<g transform="translate(-2 -8) scale(.5)">${p(STAR, YEL, '', 6)}${face(50, 50, 0.85)}</g>`
    + spark(W - 16, H - 14, '#FF8FB0', 0.9) + spark(W - 32, H - 9, LILA, 0.5);
  // Kanji-Feld: Kästchen mit Hilfslinien, darüber ein Feld für die Lesung, darunter eines für die Bedeutung; breiter ziehen = mehr Kästchen
  const KJ = { pad: 9, top: 24, bot: 26, gap: 6 };
  const kjFit = (W, H) => {
    const s = Math.max(20, H - 2 * KJ.pad - KJ.top - KJ.bot - 2 * KJ.gap);
    const n = Math.max(1, Math.round((W - 2 * KJ.pad + KJ.gap) / (s + KJ.gap)));
    return { s, n, T: n * s + (n - 1) * KJ.gap };
  };
  const kanji = (W, H) => {
    const { s, n, T } = kjFit(W, H), x0 = (W - T) / 2, y0 = KJ.pad + KJ.top + KJ.gap;
    let out = p(rr(2, 2, W - 4, H - 4, 10), '#FFD9E6') + p(rr(x0, KJ.pad, T, KJ.top, 5), CREAM, '', 1.8) + p(rr(x0, y0 + s + KJ.gap, T, KJ.bot, 5), CREAM, '', 1.8);
    for (let i = 0; i < n; i++) {
      const x = n1(x0 + i * (s + KJ.gap));
      out += `<rect x="${x}" y="${y0}" width="${n1(s)}" height="${n1(s)}" fill="${CREAM}" stroke="${O}" stroke-width="2"/><path d="M${n1(x + s / 2)} ${y0}v${n1(s)}M${x} ${n1(y0 + s / 2)}h${n1(s)}" fill="none" stroke="#FF9DB8" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    }
    return out;
  };

  const MIN = { w: 0.06, h: 0.04 };
  const NOTES = [
    { id: 'kanji', label: 'Kanji-Feld', draw: kanji, w: 0.112, h: 0.174, min: { w: 0.06, h: 0.118 } },
    { id: 'kanji3', as: 'kanji', label: 'Kanji-Reihe', w: 0.312, h: 0.174 },
    { id: 'zettel', label: 'Klebezettel', draw: note('#FFF1A8', '#F5D76E', '#FF9DB8'), w: 0.28, h: 0.2 },
    { id: 'zettel-rosa', label: 'Zettel rosa', draw: note('#FFD9E6', '#FFB3C7', MINT), w: 0.28, h: 0.2 },
    { id: 'zettel-mint', label: 'Zettel mint', draw: note('#DFF7EC', MINT, LILA), w: 0.28, h: 0.2 },
    { id: 'wolke', label: 'Wolkenrahmen', draw: cloud, w: 0.3, h: 0.2, min: { w: 0.1, h: 0.09 } },
    { id: 'baer', label: 'Bären-Block', draw: bear, w: 0.26, h: 0.24, min: { w: 0.12, h: 0.09 } },
    { id: 'kasten', label: 'Merkkasten', draw: box, w: 0.34, h: 0.16 },
    { id: 'banner', label: 'Banner', draw: banner, w: 0.3, h: 0.07 },
  ];

  const SIZE = 0.09; // Kantenlänge eines Stickers beim Einfügen (Anteil der Seitenbreite)
  const LIST = STICKERS.map((s) => ({ id: s.id, label: s.label, group: 'sticker', free: false, w: SIZE, h: SIZE }))
    .concat(NOTES.map((s) => ({ id: s.id, as: s.as || s.id, label: s.label, group: 'zettel', free: true, w: s.w, h: s.h })));
  const stickers = new Map(STICKERS.map((s) => [s.id, s])), notes = new Map(NOTES.map((s) => [s.id, s]));
  const free = (id) => notes.has(id);
  const min = (id) => (notes.get(id) || {}).min || MIN;

  const sticker = (d) => {
    const edge = d.edge || d.sil;
    const inner = `<path d="${edge}" fill="${DARK}" fill-opacity=".1" stroke="${DARK}" stroke-opacity=".1" stroke-width="12" stroke-linejoin="round"/><path d="${edge}" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>`
      + (d.pre || '') + (d.sil ? p(d.sil, d.fill) : '') + (d.body || '');
    return d.rot ? `<g transform="rotate(${d.rot} 50 50)">${inner}</g>` : inner;
  };
  // Vektorbild in der Form w × h (Anteile der Seitenbreite); Sticker füllen ihr Feld, Zettel werden für genau diese Form gezeichnet
  const svg = (id, w, h) => {
    const s = stickers.get(id);
    if (s) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">' + sticker(s) + '</svg>';
    let d = notes.get(id);
    if (d && d.as) d = notes.get(d.as);
    if (!d || !(w > 0 && h > 0)) return '';
    const W = Math.round(w * 1000), H = Math.round(h * 1000);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">` + d.draw(W, H) + '</svg>';
  };
  // Bild-Eintrag { k, w, h } → Daten-URL; key ändert sich, sobald das Bild neu gezeichnet werden muss
  const src = (im) => { const s = svg(im.k, im.w, im.h); return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) : ''; };
  const key = (im) => (free(im.k) ? im.k + ':' + Math.round(im.w * 1000) + 'x' + Math.round(im.h * 1000) : im.k);
  // nach dem Ziehen: das Kanji-Feld schnappt auf ganze Kästchen
  const snap = (id, w, h) => {
    if (id !== 'kanji') return { w, h };
    const f = kjFit(w * 1000, h * 1000);
    return { w: +((f.T + 2 * KJ.pad) / 1000).toFixed(4), h: +((f.s + 2 * KJ.pad + KJ.top + KJ.bot + 2 * KJ.gap) / 1000).toFixed(4) };
  };
  // Platz beim Einfügen: Mitte am Tipp-Punkt, ganz auf der Seite
  const place = (id, pt, pageH) => {
    const d = LIST.find((s) => s.id === id);
    if (!d) return null;
    const cl = (v, hi) => +Math.max(0, Math.min(Math.max(0, hi), v)).toFixed(4);
    return { k: d.as || d.id, x: cl(pt[0] - d.w / 2, 1 - d.w), y: cl(pt[1] - d.h / 2, pageH - d.h), w: d.w, h: d.h };
  };

  const P = { SIZE, LIST, svg, src, key, free, min, snap, place };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkKawaii = P;
})(this);
