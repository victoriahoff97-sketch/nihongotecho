/* Nihongo Techō – Flammen: Streak mit Wochen-Joker und Urlaub (reine Logik, ohne DOM). Daten als 'JJJJ-MM-TT' (Ortszeit) */
'use strict';
(function (App) {
  const K = App.streakLogic = {};
  const MAX_BACK = 400, MAX_AHEAD = 60;
  // Zeichen vor der Zahl („🔥12“) – überall in der App nur über K.MARK, damit es an einer Stelle tauschbar bleibt
  K.MARK = '🔥';

  const pad = (x) => String(x).padStart(2, '0');
  const fmt = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  // Tage verschieben (Sommerzeit-fest über setDate)
  K.addDays = (date, n) => { const d = parse(date); d.setDate(d.getDate() + n); return fmt(d); };
  // Montag der Woche als Datum
  K.weekKey = (date) => K.addDays(date, -((parse(date).getDay() + 6) % 7));

  // Zählt rückwärts ab heute (heute nur, wenn erledigt; sonst ab gestern).
  // Erledigt → n+1; Urlaub → überspringen; verpasst → Joker (einer je Woche), sonst Ende.
  K.streak = (done, off, today) => {
    let earliest = null;
    for (const d of done) if (earliest === null || d < earliest) earliest = d;
    const res = { n: 0, jokers: [] };
    if (earliest === null) return res;
    const usedWeeks = new Set();
    let d = done.has(today) ? today : K.addDays(today, -1);
    for (let i = 0; i < MAX_BACK && d >= earliest; i++, d = K.addDays(d, -1)) {
      if (done.has(d)) res.n++;
      else if (off.has(d)) continue;
      else {
        const wk = K.weekKey(d);
        if (usedWeeks.has(wk)) break;
        usedWeeks.add(wk);
        res.jokers.push(d);
      }
    }
    return res;
  };

  // Letzter Tag, an dem die Flamme ohne neue Einträge noch lebt (n ≥ 1). Tage nach heute mit futureOff(d) zählen als Urlaub.
  // null, wenn sie heute schon aus ist; höchstens heute + 60.
  K.holdUntil = (done, off, today, futureOff) => {
    if (K.streak(done, off, today).n < 1) return null;
    const offT = new Set(off);
    let last = today;
    for (let i = 1; i <= MAX_AHEAD; i++) {
      const t = K.addDays(today, i);
      if (futureOff(t)) offT.add(t);
      if (K.streak(done, offT, t).n < 1) break;
      last = t;
    }
    return last;
  };

  // Alle Urlaubstage bis heute einschließlich (Log: {from,to} inklusive; laufender Urlaub: since … heute bzw. until − 1)
  K.offDays = (vacationLog, vacation, today) => {
    const out = new Set();
    for (const v of vacationLog || []) {
      if (!v || !v.from || !v.to) continue;
      for (let d = v.from, i = 0; d <= v.to && i < 1000; i++, d = K.addDays(d, 1)) out.add(d);
    }
    if (vacation && vacation.since) {
      let end = today;
      if (vacation.until) { const e = K.addDays(fmt(new Date(vacation.until)), -1); if (e < end) end = e; }
      for (let d = fmt(new Date(vacation.since)), i = 0; d <= end && i < 1000; i++, d = K.addDays(d, 1)) out.add(d);
    }
    return out;
  };

  // Gilt der Tag (nach heute) wegen laufendem Urlaub als frei? Ohne until: alle Tage
  K.futureOff = (vacation, today) => {
    if (!vacation || !vacation.since) return () => false;
    if (!vacation.until) return () => true;
    const last = K.addDays(fmt(new Date(vacation.until)), -1);
    return (date) => date <= last;
  };
})(window.App = window.App || {});
