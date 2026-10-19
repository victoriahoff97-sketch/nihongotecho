/* Nihongo Techō – Sticker: kleine Kritzel-Symbole, die als echte Striche aufs Blatt kommen (Stiftfarbe + Marker-Tupfer). Browser: App.inkStickers, Node: module.exports */
'use strict';
(function (root) {
  const BOX = 48;      // Zeichenfeld der Vorlagen
  const SIZE = 0.055;  // Kantenlänge auf dem Blatt (Anteil der Seitenbreite)
  const PEN_W = 2, MK_W = 11, STEP = 2;
  const r4 = (v) => +v.toFixed(4);

  // Vorlagen: ink = Stiftlinien (M/L/C, absolut), circ = Kreise [cx, cy, r], dots = gefüllte Punkte [cx, cy, r],
  // mk = Marker-Tupfer, rot = Teilpfad n-mal um die Mitte gedreht
  const DEFS = [
    { id: 'idee', label: 'Idee', mk: 'M19 18 L29 18', ink: 'M18 31 C12 26 10 20 13 14 C16 7 30 6 35 13 C39 20 36 26 30 31 M18.5 31.5 L30 31 M19.5 35 L29 34.5 M21.5 38.5 L27 38 M21 30 L22 22 L24.5 25 L27 21.5 L27.5 30 M24 4 L24 0 M9 9 L6 6 M39 9 L42 6 M6 20 L2 20 M42 19.5 L46 19.5' },
    { id: 'buch', label: 'Lehrbuch', mk: 'M13 21 L16 21.5', ink: 'M24 13 C19 9 11 9 5 11 L5 37 C11 35 19 35 24 39 C29 35 37 35 43 37 L43 11 C37 9 29 9 24 13 M24 13 L24 38.5 M9 17 C13 16 17 16.5 20 18 M9 23 C13 22 17 22.5 20 24 M28 18 C31 16.5 35 16 39 17 M28 24 C31 22.5 35 22 39 23' },
    { id: 'stern', label: 'Wichtig', mk: 'M19 24 L29 24', ink: 'M24 5 L29 18 L43 19 L32.5 28 L36 42 L24 34.5 L12 42 L15.5 28 L5 19 L19 18 L24.5 5.5' },
    { id: 'achtung', label: 'Achtung', mk: 'M24 15 L24 31', ink: 'M24 6 C22 6 21 8 21.5 11 L23 29 L25.5 29 L27 10 C27.5 7.5 26 6 24 6', dots: [[24, 37.5, 2.6]] },
    { id: 'frage', label: 'Frage', mk: 'M21 12 L27 12', ink: 'M15 15 C15 7 31 5 32 14 C32.5 20 24 21 24 29', dots: [[24, 37.5, 2.5]] },
    { id: 'haken', label: 'Verstanden', mk: 'M14 29 L20 34 L34 18', mkW: 8, ink: 'M8 25 L19 36 L41 10' },
    { id: 'herz', label: 'Liebling', mk: 'M18 19 L30 19', ink: 'M24 40 C10 30 5 22 8 14 C11 7 21 8 24 16 C27 8 37 7 40 14 C43 22 38 30 24.5 40.5' },
    { id: 'pfeil', label: 'Siehe', ink: 'M5 26 C15 22 28 22 41 24 M32 15 L42 24 L33 33' },
    { id: 'sprechen', label: 'Sprechen', mk: 'M14 20.5 L34 20.5', ink: 'M8 9 L40 9 C43 9 44 11 44 13 L44 28 C44 31 42 32 40 32 L22 32 L13 41 L14 32 L8 32 C5 32 4 30 4 28 L4 13 C4 10 6 9 8.5 9 M12 17 L36 17 M12 24 L28 24' },
    { id: 'hoeren', label: 'Hören', ink: 'M17 40 C13 40 12 36 15 32 C18 28 13 24 13 17 C13 9 19 5 25 5 C32 5 36 10 36 17 C36 24 30 26 29 32 C28 38 22 41 17 40 M19 19 C18 13 23 10 27 12 C31 14 30 20 26 21 C23 22 24 26 22 28 M40 11 C42.5 14 42.5 20 40 23 M44 8 C47.5 13 47.5 21 44 26' },
    { id: 'lesen', label: 'Lesen', ink: 'M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24 M12 13 L10 9 M24 11 L24 6.5 M36 13 L38 9', circ: [[24, 24, 6]], dots: [[24, 24, 2.3]] },
    { id: 'schreiben', label: 'Schreiben', mk: 'M29 19 L17 31', mkW: 8, ink: 'M33 6 L42 15 L17 40 L6 42 L8 31 L33 6 M8 31 L17 40 M28 11 L37 20', dots: [[7.6, 40.4, 1.6]] },
    { id: 'zeit', label: 'Zeit', ink: 'M24 13 L24 24 L32 29 M24 7.5 L24 11 M40.5 24 L37 24 M24 40.5 L24 37 M7.5 24 L11 24', circ: [[24, 24, 17]] },
    { id: 'aufgabe', label: 'Aufgabe', mk: 'M18 25 L30 25', ink: 'M6 23 L24 7 L42 23 M11 20 L11 40 L37 40 L37 20 M21 40 L21 29 L28 29 L28 40' },
    { id: 'wiederholen', label: 'Nochmal', ink: 'M38 18 C34 9 20 7 13 15 C11 17 10 19 9.5 21 M38 9 L38.5 18.5 L29 18 M10 30 C14 39 28 41 35 33 C37 31 38 29 38.5 27 M10 39 L9.5 29.5 L19 30' },
    { id: 'schluessel', label: 'Schlüssel', mk: 'M28 24 L38 24', mkW: 9, ink: 'M22 24 L43 24 M36 24 L36 31 M41 24 L41 30', circ: [[14, 24, 8], [14, 24, 2.6]] },
    { id: 'merken', label: 'Merken', mk: 'M21 22 L27 22', ink: 'M17 6 L31 6 M19 6 L18 19 C13 21 11 25 11 28 L37 28 C37 25 35 21 30 19 L29 6 M24 28 L24 43' },
    { id: 'leicht', label: 'Leicht', ink: 'M15 28 C19 35 29 35 33 28', circ: [[24, 24, 17]], dots: [[18, 20, 2], [30, 20, 2]] },
    { id: 'ausnahme', label: 'Ausnahme', mk: 'M19 33 L29 33', ink: 'M24 6 L44 40 L4 40 L24.5 6.5 M24 18 L24 29', dots: [[24, 34.5, 1.9]] },
    { id: 'schwer', label: 'Schwer', mk: 'M24.5 16 L21.5 31', mkW: 8, ink: 'M27 4 L11 26 L22 26 L18 44 L37 19 L26 19 L27 4.5' },
    { id: 'termin', label: 'Termin', mk: 'M11.5 15 L36.5 15', mkW: 7, ink: 'M7 11 L41 11 L41 41 L7 41 L7 11 M7 19 L41 19 M15 7 L15 14 M33 7 L33 14 M17 30 L22 35 L31 25' },
    { id: 'ueben', label: 'Üben', ink: 'M15 33 C19 27 29 27 33 33', circ: [[24, 24, 17]], dots: [[18, 20, 2], [30, 20, 2]] },
    { id: 'ziel', label: 'Ziel', mk: 'M18 17 L32 17', ink: 'M11 5 L11 44 M11 8 C18 5 24 12 38 8 L38 26 C24 30 18 23 11 26' },
    { id: 'denken', label: 'Gedanke', ink: 'M14 30 C7 30 5 22 11 19 C10 12 19 8 24 12 C29 7 39 10 38 18 C44 20 43 30 35 30 L14 30', circ: [[13, 37, 2.8]], dots: [[7.5, 43, 1.5]] },
    // Lernen
    { id: 'hanamaru', label: 'Hanamaru', mk: 'M18 30 L30 30', mkW: 8, ink: 'M24 24 C24 21 28 21 28 24 C28 28 21 29 20 24 C19 18 29 16 31 23', rot: { d: 'M18 9 C20 2 28 2 30 9', n: 8 } },
    { id: 'hyakuten', label: '100 Punkte', mk: 'M12 21 L37 21', mkW: 12, ink: 'M9 5 L39 5 L39 44 L9 44 L9 5 M13 17 L16 14 L16 28 M22 21 C22 12 28 12 28 21 C28 30 22 30 22 21 M30 21 C30 12 36 12 36 21 C36 30 30 30 30 21 M13 34 C20 31 28 32 35 34 M14 38 C21 35 28 36 34 38' },
    { id: 'fehler', label: 'Fehler', mk: 'M18 18 L30 30', mkW: 8, ink: 'M17 17 L31 31 M31 17 L17 31', circ: [[24, 24, 17]] },
    { id: 'lupe', label: 'Nachschlagen', mk: 'M15 21 L25 21', mkW: 10, ink: 'M30 28 L43 41 M28 30 L41 43 M41 43 L43 41 M13 16 C14 13 17 11 20 11', circ: [[20, 20, 13]] },
    { id: 'karten', label: 'Karteikarten', mk: 'M12 33 L30 33', ink: 'M14 14 L14 8 L42 8 L42 34 L36 34 M8 14 L36 14 L36 40 L8 40 L8 14 M13 22 L30 22 M13 28 L26 28' },
    { id: 'radierer', label: 'Radiergummi', mk: 'M24 17 L34 27', mkW: 7, ink: 'M8 30 L26 12 C28 10 30 10 32 12 L40 20 C42 22 42 24 40 26 L22 44 L14 44 L6 36 C4 34 4 32 8 30 M17 21 L31 35 M30 45 L44 45' },
    { id: 'lautsprecher', label: 'Aussprache', mk: 'M9 24 L20 24', mkW: 9, ink: 'M6 18 L14 18 L25 9 L25 39 L14 30 L6 30 L6 18 M14 18 L14 30 M31 18 C34 21 34 27 31 30 M36 13 C42 19 42 29 36 35 M40 9 C47 17 47 31 40 39' },
    { id: 'gehirn', label: 'Gedächtnis', mk: 'M14 24 L34 24', ink: 'M24 9 C19 5 11 7 11 14 C5 16 5 26 10 28 C8 35 15 40 20 37 C22 40 26 40 28 37 C33 40 40 35 38 28 C43 26 43 16 37 14 C37 7 29 5 24 9 M24 9 L24 37 M15 18 C18 17 19 20 17 22 M33 18 C30 17 29 20 31 22 M14 29 C17 27 20 30 18 32 M34 29 C31 27 28 30 30 32' },
    { id: 'pinsel', label: 'Pinsel', mk: 'M10 36 L18 30', mkW: 7, ink: 'M38 4 L44 10 L26 28 L20 22 L38 4 M20 22 L26 28 C24 34 16 40 6 42 C8 32 14 24 20 22 M30 12 L36 18' },
    { id: 'bun', label: '文 Satz', mk: 'M12 15 L36 15', mkW: 7, ink: 'M24 6 L24 11 M8 15 L40 15 M33 16 C29 28 20 37 7 42 M15 16 C20 28 29 37 41 42' },
    { id: 'gegenteil', label: 'Gegenteil', mk: 'M10 15 L30 15', mkW: 6, ink: 'M6 15 L40 15 M32 8 L41 15 L32 22 M42 33 L8 33 M16 26 L7 33 L16 40' },
    { id: 'randoseru', label: 'Schulranzen', mk: 'M14 36 L34 36', ink: 'M10 16 C10 11 13 8 18 8 L30 8 C35 8 38 11 38 16 L38 42 C38 44 36 45 34 45 L14 45 C12 45 10 44 10 42 L10 16 M10 26 L38 26 M21 26 L21 32 L27 32 L27 26 M19 8 C19 3 29 3 29 8' },
    { id: 'kette', label: 'Verbindung', mk: 'M20 24 L28 24', mkW: 9, ink: 'M12 18 L22 18 C27 18 30 21 30 24 C30 27 27 30 22 30 L12 30 C7 30 4 27 4 24 C4 21 7 18 12 18 M26 18 L36 18 C41 18 44 21 44 24 C44 27 41 30 36 30 L26 30 C21 30 18 27 18 24 C18 21 21 18 26 18' },
    { id: 'mikrofon', label: 'Nachsprechen', mk: 'M20 15 L28 15', mkW: 9, ink: 'M18 10 C18 5 30 5 30 10 L30 22 C30 27 18 27 18 22 L18 10 M12 18 C12 32 36 32 36 18 M24 30 L24 40 M16 42 L32 42 M18 13 L30 13 M18 18 L30 18' },
    // Japan
    { id: 'torii', label: 'Torii', mk: 'M15 21 L33 21', mkW: 7, ink: 'M5 8 C15 11.5 33 11.5 43 8 M4 12.5 C14 15.5 34 15.5 44 12.5 M5 8 L4 12.5 M43 8 L44 12.5 M9 21 L39 21 M14 14.5 L12.5 43 M34 14.5 L35.5 43 M24 15 L24 21' },
    { id: 'fuji', label: 'Fuji', mk: 'M21 15 L27 15', mkW: 8, ink: 'M3 40 L18 12 C20 9 22 11 24 10 C26 9 28 9 30 12 L45 40 L3 40 M14.5 19 L18 23 L21.5 19 L24 23.5 L27 19 L30 23 L33.5 19' },
    { id: 'sakura', label: 'Sakura', mk: 'M21 24 L27 24', mkW: 14, rot: { d: 'M24 21 C18 16 19 8 22 5 L24 8 L26 5 C29 8 30 16 24 21', n: 5 }, dots: [[24, 24, 1.8]] },
    { id: 'onigiri', label: 'Onigiri', mk: 'M21.5 35.5 L26.5 35.5', mkW: 9, ink: 'M24 6 C28 6 30 9 32 13 L41 30 C44 36 41 41 35 41 L13 41 C7 41 4 36 7 30 L16 13 C18 9 20 6 24 6 M17 41 L17 30 L31 30 L31 41', dots: [[20, 20, 1], [27, 23, 1], [23, 14, 1]] },
    { id: 'daruma', label: 'Daruma', mk: 'M17 38 L31 38', mkW: 7, ink: 'M24 5 C35 5 42 14 42 25 C42 36 35 43 24 43 C13 43 6 36 6 25 C6 14 13 5 24.5 5 M24 13 C31 13 35 17 35 23 C35 29 31 32 24 32 C17 32 13 29 13 23 C13 17 17 13 24 13 M20 27.5 C22 29 26 29 28 27.5 M16.5 17 L22 16.5 M26 16.5 L31.5 17', circ: [[19.5, 21.5, 2.7], [28.5, 21.5, 2.7]], dots: [[19.5, 21.5, 1.3]] },
    { id: 'faecher', label: 'Fächer', mk: 'M16 17 C20 14 28 14 32 17', mkW: 8, ink: 'M5 20 C12 6 36 6 43 20 L24 42 L5 20 M14.5 31 C19 25 29 25 33.5 31 M24 42 L15 11.5 M24 42 L24 9.5 M24 42 L33 11.5' },
    { id: 'laterne', label: 'Laterne', mk: 'M18 24 L30 24', ink: 'M18 7 L30 7 L30 10 L18 10 L18 7 M18 10 C8 14 8 34 18 38 M30 10 C40 14 40 34 30 38 M18 38 L30 38 L30 41 L18 41 L18 38 M11.5 18 L36.5 18 M10.5 24 L37.5 24 M11.5 30 L36.5 30 M24 7 L24 2.5 M24 41 L24 46.5' },
    { id: 'tee', label: 'Tee', mk: 'M19 31 L29 31', ink: 'M11 20 L13 38 C13.5 41 16 42 19 42 L29 42 C32 42 34.5 41 35 38 L37 20 M11 20 C11 16.5 37 16.5 37 20 C37 23.5 11 23.5 11 20 M19 12 C17 9 21 7 19 4 M27 12 C25 9 29 7 27 4' },
    { id: 'welle', label: 'Welle', mk: 'M11 39 L37 39', mkW: 6, ink: 'M3 34 C8 22 18 14 28 14 C35 14 40 19 39 25 C38 30 32 31 30 27 C29 24 31 22 33.5 22.5 M3 34 C10 30 14 38 21 34 C28 30 32 38 45 33', dots: [[40, 12, 1.1], [44, 17, 1.1], [35, 8.5, 1.1]] },
    { id: 'hinomaru', label: 'Japan', mk: 'M21 21 L27 21', mkW: 13, ink: 'M5 9 L43 9 L43 33 L5 33 L5 9', circ: [[24, 21, 7]] },
    { id: 'schirm', label: 'Schirm', mk: 'M12 18 L36 18', ink: 'M5 26 C5 14 14 7 24 7 C34 7 43 14 43 26 C40 23 37 23 34 26 C31 23 27 23 24 26 C21 23 17 23 14 26 C11 23 8 23 5 26 M24 7 C19 13 18 20 18 25 M24 7 C29 13 30 20 30 25 M24 26 L24 40 C24 44 19 44 18 41' },
    { id: 'furin', label: 'Windspiel', mk: 'M17 18 L31 18', ink: 'M14 30 C14 16 18 9 24 9 C30 9 34 16 34 30 L14 30 M24 9 L24 3 M24 30 L24 35 M20 35 L28 35 L28 45 L20 45 L20 35 M17 24 C20 22 22 26 24 24 C26 22 28 26 31 24' },
    { id: 'kranich', label: 'Kranich', mk: 'M10 30 L20 32', mkW: 8, ink: 'M4 30 L19 9 L25 23 L44 15 L30 33 L36 42 L19 35 L4 30 M19 9 L22 29 L19 35 M25 23 L22 29 L30 33' },
    { id: 'kokeshi', label: 'Kokeshi', mk: 'M15 38 L33 38', ink: 'M24 21 C36 23 38 32 38 36 C38 43 32 45 24 45 C16 45 10 43 10 36 C10 32 12 23 24 21 M17 31 C20 28 23 34 26 31 C29 28 31 34 33 31 M16 12 C17 5 31 5 32 12 C28 9 26 11 24 9 C22 11 20 9 16 12', circ: [[24, 13, 8]], dots: [[21, 14, 1], [27, 14, 1]] },
    // Essen
    { id: 'bento', label: 'Bento', mk: 'M28 34 L38 34', ink: 'M6 14 L42 14 L42 40 L6 40 L6 14 M24 14 L24 40 M24 27 L42 27', circ: [[15, 27, 4]] },
    { id: 'taiyaki', label: 'Taiyaki', mk: 'M14 27 L30 27', ink: 'M4 24 C10 14 22 12 31 16 L43 9 L40 24 L43 39 L31 32 C22 36 10 34 4 24 M19 18 C21 21 21 27 19 30 M25 17 C27 21 27 27 25 31', dots: [[11, 22, 1.6]] },
    { id: 'mochi', label: 'Mochi', mk: 'M14 32 L34 32', mkW: 10, ink: 'M6 32 C6 20 15 16 24 16 C33 16 42 20 42 32 C42 40 34 43 24 43 C14 43 6 40 6 32 M24 16 C21 11 24 7 29 8 C30 12 28 15 24 16' },
    { id: 'erdbeere', label: 'Erdbeere', mk: 'M16 26 L32 26', mkW: 12, ink: 'M24 14 C17 9 8 12 8 21 C8 30 17 38 24 44 C31 38 40 30 40 21 C40 12 31 9 24 14 M16 11 L20 15 L24 8 L28 15 L32 11', dots: [[17, 22, 1], [31, 22, 1], [24, 28, 1], [19, 33, 1], [29, 33, 1]] },
    // Tiere
    { id: 'koi', label: 'Koi', mk: 'M20 20 L28 26', mkW: 8, ink: 'M24 4 C32 11 33 21 31 30 L39 42 L24 36 L9 42 L17 30 C15 21 16 11 24 4', dots: [[21, 11, 1.2], [27, 11, 1.2]] },
    { id: 'shiba', label: 'Shiba', mk: 'M17 37 L31 37', ink: 'M10 20 L9 6 L19 13 C22 12 26 12 29 13 L39 6 L38 20 C43 28 39 42 24 43 C9 42 5 28 10 20 M16 31 C17 26 21 25 24 28 C27 25 31 26 32 31', dots: [[18, 24, 1.5], [30, 24, 1.5], [24, 33, 1.6]] },
    { id: 'hase', label: 'Hase', mk: 'M14 38 L34 38', ink: 'M17 21 C13 12 14 3 18 3 C22 3 23 12 22 20 M26 20 C25 12 26 3 30 3 C34 3 35 12 31 21 M24 19 C35 19 40 26 40 33 C40 41 33 45 24 45 C15 45 8 41 8 33 C8 26 14 19 24 19', dots: [[19, 31, 1.4], [29, 31, 1.4], [24, 35, 1.2]] },
    // Natur
    { id: 'mond', label: 'Mond', mk: 'M10 24 L16 24', mkW: 8, ink: 'M31 6 C20 9 18 18 18 25 C18 33 22 41 33 44 C18 48 5 38 5 25 C5 13 18 3 31 6 M38 12 L38 18 M35 15 L41 15 M40 28 L40 32 M38 30 L42 30' },
    { id: 'regenbogen', label: 'Regenbogen', mk: 'M9 30 C11 22 18 16 24 16', mkW: 6, ink: 'M4 36 C4 20 14 12 24 12 C34 12 44 20 44 36 M10 36 C10 24 17 18 24 18 C31 18 38 24 38 36 M16 36 C16 28 20 24 24 24 C28 24 32 28 32 36 M2 40 C2 34 8 33 10 35 C12 31 18 33 17 40 L2 40 M31 40 C30 33 36 31 38 35 C40 33 46 34 46 40 L31 40' },
    // Dinge
    { id: 'schleife', label: 'Schleife', mk: 'M12 17 L18 18', mkW: 8, ink: 'M24 21 C19 11 8 9 7 17 C6 25 18 25 24 23 C30 25 42 25 41 17 C40 9 29 11 24 21 M22 24 L14 42 L19 39 L22 44 L24 26 M26 24 L34 42 L29 39 L26 44 L24 26', circ: [[24, 22, 3]] },
    { id: 'krone', label: 'Krone', mk: 'M14 37 L34 37', mkW: 6, ink: 'M8 16 L16 26 L24 10 L32 26 L40 16 L37 40 L11 40 L8 16 M11 34 L37 34', circ: [[8, 14, 2], [24, 8, 2], [40, 14, 2]] },
    { id: 'pokal', label: 'Pokal', mk: 'M18 14 L30 14', ink: 'M14 6 L34 6 L34 16 C34 24 30 28 24 28 C18 28 14 24 14 16 L14 6 M14 10 C6 10 6 20 15 21 M34 10 C42 10 42 20 33 21 M22 28 L22 35 M26 28 L26 35 M15 42 L33 42 L33 36 L15 36 L15 42' },
  ];

  // ---------- Pfad → Punktfolgen ----------
  const line = (out, a, b) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
    for (let i = 1; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
  };
  const bezier = (out, a, c1, c2, b) => {
    const len = Math.hypot(c1[0] - a[0], c1[1] - a[1]) + Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) + Math.hypot(b[0] - c2[0], b[1] - c2[1]);
    const n = Math.max(4, Math.ceil(len / STEP));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]));
    }
  };
  const parse = (d) => {
    const tk = (d || '').match(/[MLC]|-?[\d.]+/g) || [], out = [];
    let i = 0, cmd = null, pos = null, cur = null;
    const pt = () => [+tk[i++], +tk[i++]];
    while (i < tk.length) {
      if (/[MLC]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'M') { pos = pt(); cur = [pos]; out.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { const b = pt(); line(cur, pos, b); pos = b; }
      else { const c1 = pt(), c2 = pt(), b = pt(); bezier(cur, pos, c1, c2, b); pos = b; }
    }
    return out;
  };
  // von Hand schließt ein Kreis nie genau: etwas über den Anfang hinaus
  const circle = (cx, cy, r) => {
    const n = Math.max(10, Math.ceil(2 * Math.PI * r / STEP)), pts = [];
    for (let i = 0; i <= n + 1; i++) { const a = -1.9 + (i / n) * 2 * Math.PI; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  };
  const turn = (pts, a) => pts.map((q) => { const x = q[0] - BOX / 2, y = q[1] - BOX / 2; return [BOX / 2 + x * Math.cos(a) - y * Math.sin(a), BOX / 2 + x * Math.sin(a) + y * Math.cos(a)]; });
  // leichtes Zittern, vom Ort abhängig – so bleiben Linien, die sich treffen, verbunden
  const wob = (q, seed) => [q[0] + 0.35 * Math.sin(q[0] * 0.47 + q[1] * 0.29 + seed), q[1] + 0.35 * Math.sin(q[0] * 0.31 - q[1] * 0.43 + seed * 1.7)];

  const LIST = DEFS.map((d, n) => {
    let ink = parse(d.ink).concat((d.circ || []).map((c) => circle(c[0], c[1], c[2])));
    if (d.rot) for (let k = 0; k < d.rot.n; k++) ink = ink.concat(parse(d.rot.d).map((pts) => turn(pts, (k * 2 * Math.PI) / d.rot.n)));
    return { id: d.id, label: d.label, ink: ink.map((pts) => pts.map((q) => wob(q, n))), dots: d.dots || [], mk: parse(d.mk), mkW: d.mkW || MK_W };
  });
  const byId = new Map(LIST.map((s) => [s.id, s]));

  // Striche fürs Blatt: Mitte bei (x, y), ganz auf der Seite; Marker zuerst, damit die Linien obenauf liegen
  const strokes = (id, { x, y, pageH, color, mcolor, size = SIZE }) => {
    const d = byId.get(id);
    if (!d) return [];
    const k = size / BOX, h = size / 2, lim = (v, hi) => Math.max(h, Math.min(Math.max(h, hi - h), v));
    const cx = lim(x, 1), cy = lim(y, pageH);
    const at = (q, p) => [r4(cx + (q[0] - BOX / 2) * k), r4(cy + (q[1] - BOX / 2) * k), p];
    const out = d.mk.map((pts) => ({ t: 'marker', c: mcolor, w: +(d.mkW * k).toFixed(5), pts: pts.map((q) => at(q, 0.5)) }));
    // Druck schwankt leicht und lässt an den Enden nach, wie beim Schreiben
    d.ink.forEach((pts, j) => out.push({ t: 'pen', c: color, w: +(PEN_W * k).toFixed(5), pts: pts.map((q, i) => at(q, i === 0 || i === pts.length - 1 ? 0.38 : +(0.5 + 0.08 * Math.sin(i * 0.6 + j)).toFixed(2))) }));
    // gefüllter Punkt = Tipper; dessen Radius ist 0,6 × Strichstärke (inkPen.dot)
    d.dots.forEach((q) => out.push({ t: 'pen', c: color, w: +((q[2] * k) / 0.6).toFixed(5), pts: [at(q, 0.5)] }));
    return out;
  };

  // Vorschaubild für die Auswahl – aus denselben Punkten wie der Stempel
  const svg = (id, mcolor) => {
    const d = byId.get(id);
    if (!d) return '';
    const pl = (pts) => pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${BOX} ${BOX}" fill="none" stroke="currentColor" stroke-width="${PEN_W}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
      + d.mk.map((pts) => `<polyline points="${pl(pts)}" stroke="${mcolor}" stroke-width="${d.mkW}" stroke-linecap="square" opacity=".7"/>`).join('')
      + d.ink.map((pts) => `<polyline points="${pl(pts)}"/>`).join('')
      + d.dots.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="${q[2]}" fill="currentColor" stroke="none"/>`).join('')
      + '</svg>';
  };

  const P = { BOX, SIZE, LIST, strokes, svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkStickers = P;
})(this);
