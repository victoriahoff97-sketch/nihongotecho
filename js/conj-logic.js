/* Nihongo Techō – Konjugieren: Formen von Verben und Adjektiven abfragen (reine Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const F = App.formMap;
  const C = App.conjLogic = {};

  C.POS = [
    { id: 'verb', label: 'Verben' },
    { id: 'i-adj', label: 'い-Adjektive' },
    { id: 'na-adj', label: 'な-Adjektive' },
  ];
  const POS_IDS = C.POS.map((p) => p.id);
  C.posOf = (form) => (form.map === 'verb' ? 'verb' : form.id.startsWith('a-na') ? 'na-adj' : 'i-adj');

  // Abfragbar ist jede Form außer den Grundformen
  C.forms = (pos) => F.FORMS.filter((f) => f.from.length && (!pos || C.posOf(f) === pos));
  const askable = (id) => { const f = F.form(id); return f && f.from.length ? f : null; };
  // Für „Selbst zusammenstellen“: je Formenfamilie eine Gruppe, in der Reihenfolge der Formenliste
  C.groups = () => {
    const out = [];
    C.forms().forEach((f) => {
      let g = out.find((x) => x.line === f.line);
      if (!g) out.push(g = { line: f.line, label: F.LINES[f.line].label, color: F.LINES[f.line].color, pos: C.posOf(f), forms: [] });
      g.forms.push(f);
    });
    return out;
  };

  // Auswahl = { pos: [Wortarten], forms: [Form-Kennungen] }
  // Erster Besuch von „Selbst zusammenstellen“: alles angekreuzt
  C.defaults = () => ({ pos: POS_IDS.slice(), forms: C.forms().map((f) => f.id) });
  // Gemerkte Auswahl (JSON-Text) prüfen: Unsinn → null, unbekannte Kennungen fliegen raus
  C.clean = (raw) => {
    let o;
    try { o = JSON.parse(raw); } catch (e) { return null; }
    if (!o || !Array.isArray(o.pos) || !Array.isArray(o.forms)) return null;
    return { pos: POS_IDS.filter((p) => o.pos.includes(p)), forms: C.forms().filter((f) => o.forms.includes(f.id)).map((f) => f.id) };
  };
  // Fertige Mischungen für die Startseite – erst eine wählen, die Feinauswahl gibt es nur bei „Selbst zusammenstellen“.
  // forms = null: alle abfragbaren Formen (bzw. alle einer Wortart über pos) · custom: eigene Auswahl
  C.MIXES = [
    { id: 'te', label: 'Nur die て-Form', forms: ['v-te'], note: 'Genki Lektion 6' },
    { id: 'te-ta', label: 'て-, た- und たり-Form', forms: ['v-te', 'v-ta', 'v-tari'] },
    { id: 'masu', label: 'ます-Formen', forms: ['v-stem', 'v-masu', 'v-masen', 'v-mashita', 'v-masendeshita', 'v-mashou'], note: 'höflich' },
    { id: 'nai', label: 'ない-Formen', forms: ['v-nai', 'v-nakatta', 'v-naide'], note: 'verneint' },
    { id: 'kann', label: 'Können und wollen', forms: ['v-pot', 'v-vol', 'v-tai'] },
    { id: 'adj', label: 'Adjektive', forms: null, pos: ['i-adj', 'na-adj'] },
    { id: 'all', label: 'Alles gemischt', forms: null },
    { id: 'custom', label: 'Selbst zusammenstellen', custom: true },
  ];
  C.mix = (id) => C.MIXES.find((m) => m.id === id) || null;
  // Gemerkte Mischung prüfen; unbekannt oder leer → „Alles gemischt“ (wie bisher: erst einmal alles)
  C.cleanMix = (id) => (C.mix(id) ? id : 'all');
  // Die Formen einer Mischung (Form-Objekte, in der Reihenfolge der Formenliste)
  C.mixForms = (m) => (m.forms ? m.forms.map(askable).filter(Boolean) : C.forms().filter((f) => !m.pos || m.pos.includes(C.posOf(f))));
  // Auswahl aus Formen: die Wortarten ergeben sich aus den Formen – eine eigene Wortart-Wahl braucht es nicht mehr
  C.selOf = (formIds) => {
    const forms = C.forms().filter((f) => (formIds || []).includes(f.id));
    return { pos: POS_IDS.filter((p) => forms.some((f) => C.posOf(f) === p)), forms: forms.map((f) => f.id) };
  };
  C.mixSel = (id, custom) => {
    const m = C.mix(id) || C.mix('all');
    return C.selOf(m.custom ? (custom || C.defaults()).forms : C.mixForms(m).map((f) => f.id));
  };

  // „Meine Wörter“ – dieselbe Regel wie beim Übersetzen: in der Lernschlange, kann ich, oder lesen kann ich schon
  C.mine = (state, read) => state !== 'open' || read === 'known';

  // Lässt sich das Wort sicher beugen? Verben nur mit Verbgruppe, die zur Endung passt – sonst würde der Rechner raten
  C.usable = (w) => {
    const kana = (w && w.kana) || '';
    if (!kana) return false;
    if (w.pos === 'verb') {
      const cls = w.v && w.v.cls;
      if (cls === 'irr') return /(する|くる)$/.test(kana);
      if (cls === 'ru') return /る$/.test(kana);
      return cls === 'u' && /[うくぐすつぬぶむる]$/.test(kana);
    }
    if (w.pos === 'i-adj') return /い$/.test(kana);
    return w.pos === 'na-adj';
  };
  C.applies = (form, w) => C.usable(w) && C.posOf(form) === w.pos && !(form.conj === 'potential' && JP.noPotential(w));

  const chosen = (sel) => (sel.forms || []).map(askable).filter((f) => f && (sel.pos || []).includes(C.posOf(f)));
  // Wortvorrat zur Auswahl; skipped = Verben ohne passende Verbgruppe – keine eingetragen oder eine, die nicht zur
  // Endung passt (damit die Seite sagen kann, warum sie fehlen)
  C.pool = (words, sel) => {
    const forms = chosen(sel);
    const list = (words || []).filter(Boolean);
    const verbs = forms.some((f) => f.map === 'verb');
    return {
      words: list.filter((w) => forms.some((f) => C.applies(f, w))),
      skipped: verbs ? list.filter((w) => w.pos === 'verb' && w.kana && !C.usable(w)).length : 0,
    };
  };
  // Warum sich keine Runde starten lässt: pos = keine Wortart, forms = keine Form (einer gewählten Wortart),
  // mine / choice = keine passenden Wörter unter „Meine Wörter“ bzw. in der Auswahl nach Lektion oder Niveau
  C.reason = (sel, n, byChoice) => {
    if (!sel.pos.length) return 'pos';
    if (!chosen(sel).length) return 'forms';
    if (!n) return byChoice ? 'choice' : 'mine';
    return null;
  };

  // Aufgaben einer Runde: [{ it, form }]. Erst jedes Wort einmal mit einer zufälligen passenden Form;
  // reicht das nicht für n Aufgaben, weitere Durchgänge mit den noch nicht gefragten Formen (n = 0: ein Durchgang)
  C.tasks = (words, sel, n, rnd = Math.random) => {
    const forms = chosen(sel);
    const order = (words || []).filter((w) => forms.some((f) => C.applies(f, w)));
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const left = new Map(order.map((w) => [w, forms.filter((f) => C.applies(f, w))]));
    const out = [];
    for (;;) {
      const pass = [];
      order.forEach((w) => {
        const rest = left.get(w);
        if (rest.length) pass.push({ it: w, form: rest.splice(Math.floor(rnd() * rest.length), 1)[0].id });
      });
      if (!pass.length) break;
      // nicht dasselbe Wort zweimal hintereinander, wenn es sich vermeiden lässt
      if (out.length && pass.length > 1 && pass[0].it === out[out.length - 1].it) [pass[0], pass[1]] = [pass[1], pass[0]];
      out.push(...pass);
      if (!n || out.length >= n) break;
    }
    return n ? out.slice(0, n) : out;
  };

  // Auswertung je Form: gezählt wird nur der erste Versuch einer Aufgabe
  C.tally = (stats, formId, knew, first) => {
    const s = stats || {};
    if (!first) return s;
    const e = s[formId] || (s[formId] = { asked: 0, right: 0 });
    e.asked++; if (knew) e.right++;
    return s;
  };
  C.summary = (stats) => F.FORMS.filter((f) => stats && stats[f.id]).map((f) => ({ form: f.id, asked: stats[f.id].asked, right: stats[f.id].right }));

  // ---------- Womit die Karte startet und wie geantwortet wird (pro Gerät gemerkt) ----------
  C.STARTS = [
    { id: 'dict', label: 'Grundform' },
    { id: 'masu', label: 'ます-Form' },
    { id: 'any', label: 'Zufällig' },
  ];
  C.ANSWERS = [
    { id: 'head', label: 'Im Kopf', icon: 'eye' },
    { id: 'write', label: 'Schreiben', icon: 'pen' },
    { id: 'mc', label: 'Auswahl', icon: 'list' },
  ];
  C.cleanStart = (id) => (C.STARTS.some((s) => s.id === id) ? id : 'dict');
  C.cleanAnswer = (id) => (C.ANSWERS.some((s) => s.id === id) ? id : 'head');

  const conj = (form, w) => F.example(form, w).to; // Notation, z. B. 書[か]いて
  const kanaOf = (form, w) => JP.toHira(JP.kana(conj(form, w)));
  const startStation = (pos) => F.FORMS.find((x) => !x.from.length && C.posOf(x) === pos);
  // Von welcher Form aus gefragt wird: Grundform · ます-Form (Adjektive haben keine, sie starten in der Grundform) ·
  // zufällig irgendeine andere Form desselben Wortes. Nie die gesuchte Form selbst und nie eine, die gleich aussieht
  C.startOf = (w, formId, start, rnd = Math.random) => {
    const f = F.form(formId);
    const base = startStation(C.posOf(f));
    if (start === 'masu' && f.map === 'verb' && formId !== 'v-masu') return 'v-masu';
    if (start !== 'any') return base.id;
    const target = kanaOf(f, w);
    const list = [base].concat(C.forms(C.posOf(f))).filter((x) => x.id !== formId && x.id !== 'v-stem' && (x === base || C.applies(x, w)) && kanaOf(x, w) !== target);
    return list.length ? list[Math.floor(rnd() * list.length)].id : base.id;
  };

  // ---------- Auswahl-Antworten: drei falsche, die der richtigen zum Verwechseln ähneln ----------
  // Sie entstehen aus den typischen Fehlern: falsche Verbgruppe, falscher Lautwechsel (飲みて, 飲いで), falsche Vokalreihe
  // (書きない), falsche Endung bei Adjektiven (高いでした, 元気くない) oder eine Nachbarform desselben Wortes.
  // Damit man die Lösung nicht an der Form ablesen kann, kommen die Fehler nach vorn, die gleich enden und gleich lang sind.
  const ROWS = ['かきくけこ', 'がぎぐげご', 'さしすせそ', 'たちつてと', 'なにぬねの', 'ばびぶべぼ', 'まみむめも', 'らりるれろ', 'わいうえお'];
  const GODAN_END = 'うくぐすつぬぶむる';
  // Wortstamm in Kanji und Kana (書く → 書 / か), damit ein falsches Kana-Wort dieselben Kanji bekommt wie die Lösung
  const stems = (w) => {
    const k = w.kanji || '', r = w.kana || '';
    if (w.pos === 'verb' && w.v && w.v.cls === 'irr' && /来る$/.test(k)) return { k: k.slice(0, -1), r: r.slice(0, -2), kuru: true };
    let n = 0;
    while (n < k.length && n < r.length && k[k.length - 1 - n] === r[r.length - 1 - n]) n++;
    return { k: k.slice(0, k.length - n), r: r.slice(0, r.length - n) };
  };
  // Kana-Wort → Notation mit den Kanji des Wortes; null, wenn es sich nicht so schreiben lässt (dann fiele es neben der Lösung auf)
  const mk = (w, kana) => {
    if (!w.kanji || w.kanji === w.kana) return kana;
    const s = stems(w);
    if (!kana.startsWith(s.r)) return null;
    const rest = kana.slice(s.r.length + (s.kuru ? 1 : 0));
    if (s.kuru && !/^[くこき]/.test(kana.slice(s.r.length))) return null;
    const out = JP.notate(s.k + rest, kana);
    return JP.kana(out) === kana || !JP.hasNotation(out) ? out : null;
  };
  const fakeVerb = (w, cls, kana, kanji) => Object.assign({}, w, { kana: kana || w.kana, kanji: kanji === undefined ? w.kanji : kanji, v: Object.assign({}, w.v, { cls }) });
  const TE_LINE = ['te', 'ta', 'tari', 'teimasu', 'teimashita'];

  const verbWrongs = (w, f) => {
    const cls = w.v.cls, k = w.kana, out = [];
    const add = (s, src) => { if (s) out.push({ s, src }); };
    const sol = JP.toHira(JP.kana(JP.conj(w, f.conj)));
    // falsche Verbgruppe: る-Verb wie う-Verb (食べって) und umgekehrt; する/くる wie ein normales Verb
    if (cls === 'ru' || (cls === 'u' && /る$/.test(k))) add(JP.conj(fakeVerb(w, cls === 'ru' ? 'u' : 'ru'), f.conj), 'cls');
    if (cls === 'irr') { add(JP.conj(fakeVerb(w, 'ru'), f.conj), 'cls'); add(JP.conj(fakeVerb(w, 'u'), f.conj), 'cls'); }
    // る-Verben: das る bleibt einfach stehen (食べるない, 食べるて)
    if (cls === 'ru') { const st = JP.toHira(JP.kana(JP.conj(w, 'stem'))); if (sol.startsWith(st)) add(mk(w, k + sol.slice(st.length)), 'ru'); }
    if (cls === 'u') {
      // falscher Lautwechsel: so gebeugt, als ende das Verb auf einen anderen Laut (飲む → 飲いて, 飲って, 飲して)
      const end = k.slice(-1), kjEnd = (w.kanji || '').slice(-1);
      if (TE_LINE.includes(f.conj)) {
        GODAN_END.split('').filter((e) => e !== end).forEach((e) => {
          add(JP.conj(fakeVerb(w, 'u', k.slice(0, -1) + e, kjEnd === end ? w.kanji.slice(0, -1) + e : ''), f.conj), 'te');
        });
        // ます-Stamm + て (書きて) und bei 行く die „regelmäßige“ Form (行いて)
        const stem = JP.toHira(JP.kana(JP.conj(w, 'stem')));
        const teK = JP.toHira(JP.kana(JP.conj(w, 'te'))), taK = teK.replace(/て$/, 'た').replace(/で$/, 'だ');
        const swap = (to) => (sol.startsWith(teK) ? to + 'て' + sol.slice(teK.length) : sol.startsWith(taK) ? to + 'た' + sol.slice(taK.length) : null);
        const st = swap(stem); if (st) add(mk(w, st), 'te');
        if (/(行く|いく)$/.test(w.kanji || k)) add(mk(w, sol.replace(/^(.*)っ([てた])/, '$1い$2')), 'te');
      }
    }
    if (cls === 'u' || cls === 'irr') {
      // falsche Vokalreihe direkt hinter dem Stamm (書かない → 書きない, 書けない; しない → さない)
      let n = 0;
      while (n < k.length && n < sol.length && k[n] === sol[n]) n++;
      const first = sol[n], row = ROWS.find((x) => x.includes(first));
      if (row && (cls === 'irr' || row.includes(k.slice(-1)))) row.split('').filter((c) => c !== first).forEach((c) => add(mk(w, sol.slice(0, n) + c + sol.slice(n + 1)), 'row'));
    }
    // る-Verben: Potential ohne ら (食べれる) ist umgangssprachlich üblich – nicht als falsch anbieten
    return out.filter((x) => !(f.conj === 'potential' && cls === 'ru' && JP.kana(x.s) === k.slice(0, -1) + 'れる'));
  };

  const I_END = { negp: 'くない', neg: 'くないです', pastp: 'かった', past: 'かったです', pastnegp: 'くなかった', pastneg: 'くなかったです', te: 'くて' };
  const NA_END = { negp: 'じゃない', neg: 'じゃないです', pastp: 'だった', past: 'でした', pastnegp: 'じゃなかった', pastneg: 'じゃなかったです', te: 'で' };
  const adjWrongs = (w, f) => {
    const out = [], k = w.kana, c = f.conj;
    const add = (kana, src) => { const s = mk(w, kana); if (s) out.push({ s, src }); };
    if (w.pos === 'i-adj') {
      add(k + I_END[c], 'adj');                         // い bleibt stehen: 高いくない
      add(k + NA_END[c], 'adj');                        // wie ein な-Adjektiv: 高いじゃない, 高いでした
      if (c === 'past') add(k.slice(0, -1) + 'かったでした', 'adj');
      if (c === 'neg') add(k.slice(0, -1) + 'くないでした', 'adj');
      if (c === 'pastneg') add(k + 'くなかったです', 'adj');
      if (/いい$/.test(k)) add(k.slice(0, -1) + I_END[c], 'adj'); // いい → いくない statt よくない
    } else {
      const b = k.replace(/な$/, '');
      add(b + I_END[c], 'adj');                         // wie ein い-Adjektiv: 元気くない
      add(b + 'な' + NA_END[c], 'adj');                 // な bleibt stehen: 元気なじゃない
      if (c === 'past') add(b + 'だったです', 'adj');
      if (c === 'pastneg') add(b + 'じゃないでした', 'adj');
    }
    return out;
  };

  const unvoice = (s) => s.replace(/で/g, 'て').replace(/だ/g, 'た');
  const tailSame = (a, b) => { let n = 0; a = unvoice(a); b = unvoice(b); while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++; return n; };
  // Antworten für die Auswahl (Notation), die richtige darunter, gemischt. avoid = Formen, die schon auf der Karte stehen
  C.choices = (w, formId, { n = 4, avoid = [], rnd = Math.random } = {}) => {
    const f = F.form(formId);
    const sol = conj(f, w), solK = JP.toHira(JP.kana(sol));
    const seen = new Set([solK].concat(avoid.map((a) => JP.toHira(JP.kana(a)))));
    const raw = f.map === 'verb' ? verbWrongs(w, f) : adjWrongs(w, f);
    // Nachbarformen desselben Wortes (書きました ↔ 書きませんでした) – höchstens eine, sie prüft das Wissen, welche Form welche ist
    C.forms(C.posOf(f)).filter((x) => x.id !== formId && x.id !== 'v-stem' && C.applies(x, w)).forEach((x) => raw.push({ s: conj(x, w), src: 'form' }));
    const cands = [];
    raw.forEach((x) => {
      const r = JP.toHira(JP.kana(x.s));
      if (!r || seen.has(r) || /undefined/.test(x.s)) return;
      seen.add(r);
      cands.push(Object.assign(x, { score: Math.min(tailSame(r, solK), 3) * 2 - Math.abs(r.length - solK.length), rnd: rnd() }));
    });
    cands.sort((a, b) => b.score - a.score || a.rnd - b.rnd);
    const pick = [];
    const by = (src) => pick.filter((x) => x.src === src).length;
    cands.forEach((x) => { if (pick.length < n - 1 && !(x.src === 'form' && by('form')) && by(x.src) < 2) pick.push(x); });
    cands.forEach((x) => { if (pick.length < n - 1 && !pick.includes(x) && !(x.src === 'form' && by('form'))) pick.push(x); });
    cands.forEach((x) => { if (pick.length < n - 1 && !pick.includes(x)) pick.push(x); }); // zu wenige Fehler: weitere Nachbarformen
    // 来る: 来ない und 来きない sähen in Kanji gleich aus – hier stehen alle Antworten in Kana
    const show = w.pos === 'verb' && stems(w).kuru ? (s) => JP.toHira(JP.kana(s)) : (s) => s;
    const all = pick.map((x) => show(x.s)).concat(show(sol));
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return { list: all, answer: show(sol) };
  };
})(window.App);
