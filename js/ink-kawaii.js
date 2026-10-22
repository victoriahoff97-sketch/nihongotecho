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
  // Gesicht: Bäckchen, Knopfaugen mit Glanzpunkt, kleines Lächeln; Mitte zwischen den Augen bei (x, y). class="f" = fällt im Stil „Süß“ weg
  const face = (x, y, s = 1, blush = '#FF8FB0') => `<g class="f" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-15" cy="5.5" rx="4.5" ry="2.8" fill="${blush}" opacity=".85"/><ellipse cx="15" cy="5.5" rx="4.5" ry="2.8" fill="${blush}" opacity=".85"/><circle cx="-8" cy="0" r="3.2" fill="${DARK}"/><circle cx="8" cy="0" r="3.2" fill="${DARK}"/><circle cx="-9" cy="-1.2" r="1.1" fill="#fff"/><circle cx="7" cy="-1.2" r="1.1" fill="#fff"/><path d="M-3.5 4Q0 8 3.5 4" fill="none" stroke="${DARK}" stroke-width="1.8" stroke-linecap="round"/></g>`;
  const spark = (x, y, c, s = 1) => `<path transform="translate(${n1(x)} ${n1(y)}) scale(${s})" d="M0 -7Q0 0 7 0Q0 0 0 7Q0 0 -7 0Q0 0 0 -7Z" fill="${c}"/>`;
  const fx = (s) => `<g class="f">${s}</g>`; // eigene Gesichtsteile (Bäckchen …), die im Stil „Süß“ wegfallen
  const eyes = (x1, x2, y, r = 3) => dot(x1, y, r, DARK) + dot(x2, y, r, DARK); // Punktaugen für „Süß“
  const gl = (d) => ln(d, '#fff', 4, 'opacity=".75"'); // Glanzstrich
  const heart = (x, y, s, fill) => `<path transform="translate(${n1(x)} ${n1(y)}) scale(${s})" d="M0 9C-12 0 -9 -9 -4 -9C-2 -9 0 -7 0 -5C0 -7 2 -9 4 -9C9 -9 12 0 0 9Z" fill="${fill}" ${ST}/>`;

  const PINK = '#FFC2D9', ROSE = '#FF8FA3', YEL = '#FFE08A', MINT = '#A8E6CF', LILA = '#B9B5F0', SKY = '#BFE3FF', CREAM = '#FFFDF8', PEACH = '#F7C9A0', PLUM = '#6B5B8A';
  const BUBBLE = 'M22 16H78C86 16 90 22 90 30V56C90 64 86 70 78 70H48L30 86L33 70H22C14 70 10 64 10 56V30C10 22 14 16 22 16Z';
  const STAR = 'M50 12L61 36L88 39L68 57L74 84L50 70L26 84L32 57L12 39L39 36Z';
  const rays = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a); return `M${n1(50 + 35 * c)} ${n1(50 + 35 * s)}L${n1(50 + 41 * c)} ${n1(50 + 41 * s)}`; }).join('');
  const PETAL = 'M50 50C36 40 36 22 45 12L50 19L55 12C64 22 64 40 50 50Z';
  const UMBRELLA = 'M12 54C12 30 30 16 50 16C70 16 88 30 88 54C82 48 75 48 69 54C63 48 56 48 50 54C44 48 37 48 31 54C25 48 18 48 12 54Z';
  const CROWN = 'M16 32L33 48L50 22L67 48L84 32L78 80H22Z';
  const PETALS8 = Array.from({ length: 8 }, (_, i) => circ(n1(50 + 27 * Math.cos((i * Math.PI) / 4)), n1(50 + 27 * Math.sin((i * Math.PI) / 4)), 13)).join('');
  const BRAIN = 'M50 20C40 12 24 16 22 30C10 34 10 54 20 60C18 74 34 82 44 76C48 82 52 82 56 76C66 82 82 74 80 60C90 54 90 34 78 30C76 16 60 12 50 20Z';
  const MIC = 'M24 38C24 68 76 68 76 38H70C70 60 30 60 30 38Z';
  const BOW = 'M50 38C40 14 16 18 20 36C24 48 44 44 50 40C56 44 76 48 80 36C84 18 60 14 50 38Z';

  // Sticker im Feld 100 × 100: edge = weißer Stickerrand (sonst sil), pre = hinter der Hauptform, sil + fill = Hauptform, body = darüber,
  // sx = nur im Stil „Süß“ (ohne Gesicht) zusätzlich, z. B. Punktaugen oder Glanz
  const STICKERS = [
    { id: 'onigiri', label: 'Onigiri', sil: 'M50 12C58 12 62 18 66 26L86 64C92 78 84 88 70 88H30C16 88 8 78 14 64L34 26C38 18 42 12 50 12Z', fill: CREAM, body: p('M36 88V70Q36 65 41 65H59Q64 65 64 70V88Z', PLUM) + face(50, 48), sx: gl('M38 36Q42 28 47 24') },
    { id: 'daruma', label: 'Daruma', sil: circ(50, 50, 40), fill: ROSE, body: p('M23 44a27 21 0 1 0 54 0a27 21 0 1 0 -54 0Z', '#FFF3E0') + ln('M36 72Q50 82 64 72M42 80Q50 85 58 80', '#FFD166', 3) + face(50, 44), sx: eyes(42, 58, 44, 3.4) + ln('M46 52Q50 55 54 52', DARK, 2) },
    { id: 'sakura', label: 'Sakura', edge: circ(50, 50, 37), body: [0, 72, 144, 216, 288].map((a) => p(PETAL, PINK, `transform="rotate(${a} 50 50)"`)).join('') + dot(50, 50, 13, '#FFE9F1') + face(50, 49, 0.62) },
    { id: 'fuji', label: 'Fuji', sil: 'M8 86L36 26C40 18 44 22 50 20C56 18 60 18 64 26L92 86Z', fill: LILA, body: p('M36 26C40 18 44 22 50 20C56 18 60 18 64 26L70 40L63 34L56 42L50 34L44 42L37 34L30 40Z', '#fff') + face(50, 64) },
    { id: 'tee', label: 'Tee', sil: 'M22 40L26 76C27 84 34 88 42 88H58C66 88 73 84 74 76L78 40Z', fill: MINT, edge: 'M22 40L26 76C27 84 34 88 42 88H58C66 88 73 84 74 76L78 40Z M22 40a28 7 0 1 0 56 0a28 7 0 1 0 -56 0Z', body: p('M22 40a28 7 0 1 0 56 0a28 7 0 1 0 -56 0Z', '#D6EE9A') + ln('M42 26C38 20 46 16 42 10M58 26C54 20 62 16 58 10', LILA, 3) + face(50, 64) },
    { id: 'torii', label: 'Torii', edge: rr(24, 30, 10, 60, 3) + rr(66, 30, 10, 60, 3) + 'M8 16C30 24 70 24 92 16L89 31C70 37 30 37 11 31Z' + rr(17, 44, 66, 9, 3), pre: p(rr(24, 30, 10, 60, 3) + rr(66, 30, 10, 60, 3), ROSE), sil: 'M8 16C30 24 70 24 92 16L89 31C70 37 30 37 11 31Z' + rr(17, 44, 66, 9, 3), fill: ROSE, body: spark(50, 68, '#FFD166', 0.9) + spark(40, 80, MINT, 0.5) + spark(60, 80, LILA, 0.5) },
    { id: 'laterne', label: 'Laterne', edge: 'M50 16C76 16 86 34 86 52C86 70 76 86 50 86C24 86 14 70 14 52C14 34 24 16 50 16Z' + rr(36, 8, 28, 10, 3) + rr(36, 82, 28, 10, 3), sil: 'M50 16C76 16 86 34 86 52C86 70 76 86 50 86C24 86 14 70 14 52C14 34 24 16 50 16Z', fill: ROSE, body: ln('M32 21C22 40 22 64 32 81M68 21C78 40 78 64 68 81', '#FFC2D9', 2.5) + p(rr(36, 8, 28, 10, 3) + rr(36, 82, 28, 10, 3), PLUM) + face(50, 52, 1, '#FFD0DC'), sx: gl('M24 40Q26 32 30 28') },
    { id: 'neko', label: 'Glückskatze', sil: 'M20 40L18 12L40 24C46 22 54 22 60 24L82 12L80 40C88 52 86 88 50 88C14 88 12 52 20 40Z', fill: CREAM, body: `<path d="M24 21L25 33L35 27Z" fill="${PINK}"/><path d="M76 21L75 33L65 27Z" fill="${PINK}"/>` + ln('M30 78C40 85 60 85 70 78', ROSE, 5) + p(circ(50, 83, 5), YEL) + face(50, 54), sx: eyes(40, 60, 54) + `<path d="M47 60H53L50 63Z" fill="${ROSE}"/>` },
    { id: 'panda', label: 'Panda', edge: circ(50, 54, 36) + circ(22, 24, 12) + circ(78, 24, 12), pre: p(circ(22, 24, 12) + circ(78, 24, 12), DARK), sil: circ(50, 54, 36), fill: '#fff', body: `<ellipse cx="35" cy="52" rx="9" ry="11" fill="${DARK}" transform="rotate(18 35 52)"/><ellipse cx="65" cy="52" rx="9" ry="11" fill="${DARK}" transform="rotate(-18 65 52)"/>` + dot(36, 51, 3, '#fff') + dot(64, 51, 3, '#fff') + `<ellipse cx="50" cy="62" rx="4" ry="2.8" fill="${DARK}"/>` + ln('M45 68Q50 73 55 68', DARK, 1.8) + fx(`<ellipse cx="24" cy="66" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/><ellipse cx="76" cy="66" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/>`) },
    { id: 'dango', label: 'Dango', edge: circ(50, 24, 15) + circ(50, 51, 15) + circ(50, 78, 15), pre: ln('M50 8V95', '#C9A27A', 4), body: p(circ(50, 24, 15), PINK) + p(circ(50, 51, 15), CREAM) + p(circ(50, 78, 15), '#CDEBA8') + face(50, 50, 0.6) },
    { id: 'sushi', label: 'Sushi', edge: 'M16 60C16 50 24 46 50 46C76 46 84 50 84 60V72C84 80 76 84 50 84C24 84 16 80 16 72Z M12 46C12 32 30 26 50 26C70 26 88 32 88 46C88 55 70 58 50 58C30 58 12 55 12 46Z', sil: 'M16 60C16 50 24 46 50 46C76 46 84 50 84 60V72C84 80 76 84 50 84C24 84 16 80 16 72Z', fill: CREAM, body: p('M12 46C12 32 30 26 50 26C70 26 88 32 88 46C88 55 70 58 50 58C30 58 12 55 12 46Z', '#FFA98F') + ln('M33 30L27 53M50 28L47 56M67 30L66 54', '#FFD9CC', 3) + face(50, 70, 0.75) },
    { id: 'ramen', label: 'Ramen', sil: 'M10 46H90C90 70 74 86 50 86C26 86 10 70 10 46Z', fill: ROSE, edge: 'M10 46H90C90 70 74 86 50 86C26 86 10 70 10 46Z M10 46a40 10 0 1 0 80 0a40 10 0 1 0 -80 0Z', body: p('M10 46a40 10 0 1 0 80 0a40 10 0 1 0 -80 0Z', '#FFE9A8') + ln('M60 44L82 12M68 45L90 16', O, 3.5) + p(circ(34, 45, 6), '#fff') + dot(34, 45, 2, ROSE) + ln('M44 48C48 46 52 50 56 47', '#F5C76E', 2.5) + face(50, 66, 1, '#FFD0DC') },
    { id: 'stern', label: 'Wichtig', sil: STAR, fill: YEL, body: face(50, 50, 0.85), sx: gl('M40 36L46 30') },
    { id: 'herz', label: 'Liebling', sil: 'M50 86C22 66 10 50 10 34C10 20 21 12 32 12C40 12 47 17 50 24C53 17 60 12 68 12C79 12 90 20 90 34C90 50 78 66 50 86Z', fill: PINK, body: face(50, 42), sx: gl('M24 32Q26 22 34 20') },
    { id: 'idee', label: 'Idee', edge: 'M50 10C68 10 80 23 80 39C80 50 74 57 68 63C65 66 64 69 64 73H36C36 69 35 66 32 63C26 57 20 50 20 39C20 23 32 10 50 10Z' + rr(38, 73, 24, 15, 5), sil: 'M50 10C68 10 80 23 80 39C80 50 74 57 68 63C65 66 64 69 64 73H36C36 69 35 66 32 63C26 57 20 50 20 39C20 23 32 10 50 10Z', fill: YEL, body: p(rr(38, 73, 24, 15, 5), '#C9C4D9') + ln('M40 80H60', O, 2) + face(50, 42) + spark(88, 16, '#FF8FB0', 0.8) + spark(12, 20, MINT, 0.6) },
    { id: 'achtung', label: 'Achtung', sil: 'M50 12C54 12 57 14 59 18L90 74C94 82 89 88 81 88H19C11 88 6 82 10 74L41 18C43 14 46 12 50 12Z', fill: '#FFC27A', body: ln('M50 36V58', '#fff', 8) + dot(50, 73, 4.5, '#fff') + fx(`<ellipse cx="30" cy="76" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/><ellipse cx="70" cy="76" rx="5" ry="3" fill="#FF8FB0" opacity=".85"/>`) },
    { id: 'frage', label: 'Frage', sil: BUBBLE, fill: '#E0D4FF', body: ln('M40 36C40 24 60 23 60 35C60 43 50 42 50 51', O, 5) + dot(50, 60, 3.2, O) + spark(78, 28, '#FFD166', 0.6) },
    { id: 'haken', label: 'Verstanden', sil: circ(50, 50, 40), fill: MINT, body: ln('M30 52L44 66L72 36', '#fff', 9) + spark(84, 18, '#FFD166', 0.8) },
    { id: 'sprechen', label: 'Sprechen', sil: BUBBLE, fill: SKY, body: face(50, 42), sx: dot(36, 43, 4, '#fff') + dot(50, 43, 4, '#fff') + dot(64, 43, 4, '#fff') },
    { id: 'hoeren', label: 'Hören', edge: circ(38, 72, 17) + 'M58 12C72 16 82 26 78 44C72 34 66 32 58 32Z M53 12h5v60h-5Z', pre: ln('M56 72V14', O, 5), sil: circ(38, 72, 17) + 'M56 12C72 16 82 26 78 44C72 34 66 32 56 32Z', fill: LILA, body: face(38, 71, 0.62) },
    { id: 'lesen', label: 'Lesen', sil: rr(20, 12, 60, 76, 8), fill: PINK, body: p('M26 74H80V86H26C22 86 20 83 20 80C20 77 22 74 26 74Z', CREAM) + p('M60 12V32L66 26L72 32V12Z', YEL) + face(48, 46), sx: ln('M34 40H62M34 50H58', '#fff', 3.5) },
    { id: 'buch', label: 'Lehrbuch', sil: 'M50 26C40 18 24 18 10 22V78C24 74 40 74 50 82C60 74 76 74 90 78V22C76 18 60 18 50 26Z', fill: CREAM, body: ln('M50 26V82') + ln('M18 36C26 34 34 34 42 38M18 48C26 46 34 46 42 50M58 38C66 34 74 34 82 36M58 50C66 46 74 46 82 48', MINT, 3) + heart(70, 64, 0.7, PINK) + heart(30, 64, 0.7, YEL) },
    { id: 'schreiben', label: 'Schreiben', rot: 40, edge: 'M44 8H56Q60 8 60 12V68L50 90L40 68V12Q40 8 44 8Z', sil: 'M40 20H60V68H40Z', fill: YEL, body: p('M44 8H56Q60 8 60 12V20H40V12Q40 8 44 8Z', ROSE) + p('M40 68L50 90L60 68Z', PEACH) + `<path d="M46.4 82L50 90L53.6 82Z" fill="${DARK}"/>` + face(50, 44, 0.55) },
    { id: 'zeit', label: 'Zeit', edge: circ(50, 54, 36) + circ(24, 20, 9) + circ(76, 20, 9), pre: p(circ(24, 20, 9) + circ(76, 20, 9), ROSE), sil: circ(50, 54, 36), fill: MINT, body: p(circ(50, 54, 27), CREAM) + ln('M50 54V37M50 54L61 49', O, 3.5) + face(50, 66, 0.7) },
    { id: 'aufgabe', label: 'Aufgabe', sil: 'M50 10L92 46H82V86H18V46H8Z', fill: '#FFE9C9', body: p('M50 10L92 46H8Z', ROSE) + p(rr(43, 70, 14, 16, 3), PEACH) + face(50, 57, 0.8) },
    { id: 'wiederholen', label: 'Nochmal', sil: circ(50, 50, 40), fill: '#E0D4FF', body: ln('M30 46C32 34 44 28 56 31C62 33 66 37 68 42M70 29V43H56M70 54C68 66 56 72 44 69C38 67 34 63 32 58M30 71V57H44', '#fff', 6) },
    { id: 'merken', label: 'Merken', edge: circ(50, 36, 26), pre: ln('M50 60V92', O, 4), sil: circ(50, 36, 26), fill: ROSE, body: `<ellipse cx="38" cy="22" rx="6" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-35 38 22)"/>` + face(50, 38, 0.85, '#FFD0DC') },
    { id: 'termin', label: 'Termin', sil: rr(12, 18, 76, 70, 10), fill: CREAM, body: p('M12 40V28C12 22 16 18 22 18H78C84 18 88 22 88 28V40Z', ROSE) + ln('M32 11V26M68 11V26', O, 5) + face(50, 62), sx: ln('M34 62L46 72L66 52', MINT, 6) },
    { id: 'ziel', label: 'Ziel', edge: 'M24 14C40 8 52 22 84 14V54C52 62 40 48 24 54Z M22 10h4v82h-4Z', pre: ln('M24 10V92', O, 5), sil: 'M24 14C40 8 52 22 84 14V54C52 62 40 48 24 54Z', fill: MINT, body: face(54, 33, 0.8) },
    { id: 'leicht', label: 'Leicht', edge: circ(50, 50, 39), pre: ln(rays, '#FFC27A', 6), sil: circ(50, 50, 28), fill: YEL, body: face(50, 50), sx: gl('M36 40Q40 34 46 32') },
    { id: 'schwer', label: 'Schwer', sil: 'M58 8L22 54H44L36 92L78 42H56Z', fill: YEL, body: face(50, 49, 0.5) },
    { id: 'denken', label: 'Gedanke', sil: 'M28 74C14 74 8 64 12 54C8 40 22 30 34 36C38 22 60 20 66 34C80 28 94 42 86 56C92 66 84 74 72 74Z', fill: '#DFF1FF', body: face(50, 55) + p(circ(22, 86, 4), '#DFF1FF'), sx: gl('M28 46Q30 40 36 38') },
    // Lernen
    { id: 'hanamaru', label: 'Hanamaru', edge: circ(50, 50, 40), body: p(PETALS8, ROSE) + p(circ(50, 50, 25), PINK) + face(50, 50, 0.7), sx: ln('M50 50C50 45 57 45 57 50C57 57 44 58 42 50C40 40 58 36 62 48', ROSE, 3.5) },
    { id: 'hyakuten', label: '100 Punkte', sil: rr(18, 8, 64, 84, 6), fill: CREAM, body: ln('M28 40L35 34V58', ROSE, 5) + ln('M42 46a6 12 0 1 0 12 0a6 12 0 1 0 -12 0ZM60 46a6 12 0 1 0 12 0a6 12 0 1 0 -12 0Z', ROSE, 5) + ln('M26 66Q50 61 74 65M28 72Q50 67 72 71', ROSE, 3) + face(50, 81, 0.5) + spark(80, 12, YEL, 0.8), sx: ln('M28 20H58M28 26H50', '#CDE3F5', 3) },
    { id: 'fehler', label: 'Fehler', sil: circ(50, 50, 40), fill: ROSE, body: ln('M34 34L66 66M66 34L34 66', '#fff', 9) },
    { id: 'lupe', label: 'Nachschlagen', edge: circ(42, 42, 28) + 'M58 66L66 58L90 82L82 90Z', pre: ln('M62 62L84 84', O, 13) + ln('M62 62L84 84', ROSE, 7), sil: circ(42, 42, 27), fill: SKY, body: p(circ(42, 42, 19), '#EAF6FF', '', 2) + gl('M30 34Q32 27 39 25') + face(43, 46, 0.6) },
    { id: 'karten', label: 'Karteikarten', edge: rr(12, 14, 76, 70, 10), pre: `<g transform="rotate(-12 50 50)">${p(rr(20, 22, 58, 48, 6), LILA)}</g><g transform="rotate(-5 50 50)">${p(rr(21, 24, 58, 48, 6), MINT)}</g>`, sil: rr(22, 30, 58, 48, 6), fill: CREAM, body: ln('M34 66H68M34 72H56', '#CDE3F5', 3) + face(51, 50, 0.85), sx: ln('M34 46H68M34 54H62', '#CDE3F5', 3) },
    { id: 'radierer', label: 'Radiergummi', rot: -28, sil: rr(14, 34, 72, 32, 8), fill: PINK, body: p('M50 34H72Q86 34 86 42V58Q86 66 72 66H50Z', SKY) + face(31, 50, 0.6), sx: gl('M22 42H40') },
    { id: 'lautsprecher', label: 'Aussprache', edge: 'M16 36H32L56 16V84L32 64H16Z' + rr(60, 22, 30, 56, 15), sil: 'M16 36H32L56 16V84L32 64H16Z', fill: YEL, body: ln('M66 38C72 44 72 56 66 62M74 28C86 40 86 60 74 72', LILA, 5) + ln('M32 37V63', O, 2) + face(40, 48, 0.55), sx: gl('M22 44V56') },
    { id: 'gehirn', label: 'Gedächtnis', sil: BRAIN, fill: PINK, body: ln('M28 34C34 32 38 38 34 42M72 34C66 32 62 38 66 42M30 64C36 62 40 68 36 72M70 64C64 62 60 68 64 72M50 22V30M50 70V78', '#F08FB0', 2.5) + face(50, 50, 0.75), sx: ln('M50 30V70', '#F08FB0', 2.5) },
    { id: 'pinsel', label: 'Pinsel', rot: 40, edge: rr(42, 6, 16, 58, 6) + rr(40, 60, 20, 10, 3) + 'M41 68C41 80 47 88 50 95C53 88 59 80 59 68Z', sil: rr(42, 6, 16, 56, 6), fill: '#E8BC8E', body: p(rr(40, 60, 20, 10, 3), PLUM) + p('M42 70C42 80 47 87 50 93C53 87 58 80 58 70Z', DARK) + ln('M42 16H58', PLUM, 2.5) + face(50, 38, 0.4), sx: gl('M47 24V50') },
    { id: 'bun', label: '文 Satz', sil: rr(12, 12, 76, 76, 16), fill: '#E0D4FF', body: ln('M50 22V30M26 36H74M64 40C58 60 44 74 26 80M36 40C42 60 56 74 76 80', PLUM, 7) + spark(80, 20, YEL, 0.8) },
    { id: 'gegenteil', label: 'Gegenteil', edge: rr(8, 16, 84, 68, 20), body: p('M14 26H60V16L86 34L60 52V42H14Z', ROSE) + p('M86 58H40V48L14 66L40 84V74H86Z', MINT) },
    { id: 'randoseru', label: 'Schulranzen', edge: rr(18, 20, 64, 70, 14) + 'M36 24C36 6 64 6 64 24Z', pre: ln('M40 24C40 12 60 12 60 24', O, 4.5), sil: rr(18, 22, 64, 68, 14), fill: ROSE, body: p('M18 40C18 28 26 22 36 22H64C74 22 82 28 82 40V56H18Z', '#FF7A93') + p(rr(44, 50, 12, 11, 3), YEL, '', 2) + face(50, 72, 0.75), sx: gl('M26 62V80') },
    { id: 'kette', label: 'Verbindung', rot: -20, edge: rr(4, 30, 92, 40, 20), body: ln(rr(10, 37, 46, 26, 13), O, 11) + ln(rr(10, 37, 46, 26, 13), MINT, 6) + ln(rr(44, 37, 46, 26, 13), O, 11) + ln(rr(44, 37, 46, 26, 13), PINK, 6) + ln('M44 44V56', MINT, 6) },
    { id: 'mikrofon', label: 'Nachsprechen', edge: rr(36, 8, 28, 46, 14) + MIC + rr(46, 58, 8, 24, 2) + rr(32, 78, 36, 10, 5), pre: p(MIC, '#C9C4D9', '', 2) + p(rr(46, 60, 8, 20, 2), '#C9C4D9', '', 2) + p(rr(32, 80, 36, 8, 4), PLUM, '', 2), sil: rr(36, 8, 28, 46, 14), fill: LILA, body: face(50, 32, 0.5), sx: ln('M40 22H60M40 30H60M40 38H60', '#fff', 2.5) },
    // Essen
    { id: 'bento', label: 'Bento', sil: rr(12, 28, 76, 58, 10), fill: ROSE, body: p(rr(18, 34, 30, 46, 5), CREAM, '', 2) + p(rr(52, 34, 30, 21, 5), MINT, '', 2) + p(rr(52, 59, 30, 21, 5), YEL, '', 2) + p(circ(33, 46, 5.5), ROSE, '', 2) + face(33, 64, 0.55) + ln('M58 44C62 40 66 48 70 44C72 42 74 44 76 44', '#7FD6B4', 2.5), sx: dot(28, 64, 1.6, DARK) + dot(38, 66, 1.6, DARK) + dot(32, 72, 1.6, DARK) },
    { id: 'taiyaki', label: 'Taiyaki', sil: 'M10 50C22 28 44 26 62 34L86 18L80 50L86 82L62 66C44 74 22 72 10 50Z', fill: PEACH, body: ln('M46 38C50 44 50 56 46 62M58 38C62 44 62 56 58 62', '#E0A877', 2.5) + p('M40 32C44 24 54 24 58 32', PEACH, '', 2) + face(28, 50, 0.6), sx: dot(24, 47, 3, DARK) + gl('M20 40Q24 34 30 32') },
    { id: 'mochi', label: 'Mochi', sil: 'M12 64C12 40 30 32 50 32C70 32 88 40 88 64C88 80 72 86 50 86C28 86 12 80 12 64Z', fill: PINK, body: p('M50 33C44 24 50 16 58 18C60 26 56 32 50 33Z', MINT, '', 2) + face(50, 62), sx: gl('M26 52C30 44 36 42 42 42') },
    { id: 'erdbeere', label: 'Erdbeere', edge: 'M50 28C36 18 18 24 18 42C18 60 36 76 50 88C64 76 82 60 82 42C82 24 64 18 50 28Z M34 24L42 30L50 18L58 30L66 24L62 34H38Z', sil: 'M50 28C36 18 18 24 18 42C18 60 36 76 50 88C64 76 82 60 82 42C82 24 64 18 50 28Z', fill: ROSE, body: [[30, 38], [70, 38], [40, 70], [60, 70], [50, 79], [25, 52], [75, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="${YEL}"/>`).join('') + p('M34 24L42 30L50 18L58 30L66 24L62 34H38Z', MINT, '', 2) + face(50, 52, 0.85), sx: `<ellipse cx="50" cy="50" rx="1.6" ry="2.4" fill="${YEL}"/>` + gl('M28 32Q32 28 38 28') },
    // Tiere
    { id: 'koi', label: 'Koi', sil: 'M50 10C66 24 68 44 64 62L80 86L50 74L20 86L36 62C32 44 34 24 50 10Z', fill: CREAM, body: p('M42 40C48 34 58 38 58 46C54 52 44 50 42 40Z', ROSE, '', 0) + p('M44 58C50 54 58 58 56 64C50 66 46 64 44 58Z', '#FFC27A', '', 0) + face(50, 26, 0.5), sx: eyes(45, 55, 24, 2.2) + p('M40 16C44 12 56 12 60 16C56 20 44 20 40 16Z', ROSE, '', 0) },
    { id: 'shiba', label: 'Shiba', sil: 'M20 40L18 12L40 26C46 24 54 24 60 26L82 12L80 40C90 56 82 74 70 84C62 90 38 90 30 84C18 74 10 56 20 40Z', fill: '#FFC27A', body: `<path d="M25 22L26 35L35 29Z" fill="${CREAM}"/><path d="M75 22L74 35L65 29Z" fill="${CREAM}"/>` + p('M30 68C34 54 66 54 70 68C68 82 32 82 30 68Z', CREAM, '', 0) + face(50, 56), sx: eyes(38, 62, 52) + `<ellipse cx="50" cy="64" rx="4" ry="3" fill="${DARK}"/>` },
    { id: 'hase', label: 'Hase', edge: 'M36 44C28 26 30 8 38 8C46 8 48 26 46 42Z M54 42C52 26 54 8 62 8C70 8 72 26 64 44Z M50 38C72 38 82 52 82 66C82 82 68 90 50 90C32 90 18 82 18 66C18 52 28 38 50 38Z', pre: p('M36 44C28 26 30 8 38 8C46 8 48 26 46 42Z M54 42C52 26 54 8 62 8C70 8 72 26 64 44Z', '#fff') + ln('M38 16C37 26 38 34 40 40M62 16C63 26 62 34 60 40', PINK, 4), sil: 'M50 38C72 38 82 52 82 66C82 82 68 90 50 90C32 90 18 82 18 66C18 52 28 38 50 38Z', fill: '#fff', body: face(50, 64), sx: eyes(40, 60, 62) + `<path d="M47 69H53L50 72Z" fill="${ROSE}"/>` },
    // Japan
    { id: 'schirm', label: 'Schirm', edge: UMBRELLA + 'M46 50h8v32h-8Z M36 78h8v10h-8Z', pre: ln('M50 54V80C50 88 40 88 38 82', O, 4.5), sil: UMBRELLA, fill: LILA, body: p(circ(50, 15, 4), ROSE, '', 2) + dot(28, 42, 2.5, '#fff') + dot(72, 42, 2.5, '#fff') + face(50, 36, 0.8), sx: ln('M50 18C42 28 40 40 40 50M50 18C58 28 60 40 60 50', O, 2) },
    { id: 'furin', label: 'Windspiel', edge: 'M28 62C28 34 36 18 50 18C64 18 72 34 72 62Z' + rr(42, 70, 16, 20, 3) + 'M48 6h4v66h-4Z', pre: ln('M50 8V20M50 62V71', O, 2), sil: 'M28 62C28 34 36 18 50 18C64 18 72 34 72 62Z', fill: SKY, body: ln('M32 54C38 50 44 58 50 54C56 50 62 58 68 54', ROSE, 3) + p(circ(50, 63, 4), YEL, '', 2) + p(rr(42, 71, 16, 19, 3), LILA) + face(50, 38, 0.7), sx: gl('M36 44Q36 32 44 26') },
    { id: 'kranich', label: 'Kranich', sil: 'M10 60L40 20L52 46L90 30L60 66L72 84L40 70Z', fill: PINK, body: face(45, 56, 0.45), sx: ln('M40 20L46 58L40 70M52 46L46 58L60 66', O, 2) },
    { id: 'kokeshi', label: 'Kokeshi', edge: 'M50 40C76 44 76 70 76 72C76 88 62 90 50 90C38 90 24 88 24 72C24 70 24 44 50 40Z' + circ(50, 26, 17), sil: 'M50 40C76 44 76 70 76 72C76 88 62 90 50 90C38 90 24 88 24 72C24 70 24 44 50 40Z', fill: ROSE, body: ln('M34 62C40 56 44 66 50 62C56 58 60 68 66 62M34 76C40 70 44 80 50 76C56 72 60 82 66 76', YEL, 3) + p(circ(50, 26, 16), CREAM) + p('M34 22C36 10 64 10 66 22C58 16 54 20 50 18C46 20 42 16 34 22Z', DARK) + p(circ(36, 16, 4) + circ(64, 16, 4), ROSE, '', 2) + face(50, 28, 0.5), sx: eyes(44, 56, 28, 2) },
    // Natur
    { id: 'mond', label: 'Mond', sil: 'M62 12C40 18 36 36 36 50C36 66 44 82 66 88C36 96 10 76 10 50C10 26 36 6 62 12Z', fill: YEL, body: spark(76, 26, LILA, 1) + spark(84, 56, '#FF8FB0', 0.7) + spark(70, 76, MINT, 0.5) + face(25, 54, 0.45), sx: gl('M20 36Q24 26 32 22') },
    { id: 'regenbogen', label: 'Regenbogen', edge: 'M10 74A40 40 0 0 1 90 74H74A24 24 0 0 0 26 74Z M6 80C6 64 22 62 22 66C26 58 38 62 38 80Z M62 80C62 62 74 58 78 66C80 62 94 64 94 80Z', body: p('M10 74A40 40 0 0 1 90 74H80A30 30 0 0 0 20 74Z', ROSE) + p('M20 74A30 30 0 0 1 80 74H72A22 22 0 0 0 28 74Z', YEL) + p('M28 74A22 22 0 0 1 72 74H64A14 14 0 0 0 36 74Z', MINT) + p('M8 80C8 68 20 66 22 70C26 62 36 66 36 80Z M64 80C62 66 72 62 76 68C80 64 92 68 92 80Z', '#fff') + face(50, 66, 0.45), sx: spark(50, 50, LILA, 0.6) },
    // Dinge
    { id: 'schleife', label: 'Schleife', edge: BOW + 'M46 38L30 84L42 78L48 88L50 44M54 38L70 84L58 78L52 88L50 44Z', pre: p('M47 40L32 82L42 77L48 86L50 44Z M53 40L68 82L58 77L52 86L50 44Z', PINK), sil: BOW, fill: ROSE, body: p(circ(50, 38, 7), PINK) + gl('M26 30Q28 24 34 24') + gl('M66 24Q72 24 74 30') },
    { id: 'krone', label: 'Krone', sil: CROWN, fill: YEL, body: ln('M22 68H78', O, 2) + p(circ(16, 30, 5) + circ(84, 30, 5), PINK, '', 2) + p(circ(50, 20, 5.5), MINT, '', 2) + dot(32, 74, 3, ROSE) + dot(50, 74, 3, LILA) + dot(68, 74, 3, ROSE) + face(50, 52, 0.6), sx: p(circ(50, 54, 5), ROSE, '', 2) },
    { id: 'pokal', label: 'Pokal', edge: 'M28 16H72V36C72 52 62 60 50 60C38 60 28 52 28 36Z' + rr(12, 16, 76, 32, 14) + rr(32, 58, 36, 30, 4), pre: ln('M30 22C14 22 14 42 32 46M70 22C86 22 86 42 68 46', O, 4), sil: 'M28 16H72V36C72 52 62 60 50 60C38 60 28 52 28 36Z', fill: YEL, body: p(rr(45, 59, 10, 14, 2), YEL, '', 2) + p(rr(32, 72, 36, 14, 4), ROSE) + face(50, 34, 0.8) + spark(84, 12, MINT, 0.7), sx: gl('M36 24V36') },
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
  const dash = (d, c = '#fff', w = 2, gap = 5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="${gap} ${gap}" stroke-linecap="round"/>`;
  const banner = (main = MINT, dark = '#7FD6B4', sp = '#FFD166') => (W, H) => {
    const h = H * 0.74, t = H * 0.26;
    return p(`M2 ${n1(t)}H22V${n1(H - 2)}H2L11 ${n1((t + H) / 2)}Z M${n1(W - 2)} ${n1(t)}H${n1(W - 22)}V${n1(H - 2)}H${n1(W - 2)}L${n1(W - 11)} ${n1((t + H) / 2)}Z`, dark)
      + p(rr(12, 2, W - 24, h, 6), main)
      + dash(`M20 ${n1(2 + 7)}H${n1(W - 20)}M20 ${n1(h - 5)}H${n1(W - 20)}`)
      + spark(W - 14, 9, sp, 1);
  };
  // Schleifenband: leicht gewölbtes Band, die Enden hängen dahinter
  const ribbon = (W, H) => {
    const c = n1(Math.min(H * 0.16, W * 0.04)), bh = n1(H * 0.62), e = n1(Math.min(34, W / 6)), y0 = c + 2, tt = n1(H - bh);
    const tail = (x0, x1, xn) => `M${x0} ${tt}H${x1}V${n1(H - 2)}H${x0}L${xn} ${n1(H - bh / 2 - 1)}Z`;
    return p(tail(2, e + 12, n1(2 + e * 0.45)) + tail(n1(W - 2), n1(W - e - 12), n1(W - 2 - e * 0.45)), ROSE)
      + p(`M${e} ${y0}Q${n1(W / 2)} ${n1(y0 - 2 * c)} ${n1(W - e)} ${y0}V${n1(y0 + bh)}Q${n1(W / 2)} ${n1(y0 + bh - 2 * c)} ${e} ${n1(y0 + bh)}Z`, '#FFC2D9')
      + dash(`M${n1(e + 8)} ${n1(y0 + 7)}Q${n1(W / 2)} ${n1(y0 + 7 - 2 * c)} ${n1(W - e - 8)} ${n1(y0 + 7)}M${n1(e + 8)} ${n1(y0 + bh - 7)}Q${n1(W / 2)} ${n1(y0 + bh - 7 - 2 * c)} ${n1(W - e - 8)} ${n1(y0 + bh - 7)}`)
      + heart(n1(e + 4), n1(y0 + bh / 2), 0.9, YEL);
  };
  // Spiralblock: Ringe oben, rote Randlinie, Linien
  const spiral = (W, H) => {
    const top = 18, n = Math.max(2, Math.floor((W - 30) / 28)), lines = [];
    for (let y = top + 34; y < H - 12; y += 24) lines.push(`M14 ${y}H${n1(W - 14)}`);
    let rings = '';
    for (let i = 0; i < n; i++) { const x = n1(15 + ((i + 0.5) * (W - 30)) / n); rings += dot(x, top + 11, 3.2, DARK) + p(rr(x - 3.5, 4, 7, top + 9, 3.5), '#C9C4D9', '', 2); }
    return p(rr(3, top, W - 6, H - top - 3, 8), CREAM) + (lines.length ? ln(lines.join(''), '#CDE3F5', 2) : '') + ln(`M30 ${top + 2}V${n1(H - 5)}`, '#FFB3C7', 2) + rings;
  };
  // kariertes Blatt mit zwei Klebestreifen an den Ecken
  const grid = (W, H) => {
    const g = [];
    for (let x = 22; x < W - 6; x += 20) g.push(`M${x} 9V${n1(H - 4)}`);
    for (let y = 26; y < H - 4; y += 20) g.push(`M5 ${y}H${n1(W - 5)}`);
    return p(rr(3, 8, W - 6, H - 11, 4), '#fff') + (g.length ? ln(g.join(''), '#CDE3F5', 1.2) : '') + tape(-16, 6, PINK, -35) + tape(n1(W - 52), n1(H - 24), MINT, -35);
  };
  // Washi-Tape: Streifen mit gerissenen Enden, Punkte oder Streifen
  const washi = (fill, kind) => (W, H) => {
    const a = n1(H / 3), b = n1((2 * H) / 3), z = Math.min(6, W / 8);
    let pat = '';
    if (kind === 'dots') for (let x = 18; x < W - 10; x += 22) pat += dot(x, n1(H / 2), n1(Math.min(4, H / 6)), '#fff');
    else { const d = []; for (let x = -H; x < W; x += 16) d.push(`M${n1(x)} ${H}L${n1(x + H)} 0`); pat = `<path d="${d.join('')}" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`; }
    const shape = `M${z} 0H${n1(W - z)}L${n1(W)} ${a}L${n1(W - z)} ${b}L${n1(W)} ${H}H${z}L0 ${b}L${z} ${a}L0 0Z`;
    return `<clipPath id="w${kind}"><path d="${shape}"/></clipPath><path d="${shape}" fill="${fill}" opacity=".9"/><g clip-path="url(#w${kind})">${pat}</g>`;
  };
  // Sprechblase mit Spitze unten links
  const speech = (W, H) => {
    const b = H - 24, r = Math.min(20, W / 4, b / 3), R = W - 3;
    return p(`M${3 + r} 3H${n1(R - r)}A${r} ${r} 0 0 1 ${R} ${3 + r}V${n1(b - r)}A${r} ${r} 0 0 1 ${n1(R - r)} ${b}H58L30 ${n1(H - 3)}L36 ${b}H${3 + r}A${r} ${r} 0 0 1 3 ${n1(b - r)}V${3 + r}A${r} ${r} 0 0 1 ${3 + r} 3Z`, '#DFF1FF')
      + spark(W - 16, 16, '#FF8FB0', 0.9) + spark(W - 30, 10, YEL, 0.5);
  };
  // Etikett: Anhänger mit Loch und Schnur
  const tag = (W, H) => {
    const t = n1(Math.min(30, W / 4, H / 2)), m = n1(H / 2);
    return p(`M3 ${m}L${t} 4H${n1(W - 12)}Q${n1(W - 3)} 4 ${n1(W - 3)} 13V${n1(H - 13)}Q${n1(W - 3)} ${n1(H - 4)} ${n1(W - 12)} ${n1(H - 4)}H${t}Z`, '#FFE9A8')
      + dash(rr(t + 8, 12, Math.max(4, W - t - 22), Math.max(4, H - 24), 6), '#F5C76E', 2, 6)
      + p(circ(n1(t * 0.75), m, 5), '#fff', '', 2) + ln(`M${n1(t * 0.75)} ${m}C${n1(t * 0.4)} ${n1(m - 14)} 10 ${n1(m - 12)} 4 ${n1(m - 20)}`, ROSE, 2.5);
  };
  // Schriftrolle: Papier zwischen zwei Holzrollen, kleiner Stempel
  const scroll = (W, H) => p(rr(14, 10, W - 28, H - 20, 0), CREAM)
    + p(rr(3, 3, 16, H - 6, 8), '#E8BC8E') + p(rr(W - 19, 3, 16, H - 6, 8), '#E8BC8E')
    + ln(`M11 10V${n1(H - 10)}M${n1(W - 11)} 10V${n1(H - 10)}`, '#D9A77C', 2)
    + (W > 90 && H > 60 ? p(rr(W - 46, H - 42, 18, 18, 3), ROSE, '', 2) + ln(`M${n1(W - 41)} ${n1(H - 33)}H${n1(W - 33)}M${n1(W - 37)} ${n1(H - 37)}V${n1(H - 29)}`, '#fff', 2) : '');
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
  // Farben: bg = Grund, cell = Kästchen und Felder, line = Rand, guide = Hilfslinien
  const kanji = (bg, cell, line, guide) => (W, H) => {
    const { s, n, T } = kjFit(W, H), x0 = (W - T) / 2, y0 = KJ.pad + KJ.top + KJ.gap;
    const q = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    let out = q(rr(2, 2, W - 4, H - 4, 10), bg, 2.5) + q(rr(x0, KJ.pad, T, KJ.top, 5), cell, 1.8) + q(rr(x0, y0 + s + KJ.gap, T, KJ.bot, 5), cell, 1.8);
    for (let i = 0; i < n; i++) {
      const x = n1(x0 + i * (s + KJ.gap));
      out += `<rect x="${x}" y="${y0}" width="${n1(s)}" height="${n1(s)}" fill="${cell}" stroke="${line}" stroke-width="2"/><path d="M${n1(x + s / 2)} ${y0}v${n1(s)}M${x} ${n1(y0 + s / 2)}h${n1(s)}" fill="none" stroke="${guide}" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    }
    return out;
  };

  const MIN = { w: 0.06, h: 0.04 };
  const NOTES = [
    { id: 'kanji', label: 'Kanji-Feld', draw: kanji('#FFD9E6', CREAM, O, '#FF9DB8'), kj: true, w: 0.112, h: 0.174, min: { w: 0.06, h: 0.118 } },
    { id: 'kanji3', as: 'kanji', label: 'Kanji-Reihe', w: 0.312, h: 0.174 },
    // ruhigere Kanji-Felder ohne Rosa
    { id: 'kanji-papier', label: 'Kanji-Feld Papier', draw: kanji('#EFE6D6', CREAM, O, '#C4AE92'), kj: true, w: 0.112, h: 0.174, min: { w: 0.06, h: 0.118 } },
    { id: 'kanji3-papier', as: 'kanji-papier', label: 'Kanji-Reihe Papier', w: 0.312, h: 0.174 },
    { id: 'kanji-tinte', label: 'Kanji-Feld Tinte', draw: kanji('#DCE4EE', '#fff', '#4A5870', '#9DB0C6'), kj: true, w: 0.112, h: 0.174, min: { w: 0.06, h: 0.118 } },
    { id: 'kanji3-tinte', as: 'kanji-tinte', label: 'Kanji-Reihe Tinte', w: 0.312, h: 0.174 },
    { id: 'zettel', label: 'Klebezettel', draw: note('#FFF1A8', '#F5D76E', '#FF9DB8'), w: 0.28, h: 0.2 },
    { id: 'zettel-rosa', label: 'Zettel rosa', draw: note('#FFD9E6', '#FFB3C7', MINT), w: 0.28, h: 0.2 },
    { id: 'zettel-mint', label: 'Zettel mint', draw: note('#DFF7EC', MINT, LILA), w: 0.28, h: 0.2 },
    { id: 'zettel-lila', label: 'Zettel lila', draw: note('#ECE6FF', LILA, YEL), w: 0.28, h: 0.2 },
    { id: 'zettel-blau', label: 'Zettel blau', draw: note('#DFF1FF', SKY, ROSE), w: 0.28, h: 0.2 },
    { id: 'spiralblock', label: 'Spiralblock', draw: spiral, w: 0.3, h: 0.24, min: { w: 0.1, h: 0.08 } },
    { id: 'kariert', label: 'Kariert', draw: grid, w: 0.3, h: 0.22 },
    { id: 'wolke', label: 'Wolkenrahmen', draw: cloud, w: 0.3, h: 0.2, min: { w: 0.1, h: 0.09 } },
    { id: 'sprechblase', label: 'Sprechblase', draw: speech, w: 0.3, h: 0.16, min: { w: 0.1, h: 0.08 } },
    { id: 'baer', label: 'Bären-Block', draw: bear, w: 0.26, h: 0.24, min: { w: 0.12, h: 0.09 } },
    { id: 'kasten', label: 'Merkkasten', draw: box, w: 0.34, h: 0.16 },
    { id: 'etikett', label: 'Etikett', draw: tag, w: 0.24, h: 0.09, min: { w: 0.1, h: 0.05 } },
    { id: 'schriftrolle', label: 'Schriftrolle', draw: scroll, w: 0.34, h: 0.16, min: { w: 0.08, h: 0.05 } },
    { id: 'washi', label: 'Washi-Tape', draw: washi('#FFB3C7', 'dots'), w: 0.26, h: 0.035, min: { w: 0.04, h: 0.02 } },
    { id: 'washi-mint', label: 'Washi mint', draw: washi(MINT, 'stripes'), w: 0.26, h: 0.035, min: { w: 0.04, h: 0.02 } },
    { id: 'banner', label: 'Banner', draw: banner(), w: 0.3, h: 0.07 },
    { id: 'banner-rosa', label: 'Banner rosa', draw: banner('#FFC2D9', ROSE, YEL), w: 0.3, h: 0.07 },
    { id: 'banner-lila', label: 'Banner lila', draw: banner('#DCD8FA', LILA, MINT), w: 0.3, h: 0.07 },
    { id: 'band', label: 'Schleifenband', draw: ribbon, w: 0.34, h: 0.09, min: { w: 0.14, h: 0.05 } },
  ];

  // Stil „Süß“: dieselben Vorlagen ohne Gesichter (alles mit class="f"), Kennung mit Endung „.s“
  const SU = '.s';
  const base = (id) => (typeof id === 'string' && id.endsWith(SU) ? id.slice(0, -SU.length) : id);
  const plain = (s) => s.replace(/<g class="f"[^>]*>.*?<\/g>/g, '');

  const stickers = new Map(STICKERS.map((s) => [s.id, s])), notes = new Map(NOTES.map((s) => [s.id, s]));
  const free = (id) => notes.has(base(id));
  const min = (id) => (notes.get(base(id)) || {}).min || MIN;

  const sticker = (d, su) => {
    const edge = d.edge || d.sil;
    const inner = `<path d="${edge}" fill="${DARK}" fill-opacity=".1" stroke="${DARK}" stroke-opacity=".1" stroke-width="12" stroke-linejoin="round"/><path d="${edge}" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>`
      + (d.pre || '') + (d.sil ? p(d.sil, d.fill) : '') + (d.body || '') + (su ? d.sx || '' : '');
    return d.rot ? `<g transform="rotate(${d.rot} 50 50)">${inner}</g>` : inner;
  };
  // Vektorbild in der Form w × h (Anteile der Seitenbreite); Sticker füllen ihr Feld, Zettel werden für genau diese Form gezeichnet
  const svg = (id, w, h) => {
    const b = base(id), su = b !== id, out = (s) => (su ? plain(s) : s);
    const s = stickers.get(b);
    if (s) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">' + out(sticker(s, su)) + '</svg>';
    let d = notes.get(b);
    if (d && d.as) d = notes.get(d.as);
    if (!d || !(w > 0 && h > 0)) return '';
    const W = Math.round(w * 1000), H = Math.round(h * 1000);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">` + out(d.draw(W, H)) + '</svg>';
  };

  const SIZE = 0.09; // Kantenlänge eines Stickers beim Einfügen (Anteil der Seitenbreite)
  const KW = STICKERS.map((s) => ({ id: s.id, label: s.label, group: 'sticker', style: 'kawaii', free: false, w: SIZE, h: SIZE }))
    .concat(NOTES.map((s) => ({ id: s.id, as: s.as || s.id, label: s.label, group: 'zettel', style: 'kawaii', free: true, w: s.w, h: s.h })));
  // „Süß“-Fassung nur für Sticker, die ohne Gesicht anders aussehen – so steht nichts doppelt in zwei Reitern
  const LIST = KW.concat(KW.filter((s) => s.group === 'sticker' && svg(s.id + SU, s.w, s.h) !== svg(s.id, s.w, s.h))
    .map((s) => ({ ...s, id: s.id + SU, style: 'suess' })));
  // Inhalt eines Reiters: 'zettel' (Merkzettel, Kanji-Feld, Banner), 'kawaii' oder 'suess' (Sticker)
  const tab = (name) => (name === 'zettel' ? LIST.filter((s) => s.group === 'zettel') : LIST.filter((s) => s.group === 'sticker' && s.style === name));
  // Bild-Eintrag { k, w, h } → Daten-URL; key ändert sich, sobald das Bild neu gezeichnet werden muss
  const src = (im) => { const s = svg(im.k, im.w, im.h); return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) : ''; };
  const key = (im) => (free(im.k) ? im.k + ':' + Math.round(im.w * 1000) + 'x' + Math.round(im.h * 1000) : im.k);
  // nach dem Ziehen: Kanji-Felder (alle Farben) schnappen auf ganze Kästchen
  const snap = (id, w, h) => {
    if (!(notes.get(base(id)) || {}).kj) return { w, h };
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

  const P = { SIZE, LIST, tab, svg, src, key, free, min, snap, place };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkKawaii = P;
})(this);
