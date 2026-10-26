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
})(window.App);
