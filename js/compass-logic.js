/* Nihongo Techō – N4-Kompass und Wochen-Waage (reine Logik)
   Kompass: Wie oft hast du einen Grammatikpunkt selbst richtig gebildet? (Übersetzen, Umformen, eigene Sätze)
   Waage: aktive Minuten pro Fertigkeit und Woche (Lesen, Schreiben, Hören, Sprechen) */
'use strict';
(function (App) {
  const C = App.compassLogic = {};
  C.SAFE = 3; // ab so vielen Malen gilt ein Punkt als sicher

  // 0 = nur gesehen, 1 = angefangen, 2 = sicher
  C.stage = (n) => (n >= C.SAFE ? 2 : n > 0 ? 1 : 0);
  // made: { Grammatik-Id: Anzahl aus Übungen } · uses(it) → Anzahl eigener Sätze damit
  C.rows = (grammar, made, uses) => (grammar || []).map((it) => {
    const ex = (made && made[it.id]) || 0, own = uses ? uses(it) : 0;
    const n = ex + own;
    return { it, n, ex, own, stage: C.stage(n) };
  });
  C.summary = (rows) => {
    const s = { total: rows.length, safe: 0, started: 0, none: 0 };
    rows.forEach((r) => { if (r.stage === 2) s.safe++; else if (r.stage === 1) s.started++; else s.none++; });
    return s;
  };
  C.bump = (made, id) => Object.assign({}, made || {}, { [id]: ((made && made[id]) || 0) + 1 });

  // ---------- Wochen-Waage ----------
  C.SKILLS = [['l', 'Lesen'], ['s', 'Schreiben'], ['h', 'Hören'], ['p', 'Sprechen']];
  C.IDLE = 60;     // Sekunden ohne Tippen/Abspielen → Uhr steht
  C.KEEP_DAYS = 70; // so lange bleibt das Protokoll (10 Wochen)
  const pad = (n) => String(n).padStart(2, '0');
  C.day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  C.monday = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return C.day(d); };
  C.addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return C.day(d); };

  // Welche Fertigkeit gerade läuft – aus der Seite (Route) und dem, was offen ist; null = zählt nicht
  // ctx: { path, override, readAloud, micOn, cardDir, cardMode }
  // ctx: { path, jaMic: Mikrofon hört Japanisch, readAloud: Nachsprechen-Fenster offen, playing: Ton/Video läuft,
  //        wrote: in der letzten Minute selbst getippt (Japanisch) oder mit Stift/Finger geschrieben,
  //        card: Karteikarten-Runde offen → 'l' | 'p' | null, jpPrompt: Übersetzen zeigt einen japanischen Satz, einstufenDe: Einstufen Deutsch → Japanisch }
  // Reihenfolge: Sprechen vor Hören vor Schreiben vor dem, was Karte oder Seite zeigen
  C.skillOf = (ctx) => {
    if (ctx.jaMic || ctx.readAloud) return 'p';      // nur Japanisch – deutsches Diktieren zählt hier nicht
    if (ctx.playing) return 'h';
    if (ctx.wrote) return 's';                       // Schreiben = selbst tippen oder schreiben, nie Diktiertes
    if (ctx.card !== undefined) return ctx.card;
    const p = ctx.path || '';
    if (/^\/ueben\/saetze/.test(p)) return ctx.jpPrompt ? 'l' : null;
    if (/^\/ueben\/einstufen/.test(p)) return ctx.einstufenDe ? null : 'l';
    // Seiten, auf denen man japanischen Text vor sich hat und liest (das Schreiben darauf zählt oben über wrote)
    if (/^\/(eingang|saetze|pruefung|anwenden|ueben\/(luecken|kanji|umformen|konjugieren))/.test(p)) return 'l';
    return null; // Hören-Seite ohne laufenden Ton, Listen, Erklärungen, Kana schreiben ohne Striche …
  };
  // Karteikarte (ohne selbst zu schreiben): Japanisch → Deutsch = Lesen, Mikrofon-Antwort = Sprechen,
  // Deutsch → Japanisch ohne Antwortfeld = nichts; Konjugieren mit Auswahl oder „im Kopf“ = Lesen
  C.cardSkill = (dir, mode, kind) => {
    if (mode === 'say') return 'p';
    if (kind === 'pad' || kind === 'write') return null;
    if (kind === 'conj') return 'l';
    return dir === 'de' ? null : 'l';
  };
  // Zählt eine Eingabe als Schreiben? Eigene Eingabe (kein Diktat) in ein japanisches Feld
  C.JA = /[\u3040-\u30ff\u3400-\u9fff]/;
  C.typedJa = ({ trusted, lang, text, search }) => !!trusted && !search && (/^ja/.test(lang || '') || C.JA.test(text || ''));

  // Sekunden auf einen Tag buchen; alte Tage fallen weg
  C.add = (log, date, skill, sec) => {
    const out = Object.assign({}, log || {});
    const d = Object.assign({}, out[date] || {});
    d[skill] = (d[skill] || 0) + sec;
    out[date] = d;
    const cut = C.addDays(date, -C.KEEP_DAYS);
    Object.keys(out).forEach((k) => { if (k < cut) delete out[k]; });
    return out;
  };
  // Minuten pro Fertigkeit in der Woche ab Montag mon
  C.week = (log, mon) => {
    const sum = { l: 0, s: 0, h: 0, p: 0 };
    for (let i = 0; i < 7; i++) { const d = (log || {})[C.addDays(mon, i)]; if (d) C.SKILLS.forEach(([k]) => { sum[k] += d[k] || 0; }); }
    const min = {};
    C.SKILLS.forEach(([k]) => { min[k] = Math.round(sum[k] / 60); });
    return min;
  };
  // Hinweis: Was kommt zu kurz? Erst ab 30 Minuten insgesamt; zu kurz = unter einem Achtel der Woche
  C.lacking = (min) => {
    const total = C.SKILLS.reduce((a, [k]) => a + min[k], 0);
    if (total < 30) return null;
    const low = C.SKILLS.filter(([k]) => min[k] * 8 < total).sort((a, b) => min[a[0]] - min[b[0]]);
    return low.length ? low[0][0] : null;
  };
})(window.App);
